// backend/routes/cart.js
const express = require('express');
const router = express.Router();
const cartService = require('../services/cartService');

// Middleware per validazione sessionId
const validateSession = (req, res, next) => {
  const sessionId = req.params.sessionId || req.body.sessionId;
  
  if (!sessionId || typeof sessionId !== 'string' || sessionId.trim().length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Invalid session ID',
      message: 'Session ID is required'
    });
  }
  
  req.sessionId = sessionId.trim();
  next();
};

// POST /api/cart/add - Aggiungi item al carrello
router.post('/add', async (req, res) => {
  try {
    const {
      sessionId,
      productId,
      variantId,
      printifyVariantId,
      pricePerItem,
      productTitle,
      variantTitle,
      imageUrl,
      crossSell
    } = req.body;

    console.log('🛒 Cart add request:', {
      sessionId,
      productId,
      productTitle,
      pricePerItem
    });

    // Validazione sessionId
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Missing session ID',
        message: 'sessionId is required'
      });
    }

    // Aggiungi item tramite service
    const result = await cartService.addItemToCart(sessionId, {
      productId,
      variantId,
      printifyVariantId,
      pricePerItem,
      productTitle,
      variantTitle,
      imageUrl,
      crossSell
    });

    console.log(`✅ Item added to cart: ${result.item.id}`);

    res.status(201).json({
      success: true,
      message: 'Item added to cart',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Add to cart error:', error);

    // Gestione errori specifici
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'Item already in cart',
        message: error.message
      });
    }

    if (error.message.includes('required')) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart',
      message: error.message
    });
  }
});

// GET /api/cart/:sessionId - Recupera carrello completo
router.get('/:sessionId', validateSession, async (req, res) => {
  try {
    console.log(`📦 Fetching cart for session: ${req.sessionId}`);

    const cart = await cartService.getCart(req.sessionId);

    console.log(`✅ Cart retrieved: ${cart.items.length} items`);

    res.json({
      success: true,
      data: cart,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get cart error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve cart',
      message: error.message,
      sessionId: req.sessionId
    });
  }
});

// GET /api/cart/:sessionId/count - Conta items nel carrello
router.get('/:sessionId/count', validateSession, async (req, res) => {
  try {
    const result = await cartService.getCartCount(req.sessionId);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get cart count error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get cart count',
      message: error.message
    });
  }
});

// DELETE /api/cart/item/:itemId - Rimuovi singolo item
router.delete('/item/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;

    console.log(`🗑️ Removing cart item: ${itemId}`);

    if (!itemId || itemId.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid item ID'
      });
    }

    const result = await cartService.removeItemFromCart(itemId.trim());

    console.log(`✅ Cart item removed: ${itemId}`);

    res.json({
      success: true,
      message: 'Item removed from cart',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Remove cart item error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Item not found',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to remove item',
      message: error.message
    });
  }
});

// DELETE /api/cart/:sessionId - Svuota carrello completo
router.delete('/:sessionId', validateSession, async (req, res) => {
  try {
    console.log(`🧹 Clearing cart for session: ${req.sessionId}`);

    const result = await cartService.clearCart(req.sessionId);

    console.log(`✅ Cart cleared for session: ${req.sessionId}`);

    res.json({
      success: true,
      message: 'Cart cleared successfully',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Clear cart error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart',
      message: error.message
    });
  }
});

// GET /api/cart/:sessionId/summary - Riassunto carrello
router.get('/:sessionId/summary', validateSession, async (req, res) => {
  try {
    const summary = await cartService.getCartSummary(req.sessionId);

    res.json({
      success: true,
      data: summary,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get cart summary error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get cart summary',
      message: error.message
    });
  }
});

// POST /api/cart/:sessionId/prepare-checkout - Prepara carrello per checkout
router.post('/:sessionId/prepare-checkout', validateSession, async (req, res) => {
  try {
    console.log(`💳 Preparing checkout for session: ${req.sessionId}`);

    const result = await cartService.prepareCartForCheckout(req.sessionId);

    res.json({
      success: true,
      message: 'Cart prepared for checkout',
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Prepare checkout error:', error);

    if (error.message.includes('empty cart')) {
      return res.status(400).json({
        success: false,
        error: 'Empty cart',
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to prepare checkout',
      message: error.message
    });
  }
});

// GET /api/cart/_stats - Statistiche carrelli
router.get('/_stats', async (req, res) => {
  try {
    const stats = await cartService.getCartStats();

    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Get cart stats error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to get cart stats',
      message: error.message
    });
  }
});

// POST /api/cart/_maintenance - Manutenzione carrelli
router.post('/_maintenance', async (req, res) => {
  try {
    const result = await cartService.performMaintenance();

    res.json({
      success: true,
      message: `Maintenance completed: ${result.cleanedItems} items cleaned`,
      data: result,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Cart maintenance error:', error);
    
    res.status(500).json({
      success: false,
      error: 'Failed to perform maintenance',
      message: error.message
    });
  }
});

module.exports = router;