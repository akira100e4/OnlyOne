// src/App.jsx - VERSIONE AGGIORNATA con CartPage
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage/HomePage';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import FavoritesPage from './pages/FavoritesPage/FavoritesPage';
import CartPage from './pages/CartPage/CartPage';
import NotFoundPage from './pages/NotFoundPage/NotFoundPage';
import ProductDetailPage from './pages/ProductsPage/components/ProductDetailPage';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { CartProvider } from './contexts/CartContext';
import useBrowserTheme from './hooks/useBrowserTheme';
import useFavicon from './hooks/useFavicon';
import './App.css';

function AppContent() {
  const location = useLocation();
  
  // Tema per route (background del browser)
  const getBrowserTheme = () => {
    switch (location.pathname) {
      case '/':
        return '#181818'; // Homepage: scuro
      case '/products':
        return '#FAF7F3'; // Products: chiaro
      case '/favorites':
        return '#FAF7F3'; // Favorites: chiaro
      case '/cart':
        return '#FAF7F3'; // Cart: chiaro (stesso di products/favorites)
      case '/404':
        return '#FAF7F3'; // 404: chiaro
      default:
        // Per dettaglio prodotto e altre route
        if (location.pathname.startsWith('/product/')) {
          return '#000000'; // Product detail: nero
        }
        return '#FAF7F3'; // Default: chiaro
    }
  };
  
  // Applica il meta theme-color dinamico
  useBrowserTheme(getBrowserTheme());
  
  // Favicon dinamica light/dark
  useFavicon('/logo/logoweb_light.png?v=2', '/logo/logoweb_dark.png?v=2');
  
  // Debug
  console.log(`Route: ${location.pathname} → Theme: ${getBrowserTheme()}`);
  
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/favorites" element={<FavoritesPage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/product/:graphicName" element={<ProductDetailPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        {/* Catch-all route per 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <CartProvider>
      <FavoritesProvider>
        <Router>
          <AppContent />
        </Router>
      </FavoritesProvider>
    </CartProvider>
  );
}

export default App;