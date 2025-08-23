// src/components/layout/Layout.jsx
import { useState, useEffect, createContext, useContext } from 'react';
import Header from './Header';
import Footer from './Footer';

// Context per condividere lo stato dello scroll con tutti i componenti
const ScrollContext = createContext();

export const useScroll = () => {
  const context = useContext(ScrollContext);
  if (!context) {
    throw new Error('useScroll deve essere usato dentro ScrollProvider');
  }
  return context;
};

const Layout = ({ children, onNavigate, onAppNavigate }) => {
  // State per tracciare posizione scroll e sezione attiva
  const [scrollPosition, setScrollPosition] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Riferimenti alle sezioni per smooth scroll
  const sectionRefs = {
    home: null,
    bacheca: null,
    'chi-siamo': null,
    contatti: null
  };

  // Effetto per tracciare lo scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollPosition(currentScrollY);
      
      // Il logo si rimpicciolisce quando si passa il primo blocco hero
      // Assumiamo che la hero section sia alta almeno 100vh
      const heroHeight = window.innerHeight;
      setIsScrolled(currentScrollY > heroHeight * 0.8); // 80% dell'altezza hero
      
      // Determina sezione attiva basata su scroll position
      updateActiveSection(currentScrollY);
    };

    // Throttle scroll event per performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    
    // Initial call
    handleScroll();

    return () => {
      window.removeEventListener('scroll', throttledScroll);
    };
  }, []);

  // Aggiorna sezione attiva basata su scroll position
  const updateActiveSection = (scrollY) => {
    const sections = ['home', 'bacheca', 'chi-siamo', 'contatti'];
    const windowHeight = window.innerHeight;
    
    // Logica semplificata - può essere raffinata con Intersection Observer
    if (scrollY < windowHeight) {
      setActiveSection('home');
    } else if (scrollY < windowHeight * 2) {
      setActiveSection('bacheca');
    } else if (scrollY < windowHeight * 3) {
      setActiveSection('chi-siamo');
    } else {
      setActiveSection('contatti');
    }
  };

  // Smooth scroll verso sezione specifica
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const offsetTop = element.offsetTop;
      const headerHeight = 80; // Altezza header sticky
      
      window.scrollTo({
        top: offsetTop - headerHeight,
        behavior: 'smooth'
      });
      
      setActiveSection(sectionId);
    }
  };

  // Scroll verso top (home)
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
    setActiveSection('home');
  };

  // Context value da condividere
  const scrollContextValue = {
    scrollPosition,
    isScrolled,
    activeSection,
    scrollToSection,
    scrollToTop,
    sectionRefs
  };

  return (
    <ScrollContext.Provider value={scrollContextValue}>
      <div className="layout-wrapper">
        {/* Header con scroll state */}
        <Header 
          isScrolled={isScrolled}
          activeSection={activeSection}
          onNavigate={scrollToSection}
          onHomeClick={scrollToTop}
          onProductsClick={() => onNavigate && onNavigate('products')}
          onAppNavigate={onAppNavigate}
        />
        
        {/* Main content */}
        <main className="main-content">
          {children}
        </main>
        
        {/* Footer */}
        <Footer />
      </div>
    </ScrollContext.Provider>
  );
};

export default Layout;