// src/pages/HomePage/components/ContactSection.jsx - EMAIL RIMOSSA VERSION
import { useState, useEffect, useRef, useMemo } from 'react';
import { useForm } from '@formspree/react';
import './ContactSection.css';

const ContactSection = () => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const [rippleStyle, setRippleStyle] = useState({});
  const [isHovering, setIsHovering] = useState(false);
  const nameInputRef = useRef(null);
  const buttonRef = useRef(null);

  // Formspree hook
  const [state, handleFormspreeSubmit] = useForm("xeozvoed");

  // Random hero image selection (once per page load)
  const randomContactImage = useMemo(() => {
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create ripple effect
  const createRipple = (e) => {
    if (!buttonRef.current) return;

    const button = buttonRef.current;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    setRippleStyle({
      width: size,
      height: size,
      left: x,
      top: y,
      opacity: 1,
      transform: 'scale(0)',
    });

    // Animate ripple
    setTimeout(() => {
      setRippleStyle(prev => ({
        ...prev,
        transform: 'scale(2)',
        opacity: 0,
      }));
    }, 10);

    // Clear ripple
    setTimeout(() => {
      setRippleStyle({});
    }, 600);
  };

  // Handle toggle (open/close)
  const handleToggle = (e) => {
    createRipple(e);
    
    if (isFlipped) {
      // Close the form
      setIsFlipped(false);
      setTimeout(() => {
        setFormData({ name: '', email: '', message: '' });
      }, 400);
    } else {
      // Open the form
      setIsFlipped(true);
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
        }
      }, 400);
    }
  };

  // Handle X button close
  const handleClose = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setFormData({ name: '', email: '', message: '' });
    }, 400);
  };

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (e) => {
      if (e.key === 'Escape' && isFlipped) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }, [isFlipped]);

  // Handle successful form submission
  useEffect(() => {
    if (state.succeeded) {
      alert('✅ Messaggio inviato con successo! Ti risponderemo presto.');
      handleClose();
    }
  }, [state.succeeded]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      alert('Per favore, compila tutti i campi.');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert('Per favore, inserisci un\'email valida.');
      return;
    }

    // Create form data for Formspree
    const formDataToSubmit = new FormData();
    formDataToSubmit.append('name', formData.name);
    formDataToSubmit.append('email', formData.email);
    formDataToSubmit.append('message', formData.message);
    formDataToSubmit.append('_subject', `Nuovo messaggio da ${formData.name} - OnlyOne Contact`);

    // Submit to Formspree
    await handleFormspreeSubmit(formDataToSubmit);
  };

  return (
    <section id="contatti" className="contact-section with-horizontal-padding">
      <div className="contact-container">
        
        {/* CTA Column - CENTRATA */}
        <div className="contact-cta">
          <div className="contact-cta__content">
            {/* Enhanced glow that pulses */}
            <div className={`contact-cta__glow ${isHovering ? 'glow-active' : ''}`}></div>
            
            <h2 className="contact-cta__title">Raccontaci di te</h2>
            <p className="contact-cta__subtitle">
              La tua storia inizia qui. Raccontaci la tua visione.
            </p>
            
            {/* 🔥 BUTTON SEMPLIFICATO - EMAIL WRAPPER RIMOSSO */}
            <button 
              ref={buttonRef}
              onClick={handleToggle}
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
              className={`contact-cta__button contact-cta__button--enhanced ${isFlipped ? 'button-active' : ''}`}
            >
              {/* Sliding highlight effect */}
              <span className="button__highlight"></span>
              
              {/* Ripple effect */}
              {rippleStyle.width && (
                <span 
                  className="button__ripple"
                  style={rippleStyle}
                ></span>
              )}
              
              {/* Button text */}
              <span className="button__text">
                {isFlipped ? 'CHIUDI CONVERSAZIONE' : 'INIZIA LA CONVERSAZIONE'}
              </span>
            </button>
            
            {/* 🔥 EMAIL COMPLETAMENTE RIMOSSA */}
            
          </div>
        </div>

        {/* Enhanced Image/Form Card */}
        <div className="contact-visual">
          <div className={`visual-wrapper ${isFlipped ? 'flipped' : ''}`}>
            
            {/* Image Front - Integrated with background */}
            <div className="visual-front">
              <div className="image-container">
                <img
                  src={randomContactImage}
                  alt="OnlyOne Contact"
                  className="contact-image"
                />
                {/* Gradient mask overlay */}
                <div className="image-mask"></div>
              </div>
              <div className="image-overlay">
                <p className="image-text">
                  Ogni conversazione è unica come i nostri pezzi
                </p>
              </div>
            </div>

            {/* Form Back */}
            <div className="visual-back">
              <button 
                onClick={handleClose}
                className="form-close"
                aria-label="Chiudi form"
              >
                ×
              </button>
              
              <form onSubmit={handleSubmit} className="contact-form">
                <h3 className="form-title">Raccontaci di te</h3>
                
                <div className="form-group">
                  <label htmlFor="contact-name" className="form-label">
                    Nome *
                  </label>
                  <input
                    ref={nameInputRef}
                    type="text"
                    id="contact-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Il tuo nome"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-email" className="form-label">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="la.tua@email.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="contact-message" className="form-label">
                    Messaggio *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    className="form-textarea"
                    placeholder="Raccontaci di te: la tua storia potrebbe ispirare il prossimo OnlyOne!"
                    rows="4"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="form-submit"
                  disabled={state.submitting}
                >
                  {state.submitting ? 'Invio in corso...' : 'Invia Messaggio'}
                </button>

                {/* Display errors if any */}
                {state.errors && state.errors.length > 0 && (
                  <div className="form-errors">
                    {state.errors.map((error, index) => (
                      <p key={index} className="error-message">
                        {error.message}
                      </p>
                    ))}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;