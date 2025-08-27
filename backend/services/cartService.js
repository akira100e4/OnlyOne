// backend/services/cartService.js
const Cart = require('../models/Cart');

class CartService {
  constructor() {
    this.cart = Cart;
  }

  // Aggiungi item al carrello con validazione
  async addItemToCart(sessionId, itemData) {
    try {
      console.log(`🛒 Adding item to cart for session: ${sessionId}`);
      
      // Valida dati in input
      const validatedData = await this.validateCartItemData(itemData);
      
      // Verifica se l'item esiste già
      const exists = await this.cart.itemExists(
        sessionId, 
        validatedData.productId, 
        validatedData.variantId
      );
      
      if (exists) {
        throw new Error('Item already exists in cart');
      }
      
      // Aggiungi sessionId ai dati validati
      const itemToAdd = {
        sessionId,
        ...validatedData
      };
      
      // Aggiungi al database
      const addedItem = await this.cart.addItem(itemToAdd);
      
      // Restituisci item + totali aggiornati
      const cartSummary = await this.getCartSummary(sessionId);
      
      console.log(`✅ Item added to cart: ${addedItem.id}`);
      
      return {
        success: true,
        item: addedItem,
        cart: cartSummary
      };
      
    } catch (error) {
      console.error('❌ Add item to cart error:', error);
      throw error;
    }
  }

  // Recupera carrello completo
  async getCart(sessionId) {
    try {
      console.log(`📦 Fetching cart for session: ${sessionId}`);
      
      const items = await this.cart.getCartItems(sessionId);
      const totals = await this.cart.getCartTotal(sessionId);
      
      return {
        sessionId,
        items,
        totals,
        isEmpty: items.length === 0,
        itemCount: items.length
      };
      
    } catch (error) {
      console.error('❌ Get cart error:', error);
      throw error;
    }
  }

  // Rimuovi item dal carrello
  async removeItemFromCart(itemId) {
    try {
      console.log(`🗑️ Removing item from cart: ${itemId}`);
      
      // Recupera l'item prima di rimuoverlo per ottenere sessionId
      const item = await this.cart.getItem(itemId);
      if (!item) {
        throw new Error('Cart item not found');
      }
      
      // Rimuovi item
      const result = await this.cart.removeItem(itemId);
      
      // Calcola totali aggiornati
      const cartSummary = await this.getCartSummary(item.sessionId);
      
      console.log(`✅ Item removed from cart: ${itemId}`);
      
      return {
        success: true,
        removedItem: item,
        cart: cartSummary
      };
      
    } catch (error) {
      console.error('❌ Remove item from cart error:', error);
      throw error;
    }
  }

  // Svuota carrello
  async clearCart(sessionId) {
    try {
      console.log(`🧹 Clearing cart for session: ${sessionId}`);
      
      const result = await this.cart.clearCart(sessionId);
      
      console.log(`✅ Cart cleared: ${result.removedItems} items`);
      
      return {
        success: true,
        message: `Cart cleared: ${result.removedItems} items removed`,
        sessionId: sessionId
      };
      
    } catch (error) {
      console.error('❌ Clear cart error:', error);
      throw error;
    }
  }

  // Conta items nel carrello
  async getCartCount(sessionId) {
    try {
      const count = await this.cart.getCartCount(sessionId);
      return { sessionId, count };
    } catch (error) {
      console.error('❌ Get cart count error:', error);
      throw error;
    }
  }

  // Summary carrello (per UI updates)
  async getCartSummary(sessionId) {
    try {
      const [items, totals] = await Promise.all([
        this.cart.getCartItems(sessionId),
        this.cart.getCartTotal(sessionId)
      ]);
      
      return {
        sessionId,
        itemCount: items.length,
        totals,
        hasItems: items.length > 0
      };
      
    } catch (error) {
      console.error('❌ Get cart summary error:', error);
      throw error;
    }
  }

  // Validazione dati item carrello
  async validateCartItemData(itemData) {
    const {
      productId,
      variantId,
      printifyVariantId,
      pricePerItem,
      productTitle,
      variantTitle,
      imageUrl,
      crossSell = false
    } = itemData;

    // Validazione campi obbligatori
    if (!productId) {
      throw new Error('Product ID is required');
    }
    
    if (!productTitle) {
      throw new Error('Product title is required');
    }
    
    if (!pricePerItem || pricePerItem <= 0) {
      throw new Error('Valid price is required');
    }

    // Sanitizzazione dati
    return {
      productId: productId.trim(),
      variantId: variantId?.trim() || null,
      printifyVariantId: printifyVariantId || null,
      pricePerItem: parseFloat(pricePerItem),
      productTitle: productTitle.trim().substring(0, 255),
      variantTitle: variantTitle?.trim().substring(0, 255) || null,
      imageUrl: imageUrl?.trim() || null,
      crossSell: !!crossSell
    };
  }

  // Preparazione dati per checkout (future use)
  async prepareCartForCheckout(sessionId) {
    try {
      console.log(`💳 Preparing cart for checkout: ${sessionId}`);
      
      const cart = await this.getCart(sessionId);
      
      if (cart.isEmpty) {
        throw new Error('Cannot checkout empty cart');
      }
      
      return {
        sessionId,
        items: cart.items,
        totals: cart.totals,
        isValid: true,
        checkoutReady: true
      };
      
    } catch (error) {
      console.error('❌ Prepare cart for checkout error:', error);
      throw error;
    }
  }

  // Stats per monitoring
  async getCartStats() {
    try {
      const stats = await this.cart.getStats();
      return {
        ...stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Get cart stats error:', error);
      throw error;
    }
  }

  // Manutenzione carrello
  async performMaintenance() {
    try {
      console.log('🧹 Performing cart maintenance...');
      
      const cleanedItems = await this.cart.cleanupOldItems(30);
      const stats = await this.getCartStats();
      
      console.log(`✅ Cart maintenance completed: ${cleanedItems} items cleaned`);
      
      return {
        cleanedItems,
        currentStats: stats
      };
      
    } catch (error) {
      console.error('❌ Cart maintenance error:', error);
      throw error;
    }
  }
}

module.exports = new CartService();