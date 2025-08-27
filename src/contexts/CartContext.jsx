// src/contexts/CartContext.jsx - VERSIONE SISTEMATA
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';

// API Configuration
const API_BASE_URL = 'http://localhost:5001/api';

// Cart Actions
const CART_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_SESSION_ID: 'SET_SESSION_ID',
  SET_CART: 'SET_CART',
  ADD_ITEM: 'ADD_ITEM',
  REMOVE_ITEM: 'REMOVE_ITEM',
  CLEAR_CART: 'CLEAR_CART',
  UPDATE_COUNT: 'UPDATE_COUNT',
  SET_ERROR: 'SET_ERROR',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Initial State
const initialState = {
  sessionId: null,
  items: [],
  totals: {
    itemCount: 0,
    subtotal: 0,
    total: 0
  },
  count: 0,
  isEmpty: true,
  loading: false,
  error: null,
  lastUpdated: null
};

// Cart Reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
        error: action.payload ? null : state.error
      };

    case CART_ACTIONS.SET_SESSION_ID:
      return {
        ...state,
        sessionId: action.payload
      };

    case CART_ACTIONS.SET_CART:
      return {
        ...state,
        items: action.payload.items || [],
        totals: action.payload.totals || initialState.totals,
        count: action.payload.itemCount || 0,
        isEmpty: (action.payload.items?.length || 0) === 0,
        lastUpdated: new Date().toISOString(),
        loading: false,
        error: null
      };

    case CART_ACTIONS.ADD_ITEM:
      return {
        ...state,
        items: [...state.items, action.payload.item],
        totals: action.payload.cart?.totals || state.totals,
        count: state.count + 1,
        isEmpty: false,
        lastUpdated: new Date().toISOString(),
        loading: false,
        error: null
      };

    case CART_ACTIONS.REMOVE_ITEM:
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.removedItem.id),
        totals: action.payload.cart?.totals || state.totals,
        count: Math.max(0, state.count - 1),
        isEmpty: state.count <= 1,
        lastUpdated: new Date().toISOString(),
        loading: false,
        error: null
      };

    case CART_ACTIONS.CLEAR_CART:
      return {
        ...state,
        items: [],
        totals: initialState.totals,
        count: 0,
        isEmpty: true,
        lastUpdated: new Date().toISOString(),
        loading: false,
        error: null
      };

    case CART_ACTIONS.UPDATE_COUNT:
      return {
        ...state,
        count: action.payload,
        isEmpty: action.payload === 0,
        loading: false
      };

    case CART_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case CART_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Context
const CartContext = createContext();

// Session ID Generator
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Local Storage Keys
const STORAGE_KEYS = {
  SESSION_ID: 'onlyone_session_id',
  CART_BACKUP: 'onlyone_cart_backup'
};

