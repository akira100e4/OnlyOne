// src/pages/ProductsPage/components/ProductsGrid.jsx - VERSIONE GRAFICHE UNIFICATE
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import { useFavoritesContext } from '../../../contexts/FavoritesContext';
import './ProductsGrid.css';

const ProductsGrid = () => {
  const navigate = useNavigate();
  
  // Stati principali
  const [graphics, setGraphics] = useState([]); // Grafiche dal manifest.json
  const [printifyProducts, setPrintifyProducts] = useState([]); // Prodotti dal backend
  const [unifiedProducts, setUnifiedProducts] = useState([]); // Prodotti unificati finali
  const [displayedProducts, setDisplayedProducts] = useState([]);
  
  // Stati di caricamento
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  // Hook preferiti
  const { toggleFavorite, isFavorite } = useFavoritesContext();

  // Refs
  const sentinelRef = useRef(null);
  const gridRef = useRef(null);
  const prevLenRef = useRef(0);

  const INITIAL_LOAD = 24;
  const LOAD_MORE = 12;

  // Backend API configuration
  const API_BASE_URL = 'http://localhost:5001/api';

  // --- UTILITY FUNCTIONS ---------------------------------------------------
  const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  // Funzione per estrarre il nome della grafica dal titolo Printify
  const extractGraphicName = (printifyTitle) => {
    if (!printifyTitle) return null;
    
    // Il formato tipico è: "dragon_sweatshirt_680c4e" o "dragon_tshirt_680c4e"
    // Vogliamo estrarre "dragon"
    const parts = printifyTitle.toLowerCase().split('_');
    if (parts.length >= 2) {
      // Rimuovi gli ultimi elementi che sono tipo prodotto e ID
      // Mantieni solo la parte della grafica
      return parts[0]; // In questo caso "dragon"
    }
    
    // Fallback: cerca corrispondenze nei nostri ID grafiche
    const lowerTitle = printifyTitle.toLowerCase();
    return lowerTitle;
  };

  // Funzione per creare un ID unico per la grafica unificata
  const createUnifiedId = (graphicId) => `unified_${graphicId}`;

  // --- API CALLS -----------------------------------------------------------
  const loadManifest = async () => {
    try {
      const response = await fetch('/prodotti/manifest.json');
      if (!response.ok) {
        throw new Error(`Errore caricamento manifest: ${response.status}`);
      }
      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error('Errore caricamento manifest.json:', error);
      throw error;
    }
  };

  const fetchPrintifyCatalog = async () => {
    try {
      console.log('🔄 Caricamento prodotti Printify dal backend...');
      const response = await fetch(`${API_BASE_URL}/catalog?limit=100`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Prodotti Printify caricati:', data.products?.length || 0);
      return data.products || [];
    } catch (error) {
      console.error('Errore caricamento catalogo Printify:', error);
      // Non bloccare l'app se Printify non funziona
      return [];
    }
  };

  // --- PROCESSING FUNCTIONS ------------------------------------------------
  const unifyProducts = (manifestGraphics, printifyProducts) => {
    console.log('🔄 Unificazione prodotti...');
    console.log('Grafiche manifest:', manifestGraphics.length);
    console.log('Prodotti Printify:', printifyProducts.length);

    const unified = manifestGraphics.map(graphic => {
      // Trova tutti i prodotti Printify che corrispondono a questa grafica
      const relatedPrintifyProducts = printifyProducts.filter(product => {
        const extractedName = extractGraphicName(product.title);
        return extractedName === graphic.id || 
               product.title.toLowerCase().includes(graphic.id.toLowerCase());
      });

      console.log(`Grafica "${graphic.id}": trovati ${relatedPrintifyProducts.length} prodotti Printify`);

      // Calcola il range di prezzi
      let minPrice = null;
      let maxPrice = null;
      let variantCount = 0;

      if (relatedPrintifyProducts.length > 0) {
        const allPrices = [];
        
        relatedPrintifyProducts.forEach(product => {
          if (product.price?.min) allPrices.push(product.price.min);
          if (product.price?.max && product.price.max !== product.price.min) {
            allPrices.push(product.price.max);
          }
          variantCount += (product.variants?.length || 0);
        });

        if (allPrices.length > 0) {
          minPrice = Math.min(...allPrices);
          maxPrice = Math.max(...allPrices);
        }
      }

      // Fallback a prezzi mock se non ci sono dati Printify
      if (minPrice === null) {
        minPrice = 22.99;
        maxPrice = 34.99;
        variantCount = 6; // Mock: T-shirt + Sweatshirt con 3 colori ciascuno
      }

      return {
        id: createUnifiedId(graphic.id),
        graphicId: graphic.id,
        title: graphic.title,
        slug: graphic.id,
        imageSrc: graphic.src,
        image: graphic.src,
        height: graphic.height || 'md',
        
        // Dati di prezzo unificati
        price: minPrice,
        priceMax: maxPrice,
        currency: 'EUR',
        
        // Metadati
        variantCount: variantCount,
        printifyProducts: relatedPrintifyProducts,
        views: Math.floor(Math.random() * 500) + 50, // Mock views
        
        // Per compatibilità
        status: 'active',
        tags: [`graphic:${graphic.id}`],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    console.log('✅ Prodotti unificati creati:', unified.length);
    return unified;
  };

  // --- DATA LOADING --------------------------------------------------------
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Inizio caricamento dati...');

        // 1. Carica manifest.json (fonte principale)
        const manifestGraphics = await loadManifest();
        setGraphics(manifestGraphics);

        // 2. Carica prodotti Printify (per prezzi)
        const printifyData = await fetchPrintifyCatalog();
        setPrintifyProducts(printifyData);

        // 3. Unifica i dati
        const unifiedData = unifyProducts(manifestGraphics, printifyData);
        setUnifiedProducts(unifiedData);

        // 4. Setup initial display
        const initial = unifiedData.slice(0, INITIAL_LOAD);
        setDisplayedProducts(initial);
        setHasMore(unifiedData.length > INITIAL_LOAD);
        prevLenRef.current = initial.length;

        console.log('✅ Caricamento completato!');
        console.log('Grafiche:', manifestGraphics.length);
        console.log('Prodotti Printify:', printifyData.length);
        console.log('Prodotti unificati:', unifiedData.length);

      } catch (error) {
        console.error('❌ Errore caricamento:', error);
        setError(error.message);
        setUnifiedProducts([]);
        setDisplayedProducts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // --- SAFARI REFLOW FIX ---------------------------------------------------
  useEffect(() => {
    if (!isSafari()) return;
    const grid = gridRef.current;
    if (!grid) return;

    const grew = displayedProducts.length > prevLenRef.current;
    if (grew) {
      grid.style.columnCount = 'auto';
      grid.offsetHeight;
      grid.style.columnCount = '';
      prevLenRef.current = displayedProducts.length;
    }

    const handleResize = () => {
      if (!gridRef.current) return;
      gridRef.current.style.columnCount = 'auto';
      gridRef.current.offsetHeight;
      gridRef.current.style.columnCount = '';
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [displayedProducts.length]);

  // --- INFINITE SCROLL -----------------------------------------------------
  const loadMoreProducts = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    setTimeout(() => {
      const current = displayedProducts.length;
      const next = unifiedProducts.slice(current, current + LOAD_MORE);

      if (next.length > 0) {
        setDisplayedProducts((prev) => [...prev, ...next]);
        prevLenRef.current = current + next.length;
      }

      setHasMore(current + next.length < unifiedProducts.length);
      setLoadingMore(false);
    }, 300);
  }, [unifiedProducts, displayedProducts.length, loadingMore, hasMore]);

  useEffect(() => {
    if (!sentinelRef.current) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && hasMore && !loadingMore) {
          loadMoreProducts();
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );
    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [hasMore, loadingMore, loadMoreProducts]);

  // --- EVENT HANDLERS ------------------------------------------------------
  const handleProductClick = useCallback((product) => {
    // Naviga usando il graphicId, non l'ID unificato
    navigate(`/product/${product.graphicId}`);
  }, [navigate]);

  const handleToggleFavorite = useCallback((productId, e) => {
    e?.stopPropagation();
    toggleFavorite(productId);
  }, [toggleFavorite]);

  // --- RENDER STATES -------------------------------------------------------
  if (error) {
    return (
      <div className="products-grid-wrapper">
        <div className="products-error">
          <div className="error-content">
            <h3>⚠️ Errore di caricamento</h3>
            <p>Non riesco a caricare i prodotti:</p>
            <code>{error}</code>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
              style={{
                marginTop: '16px',
                padding: '12px 24px',
                background: 'var(--antique-pink)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              🔄 Riprova
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="products-grid-wrapper">
        <div className="products-loading">
          <div className="loading-logo">
            <img src="/logo/logo_black.svg" alt="OnlyOne" className="loading-logo-img" />
          </div>
          <p className="loading-text">Caricamento collezione OnlyOne...</p>
          <p className="loading-subtext">Unificazione grafiche e prezzi...</p>
        </div>
      </div>
    );
  }

  if (displayedProducts.length === 0) {
    return (
      <div className="products-grid-wrapper">
        <div className="products-empty">
          <h3>Nessuna grafica disponibile</h3>
          <p>La collezione è vuota o non accessibile.</p>
        </div>
      </div>
    );
  }

  // --- MAIN RENDER ---------------------------------------------------------
  return (
    <div className="products-grid-wrapper">
      {/* Status indicators */}
      <div className="backend-status">
        <span className="status-indicator">🟢</span>
        <span>
          {graphics.length} grafiche • {printifyProducts.length} prodotti Printify • {unifiedProducts.length} cards
        </span>
      </div>

      <div className="products-grid-container">
        <div className="products-grid" ref={gridRef}>
          {displayedProducts.map((product) => (
            <UnifiedProductCard 
              key={product.id}
              product={product}
              onProductClick={handleProductClick}
              onToggleFavorite={handleToggleFavorite}
              isFavorite={isFavorite(product.id)}
            />
          ))}
        </div>

        {/* Loading more */}
        {loadingMore && (
          <div className="loading-more">
            <div className="loading-spinner"></div>
            <p>Caricamento altre grafiche...</p>
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        {hasMore && !loadingMore && (
          <div ref={sentinelRef} className="scroll-sentinel"></div>
        )}

        {/* End message */}
        {!hasMore && displayedProducts.length > 0 && (
          <div className="products-end">
            <p>Hai visto tutte le {unifiedProducts.length} grafiche della collezione OnlyOne!</p>
          </div>
        )}
      </div>
    </div>
  );
};

// --- PRODUCT CARD COMPONENT ----------------------------------------------
const UnifiedProductCard = ({ product, onProductClick, onToggleFavorite, isFavorite: isProductFavorite }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    console.warn(`⚠️ Errore caricamento immagine per ${product.graphicId}:`, product.imageSrc);
    setImageError(true);
    setImageLoaded(false);
  };

  const handleClick = () => {
    onProductClick(product);
  };

  const handleFavoriteClick = (e) => {
    onToggleFavorite(product.id, e);
  };

  return (
    <div 
      className={`product-card ${imageLoaded ? 'is-img-ready' : ''}`}
      onClick={handleClick}
    >
      {/* 🔥 STRUTTURA CORRETTA: .media container (come nel CSS originale) */}
      <div className="media">
        {/* Skeleton shimmer */}
        {!imageLoaded && !imageError && (
          <div className="skel" />
        )}
        
        {/* Immagine principale - SENZA classi extra */}
        <img
          src={product.imageSrc}
          alt={product.title}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            opacity: imageLoaded ? 1 : 0,
            transition: 'opacity 0.3s ease'
          }}
        />

        {/* Fallback per errori immagine */}
        {imageError && (
          <div className="image-error">
            <div className="error-placeholder">
              <span>🖼️</span>
              <p>{product.title}</p>
            </div>
          </div>
        )}

        {/* 🔥 OVERLAY CORRETTO: .card-overlay (come nel CSS originale) */}
        <div className="card-overlay">
          <button
            className={`favorite-btn ${isProductFavorite ? 'active' : ''}`}
            onClick={handleFavoriteClick}
            aria-label="Aggiungi ai preferiti"
          >
            <Heart size={20} />
          </button>
        </div>
      </div>

      {/* 🔥 CONTENT CORRETTO: .card-content (come nel CSS originale) */}
      <div className="card-content">
        <div className="card-meta">
          <div className="card-title-wrapper">
            {/* 🔥 TITOLO CORRETTO: .card-title per signature sweep effect */}
            <h3 className="card-title">{product.title}</h3>
          </div>
          <div className="card-views">
            <Eye size={16} />
            <span>{product.views}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsGrid;