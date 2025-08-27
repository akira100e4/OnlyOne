// src/hooks/useCart.js
import { useCallback } from 'react';
import { useCartContext } from '../contexts/CartContext';

/**
 * Hook personalizzato per operazioni carrello
 * Wrappa il context con funzionalità aggiuntive e validazioni
 */
export const useCart = () => {
  const cartContext = useCartContext();

  if (!cartContext) {
    throw new Error('useCart must be used within a CartProvider');
  }

  const {
    sessionId,
    items,
    totals,
    count,
    isEmpty,
    loading,
    error,
    lastUpdated,
    addItem: contextAddItem,
    removeItem: contextRemoveItem,
    clearCart: contextClearCart,
    loadCart,
    refreshCount,
    hasItem,
    getItem,
    clearError,
    prepareForCheckout,
    generateNewSession
  } = cartContext;

  // Enhanced add item with validation
  const addItem = useCallback(async (productData) => {
    try {
      // Validazione dati prodotto
      const {
        productId,
        variantId,
        printifyVariantId,
        pricePerItem,
        productTitle,
        variantTitle,
        imageUrl,
        crossSell = false
      } = productData;

      if (!productId || !productTitle || !pricePerItem) {
        throw new Error('Missing required product data: productId, productTitle, pricePerItem');
      }

      if (pricePerItem <= 0) {
        throw new Error('Price must be greater than 0');
      }

      // Controlla se l'item esiste già
      if (hasItem(productId, variantId)) {
        throw new Error('Item already exists in cart');
      }

      // Dati validati per l'API
      const validatedData = {
        productId: productId.toString(),
        variantId: variantId?.toString() || null,
        printifyVariantId: printifyVariantId ? parseInt(printifyVariantId) : null,
        pricePerItem: parseFloat(pricePerItem),
        productTitle: productTitle.trim().substring(0, 255),
        variantTitle: variantTitle?.trim().substring(0, 255) || null,
        imageUrl: imageUrl?.trim() || null,
        crossSell: Boolean(crossSell)
      };

      console.log('🛒 Adding validated item:', validatedData);

      return await contextAddItem(validatedData);

    } catch (error) {
      console.error('❌ Enhanced add item error:', error);
      throw error;
    }
  }, [contextAddItem, hasItem]);

  // Enhanced remove item with confirmation
  const removeItem = useCallback(async (itemId, { confirm = false } = {}) => {
    try {
      if (!itemId) {
        throw new Error('Item ID is required');
      }

      const item = items.find(i => i.id === itemId);
      if (!item) {
        throw new Error('Item not found in cart');
      }

      // Opzionale: richiedi conferma per items costosi
      if (confirm && item.pricePerItem > 50) {
        const shouldRemove = window.confirm(
          `Remove "${item.productTitle}" (€${item.pricePerItem}) from cart?`
        );
        if (!shouldRemove) {
          return null;
        }
      }

      console.log('🗑️ Removing item:', { id: itemId, title: item.productTitle });

      return await contextRemoveItem(itemId);

    } catch (error) {
      console.error('❌ Enhanced remove item error:', error);
      throw error;
    }
  }, [contextRemoveItem, items]);

  // Enhanced clear cart with confirmation
  const clearCart = useCallback(async ({ confirm = true } = {}) => {
    try {
      if (isEmpty) {
        console.log('ℹ️ Cart is already empty');
        return { success: true, message: 'Cart is already empty' };
      }

      // Richiedi conferma se ci sono items
      if (confirm && count > 0) {
        const shouldClear = window.confirm(
          `Remove all ${count} items from cart? This action cannot be undone.`
        );
        if (!shouldClear) {
          return null;
        }
      }

      console.log('🧹 Clearing cart with', count, 'items');

      return await contextClearCart();

    } catch (error) {
      console.error('❌ Enhanced clear cart error:', error);
      throw error;
    }
  }, [contextClearCart, isEmpty, count]);

  // Quick add from product detail
  const addFromProductDetail = useCallback(async (productDetailData) => {
    try {
      const {
        product,
        selectedType,
        selectedColor,
        selectedSize,
        selectedVariant,
        crossSell = false
      } = productDetailData;

      if (!product || !selectedType || !selectedVariant) {
        throw new Error('Missing required product detail data');
      }

      // Costruisci i dati per il carrello
      const cartItemData = {
        productId: product.id,
        variantId: selectedVariant.id,
        printifyVariantId: selectedVariant.printifyVariantId || selectedVariant.id,
        pricePerItem: selectedVariant.price || product.price?.min || 0,
        productTitle: product.title,
        variantTitle: [
          selectedType === 'tshirt' ? 'T-Shirt' : 'Felpa',
          selectedSize,
          selectedColor
        ].filter(Boolean).join(' / '),
        imageUrl: product.image || product.imageSrc,
        crossSell
      };

      console.log('🎯 Adding from product detail:', cartItemData);

      return await addItem(cartItemData);

    } catch (error) {
      console.error('❌ Add from product detail error:', error);
      throw error;
    }
  }, [addItem]);

  // Batch operations (future use)
  const addMultipleItems = useCallback(async (itemsArray) => {
    try {
      const results = [];
      const errors = [];

      console.log('📦 Adding multiple items:', itemsArray.length);

      for (const itemData of itemsArray) {
        try {
          const result = await addItem(itemData);
          results.push(result);
        } catch (error) {
          errors.push({ item: itemData, error: error.message });
        }
      }

      console.log(`✅ Batch add completed: ${results.length} success, ${errors.length} errors`);

      return {
        success: results,
        errors,
        totalAdded: results.length,
        totalErrors: errors.length
      };

    } catch (error) {
      console.error('❌ Batch add error:', error);
      throw error;
    }
  }, [addItem]);

  // Get cart summary for UI
  const getCartSummary = useCallback(() => {
    return {
      sessionId,
      itemCount: count,
      totalValue: totals.total || 0,
      subtotal: totals.subtotal || 0,
      isEmpty,
      hasItems: !isEmpty,
      lastUpdated,
      items: items.map(item => ({
        id: item.id,
        title: item.productTitle,
        variant: item.variantTitle,
        price: item.pricePerItem,
        image: item.imageUrl
      }))
    };
  }, [sessionId, count, totals, isEmpty, lastUpdated, items]);

  // Format price helper
  const formatPrice = useCallback((price, currency = 'EUR') => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(price);
  }, []);

  // Get cart items by type (regular vs cross-sell)
  const getItemsByType = useCallback((crossSell = false) => {
    return items.filter(item => Boolean(item.crossSell) === crossSell);
  }, [items]);

  // Check cart health
  const isCartHealthy = useCallback(() => {
    return {
      hasSession: !!sessionId,
      hasItems: !isEmpty,
      noErrors: !error,
      isLoaded: !loading,
      lastUpdate: lastUpdated,
      healthy: !!sessionId && !error && !loading
    };
  }, [sessionId, isEmpty, error, loading, lastUpdated]);

  return {
    // State
    sessionId,
    items,
    totals,
    count,
    isEmpty,
    loading,
    error,
    lastUpdated,

    // Enhanced Actions
    addItem,
    removeItem,
    clearCart,
    loadCart,
    refreshCount,

    // Helpers
    hasItem,
    getItem,
    clearError,
    prepareForCheckout,
    generateNewSession,

    // Enhanced Features
    addFromProductDetail,
    addMultipleItems,
    getCartSummary,
    formatPrice,
    getItemsByType,
    isCartHealthy,

    // Quick accessors
    hasItems: !isEmpty,
    totalValue: totals.total || 0,
    subtotal: totals.subtotal || 0,
    regularItems: getItemsByType(false),
    crossSellItems: getItemsByType(true)
  };
};

export default useCart;