// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const app = express();
const PORT = process.env.PORT || 5000;

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

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'OnlyOne Backend Gateway',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
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

const server = app.listen(PORT, () => {
  console.log(`🚀 OnlyOne Backend Gateway running on port ${PORT}`);
  console.log(`📋 Health check: http://localhost:${PORT}/health`);
  console.log(`🎯 API Catalog: http://localhost:${PORT}/api/catalog`);
  console.log(`📡 Webhooks: http://localhost:${PORT}/api/webhooks`);
  console.log(`⚡ Queue Stats: http://localhost:${PORT}/api/queues/stats`);
});

// Graceful shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

async function gracefulShutdown(signal) {
  console.log(`\n🔄 Received ${signal}. Shutting down gracefully...`);
  
  try {
    // Chiudi server HTTP
    server.close(() => {
      console.log('✅ HTTP server closed');
    });
    
    // Chiudi database
    const database = require('./models/database.js.broken');
    await database.close();
    
    // Chiudi code
    const queueService = require('./services/queueService');
    await queueService.close();
    
    console.log('✅ Graceful shutdown completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during shutdown:', error);
    process.exit(1);
  }
}

module.exports = server;