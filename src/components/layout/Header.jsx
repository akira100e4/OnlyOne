import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }
  };

  // Smooth scroll + redirect per PRODOTTI
  const handleProductsClick = () => {
    // Se siamo già sulla homepage, scroll smooth poi redirect
    if (window.location.pathname === '/') {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
      
      // Aspetta che finisca lo scroll, poi naviga
      setTimeout(() => {
        navigate('/products');
      }, 800);
    } else {
      // Se siamo su altre pagine, vai direttamente
      navigate('/products');
    }
  };

  // Smooth scroll + redirect per CLAIM YOURS NOW (usato da HeroHome)
  const handleClaimYoursClick = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    setTimeout(() => {
      navigate('/products');
    }, 800);
  };

  // Funzione per tornare alla homepage
  const handleLogoClick = () => {
    if (window.location.pathname === '/') {
      // Se siamo già sulla homepage, scroll to top
      scrollToSection('home');
    } else {
      // Se siamo su altre pagine, naviga alla homepage
      navigate('/');
    }
  };

  return (
    <>
      {/* Main header */}
      <header className={`header ${isScrolled ? 'header--scrolled' : ''}`}>
        <div className="header__container">
          {/* Logo */}
          <div className="header__logo">
            <button 
              onClick={handleLogoClick}
              className="header__logo-btn"
            >
              OnlyOne
            </button>
          </div>

          {/* Navigation */}
          <nav className="header__nav">
            <button 
              onClick={() => scrollToSection('bacheca')}
              className="header__nav-link"
            >
              Bacheca
            </button>
            
            <button 
              onClick={handleProductsClick}
              className="header__nav-link header__nav-link--cta"
            >
              PRODOTTI
            </button>
            
            <button 
              onClick={() => scrollToSection('chi-siamo')}
              className="header__nav-link"
            >
              Chi siamo
            </button>
            
            <button 
              onClick={() => scrollToSection('contatti')}
              className="header__nav-link"
            >
              Contatti
            </button>
          </nav>
        </div>
      </header>
    </>
  );
};

// Esporta anche la funzione per CLAIM YOURS NOW
export const handleClaimYoursNavigation = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
  
  setTimeout(() => {
    window.location.href = '/products';
  }, 800);
};

export default Header;