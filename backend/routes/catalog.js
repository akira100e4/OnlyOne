// backend/routes/catalog.js
const express = require('express');
const router = express.Router();
const printifyService = require('../services/printifyService');

// GET /api/catalog - Lista prodotti per il frontend
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100); // Max 100 per page
    
    console.log(`📦 Fetching catalog - page: ${page}, limit: ${limit}`);
    
    // Fetch da Printify
    const printifyData = await printifyService.getProducts(page, limit);
    
    // Trasforma per OnlyOne
    const catalogProducts = printifyData.products.map(product => 
      printifyService.transformProductForCatalog(product)
    );
    
    // Response nel formato atteso dal frontend
    const response = {
      products: catalogProducts,
      pagination: {
        currentPage: printifyData.pagination.current_page,
        lastPage: printifyData.pagination.last_page,
        total: printifyData.pagination.total,
        hasMore: printifyData.pagination.current_page < printifyData.pagination.last_page
      },
      meta: {
        timestamp: new Date().toISOString(),
        source: 'printify',
        count: catalogProducts.length
      }
    };
    
    console.log(`✅ Catalog response: ${catalogProducts.length} products`);
    res.json(response);
    
  } catch (error) {
    console.error('❌ Catalog error:', error);
    res.status(500).json({
      error: 'Failed to fetch catalog',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/catalog/health - Test connessione Printify
router.get('/health', async (req, res) => {
  try {
    const health = await printifyService.healthCheck();
    
    if (health.connected) {
      res.json({
        status: 'OK',
        printify: health,
        message: 'Printify connection successful'
      });
    } else {
      res.status(503).json({
        status: 'ERROR',
        printify: health,
        message: 'Printify connection failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message,
      message: 'Health check failed'
    });
  }
});

// GET /api/catalog/:id - Dettaglio prodotto singolo
router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    console.log(`🔍 Fetching product detail: ${productId}`);
    
    // Fetch da Printify
    const printifyProduct = await printifyService.getProduct(productId);
    
    // Trasforma per OnlyOne
    const productDetail = printifyService.transformProductDetail(printifyProduct);
    
    console.log(`✅ Product detail: ${productDetail.title}`);
    res.json({
      product: productDetail,
      meta: {
        timestamp: new Date().toISOString(),
        source: 'printify'
      }
    });
    
  } catch (error) {
    console.error(`❌ Product detail error (${req.params.id}):`, error);
    
    if (error.message.includes('404') || error.response?.status === 404) {
      res.status(404).json({
        error: 'Product not found',
        productId: req.params.id,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        error: 'Failed to fetch product detail',
        message: error.message,
        productId: req.params.id,
        timestamp: new Date().toISOString()
      });
    }
  }
});

module.exports = router;