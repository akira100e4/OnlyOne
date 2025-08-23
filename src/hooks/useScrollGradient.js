// src/hooks/useScrollGradient.js - VERSIONE CON COLORI PERSONALIZZATI #8A6273
import { useEffect } from 'react';

const useScrollGradient = () => {
  useEffect(() => {
    // 🎨 COLORI PERSONALIZZATI - Transizione verso #8A6273FF
    const startColor = { r: 24, g: 24, b: 24 };        // #181818 (carbon-black)
    const endColor = { r: 138, g: 98, b: 115 };        // #8A6273 (malva personalizzato)
    
    // 🎨 COLORI INTERMEDI ARMONIZZATI per transizione perfetta verso malva
    const intermediateColors = [
      { r: 24, g: 24, b: 24 },      // 0% - Nero puro iniziale
      { r: 28, g: 26, b: 27 },      // 15% - Nero con leggero hint malva
      { r: 35, g: 30, b: 33 },      // 30% - Grigio scurissimo con base malva
      { r: 45, g: 38, b: 42 },      // 45% - Grigio scuro con malva emergente  
      { r: 58, g: 48, b: 54 },      // 60% - Grigio medio con malva visibile
      { r: 75, g: 62, b: 70 },      // 75% - Grigio-malva equilibrato
      { r: 95, g: 78, b: 88 },      // 87% - Malva-grigio predominante
      { r: 115, g: 88, b: 102 },    // 95% - Malva chiaro quasi finale
      { r: 138, g: 98, b: 115 }     // 100% - Malva finale #8A6273
    ];
    
    // 🔥 FUNZIONE INTERPOLAZIONE MIGLIORATA con easing
    const interpolateColor = (color1, color2, factor) => {
      // Applica easing smooth per transizione più naturale
      const easedFactor = factor * factor * (3 - 2 * factor); // smoothstep
      
      const r = Math.round(color1.r + (color2.r - color1.r) * easedFactor);
      const g = Math.round(color1.g + (color2.g - color1.g) * easedFactor);
      const b = Math.round(color1.b + (color2.b - color1.b) * easedFactor);
      return `rgb(${r}, ${g}, ${b})`;
    };
    
    // 🔥 FUNZIONE EASING AVANZATA per transizione ultra-smooth
    const createAdvancedEasing = (progress) => {
      // Curva personalizzata per evitare salti bruschi - ottimizzata per malva
      if (progress < 0.55) {
        // Fase 1: Transizione molto lenta verso i grigi scuri (55% dello scroll)
        return progress * 0.12; // Leggermente più veloce per mostrare il malva prima
      } else if (progress < 0.75) {
        // Fase 2: Accelerazione graduale verso i malva medi (55-75%)
        const localProgress = (progress - 0.55) / 0.2;
        const baseProgress = 0.12 * 0.55; // circa 0.066
        const acceleration = localProgress * localProgress * 0.35; // Accelerazione quadratica
        return baseProgress + acceleration;
      } else {
        // Fase 3: Transizione finale fluida verso malva pieno (75-100%)
        const localProgress = (progress - 0.75) / 0.25;
        const baseProgress = 0.066 + 0.35; // circa 0.416
        const finalEasing = localProgress * localProgress * localProgress; // Cubic easing
        return baseProgress + (finalEasing * 0.584); // Completa fino a 1.0
      }
    };
    
    // 🔥 GRADIENT MULTI-STEP per eliminare completamente i salti
    const createFluidGradient = (progress) => {
      const easedProgress = createAdvancedEasing(progress);
      
      // Trova i due colori intermedi più vicini
      const colorSteps = intermediateColors.length - 1;
      const stepSize = 1 / colorSteps;
      const currentStep = Math.floor(easedProgress / stepSize);
      const nextStep = Math.min(currentStep + 1, colorSteps);
      
      // Calcola il progresso locale tra i due colori
      const localProgress = (easedProgress - (currentStep * stepSize)) / stepSize;
      
      const color1 = intermediateColors[currentStep];
      const color2 = intermediateColors[nextStep];
      
      // Interpola tra i due colori vicini
      const primaryColor = interpolateColor(color1, color2, localProgress);
      
      // Crea colori per il gradient multi-stop con leggero offset
      const secondaryProgress = Math.max(0, easedProgress - 0.08);
      const secondaryStep = Math.floor(secondaryProgress / stepSize);
      const secondaryNext = Math.min(secondaryStep + 1, colorSteps);
      const secondaryLocal = (secondaryProgress - (secondaryStep * stepSize)) / stepSize;
      
      const secondaryColor = interpolateColor(
        intermediateColors[secondaryStep], 
        intermediateColors[secondaryNext], 
        secondaryLocal
      );
      
      return { primaryColor, secondaryColor };
    };
    
    // 🔥 SCROLL HANDLER OTTIMIZZATO con debounce avanzato
    let lastScrollTime = 0;
    let animationFrameId = null;
    
    const handleScroll = () => {
      const now = performance.now();
      
      // Throttle avanzato per performance ottimali
      if (now - lastScrollTime < 8) return; // Max 120fps
      lastScrollTime = now;
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      animationFrameId = requestAnimationFrame(() => {
        // Calcola la percentuale di scroll con maggiore precisione
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollProgress = Math.min(Math.max(scrollTop / scrollHeight, 0), 1);
        
        // Crea il gradient fluido
        const { primaryColor, secondaryColor } = createFluidGradient(scrollProgress);
        
        // 🎨 APPLICA GRADIENT MULTI-STOP ottimizzato per malva
        const gradientCSS = `linear-gradient(
          180deg,
          ${primaryColor} 0%,
          ${secondaryColor} 40%,
          ${primaryColor} 70%,
          ${secondaryColor} 100%
        )`;
        
        // Aggiorna le CSS custom properties
        document.documentElement.style.setProperty('--dynamic-color-start', primaryColor);
        document.documentElement.style.setProperty('--dynamic-color-mid', secondaryColor);
        document.documentElement.style.setProperty('--dynamic-color-end', primaryColor);
        
        // 🔥 NUOVO: Applica anche il gradient completo
        document.documentElement.style.setProperty('--dynamic-gradient', gradientCSS);
        
        // Debug info migliorato (opzionale) - mostra valori RGB del malva
        const debugElement = document.querySelector('.scroll-debug');
        if (debugElement) {
          const easedProgress = createAdvancedEasing(scrollProgress);
          const currentMalvaIntensity = Math.round(easedProgress * 100);
          debugElement.innerHTML = `
            Scroll: ${Math.round(scrollProgress * 100)}%<br>
            Malva: ${currentMalvaIntensity}%<br>
            Primary: ${primaryColor}<br>
            Secondary: ${secondaryColor}<br>
            Target: rgb(138, 98, 115)
          `;
        }
      });
    };
    
    // 🔥 INTERSECTION OBSERVER per ottimizzare le sezioni critiche
    const observeSection = (sectionId, callback) => {
      const section = document.getElementById(sectionId);
      if (!section) return;
      
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              callback(entry.intersectionRatio);
            }
          });
        },
        { 
          threshold: [0, 0.25, 0.5, 0.75, 1],
          rootMargin: '-10% 0px -10% 0px'
        }
      );
      
      observer.observe(section);
      return observer;
    };
    
    // Osserva le sezioni critiche per transizioni speciali
    const newsletterObserver = observeSection('newsletter', (ratio) => {
      // Assicura transizione fluida nella sezione newsletter
      document.documentElement.style.setProperty('--newsletter-transition-factor', ratio);
    });
    
    const contactObserver = observeSection('contatti', (ratio) => {
      // Assicura transizione fluida nella sezione contatti
      document.documentElement.style.setProperty('--contact-transition-factor', ratio);
    });
    
    // Inizializza i colori al caricamento
    handleScroll();
    
    // Event listeners ottimizzati
    window.addEventListener('scroll', handleScroll, { 
      passive: true,
      capture: false 
    });
    
    // Listener per resize per ricalcolare su cambi di viewport
    const handleResize = () => {
      setTimeout(handleScroll, 100);
    };
    window.addEventListener('resize', handleResize, { passive: true });
    
    // 🔥 SMOOTH SCROLL ENHANCEMENT
    if ('scrollBehavior' in document.documentElement.style) {
      document.documentElement.style.scrollBehavior = 'smooth';
    }
    
    // Cleanup avanzato
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      
      if (newsletterObserver) newsletterObserver.disconnect();
      if (contactObserver) contactObserver.disconnect();
      
      // Reset colori
      document.documentElement.style.setProperty('--dynamic-color-start', 'var(--carbon-black)');
      document.documentElement.style.setProperty('--dynamic-color-mid', 'var(--carbon-black)');
      document.documentElement.style.setProperty('--dynamic-color-end', 'var(--carbon-black)');
      document.documentElement.style.setProperty('--dynamic-gradient', 'var(--carbon-black)');
      document.documentElement.style.setProperty('--newsletter-transition-factor', '0');
      document.documentElement.style.setProperty('--contact-transition-factor', '0');
    };
  }, []);
};

export default useScrollGradient;