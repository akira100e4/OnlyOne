// backend/server.js (SOSTITUISCI COMPLETAMENTE)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

// Services
const cacheService = require('./services/cacheService');
const printifyService = require('./services/printifyService');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:3000',  // Create React App
    'http://localhost:5173',  // Vite
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true
}));
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/catalog', require('./routes/catalog'));
app.use('/api/webhooks', require('./routes/webhooks'));
app.use('/api/queues', require('./routes/queues'));

// 🛒 NUOVE ROUTE CARRELLO
app.use('/api/cart', require('./routes/cart'));

// Health check aggiornato
app.get('/health', async (req, res) => {
  try {
    const cacheStats = cacheService.getStats();
    
    // Importa database per health check
    const database = require('./models/database');
    const dbHealth = await database.healthCheck();
    
    res.json({ 
      status: 'OK', 
      service: 'OnlyOne Backend Gateway',
      cache: {
        enabled: true,
        catalogCached: cacheStats.hasCatalog,
        cacheSize: cacheStats.size,
        isWarmingUp: cacheStats.isWarmingUp
      },
      database: dbHealth,
      features: {
        catalog: true,
        cart: true,        // 🛒 NUOVO
        checkout: false,   // 💳 FUTURO
        orders: false      // 📦 FUTURO
      },
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV
    });
    
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// 🛒 NUOVO: Endpoint stats completo
app.get('/api/stats', async (req, res) => {
  try {
    const database = require('./models/database');
    const cartService = require('./services/cartService');
    
    const [dbStats, cartStats, cacheStats] = await Promise.all([
      database.getStats(),
      cartService.getCartStats(),
      Promise.resolve(cacheService.getStats())
    ]);
    
    res.json({
      success: true,
      data: {
        database: dbStats,
        cart: cartStats,
        cache: cacheStats
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Stats endpoint error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get stats',
      message: error.message
    });
  }
});

// 🧹 NUOVO: Endpoint manutenzione
app.post('/api/maintenance', async (req, res) => {
  try {
    const database = require('./models/database');
    const cartService = require('./services/cartService');
    
    console.log('🧹 Starting system maintenance...');
    
    const [dbCleanup, cartMaintenance] = await Promise.all([
      database.cleanup(30), // Pulisci record > 30 giorni
      cartService.performMaintenance()
    ]);
    
    const result = {
      database: dbCleanup,
      cart: cartMaintenance,
      timestamp: new Date().toISOString()
    };
    
    console.log('✅ System maintenance completed:', result);
    
    res.json({
      success: true,
      message: 'System maintenance completed successfully',
      data: result
    });
    
  } catch (error) {
    console.error('❌ Maintenance error:', error);
    res.status(500).json({
      success: false,
      error: 'Maintenance failed',
      message: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

const server = app.listen(PORT, async () => {
  console.log(`🚀 OnlyOne Backend Gateway running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 API Catalog: http://localhost:${PORT}/api/catalog`);
  console.log(`🔍 Search API: http://localhost:${PORT}/api/catalog/search`);
  console.log(`📊 Cache Stats: http://localhost:${PORT}/api/catalog/cache/stats`);
  
  // 🛒 NUOVI ENDPOINT CARRELLO
  console.log(`🛒 Cart API: http://localhost:${PORT}/api/cart`);
  console.log(`📊 Stats API: http://localhost:${PORT}/api/stats`);
  console.log(`🧹 Maintenance: http://localhost:${PORT}/api/maintenance`);
  
  // Avvia cache warmup in background
  console.log('🔥 Starting cache warmup...');
  try {
    // Non bloccare l'avvio del server, ma avvia warmup
    cacheService.warmupCache(printifyService).then(() => {
      console.log('✅ Cache warmup completed');
    }).catch(error => {
      console.error('⚠️ Cache warmup failed:', error.message);
    });
  } catch (error) {
    console.error('⚠️ Cache warmup initialization failed:', error.message);
  }
  
  // 🛒 Inizializza modello Cart (crea tabelle se non esistono)
  try {
    const Cart = require('./models/Cart');
    console.log('🛒 Cart model initialized');
  } catch (error) {
    console.error('⚠️ Cart model initialization failed:', error.message);
  }
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n🔄 Received ${signal}. Starting graceful shutdown...`);
  
  try {
    // Chiudi server HTTP
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    // Chiudi connessione database
    const database = require('./models/database');
    await database.close();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

module.exports = app;