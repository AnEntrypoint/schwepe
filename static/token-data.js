/**
 * Real-time Token Data Fetcher for SCHWEPE
 * Fetches live data from Somnia Explorer API and Somnex DEX
 */
class TokenDataFetcher {
    constructor() {
        this.tokenAddress = '0xDD10620866C4F586b1213d3818811Faf3718FCe3';
        this.somniaApiBase = 'https://explorer.somnia.network/api/v2';
        this.somnexUrl = 'https://somnex.xyz';
        this.cache = new Map();
        this.cacheTimeout = 15000; // 15 seconds for live data
        this.refreshInterval = 30000; // 30 seconds
        this.intervalId = null;

        // DOM element references
        this.elements = {
            price: null,
            priceChange: null,
            marketCap: null,
            holders: null,
            volume: null,
            bondingProgress: null,
            availableTokens: null,
            lastUpdate: null
        };
    }

    /**
     * Initialize the token data fetcher
     */
    init() {
        this.cacheElements();
        if (this.elements.holders) {
            this.startAutoRefresh();
            this.fetchAllData();
        }
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
        this.elements = {
            price: document.querySelector('[data-token-price]'),
            priceChange: document.querySelector('[data-token-price-change]'),
            marketCap: document.querySelector('[data-token-marketcap]'),
            holders: document.querySelector('[data-token-holders]'),
            volume: document.querySelector('[data-token-volume]'),
            bondingProgress: document.querySelector('[data-token-bonding-progress]'),
            availableTokens: document.querySelector('[data-token-available]'),
            lastUpdate: document.querySelector('[data-last-update]')
        };
    }

    /**
     * Start automatic refresh
     */
    startAutoRefresh() {
        this.stopAutoRefresh(); // Clear any existing interval
        this.intervalId = setInterval(() => {
            this.fetchAllData();
        }, this.refreshInterval);
    }

    /**
     * Stop automatic refresh
     */
    stopAutoRefresh() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    /**
     * Fetch all token data
     */
    async fetchAllData() {
        try {
            const [tokenData, holdersData, somnexData] = await Promise.all([
                this.fetchTokenInfo(),
                this.fetchHoldersCount(),
                this.fetchSomnexData()
            ]);

            this.updateUI(tokenData, holdersData, somnexData);
            this.updateLastUpdate();
        } catch (error) {
            console.error('Error fetching token data:', error);
            this.showErrorState();
        }
    }

