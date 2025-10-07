// src/pages/CartPage/CartPage.jsx - CON CHECKOUT DRAWER
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart, ShoppingCart, ArrowLeft, Trash2 } from 'lucide-react';
import { useCart } from '../../hooks/useCart';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import CartGrid from './components/CartGrid';
import CheckoutDrawer from './components/CheckoutDrawer'; // 🔥 NUOVO IMPORT
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { 
    items, 
    totals, 
    count, 
    isEmpty, 
    loading, 
    error, 
    clearCart, 
    clearError,
    sessionId 
  } = useCart();
  
  const { 
    favorites, 
    count: favoritesCount, 
    hasAny: hasAnyFavorites 
  } = useFavoritesContext();

  // States
  const [isScrolled, setIsScrolled] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [showCheckoutDrawer, setShowCheckoutDrawer] = useState(false); // 🔥 NUOVO STATE

  // Scroll detection per header
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Navigation handlers
  const handleLogoClick = () => {
    if (redirecting) return;
    setRedirecting(true);
    navigate('/');
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
  };

  const handleFavoritesClick = () => {
    if (redirecting) return;
    setRedirecting(true);
    navigate('/favorites');
  };

  const handleBackToProducts = () => {
    if (redirecting) return;
    setRedirecting(true);
    navigate('/products');
  };

  const handleClearCart = async () => {
    try {
      const confirmed = window.confirm(
        `Sei sicuro di voler rimuovere tutti i ${count} articoli dal carrello?\n\nQuesta azione non può essere annullata.`
      );
      
      if (!confirmed) return;

      await clearCart();
      console.log('Cart cleared successfully');
      
    } catch (error) {
      console.error('Clear cart error:', error);
      alert('Errore durante lo svuotamento del carrello');
    }
  };

  // 🔥 MODIFICATO: handleCheckout ora apre il drawer invece dell'alert
  const handleCheckout = () => {
    if (isEmpty) return;
    
    console.log('Opening checkout drawer for', count, 'items');
    setShowCheckoutDrawer(true);
  };

  // 🔥 NUOVO: Handler per chiudere checkout drawer
  const handleCloseCheckout = () => {
    setShowCheckoutDrawer(false);
    console.log('Checkout drawer closed');
  };

  // Format price helper
  const formatPrice = (price) => {
    // I prezzi arrivano in centesimi, convertiamo prima di formattare
    const priceInEuro = price / 100;
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR'
    }).format(priceInEuro);
  };

  return (
    <div className="cart-page">
      
      {/* Header carrello */}
      <header className={`cart-header ${isScrolled ? 'cart-header--scrolled' : ''}`}>
        <div className="cart-header__container">
          
          {/* Back Button (Sinistra) */}
          <div className="cart-header__left">
            <button 
              onClick={handleBackToProducts}
              className="cart-header__back-btn"
              aria-label="Torna ai prodotti"
              disabled={redirecting}
            >
              <ArrowLeft size={24} />
            </button>
          </div>

          {/* Logo Centrato */}
          <div className="cart-header__center">
            <button 
              onClick={handleLogoClick}
              className="cart-header__logo"
              disabled={redirecting}
            >
              <img 
                src="/logo/logo_black.svg" 
                alt="OnlyOne"
                className="cart-header__logo-img"
              />
            </button>
          </div>

          {/* Profilo + Preferiti (Destra) */}
          <div className="cart-header__right">
            <button 
              onClick={handleProfileClick}
              className="cart-header__icon-btn"
              aria-label="Profilo"
              disabled={redirecting}
            >
              <User size={24} />
            </button>
            <button 
              onClick={handleFavoritesClick}
              className="cart-header__icon-btn"
              aria-label={`Preferiti (${favoritesCount})`}
              disabled={redirecting}
            >
              <Heart size={24} />
              {hasAnyFavorites && (
                <span className="header-badge">
                  {favoritesCount}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* Hero Text */}
      <section className="cart-hero">
        <div className="cart-hero__container">
          <h2 className="cart-hero__title">
            <span className="cart-hero__title-line">Il tuo</span>
            <span className="cart-hero__title-line">Carrello</span>
          </h2>
          {!isEmpty && (
            <p className="cart-hero__subtitle">
              {count} {count === 1 ? 'articolo selezionato' : 'articoli selezionati'}
            </p>
          )}
        </div>
      </section>

      {/* Error Banner */}
      {error && (
        <section className="cart-error">
          <div className="cart-error__container">
            <div className="error-banner">
              <p>Errore: {error}</p>
              <button onClick={clearError} className="error-close">
                Chiudi
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Loading State */}
      {loading && (
        <section className="cart-loading">
          <div className="cart-loading__container">
            <div className="loading-spinner"></div>
            <p>Caricamento carrello...</p>
          </div>
        </section>
      )}

      {/* Cart Content */}
      {!loading && (
        <>
          {/* Carrello con items */}
          {!isEmpty && (
            <>
              {/* Sezione Items */}
              <section className="cart-items-section">
                <div className="cart-items-section__container">
                  
                  {/* Header sezione con clear button */}
                  <div className="cart-items-header">
                    <h3>I tuoi articoli</h3>
                    <button 
                      onClick={handleClearCart}
                      className="clear-cart-btn"
                      title="Svuota carrello"
                    >
                      <Trash2 size={16} />
                      Svuota
                    </button>
                  </div>

                  {/* Grid degli items */}
                  <CartGrid />

                </div>
              </section>

              {/* Sezione Totali */}
              <section className="cart-totals-section">
                <div className="cart-totals-section__container">
                  
                  <div className="cart-totals">
                    <h3>Riepilogo ordine</h3>
                    
                    <div className="totals-breakdown">
                      <div className="total-row">
                        <span>Subtotale ({count} {count === 1 ? 'articolo' : 'articoli'})</span>
                        <span>{formatPrice(totals.subtotal)}</span>
                      </div>
                      
                      <div className="total-row">
                        <span>Spedizione</span>
                        <span className="free-shipping">Gratuita</span>
                      </div>
                      
                      <div className="total-row total-row--final">
                        <span>Totale</span>
                        <span>{formatPrice(totals.total)}</span>
                      </div>
                    </div>

                    <button 
                      onClick={handleCheckout}
                      className="checkout-btn"
                      disabled={isEmpty}
                    >
                      <ShoppingCart size={20} />
                      Procedi al Checkout
                    </button>

                    <div className="trust-badges">
                      <span>🔒 Pagamenti sicuri</span>
                      <span>🚚 Spedizione gratuita</span>
                      <span>🔄 Reso facile</span>
                    </div>

                  </div>

                </div>
              </section>
            </>
          )}

          {/* Carrello vuoto */}
          {isEmpty && (
            <section className="cart-empty-section">
              <div className="cart-empty-section__container">
                
                <div className="cart-empty">
                  
                  <div className="cart-empty__icon">
                    <ShoppingCart size={48} />
                  </div>
                  
                  <div className="cart-empty__message">
                    <h3>Il tuo carrello è vuoto</h3>
                    <p>Scopri i nostri pezzi unici e trova quello perfetto per te</p>
                  </div>
                  
                  <div className="cart-empty__actions">
                    <button 
                      onClick={handleBackToProducts}
                      className="cart-empty__btn cart-empty__btn--primary"
                      disabled={redirecting}
                    >
                      Esplora Prodotti
                    </button>
                    
                    {hasAnyFavorites && (
                      <button 
                        onClick={handleFavoritesClick}
                        className="cart-empty__btn cart-empty__btn--secondary"
                        disabled={redirecting}
                      >
                        <Heart size={16} />
                        Vai ai Preferiti ({favoritesCount})
                      </button>
                    )}
                  </div>

                </div>

              </div>
            </section>
          )}
        </>
      )}

      {/* 🔥 CHECKOUT DRAWER */}
      <CheckoutDrawer
        isOpen={showCheckoutDrawer}
        onClose={handleCloseCheckout}
      />

      {/* Session Debug (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="cart-debug">
          <details>
            <summary>Debug Cart</summary>
            <pre>
              {JSON.stringify({ 
                sessionId, 
                count, 
                isEmpty, 
                loading, 
                error,
                totals 
              }, null, 2)}
            </pre>
          </details>
        </div>
      )}

    </div>
  );
};

export default CartPage;