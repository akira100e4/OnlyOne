// src/pages/HomePage/components/HeroHome.jsx
import { useMemo } from 'react';
import { TypewriterText, AnimatedButton } from '../../../components/ui/animations/HeroAnimations';
import './HeroHome.css';
import '../../../components/ui/animations/HeroAnimations.css';

const HeroHome = () => {
  // Random hero image selection (once per page load)
  const randomHeroImage = useMemo(() => {
    const heroImages = [
      '/hero-images/1.png',
      '/hero-images/2.png',
      '/hero-images/3.png',
      '/hero-images/4.png',
      '/hero-images/5.png',
      '/hero-images/6.png',
      '/hero-images/7.png',
      '/hero-images/8.png'
    ];
    const randomIndex = Math.floor(Math.random() * heroImages.length);
    return heroImages[randomIndex];
  }, []);

  return (
    <section id="home" className="hero-home">
      {/* Wrapper per immagine + alone - NUOVO APPROCCIO */}
      <div className="hero-home__image-wrapper animate-hero-layout-split hero-image-large">
        {/* Alone circolare - ora libero dal container */}
        <div className="hero-home__spotlight animate-glow-breath"></div>
        
        {/* Container immagine */}
        <div className="hero-home__image-container">
          <img
            src={randomHeroImage}
            alt="OnlyOne Unique Piece"
            className="hero-home__hero-image"
          />
        </div>
      </div>

      {/* Contenuto centrale - SOPRA IMMAGINE GRANDE */}
      <div className="hero-home__content hero-content-priority">
        <div className="hero-home__text-block animate-content-move-right">
          <h1 className="hero-home__main-title">
            <span className="hero-home__title-line">One Story.</span>
            <span className="hero-home__title-line">One Time.</span>
            <span className="hero-home__title-brand">The OnlyOne.</span>
          </h1>

          <TypewriterText
            text="OnlyOne. Or never again."
            speed={60}
            delay={2000}
            className="hero-home__quote"
          />

          <div style={{ opacity: 0, animation: 'fadeIn 1s ease-in-out 4.5s both' }}>
            <AnimatedButton
              variant="lift"
              className="hero-home__cta-button"
              onClick={() => window.location.href = '/products'}
            >
              CLAIM YOURS NOW
            </AnimatedButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroHome;