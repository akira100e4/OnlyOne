// backend/routes/catalog.js (SOSTITUISCI COMPLETAMENTE)
const express = require('express');
const router = express.Router();
const printifyService = require('../services/printifyService');
const cacheService = require('../services/cacheService');

// GET /api/catalog/search?q=query&limit=10 - Ricerca con cache intelligente
router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    
    console.log(`🔍 Product search: "${query}", limit=${limit}`);
    
    // Validazione
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid search query',
        message: 'Query parameter "q" is required',
        timestamp: new Date().toISOString()
      });
    }

    const sanitizedQuery = query.trim().substring(0, 100);
    let searchResult;

    // STRATEGIA 1: Cerca nel cache se disponibile
    if (cacheService.hasCatalog()) {
      console.log('🎯 Using cached catalog for search');
      searchResult = cacheService.searchInCache(sanitizedQuery, limit);
      
      if (searchResult && searchResult.products.length > 0) {
        console.log(`✅ Cache search: ${searchResult.products.length} products found`);
        
        // Response con cache hit
        return res.json({
          products: searchResult.products,
          search: {
            query: sanitizedQuery,
            strategy: 'cached',
            totalMatches: searchResult.matches,
            resultsReturned: searchResult.products.length,
            fromCache: true
          },
          meta: {
            timestamp: new Date().toISOString(),
            source: 'cache',
            endpoint: 'cached-search'
          }
        });
      }
    }

    // STRATEGIA 2: Fallback a ricerca API diretta
    console.log('🌐 Cache miss or empty, using API search');
    const apiResult = await printifyService.searchProductsFastest(sanitizedQuery, limit);
    
    // Trasforma per frontend
    const transformedProducts = apiResult.products.map(product => 
      printifyService.transformProductForCatalog(product)
    );
    
    console.log(`✅ API search: ${transformedProducts.length} products found`);

    // Response con API hit
    res.json({
      products: transformedProducts,
      search: {
        query: sanitizedQuery,
        strategy: apiResult.strategy || 'api_fallback',
        totalMatches: apiResult.matches,
        resultsReturned: transformedProducts.length,
        fromCache: false
      },
      meta: {
        timestamp: new Date().toISOString(),
        source: 'printify',
        endpoint: 'api-search'
      }
    });
    
  } catch (error) {
    console.error('❌ Search error:', error);
    
    res.status(500).json({
      error: 'Search failed',
      message: error.message,
      query: req.query.q,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/catalog?page=1&limit=50 - Catalogo paginato con cache
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);
    
    console.log(`📦 Catalog request - page: ${page}, limit: ${limit}`);
    
    // Se è la prima pagina e abbiamo cache, restituisci da cache
    if (page === 1 && cacheService.hasCatalog()) {
      const cachedCatalog = cacheService.getCatalog();
      const paginatedProducts = cachedCatalog.slice(0, limit);
      
      console.log(`✅ Returning cached catalog: ${paginatedProducts.length} products`);
      
      return res.json({
        products: paginatedProducts,
        pagination: {
          currentPage: 1,
          lastPage: Math.ceil(cachedCatalog.length / limit),
          total: cachedCatalog.length,
          hasMore: cachedCatalog.length > limit
        },
        meta: {
          timestamp: new Date().toISOString(),
          source: 'cache',
          count: paginatedProducts.length
        }
      });
    }

    // Altrimenti usa API normale
    const printifyData = await printifyService.getProducts(page, limit);
    
    const catalogProducts = printifyData.products.map(product => 
      printifyService.transformProductForCatalog(product)
    );
    
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

// GET /api/catalog/cache/stats - Statistiche cache
router.get('/cache/stats', (req, res) => {
  const stats = cacheService.getStats();
  
  res.json({
    cache: stats,
    status: 'OK',
    timestamp: new Date().toISOString()
  });
});

// POST /api/catalog/cache/warmup - Forza warm-up cache
router.post('/cache/warmup', async (req, res) => {
  try {
    console.log('🔥 Manual cache warmup requested');
    
    // Avvia warmup in background
    cacheService.warmupCache(printifyService).catch(error => {
      console.error('Background warmup failed:', error);
    });
    
    res.json({
      message: 'Cache warmup started in background',
      status: 'started',
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Warmup error:', error);
    res.status(500).json({
      error: 'Warmup failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// DELETE /api/catalog/cache - Pulisci cache
router.delete('/cache', (req, res) => {
  cacheService.clear();
  
  res.json({
    message: 'Cache cleared successfully',
    status: 'cleared',
    timestamp: new Date().toISOString()
  });
});

// GET /api/catalog/health - Health check con cache info
router.get('/health', async (req, res) => {
  try {
    const health = await printifyService.healthCheck();
    const cacheStats = cacheService.getStats();
    
    if (health.connected) {
      res.json({
        status: 'OK',
        printify: health,
        cache: cacheStats,
        message: 'Service healthy'
      });
    } else {
      res.status(503).json({
        status: 'ERROR',
        printify: health,
        cache: cacheStats,
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

    const printifyProduct = await printifyService.getProduct(productId);
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