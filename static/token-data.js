/**
 * Real-time Token Data Fetcher for SCHWEPE
 * Fetches live data from Somnia Explorer API and Somnex DEX
 */
class TokenDataFetcher {
    constructor() {
        this.tokenAddress = '0xDD10620866C4F586b1213d3818811Faf3718FCe3';
        this.somniaApiBase = 'https://explorer.somnia.network/api/v2';
        this.somnexUrl = 'https://somnex.xyz';

        // Use AllOrigins CORS proxy for production reliability
        this.corsProxyBase = 'https://api.allorigins.win/get?url=';
        this.useLocalProxy = false;

        console.log('🔗 Using AllOrigins CORS proxy:', this.corsProxyBase);

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
            lastUpdate: null,
            tokenSupply: null,
            liquidity: null
        };
    }

    /**
     * Detect which CORS proxy to use
     */
    detectCORSProxy() {
        // For development (localhost) - try local proxy first
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            this.corsProxyBase = `http://localhost:${this.localProxyPort}`;
            this.useLocalProxy = true;
            console.log('🔧 Using local CORS proxy:', this.corsProxyBase);
        } else {
            // For production - use allorigins.win
            this.corsProxyBase = 'https://api.allorigins.win/get?url=';
            this.useLocalProxy = false;
            console.log('🌐 Using remote CORS proxy:', this.corsProxyBase);
        }
    }

    /**
     * Initialize the token data fetcher
     */
    init() {
        this.cacheElements();
        // Start if any data elements are found
        const hasElements = Object.values(this.elements).some(element => element !== null);
        if (hasElements) {
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
            lastUpdate: document.querySelector('[data-last-update]'),
            tokenSupply: document.querySelector('[data-token-supply]'),
            liquidity: document.querySelector('[data-token-liquidity]')
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
            // Handle each API call individually to prevent total failure
            const results = await Promise.allSettled([
                this.fetchTokenInfo(),
                this.fetchHoldersCount(),
                this.fetchSomnexData()
            ]);

            const tokenData = results[0].status === 'fulfilled' ? results[0].value : null;
            const holdersData = results[1].status === 'fulfilled' ? results[1].value : null;
            const somnexData = results[2].status === 'fulfilled' ? results[2].value : null;

            this.updateUI(tokenData, holdersData, somnexData);
            this.updateLastUpdate();
        } catch (error) {
            console.error('Critical error fetching token data:', error);
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
            let response, data;

            // Use AllOrigins CORS proxy
            const originalUrl = `${this.somniaApiBase}/tokens/${this.tokenAddress}`;
            const proxyUrl = `${this.corsProxyBase}${encodeURIComponent(originalUrl)}`;
            console.log('🔗 Fetching from AllOrigins proxy:', proxyUrl);
            response = await fetch(proxyUrl);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();
            data = result.contents ? JSON.parse(result.contents) : null;

            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching token info:', error);
            // Return null when API calls fail - no fallbacks
            return null;
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
            let response, data;

            // Use AllOrigins CORS proxy
            const originalUrl = `${this.somniaApiBase}/tokens/${this.tokenAddress}/counters`;
            const proxyUrl = `${this.corsProxyBase}${encodeURIComponent(originalUrl)}`;
            console.log('🔗 Fetching holders from AllOrigins proxy:', proxyUrl);
            response = await fetch(proxyUrl);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();
            data = result.contents ? JSON.parse(result.contents) : null;

            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching holders count:', error);
            // Return null when API calls fail - no fallbacks
            return null;
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
            // Use AllOrigins CORS proxy for all environments to fix CORS issues completely
            const url = `${this.somnexUrl}/#/token/${this.tokenAddress}`;
            const headers = {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            };

            // Use AllOrigins CORS proxy
            const proxiedUrl = `${this.corsProxyBase}${encodeURIComponent(url)}`;
            console.log('🔗 Fetching Somnex data from AllOrigins proxy:', proxiedUrl);
            const response = await fetch(proxiedUrl, { headers });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const result = await response.json();
            const html = result.contents || '';

            const data = this.parseSomnexData(html);
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching Somnex data:', error);
            // Return null when API calls fail - no fallbacks
            return null;
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
        console.log('🔍 Updating UI with data:', { tokenData, holdersData, somnexData });

        // Update holders count - prioritize tokenData.holders, fallback to holdersData
        if (this.elements.holders) {
            // Always remove loading state first
            this.elements.holders.classList.remove('loading-data');
            if (tokenData && tokenData.holders) {
                this.elements.holders.textContent = this.formatNumber(tokenData.holders);
                this.elements.holders.classList.add('live-data');
                this.elements.holders.classList.remove('error-data');
            } else if (holdersData && holdersData.token_holders_count) {
                this.elements.holders.textContent = this.formatNumber(holdersData.token_holders_count);
                this.elements.holders.classList.add('live-data');
                this.elements.holders.classList.remove('error-data');
            } else {
                this.elements.holders.textContent = 'No data';
                this.elements.holders.classList.add('error-data');
                this.elements.holders.classList.remove('live-data');
            }
        }

        // Update price - handle null values properly
        if (this.elements.price) {
            // Always remove loading state first
            this.elements.price.classList.remove('loading-data');
            if (somnexData && somnexData.price) {
                this.elements.price.textContent = somnexData.price;
                this.elements.price.classList.add('live-data', 'live-price');
                this.elements.price.classList.remove('error-data');
            } else if (tokenData && tokenData.exchange_rate) {
                this.elements.price.textContent = this.formatPrice(tokenData.exchange_rate);
                this.elements.price.classList.add('live-data');
                this.elements.price.classList.remove('error-data');
            } else {
                this.elements.price.textContent = 'No data';
                this.elements.price.classList.add('error-data');
                this.elements.price.classList.remove('live-data');
            }
        }

        // Update price change from Somnex
        if (this.elements.priceChange && somnexData && somnexData.priceChange) {
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

        // Update market cap - handle null values properly
        if (this.elements.marketCap) {
            // Always remove loading state first
            this.elements.marketCap.classList.remove('loading-data');
            if (somnexData && somnexData.marketCap) {
                this.elements.marketCap.textContent = somnexData.marketCap;
                this.elements.marketCap.classList.add('live-data');
                this.elements.marketCap.classList.remove('error-data');
            } else if (tokenData && tokenData.circulating_market_cap && tokenData.circulating_market_cap !== null) {
                this.elements.marketCap.textContent = this.formatMarketCap(tokenData.circulating_market_cap);
                this.elements.marketCap.classList.add('live-data');
                this.elements.marketCap.classList.remove('error-data');
            } else {
                this.elements.marketCap.textContent = 'No data';
                this.elements.marketCap.classList.add('error-data');
                this.elements.marketCap.classList.remove('live-data');
            }
        }

        // Update volume - handle null values properly
        if (this.elements.volume) {
            // Always remove loading state first
            this.elements.volume.classList.remove('loading-data');
            if (somnexData && somnexData.volume) {
                this.elements.volume.textContent = somnexData.volume;
                this.elements.volume.classList.add('live-data');
                this.elements.volume.classList.remove('error-data');
            } else if (tokenData && tokenData.volume_24h && tokenData.volume_24h !== null) {
                this.elements.volume.textContent = this.formatVolume(tokenData.volume_24h);
                this.elements.volume.classList.add('live-data');
                this.elements.volume.classList.remove('error-data');
            } else {
                this.elements.volume.textContent = 'No data';
                this.elements.volume.classList.add('error-data');
                this.elements.volume.classList.remove('live-data');
            }
        }

        // Update bonding curve progress
        if (this.elements.bondingProgress && somnexData && somnexData.bondingProgress) {
            this.elements.bondingProgress.textContent = somnexData.bondingProgress;
            this.elements.bondingProgress.classList.add('live-data');
        }

        // Update available tokens
        if (this.elements.availableTokens && somnexData && somnexData.availableTokens) {
            this.elements.availableTokens.textContent = somnexData.availableTokens;
            this.elements.availableTokens.classList.add('live-data');
        }

        // Update token supply (from token data)
        if (this.elements.tokenSupply) {
            // Always remove loading state first
            this.elements.tokenSupply.classList.remove('loading-data');
            if (tokenData && tokenData.total_supply) {
                const supply = parseInt(tokenData.total_supply) / Math.pow(10, 18);
                this.elements.tokenSupply.textContent = supply.toLocaleString();
                this.elements.tokenSupply.classList.add('live-data');
                this.elements.tokenSupply.classList.remove('error-data');
            } else {
                this.elements.tokenSupply.textContent = 'No data';
                this.elements.tokenSupply.classList.add('error-data');
                this.elements.tokenSupply.classList.remove('live-data');
            }
        }

        // Update liquidity (from Somnex data)
        if (this.elements.liquidity) {
            // Always remove loading state first
            this.elements.liquidity.classList.remove('loading-data');
            if (somnexData && somnexData.liquidity) {
                this.elements.liquidity.textContent = somnexData.liquidity;
                this.elements.liquidity.classList.add('live-data');
                this.elements.liquidity.classList.remove('error-data');
            } else if (somnexData && somnexData.availableTokens) {
                // Fallback: try to extract from available tokens if liquidity not directly available
                this.elements.liquidity.textContent = somnexData.availableTokens;
                this.elements.liquidity.classList.add('live-data');
                this.elements.liquidity.classList.remove('error-data');
            } else {
                this.elements.liquidity.textContent = 'No data';
                this.elements.liquidity.classList.add('error-data');
                this.elements.liquidity.classList.remove('live-data');
            }
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
                element.classList.remove('loading-data');
                element.classList.add('error-data');
                element.textContent = 'API Blocked';
            }
        });
    }

    /**
     * Check if error is CORS related
     */
    isCORSError(error) {
        return error.message && error.message.includes('CORS') ||
               error.message && error.message.includes('Access-Control-Allow-Origin');
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
     * API-Only: No fallbacks allowed
     */

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

// Global refresh function for button onclick
window.refreshStats = function() {
    if (window.tokenDataFetcher) {
        window.tokenDataFetcher.fetchAllData();
    }
};

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