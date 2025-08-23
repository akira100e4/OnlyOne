// src/pages/ProductsPage/components/ProductDetailPage.jsx - VERSIONE BACKEND
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ShoppingCart, ArrowLeft, X, Info } from 'lucide-react';
import { useFavoritesContext } from '../../../contexts/FavoritesContext';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavoritesContext();

  // States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [product, setProduct] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [selectedProductType, setSelectedProductType] = useState('tshirt');
  const [selectedColor, setSelectedColor] = useState(null);
  const [selectedSize, setSelectedSize] = useState('M');
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [crossSellChecked, setCrossSellChecked] = useState(false);
  const [crossSellType, setCrossSellType] = useState('hoodie');
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [paymentMethodIndex, setPaymentMethodIndex] = useState(0);
  const [availableColors, setAvailableColors] = useState([]);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);

  // Refs
  const paymentRotationRef = useRef(null);

  // Backend API configuration
  const API_BASE_URL = 'http://localhost:5001/api';

  // Payment methods rotation
  const paymentMethods = ['PayPal', 'Apple Pay', 'Google Pay'];

  // Product types with prices (fallback per prodotti locali)
  const productTypes = [
    { id: 'tshirt', label: 'T-shirt', price: 25 },
    { id: 'hoodie', label: 'Hoodie', price: 35 },
    { id: 'hat', label: 'Hat', price: 20 }
  ];

  // Colors mapping (da Printify)
  const colorMapping = {
    'White': '#FFFFFF',
    'Black': '#000000',
    'Navy': '#000080',
    'Red': '#FF0000',
    'Blue': '#0000FF',
    'Green': '#008000',
    'Orange': '#FFA500',
    'Purple': '#800080',
    'Pink': '#FFC0CB',
    'Grey': '#808080',
    'Gray': '#808080',
    'Yellow': '#FFFF00',
    'Brown': '#A52A2A',
    'Burgundy': '#800020',
    'Kelly': '#4CBB17',
    'Royal': '#4169E1',
    'Military': '#544B3D',
    'Natural': '#F5F5DC',
    'Silver': '#C0C0C0',
    'Asphalt': '#2F4F4F'
  };

  // --- API Calls ---
  const fetchProductDetail = async (productId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/catalog/${productId}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          return null; // Product not found, we'll use fallback
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.product;
    } catch (error) {
      console.error('Error fetching product detail:', error);
      throw error;
    }
  };

  // --- Utility Functions ---
  const testImageExists = (src) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = src;
    });
  };

  const extractColorsFromVariants = (variants) => {
    if (!variants || !Array.isArray(variants)) return [];
    
    const colorMap = new Map();
    
    variants.forEach((variant, index) => {
      if (variant.options) {
        const colorOption = variant.options.find(opt => 
          opt.name?.toLowerCase().includes('color') || 
          opt.name?.toLowerCase().includes('colour')
        );
        
        if (colorOption) {
          const colorName = colorOption.value;
          if (!colorMap.has(colorName)) {
            colorMap.set(colorName, {
              name: colorName,
              hex: colorMapping[colorName] || '#CCCCCC',
              variant: variant,
              image: null // Will be set from main product images
            });
          }
        }
      }
    });
    
    return Array.from(colorMap.values());
  };

  const extractSizesFromVariants = (variants) => {
    if (!variants || !Array.isArray(variants)) return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    
    const sizeSet = new Set();
    
    variants.forEach(variant => {
      if (variant.options) {
        const sizeOption = variant.options.find(opt => 
          opt.name?.toLowerCase().includes('size')
        );
        
        if (sizeOption) {
          sizeSet.add(sizeOption.value);
        }
      }
    });
    
    const sizes = Array.from(sizeSet);
    return sizes.length > 0 ? sizes : ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  };

  const generateDescription = (title) => {
    const cleanTitle = title?.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').trim() || 'Prodotto';
    return `<strong>${cleanTitle} – The Only One</strong>

<p>Una maglia unica, creata una sola volta.</p>
<p>Non appena diventa tua, sparisce per sempre dallo store.</p>
<p>Un design pensato per chi vuole distinguersi e possedere qualcosa che racconta davvero chi sei.</p>
<p>Solo chi sceglie <strong>${cleanTitle}</strong> entra nella storia di OnlyOne.</p>
<p>Un dettaglio che parla di te.</p>
<p>Destinato a restare unico.</p>

<p><strong>The Only One</strong></p>`;
  };

  const findVariantByOptions = useCallback((colorName, sizeName) => {
    if (!product?.variants) return null;
    
    return product.variants.find(variant => {
      const colorMatch = variant.options?.some(opt => 
        opt.name?.toLowerCase().includes('color') && 
        opt.value === colorName
      );
      const sizeMatch = variant.options?.some(opt => 
        opt.name?.toLowerCase().includes('size') && 
        opt.value === sizeName
      );
      
      return colorMatch && sizeMatch;
    });
  }, [product]);

  // --- Load Product Data ---
  useEffect(() => {
    const loadProductData = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log(`🔄 Loading product detail for: ${productId}`);
        
        // Try to fetch from backend first
        let productData = null;
        
        try {
          productData = await fetchProductDetail(productId);
          console.log('✅ Product loaded from backend:', productData);
        } catch (backendError) {
          console.log('⚠️ Backend fetch failed, using fallback:', backendError.message);
        }
        
        if (productData) {
          // Use Printify data
          setProduct(productData);
          
          // Extract colors and sizes from variants
          const colors = extractColorsFromVariants(productData.variants);
          const sizes = extractSizesFromVariants(productData.variants);
          
          setAvailableColors(colors);
          setAvailableSizes(sizes);
          
          // Set initial selections
          if (colors.length > 0) {
            setSelectedColor(colors[0]);
          }
          if (sizes.length > 0 && sizes.includes('M')) {
            setSelectedSize('M');
          } else if (sizes.length > 0) {
            setSelectedSize(sizes[0]);
          }
          
          // Create gallery from product images
          const gallery = (productData.images || []).slice(0, 7).map((imageObj, index) => ({
            id: index,
            src: typeof imageObj === 'string' ? imageObj : imageObj.src,
            alt: `${productData.title} - Image ${index + 1}`,
            color: colors[index]?.name || 'Default'
          }));
          
          // If no product images, use main image
          if (gallery.length === 0 && productData.image) {
            gallery.push({
              id: 0,
              src: productData.image,
              alt: productData.title,
              color: 'Default'
            });
          }
          
          setGalleryImages(gallery);
          
        } else {
          // Fallback to local data
          console.log('🔄 Using local fallback for product');
          
          const normalizedTitle = productId
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
          
          const possibleImages = [
            `/prodotti/${normalizedTitle}.png`,
            `/products/${normalizedTitle}.png`,
            `/prodotti/${productId}.png`,
            `/products/${productId}.png`,
            `/prodotti/${productId.replace(/-/g, '_')}.png`,
            `/products/${productId.replace(/-/g, '_')}.png`,
          ];

          let workingImage = possibleImages[0];
          for (const imagePath of possibleImages) {
            const exists = await testImageExists(imagePath);
            if (exists) {
              workingImage = imagePath;
              console.log(`✅ Working image found: ${imagePath}`);
              break;
            }
          }

          const fallbackProduct = {
            id: productId,
            printifyId: null,
            title: normalizedTitle,
            description: generateDescription(normalizedTitle),
            image: workingImage,
            images: [workingImage],
            price: { min: 25.00, max: 35.00, currency: 'EUR' },
            variants: [],
            status: 'local'
          };
          
          setProduct(fallbackProduct);
          
          // Default colors and sizes for fallback
          setAvailableColors([
            { name: 'White', hex: '#FFFFFF', variant: null, image: workingImage },
            { name: 'Black', hex: '#000000', variant: null, image: workingImage },
            { name: 'Navy', hex: '#000080', variant: null, image: workingImage },
          ]);
          setAvailableSizes(['XS', 'S', 'M', 'L', 'XL', 'XXL']);
          setSelectedColor({ name: 'White', hex: '#FFFFFF', variant: null, image: workingImage });
          
          const gallery = Array.from({ length: 3 }, (_, index) => ({
            id: index,
            src: workingImage,
            alt: fallbackProduct.title,
            color: ['White', 'Black', 'Navy'][index]
          }));
          setGalleryImages(gallery);
        }

      } catch (err) {
        console.error('Error loading product:', err);
        setError('Errore nel caricamento del prodotto');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      loadProductData();
    }
  }, [productId]);

  // Update selected variant when color/size change
  useEffect(() => {
    if (selectedColor && selectedSize) {
      const variant = findVariantByOptions(selectedColor.name, selectedSize);
      setSelectedVariant(variant);
    }
  }, [selectedColor, selectedSize, findVariantByOptions]);

  // Payment methods rotation
  useEffect(() => {
    paymentRotationRef.current = setInterval(() => {
      setPaymentMethodIndex(prev => (prev + 1) % paymentMethods.length);
    }, 6000);

    return () => {
      if (paymentRotationRef.current) {
        clearInterval(paymentRotationRef.current);
      }
    };
  }, []);

  // --- Event Handlers ---
  const getCurrentPrice = useCallback(() => {
    if (selectedVariant && selectedVariant.price) {
      return parseFloat(selectedVariant.price);
    }
    if (product?.price?.min) {
      return product.price.min;
    }
    const productType = productTypes.find(type => type.id === selectedProductType);
    return productType ? productType.price : 25;
  }, [selectedProductType, selectedVariant, product]);

  const handleImageChange = useCallback((index) => {
    setCurrentImageIndex(index);
    if (availableColors[index]) {
      setSelectedColor(availableColors[index]);
    }
  }, [availableColors]);

  const handleColorSelect = useCallback((color) => {
    setSelectedColor(color);
    const colorIndex = availableColors.findIndex(c => c.name === color.name);
    if (colorIndex !== -1) {
      setCurrentImageIndex(colorIndex);
    }
  }, [availableColors]);

  const handleProductTypeChange = useCallback((typeId) => {
    setSelectedProductType(typeId);
    
    if (typeId === 'hat') {
      setCrossSellType('hoodie');
    } else if (typeId === 'hoodie') {
      setCrossSellType('tshirt');
    } else {
      setCrossSellType('hat');
    }
  }, []);

  const handleCrossSellTypeToggle = useCallback(() => {
    if (selectedProductType === 'hat') {
      setCrossSellType(prev => prev === 'hoodie' ? 'tshirt' : 'hoodie');
    } else {
      setCrossSellType(prev => prev === 'hat' ? 'tshirt' : 'hat');
    }
  }, [selectedProductType]);

  const handleFavoriteToggle = useCallback(() => {
    toggleFavorite(productId);
  }, [productId, toggleFavorite]);

  const handleAddToCart = useCallback(() => {
    const cartItem = {
      productId: product.printifyId || productId,
      localProductId: productId,
      title: product.title,
      type: selectedProductType,
      color: selectedColor?.name,
      size: selectedSize,
      price: getCurrentPrice(),
      image: galleryImages[currentImageIndex]?.src || product.image,
      variant: selectedVariant,
      crossSell: crossSellChecked ? {
        type: crossSellType,
        price: productTypes.find(pt => pt.id === crossSellType)?.price || 20
      } : null
    };
    
    console.log('Adding to cart:', cartItem);
    
    // TODO: Implement actual cart functionality
    alert(`Prodotto aggiunto al carrello!\n\nProdotto: ${cartItem.title}\nColore: ${cartItem.color}\nTaglia: ${cartItem.size}\nPrezzo: €${cartItem.price}`);
  }, [productId, product, selectedProductType, selectedColor, selectedSize, getCurrentPrice, galleryImages, currentImageIndex, selectedVariant, crossSellChecked, crossSellType]);

  // --- Error State ---
  if (error) {
    return (
      <div className="product-detail-page">
        <div className="error-container">
          <div className="error-content">
            <h3>⚠️ Errore di caricamento</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={() => navigate(-1)} className="back-button">
                <ArrowLeft size={20} />
                Torna indietro
              </button>
              <button onClick={() => window.location.reload()} className="retry-button">
                🔄 Riprova
              </button>
            </div>
            <div className="error-debug">
              <p><strong>Debug info:</strong></p>
              <ul>
                <li>Product ID: {productId}</li>
                <li>Backend URL: {API_BASE_URL}</li>
                <li>Verifica che il backend sia attivo sulla porta 5001</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Loading State ---
  if (loading) {
    return (
      <div className="product-detail-page">
        <div className="loading-container">
          <div className="loading-content">
            <div className="loading-logo">
              <img src="/logo/logo_white.svg" alt="OnlyOne" className="loading-logo-img" />
            </div>
            <p className="loading-text">Caricamento prodotto...</p>
            <p className="loading-subtext">ID: {productId}</p>
          </div>
        </div>
      </div>
    );
  }

  // --- No Product ---
  if (!product) {
    return (
      <div className="product-detail-page">
        <div className="error-container">
          <div className="error-content">
            <h3>Prodotto non trovato</h3>
            <p>Il prodotto richiesto non esiste o non è più disponibile.</p>
            <button onClick={() => navigate('/products')} className="back-button">
              <ArrowLeft size={20} />
              Torna al catalogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Render ---
  return (
    <div className="product-detail-page">
      {/* Header */}
      <header className="product-detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={24} />
        </button>
        <h1 className="page-title">Dettaglio Prodotto</h1>
        <button 
          onClick={handleFavoriteToggle}
          className={`favorite-button ${isFavorite(productId) ? 'active' : ''}`}
        >
          <Heart size={24} />
        </button>
      </header>

      {/* Backend Status */}
      <div className="backend-status-detail">
        <span className="status-dot">🟢</span>
        <span>
          {product.status === 'local' ? 'Modalità locale' : 'Caricato da Printify'}
          {product.printifyId && ` (ID: ${product.printifyId})`}
        </span>
      </div>

      {/* Product Gallery */}
      <div className="product-gallery">
        <div className="main-image-container">
          <img
            src={galleryImages[currentImageIndex]?.src || product.image}
            alt={product.title}
            className="main-image"
            onError={(e) => {
              e.target.src = '/products/placeholder.png';
            }}
          />
          
          {product.status === 'publishing' && (
            <div className="status-badge publishing">
              ⏳ In Pubblicazione
            </div>
          )}
        </div>

        {galleryImages.length > 1 && (
          <div className="image-thumbnails">
            {galleryImages.map((img, index) => (
              <button
                key={img.id}
                className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => handleImageChange(index)}
              >
                <img src={img.src} alt={img.alt} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="product-info">
        <h2 className="product-title">{product.title}</h2>
        
        <div className="product-price">
          <span className="current-price">€{getCurrentPrice().toFixed(2)}</span>
          {product.variants && product.variants.length > 1 && (
            <span className="price-note">
              ({product.variants.length} varianti disponibili)
            </span>
          )}
        </div>

        {/* Color Selection */}
        {availableColors.length > 0 && (
          <div className="color-selection">
            <h3>Colore: <span className="selected-color">{selectedColor?.name}</span></h3>
            <div className="color-swatches">
              {availableColors.map((color) => (
                <button
                  key={color.name}
                  className={`color-swatch ${selectedColor?.name === color.name ? 'active' : ''}`}
                  style={{ backgroundColor: color.hex }}
                  onClick={() => handleColorSelect(color)}
                  title={color.name}
                >
                  {selectedColor?.name === color.name && (
                    <span className="checkmark">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Size Selection */}
        {availableSizes.length > 0 && (
          <div className="size-selection">
            <div className="size-header">
              <h3>Taglia: <span className="selected-size">{selectedSize}</span></h3>
              <button 
                onClick={() => setShowSizeGuide(true)}
                className="size-guide-button"
              >
                <Info size={16} />
                Guida taglie
              </button>
            </div>
            <div className="size-options">
              {availableSizes.map((size) => (
                <button
                  key={size}
                  className={`size-option ${selectedSize === size ? 'active' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Product Description */}
        <div className="product-description">
          <h3>Descrizione</h3>
          <div 
            className="description-content"
            dangerouslySetInnerHTML={{
              __html: product.description || generateDescription(product.title)
            }}
          />
        </div>

        {/* Add to Cart */}
        <div className="add-to-cart-section">
          <button 
            onClick={handleAddToCart}
            className="add-to-cart-button"
            disabled={!selectedColor || !selectedSize}
          >
            <ShoppingCart size={20} />
            Aggiungi al Carrello - €{getCurrentPrice().toFixed(2)}
          </button>
          
          <div className="payment-info">
            <span className="payment-text">Pagamento sicuro con</span>
            <span className="payment-method">{paymentMethods[paymentMethodIndex]}</span>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="modal-overlay" onClick={() => setShowSizeGuide(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Guida alle Taglie</h3>
              <button onClick={() => setShowSizeGuide(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="size-guide-content">
              <table>
                <thead>
                  <tr>
                    <th>Taglia</th>
                    <th>Petto (cm)</th>
                    <th>Vita (cm)</th>
                    <th>Spalle (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>XS</td><td>86-91</td><td>76-81</td><td>41</td></tr>
                  <tr><td>S</td><td>91-96</td><td>81-86</td><td>44</td></tr>
                  <tr><td>M</td><td>96-101</td><td>86-91</td><td>47</td></tr>
                  <tr><td>L</td><td>101-106</td><td>91-96</td><td>50</td></tr>
                  <tr><td>XL</td><td>106-111</td><td>96-101</td><td>53</td></tr>
                  <tr><td>XXL</td><td>111-116</td><td>101-106</td><td>56</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetailPage;