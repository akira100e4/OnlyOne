// backend/routes/queues.js
const express = require('express');
const router = express.Router();
const queueService = require('../services/queueService');

// GET /api/queues/stats - Statistiche delle code
router.get('/stats', async (req, res) => {
  try {
    const stats = await queueService.getQueueStats();
    
    res.json({
      success: true,
      stats,
      message: 'Queue statistics retrieved successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get queue statistics',
      message: error.message
    });
  }
});

// POST /api/queues/clean - Pulizia code
router.post('/clean', async (req, res) => {
  try {
    const result = await queueService.cleanQueues();
    
    res.json({
      success: true,
      result,
      message: 'Queue cleanup completed successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clean queues',
      message: error.message
    });
  }
});

// POST /api/queues/pause - Pausa tutte le code
router.post('/pause', async (req, res) => {
  try {
    await queueService.pauseQueues();
    
    res.json({
      success: true,
      message: 'All queues paused successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to pause queues',
      message: error.message
    });
  }
});

// POST /api/queues/resume - Riprendi tutte le code
router.post('/resume', async (req, res) => {
  try {
    await queueService.resumeQueues();
    
    res.json({
      success: true,
      message: 'All queues resumed successfully'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to resume queues',
      message: error.message
    });
  }
});

// POST /api/queues/test - Test aggiunta job alla coda
router.post('/test', async (req, res) => {
  try {
    const testWebhookData = {
      id: `test-${Date.now()}`,
      type: 'product:publish:started',
      action: 'create',
      resource: {
        type: 'product',
        id: req.body.productId || 'test-product-123'
      },
      timestamp: new Date().toISOString()
    };
    
    const job = await queueService.addWebhookJob(testWebhookData);
    
    res.json({
      success: true,
      message: 'Test job added to webhook queue',
      job: {
        id: job.id,
        data: job.data,
        opts: job.opts
      },
      testData: testWebhookData
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to add test job',
      message: error.message
    });
  }
});

// Mount simple dashboard (Bull Board replacement)
router.get('/dashboard', async (req, res) => {
  try {
    const stats = await queueService.getQueueStats();
    
    res.json({
      title: 'OnlyOne Queue Dashboard',
      stats,
      endpoints: {
        stats: '/api/queues/stats',
        clean: 'POST /api/queues/clean',
        pause: 'POST /api/queues/pause',
        resume: 'POST /api/queues/resume',
        test: 'POST /api/queues/test'
      },
      message: 'Simple queue monitoring dashboard'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get dashboard data',
      message: error.message
    });
  }
});

module.exports = router;