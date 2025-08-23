// src/components/layout/Footer.jsx
import './Footer.css';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const handleNewsletterSubmit = (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    
    // TODO: Implementare logica newsletter
    console.log('Newsletter signup:', email);
    
    // Reset form
    e.target.reset();
    
    // Feedback utente (TODO: implementare toast notification)
    alert('Grazie! Ti aggiorneremo sui nuovi drop settimanali.');
  };

  const socialLinks = [
    { name: 'Instagram', url: '#', logo: '/footer/instagram.svg' },
    { name: 'TikTok', url: '#', logo: '/footer/tiktok.svg' },
    { name: 'Pinterest', url: '#', logo: '/footer/pinterest.svg' }
  ];

  const footerLinks = [
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Termini di Servizio', url: '/terms' },
    { label: 'Spedizioni', url: '/shipping' },
    { label: 'Resi', url: '/returns' }
  ];

  return (
    <footer className="footer">
      <div className="footer__container">  
        {/* Divider */}
        <div className="footer__divider"></div>

        {/* Footer Info */}
        <div className="footer__info">
          
          {/* Brand & Social */}
          <div className="footer__brand">
            <h4 className="footer__brand-name">OnlyOne</h4>
            <p className="footer__brand-tagline">
              The singular style. Every piece, one story, one time.
            </p>
            
            <div className="footer__social">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  className="footer__social-link"
                  aria-label={social.name}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img 
                    src={social.logo} 
                    alt={social.name}
                    width="20"
                    height="20"
                  />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="footer__links">
            <h5 className="footer__links-title">Informazioni</h5>
            <ul className="footer__links-list">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <a href={link.url} className="footer__link">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info - SEZIONE MODIFICATA */}
          <div className="footer__contact">
            <h5 className="footer__contact-title">
              Contatti – <a href="mailto:hello@onlyone.com" className="footer__contact-link">hello@onlyone.com</a>
            </h5>
            <p className="footer__contact-message">
              Che sia un problema, un'idea creativa o una proposta di collaborazione, scrivici: in OnlyOne, tu fai la differenza.
            </p>
          </div>
        </div>

        {/* Copyright */}
        <div className="footer__bottom">
          <p className="footer__copyright">
            © {currentYear} OnlyOne. Tutti i diritti riservati.
          </p>
          <p className="footer__made-with">
            Generato con AI • Creato con passione
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;