    /**
     * Fetch token basic information
     */
    async fetchTokenInfo() {
        const cacheKey = 'token-info';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(`${this.somniaApiBase}/tokens/${this.tokenAddress}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching token info:', error);
            throw error;
        }
    }

    /**
     * Fetch holder count
     */
    async fetchHoldersCount() {
        const cacheKey = 'holders-count';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(`${this.somniaApiBase}/tokens/${this.tokenAddress}/counters`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching holders count:', error);
            throw error;
        }
    }

    /**
     * Fetch live pricing data from Somnex DEX
     */
    async fetchSomnexData() {
        const cacheKey = 'somnex-data';
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            // Since Somnex doesn't have a public API, we'll scrape the data from their page
            // In a production environment, you'd want to use their official API if available
            const response = await fetch(`${this.somnexUrl}/#/token/${this.tokenAddress}`, {
                headers: {
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const html = await response.text();
            const data = this.parseSomnexData(html);
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching Somnex data:', error);
            // Return fallback data if Somnex fetch fails
            return {
                price: null,
                priceChange: null,
                marketCap: null,
                volume: null,
                bondingProgress: null,
                availableTokens: null
            };
        }
    }

    /**
     * Parse pricing data from Somnex HTML response
     */
    parseSomnexData(html) {
        try {
            // Create a temporary DOM parser
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            // Extract price data
            const priceElement = doc.querySelector('[data-testid="token-price"]');
            const priceChangeElement = doc.querySelector('[data-testid="price-change"]');
            const marketCapElement = doc.querySelector('[data-testid="market-cap"]');
            const volumeElement = doc.querySelector('[data-testid="volume"]');
            const bondingProgressElement = doc.querySelector('[data-testid="bonding-progress"]');
            const availableTokensElement = doc.querySelector('[data-testid="available-tokens"]');

            return {
                price: priceElement ? priceElement.textContent.trim() : null,
                priceChange: priceChangeElement ? priceChangeElement.textContent.trim() : null,
                marketCap: marketCapElement ? marketCapElement.textContent.trim() : null,
                volume: volumeElement ? volumeElement.textContent.trim() : null,
                bondingProgress: bondingProgressElement ? bondingProgressElement.textContent.trim() : null,
                availableTokens: availableTokensElement ? availableTokensElement.textContent.trim() : null
            };
        } catch (error) {
            console.error('Error parsing Somnex data:', error);
            return {
                price: null,
                priceChange: null,
                marketCap: null,
                volume: null,
                bondingProgress: null,
                availableTokens: null
            };
        }
    }

    /**
     * Update UI with fetched data
     */
    updateUI(tokenData, holdersData, somnexData) {
        // Update holders count
        if (this.elements.holders && tokenData.holders_count) {
            this.elements.holders.textContent = this.formatNumber(tokenData.holders_count);
            this.elements.holders.classList.add('live-data');
        }

        // Update price from Somnex (live data)
        if (this.elements.price && somnexData.price) {
            this.elements.price.textContent = somnexData.price;
            this.elements.price.classList.add('live-data', 'live-price');
        } else if (this.elements.price) {
            this.elements.price.textContent = 'Loading...';
            this.elements.price.classList.add('loading-data');
        }

        // Update price change from Somnex
        if (this.elements.priceChange && somnexData.priceChange) {
            this.elements.priceChange.textContent = somnexData.priceChange;
            const change = parseFloat(somnexData.priceChange.replace(/[^0-9.-]/g, ''));
            if (change > 0) {
                this.elements.priceChange.classList.add('positive-change');
                this.elements.priceChange.classList.remove('negative-change');
            } else if (change < 0) {
                this.elements.priceChange.classList.add('negative-change');
                this.elements.priceChange.classList.remove('positive-change');
            }
        }

        // Update market cap from Somnex
        if (this.elements.marketCap && somnexData.marketCap) {
            this.elements.marketCap.textContent = somnexData.marketCap;
            this.elements.marketCap.classList.add('live-data');
        } else if (this.elements.marketCap && tokenData.circulating_market_cap) {
            this.elements.marketCap.textContent = this.formatMarketCap(tokenData.circulating_market_cap);
            this.elements.marketCap.classList.add('live-data');
        } else if (this.elements.marketCap) {
            this.elements.marketCap.textContent = 'Loading...';
            this.elements.marketCap.classList.add('loading-data');
        }

        // Update volume from Somnex
        if (this.elements.volume && somnexData.volume) {
            this.elements.volume.textContent = somnexData.volume;
            this.elements.volume.classList.add('live-data');
        } else if (this.elements.volume && tokenData.volume_24h) {
            this.elements.volume.textContent = this.formatVolume(tokenData.volume_24h);
            this.elements.volume.classList.add('live-data');
        } else if (this.elements.volume) {
            this.elements.volume.textContent = 'Loading...';
            this.elements.volume.classList.add('loading-data');
        }

        // Update bonding curve progress
        if (this.elements.bondingProgress && somnexData.bondingProgress) {
            this.elements.bondingProgress.textContent = somnexData.bondingProgress;
            this.elements.bondingProgress.classList.add('live-data');
        }

        // Update available tokens
        if (this.elements.availableTokens && somnexData.availableTokens) {
            this.elements.availableTokens.textContent = somnexData.availableTokens;
            this.elements.availableTokens.classList.add('live-data');
        }
    }

    /**
     * Update last update timestamp
     */
    updateLastUpdate() {
        if (this.elements.lastUpdate) {
            const now = new Date();
            this.elements.lastUpdate.textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
    }

    /**
     * Show error state
     */
    showErrorState() {
        Object.values(this.elements).forEach(element => {
            if (element) {
                element.classList.add('error-data');
                element.textContent = 'Loading...';
            }
        });
    }

    /**
     * Get data from cache
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.data;
        }
        return null;
    }

    /**
     * Set data in cache
     */
    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    /**
     * Format number with commas
     */
    formatNumber(num) {
        return parseInt(num).toLocaleString();
    }

    /**
     * Format price
     */
    formatPrice(price) {
        if (!price || price === 0) return '$0.00';
        return `$${parseFloat(price).toFixed(8)}`;
    }

    /**
     * Format market cap
     */
    formatMarketCap(marketCap) {
        if (!marketCap || marketCap === 0) return '$0';
        const num = parseFloat(marketCap);
        if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
        if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
        return `$${num.toFixed(2)}`;
    }

    /**
     * Format volume
     */
    formatVolume(volume) {
        if (!volume || volume === 0) return '0';
        return this.formatMarketCap(volume);
    }

    /**
     * Cleanup
     */
    destroy() {
        this.stopAutoRefresh();
        this.cache.clear();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.tokenDataFetcher = new TokenDataFetcher();
    window.tokenDataFetcher.init();
});

// Also try to initialize immediately if DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, event will handle it
} else {
    // DOM is already loaded, initialize immediately
    if (!window.tokenDataFetcher) {
        window.tokenDataFetcher = new TokenDataFetcher();
        window.tokenDataFetcher.init();
    }
}

// Re-initialize after age verification to ensure data loads
window.addEventListener('ageVerified', () => {
    if (window.tokenDataFetcher) {
        window.tokenDataFetcher.fetchAllData();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.tokenDataFetcher) {
        window.tokenDataFetcher.destroy();
    }
});