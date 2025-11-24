export class CacheManager {
  constructor(dbName = 'schwelevision_cache') {
    this.dbName = dbName;
    this.dbVersion = 1;
    this.db = null;
    this.cacheStats = {
      hits: 0,
      misses: 0,
      lastHitTime: 0,
      lastMissTime: 0
    };
  }

  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => {
        console.log('⚠ IndexedDB init failed, falling back to memory cache');
        reject(request.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        console.log('✓ IndexedDB initialized');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains('durations')) {
          const store = db.createObjectStore('durations', { keyPath: 'videoId' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('✓ Created durations store');
        }

        if (!db.objectStoreNames.contains('metadata')) {
          const store = db.createObjectStore('metadata', { keyPath: 'id' });
          store.createIndex('type', 'type', { unique: false });
          console.log('✓ Created metadata store');
        }

        if (!db.objectStoreNames.contains('stats')) {
          db.createObjectStore('stats', { keyPath: 'key' });
          console.log('✓ Created stats store');
        }
      };
    });
  }

  async getDuration(videoId) {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve) => {
      const transaction = this.db.transaction(['durations'], 'readonly');
      const store = transaction.objectStore('durations');
      const request = store.get(videoId);

      request.onsuccess = () => {
        if (request.result) {
          this.cacheStats.hits++;
          this.cacheStats.lastHitTime = Date.now();
          resolve(request.result.duration);
        } else {
          this.cacheStats.misses++;
          this.cacheStats.lastMissTime = Date.now();
          resolve(null);
        }
      };

      request.onerror = () => {
        this.cacheStats.misses++;
        resolve(null);
      };
    });
  }

  async setDuration(videoId, duration) {
    if (!this.db) {
      return false;
    }

    return new Promise((resolve) => {
      const transaction = this.db.transaction(['durations'], 'readwrite');
      const store = transaction.objectStore('durations');
      const request = store.put({
        videoId: videoId,
        duration: duration,
        timestamp: Date.now()
      });

      request.onsuccess = () => {
        resolve(true);
      };

      request.onerror = () => {
        console.log('⚠ Failed to cache duration:', videoId);
        resolve(false);
      };
    });
  }

  async getMetadata(key) {
    if (!this.db) {
      return null;
    }

    return new Promise((resolve) => {
      const transaction = this.db.transaction(['metadata'], 'readonly');
      const store = transaction.objectStore('metadata');
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  }

  async getAllDurations() {
    if (!this.db) {
      return {};
    }

    return new Promise((resolve) => {
      const transaction = this.db.transaction(['durations'], 'readonly');
      const store = transaction.objectStore('durations');
      const request = store.getAll();

      request.onsuccess = () => {
        const result = {};
        request.result.forEach(item => {
          result[item.videoId] = item.duration;
        });
        resolve(result);
      };

      request.onerror = () => {
        resolve({});
      };
    });
  }

  getCacheStats() {
    const hitRate = this.cacheStats.hits + this.cacheStats.misses > 0
      ? (this.cacheStats.hits / (this.cacheStats.hits + this.cacheStats.misses) * 100).toFixed(1)
      : 0;

    return {
      hits: this.cacheStats.hits,
      misses: this.cacheStats.misses,
      hitRate: hitRate + '%',
      totalAccess: this.cacheStats.hits + this.cacheStats.misses,
      lastHitTime: this.cacheStats.lastHitTime,
      lastMissTime: this.cacheStats.lastMissTime
    };
  }
}
