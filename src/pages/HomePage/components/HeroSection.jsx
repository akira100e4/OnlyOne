// src/pages/HomePage/components/HeroSection.jsx
import HeroHome from './HeroHome';
import BachecaSection from './BachecaSection';
import AboutSection from './AboutSection';
import HeroNewsletter from './HeroNewsletter';
import ContactSection from './ContactSection';

const HeroSection = () => {
  return (
    <div className="hero-section">
      <HeroHome />
      <BachecaSection />
      <AboutSection />
      <ContactSection />
      <HeroNewsletter />
    </div>
  );
};

export default HeroSection;
