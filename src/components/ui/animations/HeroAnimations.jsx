// src/components/ui/animations/HeroAnimations.jsx
import { useEffect, useState, useRef } from 'react';

/**
 * Hook per animazioni al scroll - Essenziale per bacheca
 */
export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Rimuovi l'observer dopo la prima apparizione
          observer.unobserve(entry.target);
        }
      },
      { threshold }
    );

    if (elementRef.current) {
      observer.observe(elementRef.current);
    }

    return () => {
      if (elementRef.current) {
        observer.unobserve(elementRef.current);
      }
    };
  }, [threshold]);

  return [elementRef, isVisible];
};

/**
 * Hook per glow breath effect - NUOVO (adattato per 100vw spotlight)
 */
export const useGlowBreath = (intensity = 'normal') => {
  const [glowState, setGlowState] = useState('breathing');
  
  const intensitySettings = {
    light: { duration: 3000, scale: [1, 1.03] },
    normal: { duration: 4000, scale: [1, 1.05] },
    strong: { duration: 5000, scale: [1, 1.08] }
  };

  useEffect(() => {
    const settings = intensitySettings[intensity];
    const interval = setInterval(() => {
      setGlowState(prev => prev === 'breathing' ? 'inhale' : 'breathing');
    }, settings.duration / 2);

    return () => clearInterval(interval);
  }, [intensity]);

  return glowState;
};

/**
 * Componente TypewriterText Avanzato
 */
export const TypewriterText = ({ 
  text, 
  speed = 50, 
  delay = 0, 
  className = '',
  onComplete = () => {} 
}) => {
  const [displayText, setDisplayText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (!text || hasStarted) return;

    const timer = setTimeout(() => {
      setHasStarted(true);
      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex <= text.length) {
          setDisplayText(text.slice(0, currentIndex));
          currentIndex++;
        } else {
          clearInterval(interval);
          setIsComplete(true);
          onComplete();
        }
      }, speed);

      return () => clearInterval(interval);
    }, delay);

    return () => clearTimeout(timer);
  }, [text, speed, delay, onComplete, hasStarted]);

  return (
    <span className={`${className} ${isComplete ? '' : 'animate-typewriter'}`}>
      {displayText}
    </span>
  );
};

/**
 * Componente per reveal on scroll - Utile per bacheca
 */
export const RevealOnScroll = ({ 
  children, 
  animation = 'fade-in', 
  delay = 0,
  threshold = 0.1,
  className = '' 
}) => {
  const [elementRef, isVisible] = useScrollAnimation(threshold);

  const animationClass = isVisible ? `animate-${animation}` : '';
  const delayClass = delay ? `animate-delay-${delay}` : '';

  return (
    <div 
      ref={elementRef} 
      className={`${animationClass} ${delayClass} ${className}`}
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {children}
    </div>
  );
};

/**
 * Componente button con hover animations
 */
export const AnimatedButton = ({ 
  children, 
  onClick, 
  variant = 'scale',
  className = '',
  disabled = false,
  ...props 
}) => {
  const variantClasses = {
    scale: 'hover-scale',
    lift: 'hover-lift',
    rotate: 'hover-rotate'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      {...props}
    >
      {children}
    </button>
  );
};

/**
 * Componente per floating elements
 */
export const FloatingElement = ({ 
  children, 
  intensity = 'normal', 
  delay = 0,
  className = '' 
}) => {
  const intensityClasses = {
    light: 'animate-float',
    normal: 'animate-float-delayed',
    strong: 'animate-parallax-float'
  };

  const delayClass = delay ? `animate-delay-${delay}` : '';

  return (
    <div className={`${intensityClasses[intensity]} ${delayClass} ${className}`}>
      {children}
    </div>
  );
};

/**
 * Componente per loading animation
 */
export const LoadingSpinner = ({ size = 'normal', color = 'var(--antique-pink)' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    normal: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div 
      className={`${sizeClasses[size]} animate-slow-rotate`}
      style={{
        border: `2px solid transparent`,
        borderTop: `2px solid ${color}`,
        borderRadius: '50%'
      }}
    />
  );
};

/**
 * NUOVO: Componente GlowEffect per alone personalizzabile (100vw style)
 */
export const GlowEffect = ({ 
  size = '100vw', 
  maxHeight = '120vh',
  intensity = 'normal',
  color = 'rgba(217, 165, 165, 0.08)',
  className = '' 
}) => {
  const glowState = useGlowBreath(intensity);
  
  const baseStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: size,
    height: size,
    maxHeight: maxHeight,
    background: `radial-gradient(
      circle at center,
      ${color} 0%,
      rgba(217, 165, 165, 0.04) 30%,
      rgba(217, 165, 165, 0.02) 50%,
      rgba(217, 165, 165, 0.01) 70%,
      transparent 90%
    )`,
    pointerEvents: 'none',
    zIndex: 1
  };

  return (
    <div 
      className={`animate-glow-breath ${className}`}
      style={baseStyle}
    />
  );
};

// Export componenti principali
export default {
  useScrollAnimation,
  useGlowBreath,
  TypewriterText,
  RevealOnScroll,
  AnimatedButton,
  FloatingElement,
  LoadingSpinner,
  GlowEffect
};