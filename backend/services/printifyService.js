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
        console.log(`📤 Printify API: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('📤❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    this.client.interceptors.response.use(
      (response) => {
        console.log(`📥 Printify API: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response?.status === 429) {
          console.warn('⚠️ Rate limit hit, should implement backoff');
        }
        console.error(`📥❌ Response Error: ${error.response?.status} ${error.config?.url}`);
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
      
      console.log(`✅ Publishing succeeded confirmed for product ${productId}`);
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
      
      console.log(`❌ Publishing failed confirmed for product ${productId}: ${reason}`);
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
      
      console.log(`✅ Webhook created: ${url}`);
      return response.data;
    } catch (error) {
      console.error('Error creating webhook:', error);
      throw new Error(`Failed to create webhook: ${error.message}`);
    }
  }

  async deleteWebhook(webhookId) {
    try {
      await this.client.delete(`/webhooks/${webhookId}.json`);
      console.log(`✅ Webhook deleted: ${webhookId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting webhook ${webhookId}:`, error);
      throw new Error(`Failed to delete webhook: ${error.message}`);
    }
  }
}

module.exports = new PrintifyService();