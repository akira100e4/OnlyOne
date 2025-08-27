// src/pages/ProductsPage/components/ProductsGrid.jsx - "1 GRAFICA = 1 CARD"
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import { useFavoritesContext } from '../../../contexts/FavoritesContext';
import './ProductsGrid.css';

const ProductsGrid = () => {
  const navigate = useNavigate();
  
  // Stati principali
  const [graphics, setGraphics] = useState([]);
  const [printifyProducts, setPrintifyProducts] = useState([]);
  const [unifiedProducts, setUnifiedProducts] = useState([]);
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

  const normalizeForMatching = (text) => {
    return text
      .toLowerCase()
      .replace(/[_\-\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const createUnifiedId = (graphicId) => `unified_${graphicId}`;

  // --- API CALLS -----------------------------------------------------------
  const loadManifest = async () => {
    try {
      console.log('DEBUG: Loading manifest.json...');
      const response = await fetch('/prodotti/manifest.json');
      if (!response.ok) {
        throw new Error(`Errore caricamento manifest: ${response.status}`);
      }
      const data = await response.json();
      console.log('DEBUG: Manifest loaded, graphics found:', data?.length || 0);
      
     // 👍 Mostra tutte le grafiche del manifest
console.log('DEBUG: All graphics from manifest:', data?.length || 0);
return data;


    } catch (error) {
      console.error('DEBUG: Errore caricamento manifest.json:', error);
      throw error;
    }
  };

  const fetchPrintifyCatalog = async () => {
    try {
      console.log('DEBUG: Fetching Printify products from backend...');
      const response = await fetch(`${API_BASE_URL}/catalog?limit=100`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const products = data.products || [];
      console.log('DEBUG: Printify products loaded:', products.length);
      
      // Mostra solo prodotti che potrebbero matchare "Danzatrice"
      const relevantProducts = products.filter(p => 
        p.title.toLowerCase().includes('danzatrice')
      );
      console.log('DEBUG: Relevant products for Danzatrice:', relevantProducts.map(p => p.title));
      
      return products;
    } catch (error) {
      console.error('DEBUG: Error fetching Printify catalog:', error);
      return [];
    }
  };

  // --- DATA PROCESSING ---------------------------------------------------
  const unifyProducts = (manifestGraphics, printifyProducts) => {
    console.log('DEBUG: Starting unification process...');
    console.log('DEBUG: Manifest graphics:', manifestGraphics.length);
    console.log('DEBUG: Printify products:', printifyProducts.length);
    
    const unified = manifestGraphics.map((graphic) => {
      console.log(`\nDEBUG: Processing graphic: "${graphic.title}"`);
      console.log(`DEBUG: Graphic ID: "${graphic.id}"`);
      
      // Trova TUTTI i prodotti Printify correlati a questa grafica
      const relatedProducts = printifyProducts.filter(product => {
        if (!product.title) return false;
        
        const productTitle = normalizeForMatching(product.title);
        const graphicId = normalizeForMatching(graphic.id);
        
        // Estrai le parole chiave dalla grafica
        const graphicWords = graphicId.split(' ').filter(word => word.length > 2);
        
        console.log(`  Testing "${product.title}"`);
        console.log(`    Normalized: "${productTitle}"`);
        console.log(`    Graphic words: [${graphicWords.join(', ')}]`);
        
        // Match se almeno 2 parole chiave sono presenti
        const matchingWords = graphicWords.filter(word => 
          productTitle.includes(word)
        );
        
        const isMatch = matchingWords.length >= 2;
        console.log(`    Matching words: [${matchingWords.join(', ')}] - ${isMatch ? 'MATCH' : 'NO'}`);
        
        return isMatch;
      });
      
      console.log(`DEBUG: Found ${relatedProducts.length} related products:`);
      relatedProducts.forEach(p => console.log(`  - ${p.title}`));
      
      // Categorizza i prodotti per tipo
      const productTypes = {
        tshirt: relatedProducts.filter(p => 
          p.title.toLowerCase().includes('tshirt') || 
          p.title.toLowerCase().includes('t-shirt')
        ),
        sweatshirt: relatedProducts.filter(p => 
          p.title.toLowerCase().includes('sweatshirt') ||
          p.title.toLowerCase().includes('felpa')
        )
      };
      
      console.log(`DEBUG: Product breakdown:`);
      console.log(`  T-shirts: ${productTypes.tshirt.length}`);
      console.log(`  Sweatshirts: ${productTypes.sweatshirt.length}`);
      
      // Calcola range prezzi combinato di TUTTI i prodotti correlati
      let minPrice = null;
      let maxPrice = null;
      let totalVariants = 0;
      
      if (relatedProducts.length > 0) {
        const allPrices = [];
        
        relatedProducts.forEach(product => {
          if (product.price?.min !== undefined) {
            allPrices.push(product.price.min / 100); // Converti da centesimi
          }
          if (product.price?.max !== undefined) {
            allPrices.push(product.price.max / 100);
          }
          totalVariants += (product.variants?.length || 0);
        });
        
        if (allPrices.length > 0) {
          minPrice = Math.min(...allPrices);
          maxPrice = Math.max(...allPrices);
        }
      }
      
      // Fallback prezzi se nessun prodotto trovato
      if (minPrice === null) {
        minPrice = 25.00;
        maxPrice = 35.00;
        totalVariants = 120; // Mock totale varianti T-shirt + Felpa
      }
      
      console.log(`DEBUG: Combined pricing: €${minPrice} - €${maxPrice}, ${totalVariants} total variants`);
      
      const unifiedProduct = {
        id: createUnifiedId(graphic.id),
        graphicId: graphic.id,
        title: graphic.title,
        slug: graphic.id,
        imageSrc: graphic.src, // USA SEMPRE IMMAGINE LOCALE
        image: graphic.src,
        localFallback: graphic.src,
        height: graphic.height || 'md',
        
        // Dati di prezzo COMBINATI di tutti i prodotti
        price: minPrice,
        priceMax: maxPrice,
        currency: 'EUR',
        
        // Metadati combinati
        variantCount: totalVariants,
        printifyProducts: relatedProducts, // Tutti i prodotti correlati
        productTypes: productTypes, // Breakdown per tipo
        views: Math.floor(Math.random() * 500) + 50,
        
        status: 'active',
        tags: [`graphic:${graphic.id}`],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      console.log(`DEBUG: Created unified product:`, {
        title: unifiedProduct.title,
        imageSrc: unifiedProduct.imageSrc,
        priceRange: `€${unifiedProduct.price} - €${unifiedProduct.priceMax}`,
        totalVariants: unifiedProduct.variantCount,
        printifyProducts: unifiedProduct.printifyProducts.length,
        tshirts: unifiedProduct.productTypes.tshirt.length,
        sweatshirts: unifiedProduct.productTypes.sweatshirt.length
      });
      
      return unifiedProduct;
    });
    
    console.log('DEBUG: Unification complete. Unified products created:', unified.length);
    return unified;
  };

  // --- DATA LOADING --------------------------------------------------------
  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('DEBUG: Starting data loading process...');

        // 1. Carica manifest.json (solo grafiche test)
        const manifestGraphics = await loadManifest();
        setGraphics(manifestGraphics);

        // 2. Carica prodotti Printify
        const printifyData = await fetchPrintifyCatalog();
        setPrintifyProducts(printifyData);

        // 3. Unifica i dati (1 grafica = 1 card)
        const unifiedData = unifyProducts(manifestGraphics, printifyData);
        setUnifiedProducts(unifiedData);

        // 4. Setup initial display
        const initial = unifiedData.slice(0, INITIAL_LOAD);
        setDisplayedProducts(initial);
        setHasMore(unifiedData.length > INITIAL_LOAD);
        prevLenRef.current = initial.length;

        console.log('DEBUG: Loading completed successfully!');

      } catch (error) {
        console.error('DEBUG: Error during loading:', error);
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

  // --- EVENT HANDLERS ------------------------------------------------------
  const handleProductClick = useCallback((product) => {
    console.log('DEBUG CLICK: Navigating to product:', product.graphicId);
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
            <h3>Errore di caricamento</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-button">
              Riprova
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
        </div>
      </div>
    );
  }

  if (displayedProducts.length === 0) {
    return (
      <div className="products-grid-wrapper">
        <div className="products-empty">
          <h3>Nessuna grafica disponibile</h3>
          <p>Controlla che "La Danzatrice delle Ombre" sia presente nel manifest.json</p>
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
          {graphics.length} grafiche • {printifyProducts.length} prodotti Printify • {unifiedProducts.length} cards unificate
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
    console.warn('DEBUG: Image load error for:', product.title);
    setImageError(true);
    setImageLoaded(false);
  };

  const handleClick = () => {
    console.log('DEBUG: Card clicked:', product.title);
    onProductClick(product);
  };

  const handleFavoriteClick = (e) => {
    onToggleFavorite(product.id, e);
  };

  return (
    <div 
      className={`product-card ${imageLoaded ? 'is-img-ready' : ''}`}
      onClick={handleClick}
      data-product-id={product.id}
      data-graphic-id={product.graphicId}
    >
      {/* Media container */}
      <div className="media">
        {/* Skeleton shimmer */}
        {!imageLoaded && !imageError && (
          <div className="skel" />
        )}
        
        {/* Main image - SEMPRE LOCALE */}
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

        {/* Card overlay */}
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

      {/* Card content */}
      <div className="card-content">
        <div className="card-meta">
          <div className="card-title-wrapper">
            <h3 className="card-title">{product.title}</h3>
            {/* Info combinata */}
            <small style={{ 
              fontSize: '11px', 
              color: '#666', 
              fontFamily: 'monospace',
              display: 'block',
              marginTop: '4px'
            }}>
              {product.productTypes.tshirt.length} T-shirt + {product.productTypes.sweatshirt.length} Felpe
            </small>
          </div>
          <div className="card-views">
            <Eye size={16} />
            <span>{product.views}</span>
          </div>
        </div>
        {/* Range prezzo combinato */}
        <div style={{ marginTop: '8px' }}>
          <span style={{ fontWeight: 'bold', color: '#333' }}>
            €{product.price.toFixed(2)} - €{product.priceMax.toFixed(2)}
          </span>
          <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>
            {product.variantCount} varianti totali
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsGrid;