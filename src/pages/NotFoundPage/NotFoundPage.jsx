// src/pages/NotFoundPage/NotFoundPage.jsx
import { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Particles from './components/Particles';
import './NotFoundPage.css';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const imageContainerRef = useRef(null);
  const imageRef = useRef(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // 3D Tilt Effect
  useEffect(() => {
    const container = imageContainerRef.current;
    const image = imageRef.current;
    
    if (!container || !image) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const deltaX = e.clientX - centerX;
      const deltaY = e.clientY - centerY;
      
      const rotateX = (deltaY / rect.height) * -15; // Max 15 gradi
      const rotateY = (deltaX / rect.width) * 15;
      
      image.style.transform = `
        perspective(1000px) 
        rotateX(${rotateX}deg) 
        rotateY(${rotateY}deg) 
        scale3d(1.02, 1.02, 1.02)
      `;
    };

    const handleMouseLeave = () => {
      image.style.transform = `
        perspective(1000px) 
        rotateX(0deg) 
        rotateY(0deg) 
        scale3d(1, 1, 1)
      `;
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const touch = e.touches[0];
        const rect = container.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const deltaX = touch.clientX - centerX;
        const deltaY = touch.clientY - centerY;
        
        const rotateX = (deltaY / rect.height) * -10; // Ridotto per touch
        const rotateY = (deltaX / rect.width) * 10;
        
        image.style.transform = `
          perspective(1000px) 
          rotateX(${rotateX}deg) 
          rotateY(${rotateY}deg) 
          scale3d(1.01, 1.01, 1.01)
        `;
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseleave', handleMouseLeave);
    container.addEventListener('touchmove', handleTouchMove);
    container.addEventListener('touchend', handleMouseLeave);

    return () => {
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseleave', handleMouseLeave);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleMouseLeave);
    };
  }, [isLoaded]);

  const handleBackToProducts = () => {
    // Smooth scroll to top prima di navigare
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Piccolo delay per completare lo scroll
    setTimeout(() => {
      navigate('/products');
    }, 300);
  };

  const handleBackToHome = () => {
    // Smooth scroll to top prima di navigare
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    
    // Piccolo delay per completare lo scroll
    setTimeout(() => {
      navigate('/');
    }, 300);
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
  };

  const handleImageError = () => {
    console.warn('404 image not found, using fallback');
    setIsLoaded(true);
  };

  return (
    <div className="notfound-page">
      
      {/* Particelle dorate 3D di sfondo */}
      <Particles 
        particleCount={6000}
        particleSize={20}
        color="#D9A5A5"
        animate={true}
        className="notfound-particles"
      />
      
      {/* Container principale */}
      <div className="notfound-container">
        
        {/* Immagine 404 con effetto 3D */}
        <div 
          ref={imageContainerRef}
          className={`notfound-image-container ${isLoaded ? 'loaded' : 'loading'}`}
        >
          <img
            ref={imageRef}
            src="/preferiti/notfound.png"
            alt="Pagina non trovata"
            className="notfound-image"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Loading placeholder */}
          {!isLoaded && (
            <div className="image-loading">
              <div className="loading-spinner"></div>
            </div>
          )}
        </div>
        
        {/* OnlyOne Quote e Pulsanti */}
        <div className="notfound-actions-container">
          
          {/* Quote OnlyOne */}
          <div className="onlyone-quote">
            <p className="quote-text">
              "Ogni pezzo OnlyOne aspetta di essere scoperto da te"
            </p>
          </div>

          {/* Due Pulsanti Stilizzati */}
          <div className="notfound-buttons-group">
            
            {/* Pulsante Primario - Esplora Prodotti (SENZA ICONA) */}
            <button 
              onClick={handleBackToProducts}
              className="notfound-button notfound-button--primary"
              disabled={!isLoaded}
            >
              <span className="button-text">ESPLORA PRODOTTI</span>
              <div className="button-glow"></div>
            </button>

            {/* Pulsante Secondario - Torna alla Home */}
            <button 
              onClick={handleBackToHome}
              className="notfound-button notfound-button--secondary"
              disabled={!isLoaded}
            >
              <span className="button-text">TORNA ALLA HOME</span>
              <div className="button-glow"></div>
            </button>
            
          </div>
        </div>
        
      </div>
      
    </div>
  );
};

export default NotFoundPage;