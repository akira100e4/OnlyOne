// src/pages/HomePage/components/HeroNewsletter.jsx - PINTEREST STYLE VERSION
import { useState } from 'react';
import './HeroNewsletter.css';

const HeroNewsletter = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formState, setFormState] = useState('default'); // 'default', 'success', 'error'

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setFormState('error');
      setTimeout(() => setFormState('default'), 2000);
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFormState('error');
      setTimeout(() => setFormState('default'), 2000);
      return;
    }

    // Simulate API call
    setIsSubmitting(true);
    setFormState('default');
    
    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Success feedback
      setFormState('success');
      setTimeout(() => {
        setFormState('default');
        setEmail('');
      }, 3000);
      
    } catch (error) {
      setFormState('error');
      setTimeout(() => setFormState('default'), 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (e) => {
    setEmail(e.target.value);
    // Reset error state when user starts typing
    if (formState === 'error') {
      setFormState('default');
    }
  };

  // Dynamic placeholder based on state
  const getPlaceholder = () => {
    switch (formState) {
      case 'success':
        return '✓ Iscrizione completata!';
      case 'error':
        return '✗ Email non valida';
      default:
        return 'Resta aggiornato';
    }
  };

  // Dynamic button text
  const getButtonText = () => {
    if (isSubmitting) return 'ISCRIVENDO...';
    if (formState === 'success') return '✓ FATTO!';
    if (formState === 'error') return 'RIPROVA';
    return 'ISCRIVITI';
  };

  return (
    <section id="newsletter" className="hero-newsletter bottom-spaced">
      {/* 
        🔧 CLASSI PER CONTROLLARE L'ALTEZZA:
        
        ZERO SPACING:
        - Nessuna classe extra = min-height: 100vh (default)
        
        CON PADDING INFERIORE:
        - "bottom-spaced" = solo padding sotto (80px desktop, 60px mobile)
        - "small-bottom" = poco padding sotto (40px)  
        - "medium-bottom" = medio padding sotto (60px)
        - "large-bottom" = molto padding sotto (100px desktop, 80px mobile)
        
        PADDING COMPLETO:
        - "content-sized" = padding sopra/sotto (60px desktop, 40px mobile)
        - "custom-spacing" = padding diverso sopra/sotto (40px sopra, 80px sotto)
        
        ALTRE OPZIONI:
        - "fixed-height" = height: 80vh (altezza fissa)
        - "compact" = min-height: 70vh (altezza minima ridotta)
      */}
      
      <div className="newsletter-container">
        
        {/* Content Column (Top) */}
        <div className="newsletter-content-column">
          <div className="newsletter-content">
            <h2 className="newsletter-title">
              Non perdere i nuovi drop
            </h2>
            <p className="newsletter-subtitle">
              Ogni settimana, 20 pezzi unici. Una sola possibilità.
            </p>
          </div>
        </div>

        {/* Pinterest Style Form Column (Bottom) */}
        <div className="newsletter-form-column">
          <form onSubmit={handleSubmit} className="newsletter-form">
            
            {/* Underlined Input Field */}
            <div className={`newsletter-input-wrapper ${formState}`}>
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleInputChange}
                placeholder={getPlaceholder()}
                className="newsletter-input-underlined"
                disabled={isSubmitting || formState === 'success'}
                required
              />
            </div>

            {/* Glass Morphism CTA Button */}
            <button 
              type="submit" 
              className="newsletter-cta-button"
              disabled={isSubmitting || formState === 'success'}
            >
              <span className="button-text">{getButtonText()}</span>
              <div className="button-ripple"></div>
            </button>

          </form>
        </div>

      </div>
    </section>
  );
};

export default HeroNewsletter;