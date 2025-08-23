// src/pages/ProductsPage/components/LogoMorphingLoader.jsx
import React, { useState, useEffect } from 'react';
import './LogoMorphingLoader.css';

const LogoMorphingLoader = ({ onComplete, logoSrc = '/logo/logo_black.svg' }) => {
  const [phase, setPhase] = useState('morph'); // morph -> dissolve -> complete

  useEffect(() => {
    // Timeline delle fasi del loader
    const timeline = [
      { phase: 'morph', delay: 0 },      // Morfing per 2.5s
      { phase: 'dissolve', delay: 2500 }, // Dissolve per 0.8s
      { phase: 'complete', delay: 3300 }   // Complete (istantaneo)
    ];

    const timeouts = timeline.map(({ phase: nextPhase, delay }) =>
      setTimeout(() => {
        setPhase(nextPhase);
        
        if (nextPhase === 'complete' && onComplete) {
          // 🔥 FIX: Nessuna animazione in complete - callback immediata
          onComplete();
        }
      }, delay)
    );

    // Cleanup timeouts
    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <div className={`logo-morphing-loader ${phase}`} role="dialog" aria-label="Loading">
      {/* Overlay background */}
      <div className="loader-overlay" />
      
      {/* Logo container centrale */}
      <div className="logo-container">
        {/* Effetti morphing sovrapposti */}
        <div className="morph-effect morph-scale" />
        <div className="morph-effect morph-pulse" />
        <div className="morph-effect morph-particles" />
        
        {/* Effetti glow e ripple */}
        <div className="logo-glow" />
        <div className="logo-ripple" />
        
        {/* Logo principale con morphing */}
        <div className="logo-morph">
          <img 
            src={logoSrc} 
            alt="Loading logo" 
            className="logo-main"
            loading="eager"
            decoding="sync"
          />
        </div>
      </div>
      
      {/* Barra di progresso */}
      <div className="loading-progress" role="progressbar" aria-valuenow="100" aria-valuemin="0" aria-valuemax="100">
        <div className="progress-bar" />
      </div>
    </div>
  );
};

export default LogoMorphingLoader;