// src/pages/FavoritesPage/FavoritesPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart, ShoppingCart } from 'lucide-react';
import LogoMorphingLoader from '../ProductsPage/components/LogoMorphingLoader.jsx';
import FavoritesGrid from './components/FavoritesGrid.jsx'; // 🔥 CAMBIATO: Usa il nuovo FavoritesGrid
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import './FavoritesPage.css';

const FavoritesPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();
  
  // Hook preferiti
  const { 
    favoritesCount, 
    hasAny, 
    updateTrigger,
    exportFavorites,
    isEmpty,
    isLoading // Importante: aspettiamo che finisca il caricamento
  } = useFavoritesContext();

  // 🔥 REINDIRIZZAMENTO AUTOMATICO - Solo se NON ci sono preferiti
  useEffect(() => {
    // Solo dopo che il loader è finito e i preferiti sono caricati
    if (!showLoader && !isLoading && !redirecting) {
      if (isEmpty) {
        // Nessun preferito → vai a 404
        console.log('🔄 Nessun preferito trovato, reindirizzamento a /404');
        setRedirecting(true);
        
        // Piccolo delay per UX fluida
        setTimeout(() => {
          navigate('/404', { replace: true });
        }, 500);
      }
      // Se hasAny è true, resta semplicemente su /favorites (non fare nulla)
    }
  }, [showLoader, isLoading, isEmpty, navigate, redirecting]);

  // Aggiornamento badge con animazione (solo se non stiamo reindirizzando)
  useEffect(() => {
    if (!redirecting) {
      console.log('🔔 Badge preferiti aggiornato:', favoritesCount);
    }
  }, [updateTrigger, favoritesCount, redirecting]);

  // Scroll handler per header e footer
  useEffect(() => {
    const handleScroll = () => {
      if (redirecting) return;

      const scrolled = window.scrollY > 50;
      setIsScrolled(scrolled);

      // Footer end section animation
      if (hasAny) {
        const endContainer = document.querySelector('.favorites-end-section__container');
        const firstMessage = document.querySelector('.favorites-end__first-message');
        const secondMessage = document.querySelector('.favorites-end__second-message');
        const actions = document.querySelector('.favorites-end__actions');
        const pageContainer = document.querySelector('.favorites-page');

        if (endContainer && firstMessage && secondMessage && actions && pageContainer) {
          const triggerHeight = window.innerHeight * 0.3;
          
          if (window.scrollY > triggerHeight) {
            endContainer.classList.add('expanded');
            firstMessage.classList.add('expanded');
            pageContainer.classList.add('footer-expanded');
            
            secondMessage.classList.add('visible');
            
            setTimeout(() => {
              actions.classList.add('visible');
            }, 800);
          }
        }
      }
    };

    if (!showLoader) {
      window.addEventListener('scroll', handleScroll);
      handleScroll();
    }

    return () => window.removeEventListener('scroll', handleScroll);
  }, [showLoader, hasAny, redirecting]);

  const handleLogoClick = () => {
    if (!redirecting) {
      navigate('/');
    }
  };

  const handleProfileClick = () => {
    if (!redirecting) {
      console.log('Profile clicked');
    }
  };

  const handleFavoritesClick = () => {
    if (!redirecting) {
      console.log('Already on favorites page');
    }
  };

  const handleCartClick = () => {
    if (!redirecting) {
      console.log('Cart clicked');
    }
  };

  const handleLoaderComplete = () => {
    setShowLoader(false);
  };

  // 🔥 RENDER CONDIZIONALE: Durante reindirizzamento mostra loader
  if (redirecting) {
    return (
      <div className="favorites-page">
        <LogoMorphingLoader 
          onComplete={() => {}} // Non fare nulla, stiamo reindirizzando
        />
      </div>
    );
  }

  return (
    <div className="favorites-page">
      {/* Logo Morphing Loader */}
      {showLoader && (
        <LogoMorphingLoader onComplete={handleLoaderComplete} />
      )}

      {/* Header dedicato preferiti */}
      <header className={`favorites-header ${isScrolled ? 'favorites-header--scrolled' : ''} ${showLoader ? 'favorites-header--hidden' : ''}`}>
        <div className="favorites-header__container">
          
          {/* Icona Profilo (Sinistra) */}
          <div className="favorites-header__left">
            <button 
              onClick={handleProfileClick}
              className="favorites-header__icon-btn"
              aria-label="Profilo"
              disabled={redirecting}
            >
              <User size={24} />
            </button>
          </div>

          {/* Logo Centrato */}
          <div className="favorites-header__center">
            <button 
              onClick={handleLogoClick}
              className="favorites-header__logo"
              disabled={redirecting}
            >
              <img 
                src="/logo/logo_black.svg" 
                alt="OnlyOne"
                className="favorites-header__logo-img"
              />
            </button>
          </div>

          {/* Preferiti + Carrello (Destra) */}
          <div className="favorites-header__right">
            <button 
              onClick={handleFavoritesClick}
              className="favorites-header__icon-btn favorites-header__icon-btn--active"
              aria-label={`Preferiti (${favoritesCount})`}
              disabled={redirecting}
            >
              <Heart size={24} fill="currentColor" />
              {hasAny && (
                <span className="header-badge" key={`badge-${updateTrigger}`}>
                  {favoritesCount}
                </span>
              )}
            </button>
            <button 
              onClick={handleCartClick}
              className="favorites-header__icon-btn"
              aria-label="Carrello"
              disabled={redirecting}
            >
              <ShoppingCart size={24} />
            </button>
          </div>

        </div>
      </header>

      {/* Hero Text */}
      <section className={`favorites-hero ${showLoader ? 'favorites-hero--hidden' : ''}`}>
        <div className="favorites-hero__container">
          <h2 className="favorites-hero__title">
            <span className="favorites-hero__title-line">Your</span>
            <span className="favorites-hero__title-line">OnlyOnes</span>
          </h2>
        </div>
      </section>

      {/* 🔥 CONTENUTO: Mostra sempre FavoritesGrid se ci sono preferiti */}
      {!showLoader && !redirecting && hasAny && (
        <>
          {/* Sezione Prodotti Preferiti */}
          <section className="favorites-section">
            <div className="favorites-section__container">
              <FavoritesGrid />
            </div>
          </section>

          {/* Sezione End - FOOTER */}
          <section className="favorites-end-section">
            <div className="favorites-end-section__container">
              <div className="favorites-end">
                {/* Prima scritta */}
                <div className="favorites-end__first-message">
                  <p>✨ I tuoi pezzi unici selezionati</p>
                </div>
                
                {/* Seconda scritta - urgenza */}
                <div className="favorites-end__second-message">
                  <p>Non aspettare. Questi pezzi unici non torneranno mai più.</p>
                </div>
                
                {/* Bottoni */}
                <div className="favorites-end__actions">
                  <button 
                    onClick={() => !redirecting && navigate('/products')}
                    className="favorites-end__btn favorites-end__btn--back"
                    disabled={redirecting}
                  >
                    <Heart size={20} />
                    <span>Continua Shopping</span>
                  </button>
                  
                  <button 
                    onClick={handleCartClick}
                    className="favorites-end__btn favorites-end__btn--checkout"
                    disabled={redirecting}
                  >
                    <ShoppingCart size={20} />
                    <span>Procedi al Checkout</span>
                  </button>
                </div>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default FavoritesPage;