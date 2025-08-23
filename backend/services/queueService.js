// backend/services/queueService.js
class QueueService {
  constructor() {
    console.log('✅ Queue service initialized (simplified mode)');
    this.mode = 'direct';
  }

  // Processa webhook direttamente (senza coda)
  async addWebhookJob(webhookData, signature = null, options = {}) {
    try {
      console.log('🔄 Processing webhook directly (simplified mode)');
      const webhookService = require('./webhookService');
      const result = await webhookService.processWebhook(webhookData, signature);
      console.log('✅ Webhook processed successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to process webhook:', error);
      throw error;
    }
  }

  // Processa pubblicazione direttamente (senza coda)
  async addPublishJob(productId, action, webhookPayload, options = {}) {
    try {
      console.log('🔄 Processing publish directly (simplified mode)');
      const webhookService = require('./webhookService');
      const result = await webhookService.handleProductPublishStarted(webhookPayload);
      console.log('✅ Publish processed successfully');
      return result;
    } catch (error) {
      console.error('❌ Failed to process publish:', error);
      throw error;
    }
  }

  // Statistiche code (modalità semplice)
  async getQueueStats() {
    return {
      webhook: { 
        name: 'webhook processing', 
        mode: 'direct processing (simplified)', 
        counts: { total: 0, active: 0, completed: 0, failed: 0 } 
      },
      publish: { 
        name: 'product publishing', 
        mode: 'direct processing (simplified)', 
        counts: { total: 0, active: 0, completed: 0, failed: 0 } 
      },
      timestamp: new Date().toISOString(),
      mode: 'simplified'
    };
  }

  // Pulisce le code (nop in modalità semplice)
  async cleanQueues() {
    return {
      cleaned: {
        webhook: { completed: 0, failed: 0 },
        publish: { completed: 0, failed: 0 }
      },
      message: 'No cleanup needed in simplified mode'
    };
  }

  // Pausa code (nop in modalità semplice)
  async pauseQueues() {
    console.log('⚠️ Cannot pause queues (simplified mode)');
    return { message: 'Pause not available in simplified mode' };
  }

  // Riprendi code (nop in modalità semplice)
  async resumeQueues() {
    console.log('⚠️ Cannot resume queues (simplified mode)');
    return { message: 'Resume not available in simplified mode' };
  }

  // Chiudi connessioni (nop in modalità semplice)
  async close() {
    console.log('✅ Queue service closed (simplified mode)');
    return true;
  }
}

// Export singleton
const queueService = new QueueService();
module.exports = queueService;