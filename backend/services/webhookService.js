// backend/services/webhookService.js
const crypto = require('crypto');
const database = require('../models/database.js.broken');
const printifyService = require('./printifyService');

class WebhookService {
  constructor() {
    this.webhookSecret = process.env.WEBHOOK_SECRET || 'your_webhook_secret_here';
  }

  // Valida la firma HMAC del webhook
  validateWebhookSignature(payload, signature) {
    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload, 'utf8')
        .digest('hex');
      
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('Errore validazione firma webhook:', error);
      return false;
    }
  }

  // Genera un ID univoco per la scheda OnlyOne
  generateOnlyOneId(printifyProduct) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const titleSlug = printifyProduct.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    return `${titleSlug}-${random}-${timestamp}`;
  }

  // Genera handle pubblico (URL slug)
  generatePublicHandle(printifyProduct, onlyOneId) {
    const baseHandle = printifyProduct.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    
    // Assicurati che sia univoco
    return `${baseHandle}-${onlyOneId.split('-')[1]}`;
  }

  // Gestisce l'evento product:publish:started
  async handleProductPublishStarted(webhookPayload) {
    const { resource, action } = webhookPayload;
    
    console.log(`📦 Processing product publish: ${resource.id} (${action})`);
    
    try {
      // 1. Recupera il prodotto completo da Printify
      const printifyProduct = await printifyService.getProduct(resource.id);
      
      if (!printifyProduct) {
        throw new Error(`Product ${resource.id} not found on Printify`);
      }

      // 2. Controlla se esiste già nel nostro DB
      let existingProduct = await database.getProductByPrintifyId(resource.id);
      
      if (existingProduct) {
        console.log(`⚠️ Product ${resource.id} already exists in OnlyOne DB`);
        
        if (action === 'delete') {
          // Prodotto cancellato su Printify
          await database.updateProductStatus(resource.id, 'deleted');
          await this.confirmPublishingToProductify(resource.id, 'succeeded', existingProduct);
          return { success: true, action: 'deleted', product: existingProduct };
        } else {
          // Prodotto aggiornato
          await this.confirmPublishingToProductify(resource.id, 'succeeded', existingProduct);
          return { success: true, action: 'updated', product: existingProduct };
        }
      }

      if (action === 'delete') {
        // Prodotto da cancellare ma non esiste nel nostro DB
        console.log(`⚠️ Delete action for non-existing product ${resource.id}`);
        await printifyService.confirmPublishingFailed(resource.id, 'Product not found in OnlyOne');
        return { success: true, action: 'deleted', product: null };
      }

      // 3. Crea nuova scheda OnlyOne
      const onlyOneId = this.generateOnlyOneId(printifyProduct);
      const handle = this.generatePublicHandle(printifyProduct, onlyOneId);
      
      // 4. Trasforma i dati per il nostro formato
      const transformedProduct = printifyService.transformProductDetail(printifyProduct);
      
      // 5. Salva nel database
      const productData = {
        printify_id: resource.id,
        onlyone_id: onlyOneId,
        handle: handle,
        title: transformedProduct.title,
        description: transformedProduct.description,
        price_min: transformedProduct.price.min,
        price_max: transformedProduct.price.max,
        currency: transformedProduct.price.currency,
        images: transformedProduct.images,
        variants: transformedProduct.variants,
        external_data: {
          blueprint_id: transformedProduct.blueprint_id,
          print_provider_id: transformedProduct.print_provider_id,
          tags: transformedProduct.tags,
          created_at: transformedProduct.createdAt,
          updated_at: transformedProduct.updatedAt
        }
      };

      const result = await database.createProduct(productData);
      console.log(`✅ Product saved to OnlyOne DB: ${result.onlyone_id}`);

      // 6. Conferma a Printify che la pubblicazione è riuscita
      const externalData = {
        id: result.onlyone_id,
        handle: `${process.env.FRONTEND_URL || 'https://onlyone.com'}/product/${handle}`
      };
      
      await this.confirmPublishingToProductify(resource.id, 'succeeded', result, externalData);
      
      // 7. Aggiorna stato nel DB
      await database.updateProductStatus(resource.id, 'published', externalData);

      console.log(`🎉 Product ${resource.id} successfully published to OnlyOne!`);
      
      return {
        success: true,
        action: 'created',
        product: result,
        onlyOneId: result.onlyone_id,
        handle: handle,
        url: externalData.handle
      };

    } catch (error) {
      console.error(`❌ Error processing product ${resource.id}:`, error);
      
      // Conferma a Printify che la pubblicazione è fallita
      try {
        await printifyService.confirmPublishingFailed(resource.id, error.message);
      } catch (confirmError) {
        console.error('Failed to confirm publishing failure to Printify:', confirmError);
      }
      
      throw error;
    }
  }

  // Conferma la pubblicazione a Printify (succeeded)
  async confirmPublishingToProductify(productId, status, productResult, externalData = null) {
    try {
      if (status === 'succeeded') {
        const external = externalData || {
          id: productResult.onlyone_id,
          handle: `${process.env.FRONTEND_URL || 'https://onlyone.com'}/product/${productResult.handle}`
        };
        
        await printifyService.confirmPublishingSucceeded(productId, external);
        console.log(`✅ Confirmed publishing success to Printify: ${productId}`);
      } else {
        await printifyService.confirmPublishingFailed(productId, 'Processing failed');
        console.log(`❌ Confirmed publishing failure to Printify: ${productId}`);
      }
    } catch (error) {
      console.error(`Failed to confirm publishing to Printify: ${productId}`, error);
      throw error;
    }
  }

  // Processa webhook generico
  async processWebhook(webhookData, signature = null) {
    // Valida firma se fornita
    if (signature) {
      const isValid = this.validateWebhookSignature(
        JSON.stringify(webhookData), 
        signature.replace('sha256=', '')
      );
      
      if (!isValid) {
        throw new Error('Invalid webhook signature');
      }
    }

    // Estrai dati evento
    const eventId = webhookData.id || `${Date.now()}-${Math.random()}`;
    const eventType = webhookData.type;
    const resource = webhookData.resource || {};
    const action = webhookData.action;

    console.log(`📡 Webhook received: ${eventType} (${action}) for ${resource.type} ${resource.id}`);

    // Salva evento nel database per idempotenza
    try {
      const eventResult = await database.createWebhookEvent({
        event_id: eventId,
        event_type: eventType,
        resource_type: resource.type,
        resource_id: resource.id,
        action: action,
        payload: webhookData
      });

      if (eventResult.exists) {
        console.log(`⚠️ Webhook event ${eventId} already processed (idempotent)`);
        return { success: true, message: 'Event already processed' };
      }
    } catch (dbError) {
      console.error('Error saving webhook event:', dbError);
      // Continue processing even if DB save fails
    }

    // Processa l'evento
    let result = { success: false };
    
    try {
      switch (eventType) {
        case 'product:publish:started':
          result = await this.handleProductPublishStarted(webhookData);
          break;
          
        case 'order:created':
        case 'order:updated':
        case 'order:sent-to-production':
        case 'order:shipment:created':
        case 'order:shipment:delivered':
          console.log(`📦 Order event ${eventType} received but not implemented yet`);
          result = { success: true, message: 'Order event logged but not processed' };
          break;
          
        default:
          console.log(`⚠️ Unhandled webhook event type: ${eventType}`);
          result = { success: true, message: 'Event type not handled' };
      }

      // Aggiorna stato evento nel database
      await database.updateWebhookEventStatus(eventId, 'processed');
      
      console.log(`✅ Webhook ${eventId} processed successfully`);
      return result;
      
    } catch (error) {
      console.error(`❌ Error processing webhook ${eventId}:`, error);
      
      // Aggiorna stato evento come errore
      await database.updateWebhookEventStatus(eventId, 'error', error.message);
      
      throw error;
    }
  }

  // Lista webhook pendenti per retry
  async getPendingWebhooks() {
    return database.getPendingWebhookEvents();
  }

  // Retry webhook falliti
  async retryPendingWebhooks() {
    const pending = await this.getPendingWebhooks();
    
    console.log(`🔄 Retrying ${pending.length} pending webhooks`);
    
    const results = [];
    
    for (const event of pending) {
      try {
        const result = await this.processWebhook(event.payload);
        results.push({ eventId: event.event_id, success: true, result });
      } catch (error) {
        console.error(`Failed to retry webhook ${event.event_id}:`, error);
        results.push({ eventId: event.event_id, success: false, error: error.message });
      }
    }
    
    return results;
  }
}

module.exports = new WebhookService();