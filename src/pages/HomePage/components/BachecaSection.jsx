// src/pages/HomePage/components/BachecaSection.jsx
import { useState, useEffect } from 'react';
import './BachecaSection.css';

const BachecaSection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Funzione per rilevare automaticamente tutte le immagini in /public/products/
  const detectAllProductImages = async () => {
    const detectedProducts = [];
    let productId = 1;

    // Pattern di nomi file da testare
    const filePatterns = [
      // File numerici
      ...Array.from({length: 50}, (_, i) => `${i + 1}.png`),
      ...Array.from({length: 50}, (_, i) => `${i + 1}.jpg`),
      ...Array.from({length: 50}, (_, i) => `${i + 1}.jpeg`),
      
      // File con nomi comuni
      'Monarch.png', 'anchor.png', 'capricorno.png', 'dragon.png', 'frafalla.png', 'japan.png', 'lion.png', 
      'photo.png', 'photo.jpg', 'product.png', 'product.jpg',
      'hero.png', 'hero.jpg', 'primary.png', 'primary.jpg',
      'index.png', 'index.jpg', 'default.png', 'default.jpg',
      
      // Altri pattern
      '1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png',
      'img1.png', 'img2.png', 'img3.png', 'img4.png', 'img5.png'
    ];

    // Testa ogni possibile file nella directory products
    for (const fileName of filePatterns) {
      try {
        const imagePath = `/products/${fileName}`;
        
        // Verifica se l'immagine esiste provando a caricarla
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = imagePath;
        });
        
        // Se arriviamo qui, l'immagine esiste
        const title = fileName.split('.')[0]; // Nome file senza estensione
        const formattedTitle = title.charAt(0).toUpperCase() + title.slice(1); // Prima lettera maiuscola
        
        detectedProducts.push({
          id: productId++,
          image: imagePath,
          title: formattedTitle,
          price: "Dominio. Silenzio. Potenza. Solo per chi guida, non segue"
        });
        
        console.log(`✅ Trovata immagine: ${fileName}`);
        
      } catch (error) {
        // Immagine non trovata, continua con il prossimo
        continue;
      }
    }
    
    return detectedProducts;
  };

  // Carica tutte le immagini al mount del componente
  useEffect(() => {
    const loadAllProducts = async () => {
      setLoading(true);
      
      try {
        const allProducts = await detectAllProductImages();
        
        if (allProducts.length === 0) {
          // Fallback se non trova nessuna immagine
          console.warn('⚠️ Nessuna immagine trovata, uso fallback');
          setProducts([
            {
              id: 1,
              image: '/products/1.png',
              title: 'Product 1',
              price: "Dominio. Silenzio. Potenza. Solo per chi guida, non segue"
            }
          ]);
        } else {
          setProducts(allProducts);
          console.log(`🎯 Caricati ${allProducts.length} prodotti automaticamente`);
        }
        
      } catch (error) {
        console.error('❌ Errore nel caricamento automatico:', error);
        // Fallback di emergenza
        setProducts([
          {
            id: 1,
            image: '/products/1.png',
            title: 'Default Product',
            price: "Dominio. Silenzio. Potenza. Solo per chi guida, non segue"
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadAllProducts();
  }, []);

  // Loading state
  if (loading) {
    return (
      <section id="bacheca" className="hero-bacheca">
        <div className="hero-container">
          <h1 className="hero-title">I Nostri Prodotti Esclusivi</h1>
          <div className="loading-grid">
            <p style={{ color: 'var(--light-cream)', textAlign: 'center' }}>
              Rilevazione prodotti automatica...
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="bacheca" className="hero-bacheca">
      <div className="hero-container">
        <h1 className="hero-title">I Nostri Prodotti Esclusivi</h1>
        
        <div className="carousel-container">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="carousel-card"
            >
              <div className="card-image-container">
                <img 
                  src={product.image} 
                  alt={product.title}
                  className="card-image"
                  onError={(e) => {
                    console.error(`❌ Errore caricamento immagine: ${product.image}`);
                    // Fallback in caso di errore
                    e.target.src = '/products/placeholder.png';
                  }}
                />
                <div className="card-overlay">
                  <div className="card-content">
                    <h3 className="card-title">{product.title}</h3>
                    <p className="card-price">{product.price}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BachecaSection;