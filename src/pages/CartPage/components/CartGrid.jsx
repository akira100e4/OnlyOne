// src/pages/CartPage/components/CartGrid.jsx
import React, { useState } from 'react';
import { Trash2, Heart, ExternalLink } from 'lucide-react';
import { useCart } from '../../../hooks/useCart';
import { useFavoritesContext } from '../../../contexts/FavoritesContext';
import './CartGrid.css';

const CartGrid = () => {
  const { items, removeItem, loading } = useCart();
  const { toggleFavorite, isFavorite } = useFavoritesContext();
  const [removingItems, setRemovingItems] = useState(new Set());

  // Format price helper
 const formatPrice = (price) => {
  // Converti da centesimi a euro prima della formattazione
  const priceInEuro = price / 100;
  return new Intl.NumberFormat('it-IT', {
    style: 'currency',
    currency: 'EUR'
  }).format(priceInEuro);
};

  // Handle remove item with loading state
  const handleRemoveItem = async (item) => {
    try {
      const confirmed = window.confirm(
        `Rimuovere "${item.productTitle}" dal carrello?`
      );
      
      if (!confirmed) return;

      // Add to removing set for visual feedback
      setRemovingItems(prev => new Set(prev).add(item.id));

      await removeItem(item.id);
      
      console.log('Item removed from cart:', item.id);

    } catch (error) {
      console.error('Remove item error:', error);
      alert('Errore durante la rimozione dell\'articolo');
    } finally {
      // Remove from removing set
      setRemovingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(item.id);
        return newSet;
      });
    }
  };

  // Handle favorite toggle
  const handleFavoriteToggle = (item, e) => {
    e.stopPropagation();
    
    // Extract graphic name from productId for favorites
    const productId = item.productId;
    toggleFavorite(productId);
    
    console.log('Favorite toggled for cart item:', productId);
  };

  // Handle item click (navigate to product)
  const handleItemClick = (item) => {
    // Extract graphic name from productId for navigation
    const graphicName = item.productId.replace(/_\w+$/, ''); // Remove type suffix
    
    // Navigate to product detail
    window.location.href = `/product/${encodeURIComponent(graphicName)}`;
  };

  // Get placeholder image
  const getPlaceholderImage = (item) => {
    // Try to extract graphic name and find local image
    const graphicName = item.productId.replace(/_\w+$/, '');
    const localImage = `/prodotti/${graphicName}.png`;
    
    return localImage;
  };

  // Handle image error
  const handleImageError = (e, item) => {
    console.log('Image failed to load for item:', item.productTitle);
    
    // Set fallback placeholder
    e.target.src = 'data:image/svg+xml,' + encodeURIComponent(`
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="#f5f5f5"/>
        <text x="100" y="100" text-anchor="middle" dy=".3em" font-family="Arial" font-size="14" fill="#999">
          ${item.productTitle}
        </text>
      </svg>
    `);
  };

  if (items.length === 0) {
    return null; // Parent component handles empty state
  }

  return (
    <div className="cart-grid">
      {items.map((item) => {
        const isRemoving = removingItems.has(item.id);
        const isFav = isFavorite(item.productId);
        
        return (
          <div
            key={item.id}
            className={`cart-item ${isRemoving ? 'cart-item--removing' : ''}`}
            onClick={() => !isRemoving && handleItemClick(item)}
          >
            
            {/* Image */}
            <div className="cart-item__image">
              <img
                src={item.imageUrl || getPlaceholderImage(item)}
                alt={item.productTitle}
                onError={(e) => handleImageError(e, item)}
              />
              
              {/* Favorite heart */}
              <button
                className={`cart-item__favorite ${isFav ? 'active' : ''}`}
                onClick={(e) => handleFavoriteToggle(item, e)}
                title={isFav ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
              >
                <Heart size={16} />
              </button>

              {/* External link icon */}
              <div className="cart-item__external">
                <ExternalLink size={14} />
              </div>
            </div>

            {/* Info */}
            <div className="cart-item__info">
              <h4 className="cart-item__title">{item.productTitle}</h4>
              
              {item.variantTitle && (
                <p className="cart-item__variant">{item.variantTitle}</p>
              )}
              
              {item.crossSell && (
                <span className="cart-item__badge">Cross-sell</span>
              )}
              
              <div className="cart-item__price">
                {formatPrice(item.pricePerItem)}
              </div>
            </div>

            {/* Actions */}
            <div className="cart-item__actions">
              <button
                className="cart-item__remove"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveItem(item);
                }}
                disabled={isRemoving}
                title="Rimuovi dal carrello"
              >
                {isRemoving ? (
                  <div className="mini-spinner"></div>
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            </div>

          </div>
        );
      })}
    </div>
  );
};

export default CartGrid;