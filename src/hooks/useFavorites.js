// src/hooks/useFavorites.js - FIXED: Solo preferiti veri
import { useState, useEffect, useCallback, useMemo } from 'react';

/**
 * Hook per gestire i preferiti con persistenza localStorage
 */
const useFavorites = () => {
  const [favorites, setFavorites] = useState(new Set()); // Manteniamo per compatibilità
  const [favoriteProducts, setFavoriteProducts] = useState([]); // Array prodotti completi
  const [isLoading, setIsLoading] = useState(true);
  const [updateTrigger, setUpdateTrigger] = useState(0);

  const STORAGE_KEY = 'onlyone_favorites';
  const PRODUCTS_STORAGE_KEY = 'onlyone_favorite_products';

  // Carica preferiti da localStorage
  useEffect(() => {
    try {
      // Carica ID (per compatibilità)
      const savedFavorites = localStorage.getItem(STORAGE_KEY);
      if (savedFavorites) {
        const parsedFavorites = JSON.parse(savedFavorites);
        if (Array.isArray(parsedFavorites)) {
          setFavorites(new Set(parsedFavorites));
        }
      }

      // Carica prodotti completi
      const savedProducts = localStorage.getItem(PRODUCTS_STORAGE_KEY);
      if (savedProducts) {
        const parsedProducts = JSON.parse(savedProducts);
        if (Array.isArray(parsedProducts)) {
          setFavoriteProducts(parsedProducts);
        }
      }
    } catch (error) {
      console.warn('Errore caricamento preferiti:', error);
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(PRODUCTS_STORAGE_KEY);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Salva preferiti in localStorage
  useEffect(() => {
    if (!isLoading) {
      try {
        // Salva ID (per compatibilità)
        const favoritesArray = Array.from(favorites);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favoritesArray));

        // Salva prodotti completi
        localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(favoriteProducts));
        
        setUpdateTrigger(prev => prev + 1);
      } catch (error) {
        console.warn('Errore salvataggio preferiti:', error);
        
        if (error.name === 'QuotaExceededError') {
          try {
            // Limitiamo a 50 preferiti
            const limitedFavorites = Array.from(favorites).slice(-50);
            const limitedProducts = favoriteProducts.slice(-50);
            
            setFavorites(new Set(limitedFavorites));
            setFavoriteProducts(limitedProducts);
            
            localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedFavorites));
            localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(limitedProducts));
          } catch (cleanupError) {
            console.error('Impossibile salvare preferiti:', cleanupError);
          }
        }
      }
    }
  }, [favorites, favoriteProducts, isLoading]);

  // 🔥 FIXED: Toggle preferito con sincronizzazione corretta
  const toggleFavorite = useCallback((productIdOrObject) => {
    if (!productIdOrObject) return;

    // Gestisci sia ID che oggetti
    const productId = typeof productIdOrObject === 'string' 
      ? productIdOrObject 
      : productIdOrObject.id;
    
    const productData = typeof productIdOrObject === 'object'
      ? productIdOrObject
      : null;

    // Normalizza ID a string per consistenza
    const normalizedId = String(productId);

    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      const isRemoving = newFavorites.has(normalizedId);
      
      if (isRemoving) {
        newFavorites.delete(normalizedId);
      } else {
        newFavorites.add(normalizedId);
      }
      
      return newFavorites;
    });

    setFavoriteProducts(prevProducts => {
      const isRemoving = prevProducts.some(p => String(p.id) === normalizedId);
      
      if (isRemoving) {
        // Rimuovi prodotto
        return prevProducts.filter(p => String(p.id) !== normalizedId);
      } else {
        // Aggiungi prodotto (se abbiamo i dati completi)
        if (productData) {
          return [...prevProducts, productData];
        } else {
          // Se abbiamo solo l'ID, creiamo un oggetto di base
          const basicProduct = {
            id: normalizedId,
            title: `Prodotto ${normalizedId}`,
            views: Math.floor(Math.random() * 100) + 1,
            imageSrc: `/products/${normalizedId}.png`,
          };
          return [...prevProducts, basicProduct];
        }
      }
    });
  }, []);

  // 🔥 FIXED: Controlla se è preferito con normalizzazione ID
  const isFavorite = useCallback((productId) => {
    if (!productId) return false;
    const normalizedId = String(productId);
    return favorites.has(normalizedId);
  }, [favorites]);

  // Pulisci tutti i preferiti
  const clearFavorites = useCallback(() => {
    setFavorites(new Set());
    setFavoriteProducts([]);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(PRODUCTS_STORAGE_KEY);
  }, []);

  // Aggiungi multipli preferiti con supporto oggetti
  const addMultipleFavorites = useCallback((products) => {
    if (!Array.isArray(products)) return;

    setFavorites(prevFavorites => {
      const newFavorites = new Set(prevFavorites);
      products.forEach(item => {
        const id = typeof item === 'string' ? item : item.id;
        if (id) newFavorites.add(String(id));
      });
      return newFavorites;
    });

    setFavoriteProducts(prevProducts => {
      const newProducts = [...prevProducts];
      
      products.forEach(item => {
        const productId = typeof item === 'string' ? item : item.id;
        const normalizedId = String(productId);
        const exists = newProducts.some(p => String(p.id) === normalizedId);
        
        if (!exists) {
          if (typeof item === 'object') {
            newProducts.push(item);
          } else {
            // Oggetto di base per ID semplici
            newProducts.push({
              id: normalizedId,
              title: `Prodotto ${normalizedId}`,
              views: Math.floor(Math.random() * 100) + 1,
              imageSrc: `/products/${normalizedId}.png`,
            });
          }
        }
      });
      
      return newProducts;
    });
  }, []);

  // 🔥 FIXED: Esporta solo gli ID dei preferiti veri (non tutti)
  const exportFavorites = useCallback(() => {
    return Array.from(favorites);
  }, [favorites]);

  // Esporta prodotti completi
  const exportFavoriteProducts = useCallback(() => {
    return favoriteProducts;
  }, [favoriteProducts]);

  // 🔥 FIXED: Computed values basati sul Set vero
  const favoritesCount = favorites.size;
  const isEmpty = favoritesCount === 0;
  const hasAny = favoritesCount > 0;

  // 🔥 DEBUG: Aggiungi log per verificare
  if (process.env.NODE_ENV === 'development') {
    console.log('🔍 DEBUG useFavorites:', {
      favoritesCount,
      favoriteIds: Array.from(favorites),
      favoriteProductsCount: favoriteProducts.length,
      isEmpty,
      hasAny
    });
  }

  return {
    // Stato principale (compatibilità mantenuta)
    favorites,
    favoritesCount,
    isEmpty,
    hasAny,
    isLoading,
    updateTrigger,

    // Prodotti completi
    favoriteProducts,

    // Funzioni principali
    toggleFavorite,
    isFavorite,
    clearFavorites,

    // Funzioni avanzate
    addMultipleFavorites,
    exportFavorites,
    exportFavoriteProducts,
  };
};

export default useFavorites;