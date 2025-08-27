// backend/services/printifyService.js
const axios = require('axios');

class PrintifyService {
  constructor() {
    this.baseURL = process.env.PRINTIFY_BASE_URL || 'https://api.printify.com/v1';
    this.token = process.env.PRINTIFY_API_TOKEN;
    this.shopId = process.env.PRINTIFY_SHOP_ID;
    
    if (!this.token) {
      throw new Error('PRINTIFY_API_TOKEN is required');
    }
    
    if (!this.shopId) {
      throw new Error('PRINTIFY_SHOP_ID is required');
    }

    // Configura axios con defaults
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'User-Agent': 'OnlyOne/1.0',
        'Content-Type': 'application/json'
      },
      timeout: 30000 // 30 secondi
    });

    // Interceptors per logging e rate limiting
    this.client.interceptors.request.use(
      (config) => {
        console.log(`ðŸ"¤ Printify API: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('ðŸ"¤âŒ Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`ðŸ"¥ Printify API: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response?.status === 429) {
          console.warn('âš ï¸ Rate limit hit, should implement backoff');
        }
        console.error(`ðŸ"¥âŒ Response Error: ${error.response?.status} ${error.config?.url}`);
        return Promise.reject(error);
      }
    );
  }

  // Verifica connessione e configurazione
  async healthCheck() {
    try {
      const response = await this.client.get('/shops.json');
      const shops = response.data;
      
      const currentShop = shops.find(shop => shop.id.toString() === this.shopId);
      
      return {
        connected: true,
        shopId: this.shopId,
        shopFound: !!currentShop,
        shopTitle: currentShop?.title || 'Shop not found',
        totalShops: shops.length
      };
    } catch (error) {
      return {
        connected: false,
        error: error.message,
        status: error.response?.status
      };
    }
  }

  // Lista tutti i prodotti
  async getProducts(page = 1, limit = 50) {
    try {
      // Printify API ha limiti specifici per products.json
      const validLimit = Math.min(Math.max(limit, 1), 50); // Max 50 per products
      
      const response = await this.client.get(`/shops/${this.shopId}/products.json`, {
        params: { 
          page: Math.max(page, 1),
          limit: validLimit 
        }
      });
      
      return {
        products: response.data.data || response.data || [],
        pagination: {
          current_page: response.data.current_page || page,
          last_page: response.data.last_page || 1,
          total: response.data.total || 0
        }
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      console.error('Response data:', error.response?.data);
      throw new Error(`Failed to fetch products: ${error.message}`);
    }
  }

  // Dettaglio singolo prodotto
  async getProduct(productId) {
    try {
      const response = await this.client.get(`/shops/${this.shopId}/products/${productId}.json`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching product ${productId}:`, error);
      throw new Error(`Failed to fetch product: ${error.message}`);
    }
  }

  // Cerca prodotti per query testuale (OTTIMIZZATO - NO FULL CATALOG)
  async searchProducts(query, limit = 10) {
    try {
      console.log(`🔍 Fast search for: "${query}"`);
      
      if (!query || typeof query !== 'string') {
        throw new Error('Query parameter is required and must be a string');
      }

      // Normalizza la query
      const normalizedQuery = this.normalizeString(query);
      const queryWords = this.extractSearchWords(normalizedQuery);
      
      console.log(`🔍 Query words: [${queryWords.join(', ')}]`);
      
      if (queryWords.length === 0) {
        return {
          products: [],
          query: query,
          matches: 0,
          searchWords: queryWords,
          strategy: 'empty_query'
        };
      }

      // ⚡ STRATEGIA VELOCE: Carica solo le prime 2 pagine (100 prodotti max)
      const MAX_PAGES = 2;
      const BATCH_SIZE = 50;
      
      let allProducts = [];
      let matchingProducts = [];
      
      for (let page = 1; page <= MAX_PAGES; page++) {
        console.log(`📦 Fetching page ${page}/${MAX_PAGES}...`);
        
        const batch = await this.getProducts(page, BATCH_SIZE);
        
        if (!batch.products || batch.products.length === 0) {
          console.log(`📦 No more products at page ${page}`);
          break;
        }
        
        // Filtra immediatamente questa pagina
        const pageMatches = this.filterProductsByQuery(batch.products, queryWords, query);
        matchingProducts = matchingProducts.concat(pageMatches);
        allProducts = allProducts.concat(batch.products);
        
        console.log(`📦 Page ${page}: ${batch.products.length} products, ${pageMatches.length} matches`);
        
        // ⚡ EARLY EXIT: Se abbiamo abbastanza matches, fermiamoci
        if (matchingProducts.length >= limit * 2) {
          console.log(`⚡ Early exit: Found ${matchingProducts.length} matches, enough for ${limit} results`);
          break;
        }
        
        // ⚡ EARLY EXIT: Se è l'ultima pagina disponibile
        if (batch.pagination.current_page >= batch.pagination.last_page) {
          console.log(`📦 Reached last page (${batch.pagination.last_page})`);
          break;
        }
        
        // Rate limiting solo tra le chiamate
        if (page < MAX_PAGES) {
          await new Promise(resolve => setTimeout(resolve, 50)); // 50ms pausa
        }
      }

      // Limita risultati finali
      const limitedResults = matchingProducts.slice(0, limit);
      
      console.log(`✅ Fast search completed: ${matchingProducts.length} matches from ${allProducts.length} products`);
      
      return {
        products: limitedResults,
        query: query,
        matches: matchingProducts.length,
        total: allProducts.length,
        searchWords: queryWords,
        limited: matchingProducts.length > limit,
        strategy: 'fast_search'
      };

    } catch (error) {
      console.error(`❌ Fast search error for "${query}":`, error);
      throw new Error(`Fast search failed: ${error.message}`);
    }
  }

  // ⚡ VERSIONE ANCORA PIÙ VELOCE: Cerca solo nella prima pagina
  async searchProductsFastest(query, limit = 10) {
    try {
      console.log(`⚡ Ultra-fast search for: "${query}"`);
      
      if (!query || typeof query !== 'string') {
        throw new Error('Query parameter is required');
      }

      const normalizedQuery = this.normalizeString(query);
      const queryWords = this.extractSearchWords(normalizedQuery);
      
      if (queryWords.length === 0) {
        return { products: [], query, matches: 0, searchWords: [], strategy: 'empty_query' };
      }

      // Carica SOLO la prima pagina (50 prodotti)
      console.log(`📦 Fetching first page only...`);
      const firstPage = await this.getProducts(1, 50);
      
      if (!firstPage.products) {
        return { products: [], query, matches: 0, searchWords: queryWords, strategy: 'no_products' };
      }

      // Filtra immediatamente
      const matches = this.filterProductsByQuery(firstPage.products, queryWords, query);
      const limited = matches.slice(0, limit);
      
      console.log(`⚡ Ultra-fast completed: ${matches.length} matches from ${firstPage.products.length} products`);
      
      return {
        products: limited,
        query,
        matches: matches.length,
        total: firstPage.products.length,
        searchWords: queryWords,
        limited: matches.length > limit,
        strategy: 'ultra_fast'
      };

    } catch (error) {
      console.error(`❌ Ultra-fast search error:`, error);
      throw error;
    }
  }

  // NEW: Utility - normalizza stringa (stesso algoritmo del frontend)
  normalizeString(str) {
    return str
      .toLowerCase()
      .replace(/[_\-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // NEW: Utility - estrae parole significative per la ricerca
  extractSearchWords(normalizedStr) {
    const stopWords = ['la', 'le', 'il', 'dello', 'della', 'degli', 'delle', 'del', 'di', 'da', 'in', 'con', 'per', 'tra', 'fra', 'the', 'of', 'and', 'a', 'an'];
    
    return normalizedStr
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.includes(word));
  }

  // NEW: Utility - filtra prodotti che matchano la query
  filterProductsByQuery(products, queryWords, originalQuery) {
    return products.filter(product => {
      if (!product.title) return false;
      
      const normalizedTitle = this.normalizeString(product.title);
      
      // Strategia 1: Match esatto della query completa
      if (normalizedTitle.includes(this.normalizeString(originalQuery))) {
        console.log(`🎯 Exact match found: "${product.title}"`);
        return true;
      }
      
      // Strategia 2: Match di almeno 1 parola significativa (abbassato da 2)
      const titleWords = this.extractSearchWords(normalizedTitle);
      const matchCount = queryWords.filter(qWord => 
        titleWords.some(tWord => tWord.includes(qWord) || qWord.includes(tWord))
      ).length;
      
      if (matchCount >= 1) {
        console.log(`📝 Word match (${matchCount}/${queryWords.length}): "${product.title}"`);
        return true;
      }
      
      return false;
    });
  }

  // Trasforma i dati Printify nel formato OnlyOne
  transformProductForCatalog(printifyProduct) {
    const {
      id,
      title,
      description,
      tags,
      images,
      variants,
      blueprint_id,
      print_provider_id,
      created_at,
      updated_at,
      external
    } = printifyProduct;

    // Trova l'immagine principale (prima disponibile)
    const mainImage = images && images.length > 0 ? images[0] : null;
    
    // Calcola range prezzi dalle varianti
    const prices = variants
      ?.filter(v => v.is_enabled)
      ?.map(v => parseFloat(v.price)) || [];
    
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

    return {
      id: id.toString(),
      printifyId: id,
      title: title || 'Untitled Product',
      description: description || '',
      handle: external?.handle || `product-${id}`, // URL slug
      tags: tags || [],
      image: mainImage?.src || null,
      images: images || [],
      price: {
        min: minPrice,
        max: maxPrice,
        currency: 'EUR' // Assumiamo EUR, ma potresti leggerlo da configurazione
      },
      variants: variants?.filter(v => v.is_enabled) || [],
      status: printifyProduct.is_locked ? 'publishing' : 'published',
      createdAt: created_at,
      updatedAt: updated_at,
      external: external || null
    };
  }

  // Trasforma dettaglio prodotto con tutte le varianti
  transformProductDetail(printifyProduct) {
    const base = this.transformProductForCatalog(printifyProduct);
    
    // Raggruppa varianti per opzioni (colore, taglia, etc.)
    const variantOptions = {};
    
    if (base.variants) {
      base.variants.forEach(variant => {
        if (variant.options) {
          variant.options.forEach(option => {
            if (!variantOptions[option.name]) {
              variantOptions[option.name] = new Set();
            }
            variantOptions[option.name].add(option.value);
          });
        }
      });
    }
    
    // Converte Set in Array
    Object.keys(variantOptions).forEach(key => {
      variantOptions[key] = Array.from(variantOptions[key]);
    });

    return {
      ...base,
      variantOptions,
      blueprint_id: printifyProduct.blueprint_id,
      print_provider_id: printifyProduct.print_provider_id
    };
  }

  // Conferma pubblicazione riuscita a Printify
  async confirmPublishingSucceeded(productId, external) {
    try {
      const response = await this.client.post(`/shops/${this.shopId}/products/${productId}/publishing_succeeded.json`, {
        external: {
          id: external.id,
          handle: external.handle
        }
      });
      
      console.log(`âœ… Publishing succeeded confirmed for product ${productId}`);
      return response.data;
    } catch (error) {
      console.error(`Error confirming publishing success for ${productId}:`, error);
      throw new Error(`Failed to confirm publishing success: ${error.message}`);
    }
  }

  // Conferma pubblicazione fallita a Printify
  async confirmPublishingFailed(productId, reason) {
    try {
      const response = await this.client.post(`/shops/${this.shopId}/products/${productId}/publishing_failed.json`, {
        reason: reason || 'Unknown error during publishing'
      });
      
      console.log(`âŒ Publishing failed confirmed for product ${productId}: ${reason}`);
      return response.data;
    } catch (error) {
      console.error(`Error confirming publishing failure for ${productId}:`, error);
      throw new Error(`Failed to confirm publishing failure: ${error.message}`);
    }
  }

  // Lista e gestione webhooks
  async listWebhooks() {
    try {
      const response = await this.client.get('/webhooks.json');
      return response.data;
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      throw new Error(`Failed to fetch webhooks: ${error.message}`);
    }
  }

  async createWebhook(url, events) {
    try {
      const response = await this.client.post('/webhooks.json', {
        webhook: {
          url: url,
          events: events || [
            'product:publish:started',
            'order:created',
            'order:updated',
            'order:sent-to-production',
            'order:shipment:created',
            'order:shipment:delivered'
          ]
        }
      });
      
      console.log(`âœ… Webhook created: ${url}`);
      return response.data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw new Error(`Failed to create webhook: ${error.message}`);
    }
  }

  async deleteWebhook(webhookId) {
    try {
      await this.client.delete(`/webhooks/${webhookId}.json`);
      console.log(`âœ… Webhook deleted: ${webhookId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting webhook ${webhookId}:`, error);
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }
}

module.exports = new PrintifyService();