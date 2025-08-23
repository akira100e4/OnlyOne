// src/pages/ProductsPage/components/ProductsGrid.jsx - VERSIONE BACKEND
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Eye } from 'lucide-react';
import { useFavoritesContext } from '../../../contexts/FavoritesContext';
import './ProductsGrid.css';

const ProductsGrid = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState(null);
  
  // Hook preferiti
  const { 
    toggleFavorite, 
    isFavorite
  } = useFavoritesContext();

  // Refs
  const sentinelRef = useRef(null);
  const gridRef = useRef(null);
  const prevLenRef = useRef(0);

  const INITIAL_LOAD = 24;
  const LOAD_MORE = 12;

  // Backend API configuration
  const API_BASE_URL = 'http://localhost:5001/api';

  // --- API Calls ------------------------------------------------------------
  const fetchCatalog = async (page = 1, limit = 50) => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalog?page=${page}&limit=${limit}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching catalog:', error);
      throw error;
    }
  };

  // --- Helpers --------------------------------------------------------------
  const isSafari = () => /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  const slugify = (s) => (s || '')
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '');

  // Trasforma i prodotti dal backend nel formato atteso dal grid
  const transformBackendProduct = (backendProduct) => {
    return {
      id: backendProduct.id,
      printifyId: backendProduct.printifyId,
      title: backendProduct.title,
      slug: backendProduct.handle,
      image: backendProduct.image,
      imageSrc: backendProduct.image,
      description: backendProduct.description,
      price: backendProduct.price?.min || 0,
      priceMax: backendProduct.price?.max || 0,
      currency: backendProduct.price?.currency || 'EUR',
      variants: backendProduct.variants || [],
      status: backendProduct.status,
      views: Math.floor(Math.random() * 1000) + 100, // Mock views per ora
      tags: backendProduct.tags || [],
      createdAt: backendProduct.createdAt,
      updatedAt: backendProduct.updatedAt
    };
  };

  // --- Data loading ---------------------------------------------------------
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🔄 Loading products from backend...');
        
        // Fetch dal nostro backend invece che da Printify direttamente
        const catalogData = await fetchCatalog(1, 50); // Rispettiamo il limite Printify di 50
        
        if (!catalogData.products || catalogData.products.length === 0) {
          console.warn('No products found in backend catalog');
          setProducts([]);
          setDisplayedProducts([]);
          setHasMore(false);
          return;
        }

        // Trasforma i prodotti nel formato atteso dal componente
        const transformedProducts = catalogData.products.map(transformBackendProduct);
        
        console.log(`✅ Loaded ${transformedProducts.length} products from backend`);
        console.log('First product:', transformedProducts[0]);

        setProducts(transformedProducts);
        const initial = transformedProducts.slice(0, INITIAL_LOAD);
        setDisplayedProducts(initial);
        setHasMore(transformedProducts.length > INITIAL_LOAD);
        prevLenRef.current = initial.length;

      } catch (error) {
        console.error('Error loading products:', error);
        setError(error.message);
        setProducts([]);
        setDisplayedProducts([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // --- Safari reflow fix ----------------------------------------------------
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

  // --- Infinite scroll ------------------------------------------------------
  const loadMoreProducts = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    setTimeout(() => {
      const current = displayedProducts.length;
      const next = products.slice(current, current + LOAD_MORE);

      if (next.length > 0) {
        setDisplayedProducts((prev) => [...prev, ...next]);
        prevLenRef.current = current + next.length;
      }

      setHasMore(current + next.length < products.length);
      setLoadingMore(false);
    }, 300);
  }, [products, displayedProducts.length, loadingMore, hasMore]);

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

  // --- Handlers -------------------------------------------------------------
  const handleProductClick = useCallback((product) => {
    navigate(`/product/${product.id}`);
  }, [navigate]);

  const handleToggleFavorite = useCallback((productId, e) => {
    e?.stopPropagation();
    toggleFavorite(productId);
  }, [toggleFavorite]);

  // --- Error state ----------------------------------------------------------
  if (error) {
    return (
      <div className="products-grid-wrapper">
        <div className="products-error">
          <div className="error-content">
            <h3>⚠️ Errore di connessione</h3>
            <p>Non riesco a caricare i prodotti dal server:</p>
            <code>{error}</code>
            <button 
              onClick={() => window.location.reload()} 
              className="retry-button"
            >
              🔄 Riprova
            </button>
            <div className="error-debug">
              <p><strong>Debug info:</strong></p>
              <ul>
                <li>Backend URL: {API_BASE_URL}</li>
                <li>Verifica che il backend sia avviato su porta 5001</li>
                <li>Controlla la console del browser per altri errori</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Loading state --------------------------------------------------------
  if (loading) {
    return (
      <div className="products-grid-wrapper">
        <div className="products-loading">
          <div className="loading-logo">
            <img src="/logo/logo_black.svg" alt="OnlyOne" className="loading-logo-img" />
          </div>
          <p className="loading-text">Caricamento catalogo dal server...</p>
          <p className="loading-subtext">Connessione al backend OnlyOne...</p>
        </div>
      </div>
    );
  }

  // --- No products ----------------------------------------------------------
  if (displayedProducts.length === 0) {
    return (
      <div className="products-grid-wrapper">
        <div className="products-empty">
          <h3>Nessun prodotto disponibile</h3>
          <p>Il catalogo è vuoto o non accessibile.</p>
        </div>
      </div>
    );
  }

  // --- Main render ----------------------------------------------------------
  return (
    <div className="products-grid-wrapper">
      {/* Backend status indicator */}
      <div className="backend-status">
        <span className="status-indicator">🟢</span>
        <span>Backend attivo - {products.length} prodotti caricati</span>
      </div>

      <div className="products-grid-container">
        <div className="products-grid" ref={gridRef}>
          {displayedProducts.map((product) => (
            <div
              key={product.id}
              className="product-card"
              onClick={() => handleProductClick(product)}
            >
              <div className="product-card-image-wrapper">
                <img
                  src={product.image || '/products/placeholder.png'}
                  alt={product.title}
                  className="product-card-image"
                  loading="lazy"
                  onError={(e) => {
                    e.target.src = '/products/placeholder.png';
                  }}
                />
                
                {/* Status badge per prodotti in publishing */}
                {product.status === 'publishing' && (
                  <div className="status-badge publishing">
                    ⏳ In Pubblicazione
                  </div>
                )}
                
                <div className="product-card-overlay">
                  <div className="product-card-actions">
                    <button
                      className={`favorite-btn ${isFavorite(product.id) ? 'active' : ''}`}
                      onClick={(e) => handleToggleFavorite(product.id, e)}
                      aria-label="Aggiungi ai preferiti"
                    >
                      <Heart size={20} />
                    </button>
                    <div className="views-count">
                      <Eye size={16} />
                      <span>{product.views}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="product-card-content">
                <h3 className="product-card-title">{product.title}</h3>
                <div className="product-card-price">
                  {product.price === product.priceMax ? (
                    <span className="price-single">
                      €{product.price?.toFixed(2)}
                    </span>
                  ) : (
                    <span className="price-range">
                      €{product.price?.toFixed(2)} - €{product.priceMax?.toFixed(2)}
                    </span>
                  )}
                </div>
                {product.variants && product.variants.length > 0 && (
                  <div className="product-card-variants">
                    {product.variants.length} varianti disponibili
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Loading more */}
        {loadingMore && (
          <div className="loading-more">
            <div className="loading-spinner"></div>
            <p>Caricamento altri prodotti...</p>
          </div>
        )}

        {/* Sentinel for infinite scroll */}
        {hasMore && !loadingMore && (
          <div ref={sentinelRef} className="scroll-sentinel"></div>
        )}

        {/* End message */}
        {!hasMore && displayedProducts.length > 0 && (
          <div className="products-end">
            <p>Hai visto tutti i {products.length} prodotti disponibili!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductsGrid;