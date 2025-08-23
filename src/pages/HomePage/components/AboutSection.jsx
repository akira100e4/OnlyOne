// src/pages/HomePage/components/AboutSection.jsx - VERSIONE CON HIGHLIGHT-GLOW CONTINUATIVO
import { useEffect, useRef, useState } from 'react';
import { AnimatedButton } from '../../../components/ui/animations/HeroAnimations';
import useDebouncedScroll from '../../../hooks/useDebouncedScroll';
import './AboutSection.css';

// Individual Block Components con animazioni mirate
const IdentityBlock = ({ isActive }) => (
  <div className={`about-block__content ${isActive ? 'content-active' : ''}`}>
    <h2 className="about-block__main-title">
      OnlyOne è la tua opera da indossare.
    </h2>
    <div className="about-block__manifesto">
      <p className="about-block__text">
        Ogni creazione è l'unico esemplare esistente. Nessuna replica. Nessun ritorno.
      </p>
      <p className="about-block__text">
        Ogni pezzo riflette chi sei, non cosa segui.
      </p>
      <p className="about-block__text">
        Generato una sola volta, destinato solo a te.
      </p>
      <p className="about-block__text about-block__text--emphasis">
        <span className="highlight-glow">Perché la tua unicità merita di essere portata addosso, e non può essere copiata.</span>
      </p>
    </div>
  </div>
);

const MissionBlock = ({ isActive }) => (
  <div className={`about-block__content ${isActive ? 'content-active' : ''}`}>
    <h3 className="about-block__section-title">Mission</h3>
    <div className="about-block__text-group">
      <p className="about-block__text">
        In un mondo in cui tutto si ripete, scegliamo di non ripetere mai.
      </p>
      <p className="about-block__text">
        <span className="flash-underline">Ogni capo è il N.1 della sua serie.</span>
      </p>
      <p className="about-block__text">
        Viene generato una sola volta, acquistato una sola volta, poi sparisce per sempre.
      </p>
      <p className="about-block__text about-block__text--emphasis">
        Perché il vero valore nasce dalla fine, non dalla possibilità di rifarlo.
      </p>
    </div>
  </div>
);

const VisionBlock = ({ isActive }) => (
  <div className={`about-block__content ${isActive ? 'content-active' : ''}`}>
    <h3 className="about-block__section-title">Vision</h3>
    <div className="about-block__text-group">
      <p className="about-block__text">
        Vogliamo un mondo in cui ogni persona possa indossare ciò che le appartiene davvero.
      </p>
      <p className="about-block__text">
        Non un trend. Non un'illusione di unicità.
      </p>
      <p className="about-block__text">
        Ma un'opera generata <span className="signature-sweep">solo per te</span>.
      </p>
      <p className="about-block__text">
        Un'estensione di chi sei.
      </p>
      <p className="about-block__text about-block__text--emphasis">
        Non più stile da seguire. Ma essenza da affermare.
      </p>
    </div>
  </div>
);

const PositioningBlock = ({ isActive }) => {
  const positioningCards = [
    {
      id: 1,
      title: "Mai replicato",
      description: "Nessun prodotto viene ristampato. Nessuna collezione. Nessun secondo giro."
    },
    {
      id: 2,
      title: "Tu sei il Brand",
      description: "Ogni scelta che fai modella OnlyOne. Il tuo pezzo lo definisce quanto il nostro design."
    },
    {
      id: 3,
      title: "Un mosaico di storie",
      description: "Chi sceglie OnlyOne entra a far parte della sua storia. Indossa e costruisce."
    }
  ];

  return (
    <div className={`about-block__content ${isActive ? 'content-active' : ''}`}>
      <h3 className="about-block__section-title about-block__section-title--centered">
        Il nostro posizionamento
      </h3>
      <div className="about-block__cards-grid">
        {positioningCards.map((card) => (
          <div key={card.id} className="about-block__card">
            <h4 className="about-block__card-title">
              {card.title}
            </h4>
            <p className="about-block__card-description">
              {card.id === 2 ? (
                <>
                  Ogni scelta che fai modella OnlyOne. <span className="background-accent">Il tuo pezzo lo definisce quanto il nostro design.</span>
                </>
              ) : (
                card.description
              )}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

const CTABlock = ({ isActive, onCTAClick }) => (
  <div className={`about-block__content ${isActive ? 'content-active' : ''}`}>
    <h3 className="about-block__cta-title">
      Entra a far parte della famiglia OnlyOne.
    </h3>
    <p className="about-block__cta-subtitle">
      <span className="typewriter-effect">Possiedi qualcosa che nessun altro avrà mai.</span>
    </p>
    <AnimatedButton
      variant="lift"
      onClick={onCTAClick}
      className="about-block__cta-button"
    >
      Unisciti ora
    </AnimatedButton>
  </div>
);

const AboutSection = () => {
  const [activeBlock, setActiveBlock] = useState(0);
  const containerRef = useRef(null);
  const blockRefs = useRef([]);
  
  // 🔥 Set per tracciare animazioni già attivate (evita ripetizioni per animazioni una tantum)
  const activatedAnimations = useRef(new Set());
  
  // Hook debounced scroll ottimizzato
  const { isScrolling, scrollY, resetScroll } = useDebouncedScroll({
    delay: 150,
    element: containerRef.current,
    onScrollEnd: ({ position, element }) => {
      console.log('Scroll ended at:', position.y);
    },
    preventDefault: false,
    passive: true
  });

  // IntersectionObserver ottimizzato con animazioni ripetibili per highlight-glow
  useEffect(() => {
    // Solo se non stiamo scrollando attivamente
    if (isScrolling) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const blockIndex = parseInt(entry.target.dataset.blockIndex);
          
          if (entry.isIntersecting && entry.intersectionRatio > 0.6) {
            setActiveBlock(blockIndex);
            
            // Update block states
            blockRefs.current.forEach((block, index) => {
              if (block) {
                // Rimuovi tutte le classi prima di aggiungere quella corretta
                block.classList.remove('block-active', 'block-exit', 'block-enter');
                
                if (index === blockIndex) {
                  block.classList.add('block-active');
                  
                  // 🔥 TRIGGER ANIMAZIONI CON LOGICA RIPETIBILE/UNA-TANTUM
                  const animatedSpans = block.querySelectorAll('.highlight-glow, .flash-underline, .signature-sweep, .typewriter-effect, .background-accent');
                  
                  animatedSpans.forEach((span) => {
                    const spanClass = span.className.split(' ')[0];
                    const animationId = `${blockIndex}-${spanClass}`;
                    
                    // 🔥 ANIMAZIONI RIPETIBILI: flash-underline + highlight-glow
                    if (spanClass === 'flash-underline' || spanClass === 'highlight-glow') {
                      // Rimuovi classe animate esistente e re-triggera
                      span.classList.remove('animate');
                      // Force reflow per reset dell'animazione
                      span.offsetHeight;
                      
                      // Delay differenziato per tipo di animazione
                      const delay = spanClass === 'highlight-glow' ? 500 : 100;
                      
                      setTimeout(() => {
                        span.classList.add('animate');
                      }, delay);
                    }
                    // 🔥 ANIMAZIONI UNA-TANTUM: signature-sweep, typewriter-effect, background-accent
                    else if (!activatedAnimations.current.has(animationId)) {
                      // Delay progressivo per animazioni multiple nello stesso blocco
                      const spanIndex = Array.from(animatedSpans).indexOf(span);
                      const delay = spanIndex * 200; // 200ms di differenza tra animazioni
                      
                      setTimeout(() => {
                        span.classList.add('animate');
                        activatedAnimations.current.add(animationId);
                      }, delay);
                    }
                  });
                  
                } else if (index < blockIndex) {
                  block.classList.add('block-exit');
                } else {
                  block.classList.add('block-enter');
                }
              }
            });
          }
        });
      },
      {
        root: containerRef.current,
        threshold: [0.4, 0.6, 0.8],
        rootMargin: '-5% 0px -5% 0px'
      }
    );

    // Observe all blocks
    blockRefs.current.forEach((block) => {
      if (block) observer.observe(block);
    });

    return () => observer.disconnect();
  }, [isScrolling]);

  // Performance: Cleanup on unmount
  useEffect(() => {
    return () => {
      resetScroll();
      // Reset activated animations (solo per quelle una-tantum)
      activatedAnimations.current.clear();
    };
  }, [resetScroll]);

  const handleCTAClick = () => {
    window.location.href = '/products';
  };

  const blocks = [
    { Component: IdentityBlock, key: 'identity' },
    { Component: MissionBlock, key: 'mission' },
    { Component: VisionBlock, key: 'vision' },
    { Component: PositioningBlock, key: 'positioning' },
    { Component: CTABlock, key: 'cta', props: { onCTAClick: handleCTAClick } }
  ];

  return (
    <section 
      id="chi-siamo" 
      className={`about-scroll-container ${isScrolling ? 'is-scrolling' : 'scroll-idle'}`}
    >
      <div className="about-scroll-wrapper" ref={containerRef}>
        {blocks.map(({ Component, key, props = {} }, index) => (
          <div 
            key={key}
            className={`about-block about-block--${key}`}
            data-block-index={index}
            ref={el => blockRefs.current[index] = el}
          >
            <Component 
              isActive={activeBlock === index} 
              {...props}
            />
          </div>
        ))}
      </div>
      
      {/* Debug info - RIMUOVI IN PRODUZIONE */}
      {process.env.NODE_ENV === 'development' && (
        <div className="scroll-debug">
          <p>Is Scrolling: {isScrolling ? 'YES' : 'NO'}</p>
          <p>Scroll Y: {scrollY}px</p>
          <p>Active Block: {activeBlock}</p>
          <p>Activated Animations: {activatedAnimations.current.size}</p>
        </div>
      )}
    </section>
  );
};

export default AboutSection;