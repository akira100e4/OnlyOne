// src/App.jsx - VERSIONE CORRETTA che rispetta la tua struttura esistente
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import FavoritesPage from './pages/FavoritesPage/FavoritesPage';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
// 🔥 UPDATED: Importa il nuovo ProductDetailPage invece del vecchio ProductDetail
import ProductDetailPage from './pages/ProductsPage/components/ProductDetailPage';
import { FavoritesProvider } from './contexts/FavoritesContext';
import useBrowserTheme from './hooks/useBrowserTheme';
import useFavicon from './hooks/useFavicon';
import './App.css';

function AppContent() {
  const location = useLocation();
  
  // 🎨 Tema per route (background del browser)
  const getBrowserTheme = () => {
    switch (location.pathname) {
      case '/':
        return '#181818'; // Homepage: scuro
      case '/products':
        return '#FAF7F3'; // Products: chiaro
      case '/favorites':
        return '#FAF7F3'; // Favorites: chiaro (stesso di products)
      case '/404':
        return '#FAF7F3'; // 404: chiaro come Products
      default:
        // Per dettaglio prodotto e altre route
        if (location.pathname.startsWith('/product/')) {
          return '#000000'; // 🔥 UPDATED: Product detail nuovo è completamente nero
        }
        return '#FAF7F3'; // Default 404: chiaro
    }
  };
  
  // Applica il meta theme-color dinamico
  useBrowserTheme(getBrowserTheme());
  
  // 🪪 Favicon dinamica light/dark (nera su bianco vs bianca su nero)
  // Aggiungo un query param per forzare l'aggiornamento su Safari.
  useFavicon('/logo/logoweb_light.png?v=2', '/logo/logoweb_dark.png?v=2');
  
  // Debug
  console.log(`🔍 Route: ${location.pathname} → Theme: ${getBrowserTheme()}`);
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        {/* 🔥 UPDATED: Usa il nuovo ProductDetailPage invece del vecchio ProductDetail */}
        <Route path="/product/:id" element={<ProductDetailPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        {/* 🔥 CATCH-ALL ROUTE per 404 - Qualsiasi URL non esistente */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <FavoritesProvider>
      <Router>
        <AppContent />
      </Router>
    </FavoritesProvider>
  );
}

export default App;