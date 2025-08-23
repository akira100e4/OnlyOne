// backend/routes/webhooks.js
const express = require('express');
const router = express.Router();
const webhookService = require('../services/webhookService');
const printifyService = require('../services/printifyService');

// Middleware per catturare il raw body (necessario per validazione HMAC)
const rawBodyMiddleware = (req, res, next) => {
  req.rawBody = '';
  req.setEncoding('utf8');
  req.on('data', (chunk) => {
    req.rawBody += chunk;
  });
  req.on('end', () => {
    next();
  });
};

// POST /api/webhooks/printify - Endpoint principale per webhooks Printify
router.post('/printify', rawBodyMiddleware, async (req, res) => {
  try {
    console.log('📡 Webhook Printify ricevuto');
    
    // Estrai la firma HMAC dall'header
    const signature = req.headers['x-pfy-signature'];
    
    if (!signature && process.env.NODE_ENV === 'production') {
      return res.status(401).json({ 
        error: 'Missing webhook signature',
        message: 'X-Pfy-Signature header required in production' 
      });
    }
    
    // Parse del payload
    let webhookData;
    try {
      webhookData = JSON.parse(req.rawBody);
    } catch (parseError) {
      console.error('Invalid JSON in webhook payload:', parseError);
      return res.status(400).json({ error: 'Invalid JSON payload' });
    }
    
    console.log('📦 Webhook data:', {
      type: webhookData.type,
      action: webhookData.action,
      resource: webhookData.resource?.type,
      resourceId: webhookData.resource?.id
    });
    
    // Processa il webhook
    const result = await webhookService.processWebhook(webhookData, signature);
    
    console.log('✅ Webhook processato con successo:', result);
    
    // Risposta rapida a Printify (importante: < 30 secondi)
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      eventId: webhookData.id,
      result: result
    });
    
  } catch (error) {
    console.error('❌ Errore processing webhook:', error);
    
    // Risposta di errore a Printify
    res.status(500).json({
      success: false,
      error: 'Webhook processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/webhooks/health - Health check per webhooks
router.get('/health', async (req, res) => {
  try {
    // Test connessione database
    const database = require('../models/database.js.broken');
    const pendingEvents = await database.getPendingWebhookEvents();
    
    // Test connessione Printify
    const printifyHealth = await printifyService.healthCheck();
    
    res.json({
      status: 'OK',
      service: 'OnlyOne Webhooks',
      timestamp: new Date().toISOString(),
      database: {
        connected: true,
        pendingEvents: pendingEvents.length
      },
      printify: printifyHealth,
      webhookUrl: `${req.protocol}://${req.get('host')}/api/webhooks/printify`
    });
    
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/webhooks/events - Lista eventi webhook (per debug)
router.get('/events', async (req, res) => {
  try {
    const database = require('../models/database.js.broken');
    const limit = parseInt(req.query.limit) || 50;
    const status = req.query.status; // pending, processed, error
    
    // Query base
    let query = 'SELECT * FROM webhook_events';
    let params = [];
    
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);
    
    // Esegui query
    const events = await new Promise((resolve, reject) => {
      database.db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows.map(row => ({
          ...row,
          payload: JSON.parse(row.payload || '{}')
        })));
      });
    });
    
    res.json({
      events,
      count: events.length,
      filters: { status, limit }
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch webhook events',
      message: error.message
    });
  }
});

// POST /api/webhooks/retry - Retry eventi falliti
router.post('/retry', async (req, res) => {
  try {
    console.log('🔄 Retrying failed webhook events...');
    
    const results = await webhookService.retryPendingWebhooks();
    
    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => !r.success).length;
    
    res.json({
      success: true,
      message: `Retry completed: ${successCount} succeeded, ${errorCount} failed`,
      results,
      summary: {
        total: results.length,
        succeeded: successCount,
        failed: errorCount
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to retry webhooks',
      message: error.message
    });
  }
});

// GET /api/webhooks/printify - Gestione webhook Printify
router.get('/printify/list', async (req, res) => {
  try {
    const webhooks = await printifyService.listWebhooks();
    res.json({
      success: true,
      webhooks: webhooks,
      count: webhooks.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list Printify webhooks',
      message: error.message
    });
  }
});

// POST /api/webhooks/printify/create - Crea webhook su Printify
router.post('/printify/create', async (req, res) => {
  try {
    const webhookUrl = req.body.url || `${req.protocol}://${req.get('host')}/api/webhooks/printify`;
    const events = req.body.events || [
      'product:publish:started',
      'order:created',
      'order:updated',
      'order:sent-to-production',
      'order:shipment:created',
      'order:shipment:delivered'
    ];
    
    console.log(`🔗 Creating Printify webhook: ${webhookUrl}`);
    
    const webhook = await printifyService.createWebhook(webhookUrl, events);
    
    res.json({
      success: true,
      message: 'Webhook created successfully',
      webhook,
      url: webhookUrl,
      events
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to create Printify webhook',
      message: error.message
    });
  }
});

// DELETE /api/webhooks/printify/:id - Elimina webhook Printify
router.delete('/printify/:id', async (req, res) => {
  try {
    const webhookId = req.params.id;
    
    await printifyService.deleteWebhook(webhookId);
    
    res.json({
      success: true,
      message: `Webhook ${webhookId} deleted successfully`
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to delete Printify webhook',
      message: error.message
    });
  }
});

// POST /api/webhooks/test - Test webhook locale (per debug)
router.post('/test', async (req, res) => {
  try {
    const testPayload = req.body.payload || {
      id: `test-${Date.now()}`,
      type: 'product:publish:started',
      action: 'create',
      resource: {
        type: 'product',
        id: req.body.productId || 'test-product-id'
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('🧪 Processing test webhook:', testPayload);
    
    const result = await webhookService.processWebhook(testPayload);
    
    res.json({
      success: true,
      message: 'Test webhook processed',
      payload: testPayload,
      result
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Test webhook failed',
      message: error.message,
      payload: req.body.payload
    });
  }
});

module.exports = router;