// CartProvider Component
export const CartProvider = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // Initialize session ID
  useEffect(() => {
    let sessionId = localStorage.getItem(STORAGE_KEYS.SESSION_ID);
    
    if (!sessionId) {
      sessionId = generateSessionId();
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, sessionId);
      console.log('New session created:', sessionId);
    } else {
      console.log('Existing session restored:', sessionId);
    }
    
    dispatch({ type: CART_ACTIONS.SET_SESSION_ID, payload: sessionId });
  }, []);

  // Load cart when session ID is available
  useEffect(() => {
    if (state.sessionId) {
      loadCart();
    }
  }, [state.sessionId]);

  // Backup cart to localStorage on changes
  useEffect(() => {
    if (state.items.length > 0) {
      const backup = {
        sessionId: state.sessionId,
        items: state.items,
        totals: state.totals,
        timestamp: state.lastUpdated
      };
      localStorage.setItem(STORAGE_KEYS.CART_BACKUP, JSON.stringify(backup));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CART_BACKUP);
    }
  }, [state.items, state.totals, state.sessionId, state.lastUpdated]);

  // API Helper Functions
  const makeApiCall = async (endpoint, options = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  };

  // Load cart from backend
  const loadCart = useCallback(async () => {
    if (!state.sessionId) return;

    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

      console.log('Loading cart from backend...', state.sessionId);

      const response = await makeApiCall(`/cart/${state.sessionId}`);
      
      if (response.success) {
        dispatch({ type: CART_ACTIONS.SET_CART, payload: response.data });
        console.log('Cart loaded:', response.data.items.length, 'items');
      } else {
        throw new Error(response.message || 'Failed to load cart');
      }

    } catch (error) {
      console.error('Load cart error:', error);
      
      // Fallback: try to restore from localStorage
      const backup = localStorage.getItem(STORAGE_KEYS.CART_BACKUP);
      if (backup) {
        try {
          const cartBackup = JSON.parse(backup);
          if (cartBackup.sessionId === state.sessionId) {
            dispatch({ type: CART_ACTIONS.SET_CART, payload: cartBackup });
            console.log('Cart restored from backup');
            return;
          }
        } catch (backupError) {
          console.warn('Cart backup restore failed:', backupError);
        }
      }
      
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
    }
  }, [state.sessionId]);

  // Add item to cart
  const addItem = useCallback(async (itemData) => {
    if (!state.sessionId) {
      throw new Error('No session ID available');
    }

    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

      console.log('Adding item to cart:', itemData);

      const response = await makeApiCall('/cart/add', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: state.sessionId,
          ...itemData
        })
      });

      if (response.success) {
        dispatch({ type: CART_ACTIONS.ADD_ITEM, payload: response.data });
        console.log('Item added to cart:', response.data.item.id);
        return response.data.item;
      } else {
        throw new Error(response.message || 'Failed to add item to cart');
      }

    } catch (error) {
      console.error('Add item error:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);

  // Remove item from cart
  const removeItem = useCallback(async (itemId) => {
    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

      console.log('Removing item from cart:', itemId);

      const response = await makeApiCall(`/cart/item/${itemId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        dispatch({ type: CART_ACTIONS.REMOVE_ITEM, payload: response.data });
        console.log('Item removed from cart:', itemId);
        return response.data.removedItem;
      } else {
        throw new Error(response.message || 'Failed to remove item from cart');
      }

    } catch (error) {
      console.error('Remove item error:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, []);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    if (!state.sessionId) return;

    try {
      dispatch({ type: CART_ACTIONS.SET_LOADING, payload: true });

      console.log('Clearing cart:', state.sessionId);

      const response = await makeApiCall(`/cart/${state.sessionId}`, {
        method: 'DELETE'
      });

      if (response.success) {
        dispatch({ type: CART_ACTIONS.CLEAR_CART });
        console.log('Cart cleared');
      } else {
        throw new Error(response.message || 'Failed to clear cart');
      }

    } catch (error) {
      console.error('Clear cart error:', error);
      dispatch({ type: CART_ACTIONS.SET_ERROR, payload: error.message });
      throw error;
    }
  }, [state.sessionId]);

  // Get cart count (lightweight)
  const refreshCount = useCallback(async () => {
    if (!state.sessionId) return;

    try {
      const response = await makeApiCall(`/cart/${state.sessionId}/count`);
      
      if (response.success) {
        dispatch({ type: CART_ACTIONS.UPDATE_COUNT, payload: response.data.count });
      }
    } catch (error) {
      console.warn('Refresh count error:', error);
    }
  }, [state.sessionId]);

  // Check if item exists in cart
  const hasItem = useCallback((productId, variantId = null) => {
    return state.items.some(item => 
      item.productId === productId && 
      item.variantId === variantId
    );
  }, [state.items]);

  // Get item from cart
  const getItem = useCallback((productId, variantId = null) => {
    return state.items.find(item => 
      item.productId === productId && 
      item.variantId === variantId
    );
  }, [state.items]);

  // Clear error
  const clearError = useCallback(() => {
    dispatch({ type: CART_ACTIONS.CLEAR_ERROR });
  }, []);

  // Prepare cart for checkout
  const prepareForCheckout = useCallback(async () => {
    if (!state.sessionId) {
      throw new Error('No session ID available');
    }

    try {
      const response = await makeApiCall(`/cart/${state.sessionId}/prepare-checkout`, {
        method: 'POST'
      });

      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to prepare cart for checkout');
      }

    } catch (error) {
      console.error('Prepare checkout error:', error);
      throw error;
    }
  }, [state.sessionId]);

  // Enhanced addFromProductDetail function
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

      console.log('Adding from product detail:', cartItemData);

      return await addItem(cartItemData);

    } catch (error) {
      console.error('Add from product detail error:', error);
      throw error;
    }
  }, [addItem]);

  // Context Value
  const contextValue = {
    // State
    ...state,
    
    // Actions
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
    addFromProductDetail,
    
    // Utils
    generateNewSession: () => {
      const newSessionId = generateSessionId();
      localStorage.setItem(STORAGE_KEYS.SESSION_ID, newSessionId);
      dispatch({ type: CART_ACTIONS.SET_SESSION_ID, payload: newSessionId });
      return newSessionId;
    }
  };

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

// Hook per usare il context - NOME CAMBIATO per evitare conflitti
export const useCartContext = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCartContext must be used within a CartProvider');
  }
  return context;
};

// Export del provider
export default CartProvider;