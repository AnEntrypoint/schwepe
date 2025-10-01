/**
 * Real-time Token Data Fetcher for SCHWEPE
 * Fetches live data from Somnia Explorer API and Somnex DEX
 */
class TokenDataFetcher {
    constructor() {
        this.tokenAddress = '0xDD10620866C4F586b1213d3818811Faf3718FCe3';
        this.somniaApiBase = 'https://explorer.somnia.network/api/v2';
        this.somnexUrl = 'https://somnex.xyz';

        // Use integrated CORS proxy on main server
        this.corsProxyBase = window.location.origin;
        this.useLocalProxy = true; // Always use integrated proxy

        console.log('🔗 Using integrated CORS proxy:', this.corsProxyBase);

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

            // Use integrated CORS proxy on main server
            const apiUrl = `${this.corsProxyBase}/api/token/${this.tokenAddress}`;
            console.log('🔗 Fetching from integrated proxy:', apiUrl);
            response = await fetch(apiUrl);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            data = await response.json();

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

            // Use integrated CORS proxy on main server
            const apiUrl = `${this.corsProxyBase}/api/token/${this.tokenAddress}/counters`;
            console.log('🔗 Fetching holders from integrated proxy:', apiUrl);
            response = await fetch(apiUrl);

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            data = await response.json();

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
            // Use CORS proxy for all environments to fix CORS issues completely
            const url = `${this.somnexUrl}/#/token/${this.tokenAddress}`;
            const headers = {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            };

            // Use integrated CORS proxy on main server
            const proxiedUrl = `${this.corsProxyBase}/api/proxy?url=${encodeURIComponent(url)}`;
            console.log('🔗 Fetching Somnex data from integrated proxy:', proxiedUrl);
            const response = await fetch(proxiedUrl, { headers });

            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const html = await response.text();

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
        // Update holders count
        if (this.elements.holders && tokenData && tokenData.holders_count) {
            this.elements.holders.textContent = this.formatNumber(tokenData.holders_count);
            this.elements.holders.classList.add('live-data');
        }

        // Update price from Somnex (live data)
        if (this.elements.price && somnexData && somnexData.price) {
            this.elements.price.textContent = somnexData.price;
            this.elements.price.classList.add('live-data', 'live-price');
        } else if (this.elements.price) {
            this.elements.price.textContent = 'Loading...';
            this.elements.price.classList.add('loading-data');
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

        // Update market cap from Somnex
        if (this.elements.marketCap && somnexData && somnexData.marketCap) {
            this.elements.marketCap.textContent = somnexData.marketCap;
            this.elements.marketCap.classList.add('live-data');
        } else if (this.elements.marketCap && tokenData && tokenData.circulating_market_cap) {
            this.elements.marketCap.textContent = this.formatMarketCap(tokenData.circulating_market_cap);
            this.elements.marketCap.classList.add('live-data');
        } else if (this.elements.marketCap) {
            this.elements.marketCap.textContent = 'Loading...';
            this.elements.marketCap.classList.add('loading-data');
        }

        // Update volume from Somnex
        if (this.elements.volume && somnexData && somnexData.volume) {
            this.elements.volume.textContent = somnexData.volume;
            this.elements.volume.classList.add('live-data');
        } else if (this.elements.volume && tokenData && tokenData.volume_24h) {
            this.elements.volume.textContent = this.formatVolume(tokenData.volume_24h);
            this.elements.volume.classList.add('live-data');
        } else if (this.elements.volume) {
            this.elements.volume.textContent = 'Loading...';
            this.elements.volume.classList.add('loading-data');
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
        if (this.elements.tokenSupply && tokenData && tokenData.total_supply) {
            const supply = parseInt(tokenData.total_supply) / Math.pow(10, 18);
            this.elements.tokenSupply.textContent = supply.toLocaleString();
            this.elements.tokenSupply.classList.add('live-data');
        } else if (this.elements.tokenSupply) {
            this.elements.tokenSupply.textContent = 'Loading...';
            this.elements.tokenSupply.classList.add('loading-data');
        }

        // Update liquidity (from Somnex data)
        if (this.elements.liquidity && somnexData && somnexData.liquidity) {
            this.elements.liquidity.textContent = somnexData.liquidity;
            this.elements.liquidity.classList.add('live-data');
        } else if (this.elements.liquidity && somnexData && somnexData.availableTokens) {
            // Fallback: try to extract from available tokens if liquidity not directly available
            this.elements.liquidity.textContent = somnexData.availableTokens;
            this.elements.liquidity.classList.add('live-data');
        } else if (this.elements.liquidity) {
            this.elements.liquidity.textContent = 'Loading...';
            this.elements.liquidity.classList.add('loading-data');
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