// backend/services/cacheService.js
class CacheService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.CATALOG_KEY = 'full_catalog';
    this.CACHE_DURATION = 15 * 60 * 1000; // 15 minuti
    this.isWarmingUp = false;
  }

  // Ottieni dal cache se valido
  get(key) {
    const expiry = this.cacheExpiry.get(key);
    if (expiry && Date.now() < expiry) {
      console.log(`Cache HIT: ${key}`);
      return this.cache.get(key);
    }
    
    if (this.cache.has(key)) {
      console.log(`Cache EXPIRED: ${key}`);
      this.cache.delete(key);
      this.cacheExpiry.delete(key);
    }
    
    console.log(`Cache MISS: ${key}`);
    return null;
  }

  // Salva nel cache
  set(key, value) {
    console.log(`Cache SET: ${key}`);
    this.cache.set(key, value);
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);
  }

  // Verifica se il catalogo completo è in cache
  hasCatalog() {
    return this.get(this.CATALOG_KEY) !== null;
  }

  // Ottieni catalogo completo dal cache
  getCatalog() {
    return this.get(this.CATALOG_KEY);
  }

  // Salva catalogo completo
  setCatalog(catalog) {
    this.set(this.CATALOG_KEY, catalog);
  }

  // Warm-up cache in background (chiamato all'avvio server)
  async warmupCache(printifyService) {
    if (this.isWarmingUp || this.hasCatalog()) {
      return;
    }

    this.isWarmingUp = true;
    console.log('Starting cache warmup...');

    try {
      // Carica tutto il catalogo in background
      let allProducts = [];
      let currentPage = 1;
      let hasMore = true;

      while (hasMore && allProducts.length < 200) {
        const batch = await printifyService.getProducts(currentPage, 50);
        
        if (!batch.products || batch.products.length === 0) {
          break;
        }
        
        allProducts = allProducts.concat(batch.products);
        hasMore = batch.pagination.current_page < batch.pagination.last_page;
        currentPage++;

        // Rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // Trasforma i prodotti
      const transformedProducts = allProducts.map(product => 
        printifyService.transformProductForCatalog(product)
      );

      // Salva in cache
      this.setCatalog(transformedProducts);
      
      console.log(`Cache warmup completed: ${transformedProducts.length} products cached`);

    } catch (error) {
      console.error('Cache warmup failed:', error);
    } finally {
      this.isWarmingUp = false;
    }
  }

  // Ricerca nel catalogo cached
  searchInCache(query, limit = 10) {
    const catalog = this.getCatalog();
    if (!catalog) {
      return null;
    }

    const normalizedQuery = this.normalizeString(query);
    const queryWords = this.extractSearchWords(normalizedQuery);
    
    if (queryWords.length === 0) {
      return { products: [], matches: 0, fromCache: true };
    }

    // Filtra prodotti matching
    const matches = catalog.filter(product => {
      if (!product.title) return false;
      
      const normalizedTitle = this.normalizeString(product.title);
      
      // Match esatto
      if (normalizedTitle.includes(normalizedQuery)) {
        return true;
      }
      
      // Match di almeno 1 parola
      const titleWords = this.extractSearchWords(normalizedTitle);
      const matchCount = queryWords.filter(qWord => 
        titleWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))
      ).length;
      
      return matchCount >= 1;
    });

    const limited = matches.slice(0, limit);
    
    return {
      products: limited,
      matches: matches.length,
      total: catalog.length,
      fromCache: true,
      searchWords: queryWords
    };
  }

  // Utility functions
  normalizeString(str) {
    return str.toLowerCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  extractSearchWords(normalizedStr) {
    const stopWords = ['la', 'le', 'il', 'dello', 'della', 'degli', 'delle', 'del', 'di', 'da', 'in', 'con', 'per', 'tra', 'fra', 'the', 'of', 'and', 'a', 'an'];
    
    return normalizedStr
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word));
  }

  // Pulisci cache
  clear() {
    this.cache.clear();
    this.cacheExpiry.clear();
    console.log('Cache cleared');
  }

  // Statistiche cache
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
      hasCatalog: this.hasCatalog(),
      isWarmingUp: this.isWarmingUp
    };
  }
}

// Singleton instance
const cacheService = new CacheService();
module.exports = cacheService;