// src/pages/HomePage/HomePage.jsx - VERSIONE AGGIORNATA
import Layout from '../../components/layout/Layout';
import HeroSection from './components/HeroSection';
import AboutSection from './components/AboutSection';
import ContactSection from './components/ContactSection';
import useScrollGradient from '../../hooks/useScrollGradient';
import './HomePage.css';

const HomePage = () => {
  // Gradient con transizione molto tardiva - viola appare solo negli ultimi 30% dello scroll
  useScrollGradient();

  return (
    <div className="home-page">
      <Layout>
        <HeroSection />
      </Layout>
      
      {/* Debug panel - rimuovi in produzione */}
      <div className="scroll-debug"></div>
    </div>
  );
};

export default HomePage;