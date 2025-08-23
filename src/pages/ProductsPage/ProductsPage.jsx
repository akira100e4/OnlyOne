// src/pages/ProductsPage/ProductsPage.jsx - VERSIONE PULITA
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Heart, ShoppingCart } from 'lucide-react';
import LogoMorphingLoader from './components/LogoMorphingLoader.jsx';
import ProductsGrid from './components/ProductsGrid.jsx';
import { useFavoritesContext } from '../../contexts/FavoritesContext';
import './ProductsPage.css';

const ProductsPage = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const navigate = useNavigate();
  
  // Hook preferiti
  const { 
    favoritesCount, 
    hasAny, 
    updateTrigger,
    exportFavorites
  } = useFavoritesContext();

  // Aggiornamento badge con animazione
  useEffect(() => {
    if (!showLoader && updateTrigger > 0) {
      const badge = document.querySelector('.header-badge');
      if (badge) {
        badge.style.animation = 'none';
        badge.offsetHeight;
        badge.style.animation = 'badgeFlash 0.3s ease-out';
      }
    }
  }, [updateTrigger, favoritesCount, showLoader]);

  // Gestione scroll e animazioni footer
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
      
      if (!showLoader) {
        const endSection = document.querySelector('.products-end-section');
        const endContainer = document.querySelector('.products-end');
        const firstMessage = document.querySelector('.products-end__first-message');
        const secondMessage = document.querySelector('.products-end__second-message');
        const actions = document.querySelector('.products-end__actions');
        const pageContainer = document.querySelector('.products-page');
        
        if (endSection && endContainer && firstMessage && secondMessage && actions && pageContainer) {
          const scrollY = window.scrollY;
          const windowHeight = window.innerHeight;
          const documentHeight = document.documentElement.scrollHeight;
          
          const triggerScroll = Math.max(windowHeight * 0.5, 300);
          const nearBottom = scrollY > documentHeight - windowHeight - 200;
          
          if (scrollY > triggerScroll || nearBottom) {
            endSection.classList.add('expanded');
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
  }, [showLoader]);

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleProfileClick = () => {
    console.log('Profile clicked');
  };

  const handleFavoritesClick = () => {
   navigate('/favorites')
  };

  const handleCartClick = () => {
    console.log('Cart clicked');
  };

  const handleLoaderComplete = () => {
    setShowLoader(false);
  };

  return (
    <div className="products-page">
      {/* Logo Morphing Loader */}
      {showLoader && (
        <LogoMorphingLoader onComplete={handleLoaderComplete} />
      )}

      {/* Header dedicato prodotti */}
      <header className={`products-header ${isScrolled ? 'products-header--scrolled' : ''} ${showLoader ? 'products-header--hidden' : ''}`}>
        <div className="products-header__container">
          
          {/* Icona Profilo (Sinistra) */}
          <div className="products-header__left">
            <button 
              onClick={handleProfileClick}
              className="products-header__icon-btn"
              aria-label="Profilo"
            >
              <User size={24} />
            </button>
          </div>

          {/* Logo Centrato */}
          <div className="products-header__center">
            <button 
              onClick={handleLogoClick}
              className="products-header__logo"
            >
              <img 
                src="/logo/logo_black.svg" 
                alt="OnlyOne"
                className="products-header__logo-img"
              />
            </button>
          </div>

          {/* Preferiti + Carrello (Destra) */}
          <div className="products-header__right">
            <button 
              onClick={handleFavoritesClick}
              className="products-header__icon-btn"
              aria-label={`Preferiti (${favoritesCount})`}
            >
              <Heart size={24} />
              {hasAny && (
                <span className="header-badge" key={`badge-${updateTrigger}`}>
                  {favoritesCount}
                </span>
              )}
            </button>
            <button 
              onClick={handleCartClick}
              className="products-header__icon-btn"
              aria-label="Carrello"
            >
              <ShoppingCart size={24} />
            </button>
          </div>

        </div>
      </header>

      {/* Hero Text */}
      <section className={`products-hero ${showLoader ? 'products-hero--hidden' : ''}`}>
        <div className="products-hero__container">
          <h2 className="products-hero__title">
            <span className="products-hero__title-line">Qui dove ogni capo</span>
            <span className="products-hero__title-line">è pensato solo per te</span>
          </h2>
        </div>
      </section>

      {/* Sezione Prodotti */}
      <section className={`products-section ${showLoader ? 'products-section--hidden' : ''}`}>
        <div className="products-section__container">
          <ProductsGrid />
        </div>
      </section>

      {/* Sezione End - TESTO FISSO */}
      <section className={`products-end-section ${showLoader ? 'products-end-section--hidden' : ''}`}>
        <div className="products-end-section__container">
          <div className="products-end">
            {/* Prima scritta */}
            <div className="products-end__first-message">
              <p>✨ Hai visto tutti i nostri pezzi unici</p>
            </div>
            
            {/* 🔥 TESTO FISSO: Sempre uguale */}
            <div className="products-end__second-message">
              <p>Quale ti piace di più?</p>
            </div>
            
            {/* Bottoni */}
            <div className="products-end__actions">
              <button 
                onClick={handleFavoritesClick}
                className={`products-end__btn products-end__btn--favorites ${hasAny ? 'has-favorites' : 'no-favorites'}`}
              >
                <Heart size={20} />
                <span>{hasAny ? 'Vai ai Preferiti' : 'Aggiungi Preferiti'}</span>
                {hasAny && (
                  <span 
                    className="btn-badge" 
                    key={`footer-badge-${updateTrigger}`}
                  >
                    {favoritesCount}
                  </span>
                )}
              </button>
              
              <button 
                onClick={handleCartClick}
                className="products-end__btn products-end__btn--cart"
              >
                <ShoppingCart size={20} />
                <span>Vedi Carrello</span>
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProductsPage;