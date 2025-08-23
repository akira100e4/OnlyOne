// src/pages/FavoritesPage/components/FavoritesGrid.jsx
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Heart, Eye } from 'lucide-react';
import { useFavoritesContext } from '../../../contexts/FavoritesContext';
import '../../../pages/ProductsPage/components/ProductsGrid.css'; // Riutilizziamo gli stili esistenti

const FavoritesGrid = () => {
  // Hook preferiti
  const { 
    exportFavorites, // Usa solo gli ID
    toggleFavorite, 
    isFavorite,
    isLoading: favoritesLoading
  } = useFavoritesContext();

  // State per il manifest e i prodotti risolti
  const [manifestData, setManifestData] = useState([]);
  const [favoriteProductsResolved, setFavoriteProductsResolved] = useState([]);
  const [manifestLoading, setManifestLoading] = useState(true);
  const [manifestError, setManifestError] = useState(false);

  // Cache per immagini risolte (manteniamo per eventuali fallback)
  const resolvedSrcCacheRef = useRef(new Map());
  const existsCacheRef = useRef(new Map());

  // --- Caricamento del manifest ---------------------------------------------
  useEffect(() => {
    const loadManifest = async () => {
      try {
        setManifestLoading(true);
        setManifestError(false);

        // Prova diversi percorsi per il manifest
        const manifestPaths = [
          '/prodotti/manifest.json',
          '/products/manifest.json',
          '/data/products.json',
        ];

        let manifestData = [];
        for (const path of manifestPaths) {
          try {
            const res = await fetch(path);
            if (res.ok) {
              manifestData = await res.json();
              console.log(`✅ Manifest caricato da: ${path}`, manifestData.length, 'prodotti');
              break;
            }
          } catch (err) {
            console.warn(`❌ Errore caricamento manifest da ${path}:`, err);
          }
        }

        if (!Array.isArray(manifestData) || manifestData.length === 0) {
          throw new Error('Manifest vuoto o non valido');
        }

        setManifestData(manifestData);
      } catch (error) {
        console.error('❌ Errore caricamento manifest:', error);
        setManifestError(true);
      } finally {
        setManifestLoading(false);
      }
    };

    loadManifest();
  }, []);

  // --- Match tra favoriti e manifest ---------------------------------------
  useEffect(() => {
    if (manifestLoading || favoritesLoading || manifestData.length === 0) return;

    const favoriteIds = exportFavorites(); // Array di ID dai preferiti
    console.log('🔍 Matching favoriti:', favoriteIds);
    
    const resolvedProducts = favoriteIds
      .map(favoriteId => {
        // Cerca nel manifest il prodotto corrispondente
        const manifestProduct = manifestData.find(product => 
          String(product.id) === String(favoriteId)
        );

        if (manifestProduct) {
          // Aggiungi views random per compatibilità UI
          const views = Math.floor(Math.random() * 100) + 1;
          return {
            ...manifestProduct,
            views,
            // Assicurati che imageSrc punti al src corretto del manifest
            imageSrc: manifestProduct.src
          };
        } else {
          // Prodotto non trovato nel manifest - crea fallback
          console.warn(`⚠️ Prodotto ${favoriteId} non trovato nel manifest`);
          return {
            id: favoriteId,
            title: `Prodotto ${favoriteId}`,
            views: Math.floor(Math.random() * 100) + 1,
            imageSrc: `/prodotti/${favoriteId}.png`, // Fallback
            src: `/prodotti/${favoriteId}.png`,
            originalFilename: `${favoriteId}.png`,
            height: 'md'
          };
        }
      })
      .filter(Boolean); // Rimuovi eventuali null/undefined

    console.log('✅ Prodotti preferiti risolti:', resolvedProducts);
    setFavoriteProductsResolved(resolvedProducts);
  }, [manifestData, manifestLoading, favoritesLoading, exportFavorites]);

  // --- Helpers per immagini (mantenuti per robustezza) ---------------------
  const testImageExists = (src) => new Promise((resolve) => {
    if (!src) return resolve(false);
    const cached = existsCacheRef.current.get(src);
    if (typeof cached === 'boolean') return resolve(cached);
    const img = new Image();
    img.onload = () => { existsCacheRef.current.set(src, true); resolve(true); };
    img.onerror = () => { existsCacheRef.current.set(src, false); resolve(false); };
    img.src = src;
  });

  // --- Handlers -------------------------------------------------------------
  const handleProductClick = useCallback((product) => {
    console.log('Favorite product clicked:', product.title);
    // Qui potresti aggiungere navigazione al dettaglio prodotto
  }, []);

  const handleToggleFavorite = useCallback((productId, e) => {
    e?.stopPropagation();
    toggleFavorite(productId);
  }, [toggleFavorite]);

  // --- Loading states -------------------------------------------------------
  if (favoritesLoading || manifestLoading) {
    return (
      <div className="products-grid-wrapper">
        <div className="products-loading">
          <div className="loading-logo">
            <img src="/logo/logo_black.svg" alt="OnlyOne" className="loading-logo-img" />
          </div>
          <p className="loading-text">
            {favoritesLoading ? 'Caricamento preferiti...' : 'Caricamento prodotti...'}
          </p>
        </div>
      </div>
    );
  }

  // --- Error state ----------------------------------------------------------
  if (manifestError) {
    return (
      <div className="products-grid-wrapper">
        <div className="products-loading">
          <div className="error-placeholder">
            <span>⚠️</span>
            <p>Errore nel caricamento dei prodotti</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ 
                marginTop: '16px', 
                padding: '8px 16px', 
                border: '1px solid #ccc', 
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Product Card Component -----------------------------------------------
  const FavoriteProductCard = ({ product }) => {
    const [imageLoaded, setImageLoaded] = useState(false);
    const [imageError, setImageError] = useState(false);
    
    const isProductFavorite = isFavorite(product.id);

    const handleImageLoad = () => {
      setImageLoaded(true);
      setImageError(false);
    };

    const handleImageError = async () => {
      // Se l'immagine principale non funziona, prova un fallback
      console.warn(`❌ Errore caricamento immagine per ${product.id}:`, product.imageSrc);
      
      // Prova un'immagine alternativa se esiste
      if (product.originalFilename && product.imageSrc !== `/prodotti/${product.originalFilename}`) {
        const fallbackSrc = `/prodotti/${product.originalFilename}`;
        const exists = await testImageExists(fallbackSrc);
        if (exists) {
          // Aggiorna la src dell'immagine
          const img = document.querySelector(`img[alt="${product.title}"]`);
          if (img) {
            img.src = fallbackSrc;
            return;
          }
        }
      }
      
      setImageError(true);
      setImageLoaded(false);
    };

    const handleClick = () => {
      handleProductClick(product);
    };

    const handleFavoriteClick = (e) => {
      handleToggleFavorite(product.id, e);
    };

    return (
      <div 
        className={`product-card ${imageLoaded ? 'is-img-ready' : ''}`}
        onClick={handleClick}
      >
        <div className="media">
          {!imageLoaded && !imageError && (
            <div className="skel" />
          )}
          
          <img
            src={product.imageSrc}
            alt={product.title}
            onLoad={handleImageLoad}
            onError={handleImageError}
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease'
            }}
          />
          
          {imageError && (
            <div className="image-error">
              <div className="error-placeholder">
                <span>🖼️</span>
                <p>Immagine non disponibile</p>
                <small>{product.id}</small>
              </div>
            </div>
          )}
          
          <div className="card-overlay">
            <button
              className={`favorite-btn ${isProductFavorite ? 'active' : ''}`}
              onClick={handleFavoriteClick}
              aria-label={isProductFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            >
              <Heart 
                size={20} 
                fill={isProductFavorite ? 'currentColor' : 'none'}
              />
            </button>
          </div>
        </div>
        
        {/* Product Info */}
        <div className="card-content">
          <div className="card-meta">
            <div className="card-title-wrapper">
              <h3 className="card-title">{product.title}</h3>
            </div>
            <div className="card-views">
              <Eye size={14} />
              <span>{product.views}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // --- Render ---------------------------------------------------------------
  return (
    <div className="products-grid-wrapper">
      <div className="products-grid">
        {favoriteProductsResolved.map((product) => (
          <FavoriteProductCard
            key={`favorite-${product.id}`}
            product={product}
          />
        ))}
      </div>
      
      {/* Messaggio se non ci sono preferiti risolti */}
      {favoriteProductsResolved.length === 0 && !favoritesLoading && !manifestLoading && (
        <div className="products-loading">
          <p className="loading-text">Nessun prodotto trovato nei preferiti</p>
        </div>
      )}
    </div>
  );
};

export default FavoritesGrid;