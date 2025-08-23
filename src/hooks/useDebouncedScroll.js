// src/hooks/useDebouncedScroll.js
import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook per gestire lo scroll debounced con performance ottimizzate
 * 
 * @param {Object} options - Configurazione del hook
 * @param {number} options.delay - Delay in ms per il debounce (default: 100)
 * @param {HTMLElement|null} options.element - Elemento da osservare (default: window)
 * @param {Function} options.onScrollEnd - Callback eseguito quando lo scroll si ferma
 * @param {boolean} options.preventDefault - Se prevenire il comportamento default (default: false)
 * @param {boolean} options.passive - Se usare passive listeners (default: true)
 * 
 * @returns {Object} - { isScrolling, scrollPosition, resetScroll }
 */
const useDebouncedScroll = ({
  delay = 100,
  element = null,
  onScrollEnd = null,
  preventDefault = false,
  passive = true
} = {}) => {
  // Stati del hook
  const [isScrolling, setIsScrolling] = useState(false);
  const [scrollPosition, setScrollPosition] = useState({ x: 0, y: 0 });
  
  // Refs per gestire timers e cleanup
  const debounceTimer = useRef(null);
  const rafId = useRef(null);
  const lastScrollTime = useRef(0);
  const isInitialized = useRef(false);
  
  // Ottimizzazione: Throttled position update con RAF
  const updateScrollPosition = useCallback((target) => {
    if (rafId.current) {
      cancelAnimationFrame(rafId.current);
    }
    
    rafId.current = requestAnimationFrame(() => {
      const x = target === window ? window.pageXOffset : target.scrollLeft;
      const y = target === window ? window.pageYOffset : target.scrollTop;
      
      setScrollPosition({ x, y });
      rafId.current = null;
    });
  }, []);

  // Reset manuale dello stato scroll
  const resetScroll = useCallback(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    
    setIsScrolling(false);
    lastScrollTime.current = 0;
  }, []);

  // Handler principale per eventi scroll
  const handleScrollEvent = useCallback((event) => {
    const now = Date.now();
    const target = event.target === document ? window : event.target;
    
    // Previeni comportamento default se richiesto
    if (preventDefault && !passive) {
      event.preventDefault();
    }
    
    // Aggiorna timestamp ultimo scroll
    lastScrollTime.current = now;
    
    // Set scrolling state se non già attivo
    if (!isScrolling) {
      setIsScrolling(true);
    }
    
    // Aggiorna posizione con throttling
    updateScrollPosition(target);
    
    // Clear timer esistente
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    // Set nuovo timer debounced
    debounceTimer.current = setTimeout(() => {
      // Double-check: assicurati che sia passato abbastanza tempo
      const timeSinceLastScroll = Date.now() - lastScrollTime.current;
      
      if (timeSinceLastScroll >= delay - 10) { // -10ms tolerance
        setIsScrolling(false);
        
        // Esegui callback se fornito
        if (onScrollEnd && typeof onScrollEnd === 'function') {
          try {
            onScrollEnd({
              position: { 
                x: target === window ? window.pageXOffset : target.scrollLeft,
                y: target === window ? window.pageYOffset : target.scrollTop
              },
              element: target,
              event
            });
          } catch (error) {
            console.warn('Error in onScrollEnd callback:', error);
          }
        }
        
        debounceTimer.current = null;
      }
    }, delay);
  }, [delay, preventDefault, passive, isScrolling, onScrollEnd, updateScrollPosition]);

  // Setup degli event listeners
  useEffect(() => {
    const targetElement = element || window;
    const isWindow = targetElement === window;
    
    // Determina il target corretto per gli eventi
    const scrollTarget = isWindow ? window : targetElement;
    const documentTarget = isWindow ? document : targetElement;
    
    // Verifica che l'elemento esista
    if (!scrollTarget || (scrollTarget !== window && !scrollTarget.addEventListener)) {
      console.warn('useDebouncedScroll: Invalid target element');
      return;
    }
    
    // Opzioni per gli event listeners
    const listenerOptions = {
      passive: passive && !preventDefault,
      capture: false
    };
    
    // Event handlers unificati
    const scrollHandler = handleScrollEvent;
    const wheelHandler = handleScrollEvent;
    const touchMoveHandler = handleScrollEvent;
    
    try {
      // Aggiungi listeners per tutti i tipi di scroll
      scrollTarget.addEventListener('scroll', scrollHandler, listenerOptions);
      
      // Wheel events (desktop)
      if (scrollTarget.addEventListener) {
        scrollTarget.addEventListener('wheel', wheelHandler, listenerOptions);
      }
      
      // Touch events (mobile)
      if (documentTarget.addEventListener) {
        documentTarget.addEventListener('touchmove', touchMoveHandler, listenerOptions);
      }
      
      // Inizializza posizione corrente
      if (!isInitialized.current) {
        const initialX = isWindow ? window.pageXOffset : targetElement.scrollLeft;
        const initialY = isWindow ? window.pageYOffset : targetElement.scrollTop;
        setScrollPosition({ x: initialX, y: initialY });
        isInitialized.current = true;
      }
      
    } catch (error) {
      console.error('Error setting up scroll listeners:', error);
    }
    
    // Cleanup function
    return () => {
      try {
        // Rimuovi tutti gli event listeners
        scrollTarget.removeEventListener('scroll', scrollHandler, listenerOptions);
        
        if (scrollTarget.removeEventListener) {
          scrollTarget.removeEventListener('wheel', wheelHandler, listenerOptions);
        }
        
        if (documentTarget.removeEventListener) {
          documentTarget.removeEventListener('touchmove', touchMoveHandler, listenerOptions);
        }
        
        // Clear timers
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
          debounceTimer.current = null;
        }
        
        if (rafId.current) {
          cancelAnimationFrame(rafId.current);
          rafId.current = null;
        }
        
        // Reset stati
        setIsScrolling(false);
        lastScrollTime.current = 0;
        isInitialized.current = false;
        
      } catch (error) {
        console.error('Error cleaning up scroll listeners:', error);
      }
    };
  }, [element, handleScrollEvent, passive, preventDefault]);
  
  // Cleanup aggiuntivo on unmount
  useEffect(() => {
    return () => {
      resetScroll();
    };
  }, [resetScroll]);
  
  // Return dell'hook
  return {
    isScrolling,
    scrollPosition,
    resetScroll,
    // Utility values
    scrollY: scrollPosition.y,
    scrollX: scrollPosition.x,
    // Debug info (rimuovi in produzione)
    _debug: {
      lastScrollTime: lastScrollTime.current,
      hasActiveTimer: !!debounceTimer.current,
      isInitialized: isInitialized.current
    }
  };
};

export default useDebouncedScroll;