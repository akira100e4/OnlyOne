import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Heart, ShoppingCart, X, Info, Target } from 'lucide-react';
import { useFavoritesContext } from '../../../contexts/FavoritesContext';
import { useCart } from '../../../hooks/useCart';
import SizeFinderModal from './SizeFinderModal';
import { SIZE_CHART_TSHIRT, findSizeIdByLabel, findBestAvailableSizeId } from '../../../utils/sizing';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  const { graphicName } = useParams();
  const navigate = useNavigate();
  const { toggleFavorite, isFavorite } = useFavoritesContext();
  
  // Hook carrello
  const { 
    addFromProductDetail, 
    hasItem, 
    loading: cartLoading,
    error: cartError,
    clearError,
    count: cartCount
  } = useCart();

  // States principali
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [productModels, setProductModels] = useState({}); // {tshirt: {...}, sweatshirt: {...}}
  const [availableTypes, setAvailableTypes] = useState([]); // ['tshirt', 'sweatshirt']
  
  // Stati di selezione
  const [selectedType, setSelectedType] = useState('tshirt');
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Stati UI
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showSizeFinder, setShowSizeFinder] = useState(false);
  const [crossSellChecked, setCrossSellChecked] = useState(false);
  const [paymentMethodIndex, setPaymentMethodIndex] = useState(0);

  // Configurazioni
  const API_BASE_URL = 'http://localhost:5001/api';
  const paymentMethods = ['PayPal', 'Apple Pay', 'Google Pay'];
  
  // Color mapping per swatch (espanso con i colori del prodotto)
  const colorMapping = {
    'White': '#FFFFFF',
    'Arctic White': '#FFFFFF', 
    'Black': '#000000',
    'Jet Black': '#000000',
    'Navy': '#000080',
    'Oxford Navy': '#000080',
    'Red': '#FF0000',
    'Fire Red': '#FF0000',
    'Blue': '#0000FF',
    'Royal Blue': '#4169E1',
    'Sky Blue': '#87CEEB',
    'Green': '#008000',
    'Kelly Green': '#4CBB17',
    'Bottle Green': '#006A4E',
    'Orange': '#FFA500',
    'Purple': '#800080',
    'Pink': '#FFC0CB',
    'Grey': '#808080',
    'Gray': '#808080',
    'Heather Grey': '#999999',
    'Yellow': '#FFFF00',
    'Brown': '#A52A2A',
    'Hot Chocolate': '#D2691E',
    'Burgundy': '#800020',
    'Military': '#544B3D',
    'Natural': '#F5F5DC',
    'Silver': '#C0C0C0',
    'Asphalt': '#2F4F4F'
  };

  // --- UTILITY FUNCTIONS ---
  const normalize = (s) => s.toLowerCase().replace(/[_\-]/g, ' ').replace(/\s+/g, ' ').trim();
  
  const getGraphicWords = (graphicName) => {
    return normalize(graphicName)
      .split(' ')
      .filter(w => w.length > 2 && !['la','le','il','delle','degli','del','di','da','in','con','per','tra','fra'].includes(w));
  };

  // Utility per ricostruire opzioni da varianti
  const slug = (s) =>
    String(s || '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const isSizeLabel = (s) =>
    /\b(XXS|XS|S|M|L|XL|2XL|3XL|4XL|5XL|One Size|Taglia Unica|Unica|Youth|Kid|Women|Men|\d{2}(?:cm|in)?)\b/i.test(String(s || ''));

  // Utility per parsing titolo variante
  const splitVariantTitle = (title) => {
    if (typeof title !== 'string') return { color: null, size: null };
    const parts = title.split(/\s*\/\s*/).map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) return { color: parts[0], size: parts[1] };
    return { color: parts[0] || null, size: null };
  };

  const isMatch = (title, words) => {
    const t = normalize(title);
    const hits = words.filter(w => t.includes(w));
    return hits.length >= 1; // Abbassato da 2 a 1 per essere più permissivo
  };

  // valuta PRIMA felpa/sweatshirt, POI t-shirt
  const isSweatshirt = (title = '') =>
    /(^|[\s\-_])(sweat[\s\-_]?shirt|felpa)(?=$|[\s\-_])/i.test(title);

  const isTshirt = (title = '') =>
    /(^|[\s\-_])t[\s\-_]?shirt(?=$|[\s\-_])/i.test(title);

  const getProductType = (title = '') => {
    if (isSweatshirt(title)) return 'sweatshirt'; // controlla prima le felpe
    if (isTshirt(title)) return 'tshirt';
    return 'other';
  };

  const getColorHex = (colorName) => {
    return colorMapping[colorName] || '#CCCCCC';
  };

  const formatPrice = (price) => {
    return (price / 100).toFixed(2);
  };

  const getCleanTitle = (graphicName) => {
    return normalize(graphicName)
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Calcola prezzo minimo felpa
  const getSweatshirtMinPrice = () => {
    const sweatshirtModel = productModels['sweatshirt'];
    if (sweatshirtModel?.price?.min) {
      return formatPrice(sweatshirtModel.price.min);
    }
    return '30.00'; // Fallback
  };

  // Calcola prezzo totale
  const getTotalPrice = () => {
    const basePrice = parseFloat(getCurrentPrice());
    if (crossSellChecked) {
      const sweatshirtPrice = parseFloat(getSweatshirtMinPrice());
      return (basePrice + sweatshirtPrice).toFixed(2);
    }
    return basePrice.toFixed(2);
  };

  // Ottieni nome colore selezionato
  const getSelectedColorName = () => {
    if (!selectedColorId || !getCurrentModel()?.availableColors) return '';
    const color = getCurrentModel().availableColors.find(c => c.id === selectedColorId);
    return color?.title || '';
  };

  // --- VARIANTS / FILTER HELPERS --------------------------------------------

  // Varianti che appartengono a un certo colore
  const getVariantsByColor = (model, colorId) => {
    if (!model?.variants || model.colorOptionIndex < 0) return [];
    return model.variants.filter(v => v.options?.[model.colorOptionIndex] === colorId && v.is_enabled);
  };

  // Taglie disponibili (con stock) per un certo colore
  const getAvailableSizesForColor = (model, colorId) => {
    const byColor = getVariantsByColor(model, colorId).filter(v => v.is_available);
    const set = new Set(byColor.map(v => v.options?.[model.sizeOptionIndex]));
    return Array.from(set); // array di sizeId
  };

  // Il colore ha almeno una variante disponibile?
  const colorHasStock = (model, colorId) => {
    return getVariantsByColor(model, colorId).some(v => v.is_available);
  };

  // Immagini per un colore: usa le immagini legate alle varianti di quel colore
  const getImagesForColor = (model, colorId) => {
    if (!model) return [];
    const byColor = getVariantsByColor(model, colorId);
    const ids = new Set(byColor.map(v => v.id));

    const imgs = (model.images || []).filter(img =>
      Array.isArray(img.variant_ids) && img.variant_ids.some(id => ids.has(id))
    );

    if (imgs.length) return imgs;

    // fallback: front/back
    const fb = (model.images || []).filter(img => img.position === 'front' || img.position === 'back');
    if (fb.length) return fb;

    // fallback finale
    return model.images || [];
  };

  // searchProducts ottimizzata (sostituisce fetchCatalog)
  const searchProducts = async (graphicName) => {
    try {
      const query = encodeURIComponent(graphicName.trim());
      
      // Usa il nuovo endpoint ultra-veloce
      const response = await fetch(`${API_BASE_URL}/catalog/search?q=${query}&limit=15&fast=true`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      console.log('Search results:', {
        query: data.search?.query,
        matches: data.search?.totalMatches,
        strategy: data.search?.strategy,
        returned: data.products?.length
      });
      
      return data.products || [];
      
    } catch (error) {
      console.error('Search products error:', error);
      throw error;
    }
  };

  // --- DATA PROCESSING - SEMPLIFICATA ---
  const processSearchResults = (searchResults, graphicWords) => {
    console.log('Processing search results for graphic:', graphicName);
    console.log('Search results count:', searchResults.length);

    const models = {};
    const availableTypes = [];

    // I prodotti sono già filtrati dal backend, processiamo direttamente
    for (const product of searchResults) {
      const type = getProductType(product.title);
      console.log(`Product "${product.title}" -> type: ${type}`);
      
      if ((type === 'tshirt' || type === 'sweatshirt') && !models[type]) {
        models[type] = processProductModel(product);
        availableTypes.push(type);
        console.log(`Added ${type} model from "${product.title}"`);
      }
      
      if (availableTypes.length === 2) break; // T-shirt e felpa trovate
    }

    console.log('Final available types:', availableTypes);
    return { models, availableTypes };
  };

  const processProductModel = (product) => {
    console.log('Processing product model:', product.title);

    const variants = Array.isArray(product?.variants) ? product.variants : [];
    const rawOpts  = Array.isArray(product?.options)  ? product.options  : [];

    // 1) Prova con options se presenti (nomi flessibili)
    let colorOptionIndex = rawOpts.findIndex(o => /color|colour|colore/i.test(o?.name || ''));
    let sizeOptionIndex  = rawOpts.findIndex(o => /size|sizes|taglia|taglie/i.test(o?.name || ''));

    let availableColors = [];
    let availableSizes  = [];

    if (rawOpts.length && colorOptionIndex !== -1 && sizeOptionIndex !== -1) {
      availableColors = rawOpts[colorOptionIndex]?.values || [];
      availableSizes  = rawOpts[sizeOptionIndex]?.values  || [];
      console.log('Using native options from product.options');
    } else {
      // 2) Fallback: ricostruisci da variants
      console.warn('product.options missing — rebuilding from variants');
      const colorMap = new Map();
      const sizeMap  = new Map();

      for (const v of variants) {
        if (!Array.isArray(v.options) || v.options.length < 2) continue;
        const [cId, sId] = v.options;
        const { color, size } = splitVariantTitle(v.title);
        if (cId != null && color && !colorMap.has(cId)) colorMap.set(cId, { id: cId, title: color });
        if (sId != null && size  && !sizeMap.has(sId))  sizeMap.set(sId,  { id: sId,  title: size  });
      }

      availableColors = [...colorMap.values()];
      availableSizes  = [...sizeMap.values()];

      // Indici coerenti con v.options
      colorOptionIndex = 0;
      sizeOptionIndex  = 1;
    }

    console.log('Color option index:', colorOptionIndex);
    console.log('Size option index:',  sizeOptionIndex);
    console.log('Available colors:', availableColors.map(c => c.title));
    console.log('Available sizes:',  availableSizes.map(s => s.title));

    return {
      ...product,
      colorOptionIndex,
      sizeOptionIndex,
      availableColors,
      availableSizes,
    };
  };

  const findVariant = (productModel, colorId, sizeId) => {
    if (!productModel || !productModel.variants) return null;

    return productModel.variants.find(variant => {
      if (!variant.options || variant.options.length < 2) return false;
      
      const variantColorId = variant.options[productModel.colorOptionIndex];
      const variantSizeId = variant.options[productModel.sizeOptionIndex];
      
      return variantColorId === colorId && variantSizeId === sizeId;
    });
  };

  const getVariantImages = (productModel, variant) => {
    if (!productModel || !variant) return productModel?.images || [];

    // 1. Cerca immagini specifiche per la variant
    const variantImages = productModel.images?.filter(img => 
      img.variant_ids && img.variant_ids.includes(variant.id)
    ) || [];

    if (variantImages.length > 0) {
      console.log('Found variant-specific images:', variantImages.length);
      return variantImages;
    }

    // 2. Fallback a immagini front/back
    const frontBackImages = productModel.images?.filter(img => 
      img.position === 'front' || img.position === 'back'
    ) || [];

    if (frontBackImages.length > 0) {
      console.log('Using front/back images:', frontBackImages.length);
      return frontBackImages;
    }

    // 3. Fallback a tutte le immagini
    console.log('Using all images:', productModel.images?.length || 0);
    return productModel.images || [];
  };

  // --- EFFECTS - OTTIMIZZATI ---
  useEffect(() => {
    const loadProductData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Loading product data for:', graphicName);
        // STRATEGIA UNICA: Solo ricerca ottimizzata, NO fallback
        console.log('Using optimized search (no fallback)...');
        const searchResults = await searchProducts(graphicName);
        
        if (searchResults.length === 0) {
          setError(`Nessun prodotto trovato per "${graphicName}". Prova con un altro termine.`);
          return;
        }
        // Processa i risultati della ricerca
        const graphicWords = getGraphicWords(graphicName);
        const { models, availableTypes } = processSearchResults(searchResults, graphicWords);
        if (availableTypes.length === 0) {
          setError(`Prodotti trovati ma nessun tipo compatibile per "${graphicName}"`);
          return;
        }
        // Set states
        setProductModels(models);
        setAvailableTypes(availableTypes);
        
        // Set initial type
        const initialType = availableTypes.includes('tshirt') ? 'tshirt' : availableTypes[0];
        setSelectedType(initialType);
        console.log(`Product data loaded: ${availableTypes.length} types, ${searchResults.length} products`);
      } catch (error) {
        console.error('Error loading product data:', error);
        
        // Errore più descrittivo
        if (error.message.includes('fetch')) {
          setError('Errore di connessione. Controlla la connessione internet.');
        } else if (error.message.includes('404')) {
          setError(`Prodotto "${graphicName}" non trovato nel catalogo.`);
        } else {
          setError(`Errore nel caricamento: ${error.message}`);
        }
      } finally {
        setLoading(false);
      }
    };
    if (graphicName) {
      loadProductData();
    }
  }, [graphicName]);

  // Effect per aggiornare selezioni quando cambia il tipo
  useEffect(() => {
    const model = productModels[selectedType];
    if (!model) return;

    // primo colore che ha stock
    const firstColorWithStock = (model.availableColors || [])
      .map(c => c.id)
      .find(cid => colorHasStock(model, cid)) || model.availableColors?.[0]?.id || null;

    if (firstColorWithStock && selectedColorId !== firstColorWithStock) {
      setSelectedColorId(firstColorWithStock);
    }

    if (firstColorWithStock) {
      const enabledSizes = getAvailableSizesForColor(model, firstColorWithStock);
      const firstSize = enabledSizes[0] || model.availableSizes?.[0]?.id || null;
      if (firstSize && selectedSizeId !== firstSize) {
        setSelectedSizeId(firstSize);
      }
    }
  }, [selectedType, productModels]);

  // Effect per aggiornare variant quando cambiano colore/taglia
  useEffect(() => {
    const model = productModels[selectedType];
    if (!model || !selectedColorId || !selectedSizeId) {
      setSelectedVariant(null);
      return;
    }
    const variant = findVariant(model, selectedColorId, selectedSizeId);
    setSelectedVariant(variant || null);
    setCurrentImageIndex(0);
  }, [selectedType, selectedColorId, selectedSizeId, productModels]);

  // Payment method rotation
  useEffect(() => {
    const interval = setInterval(() => {
      setPaymentMethodIndex((prev) => (prev + 1) % paymentMethods.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // --- EVENT HANDLERS ---
  const handleTypeChange = useCallback((type) => {
    setSelectedType(type);
    setSelectedColorId(null);
    setSelectedSizeId(null);
    setSelectedVariant(null);
    setCurrentImageIndex(0);
  }, []);

  const handleColorChange = useCallback((colorId) => {
    setSelectedColorId(colorId);
    setCurrentImageIndex(0);

    const model = productModels[selectedType];
    if (!model) return;

    const enabledSizes = getAvailableSizesForColor(model, colorId);
    const firstSize = enabledSizes[0] || null;
    setSelectedSizeId(firstSize);

    if (firstSize) {
      const v = findVariant(model, colorId, firstSize);
      setSelectedVariant(v || null);
    } else {
      setSelectedVariant(null);
    }
  }, [productModels, selectedType]);

  const handleSizeChange = useCallback((sizeId) => {
    setSelectedSizeId(sizeId);
    const model = productModels[selectedType];
    if (!model || !selectedColorId) return;
    const v = findVariant(model, selectedColorId, sizeId);
    setSelectedVariant(v || null);
  }, [productModels, selectedType, selectedColorId]);

  const handleImageChange = useCallback((index) => {
    setCurrentImageIndex(index);
  }, []);

  // SIZE FINDER HANDLERS
  const handleSizeFinderOpen = useCallback(() => {
    console.log('sizeFinder_open', { product: graphicName, type: selectedType });
    setShowSizeFinder(true);
  }, [graphicName, selectedType]);

  const handleSizeFinderClose = useCallback(() => {
    setShowSizeFinder(false);
  }, []);

  const handleSizeFinderApply = useCallback((recommendation) => {
    console.log('Size Finder recommendation received:', recommendation);
    
    const currentModel = productModels[selectedType];
    if (!currentModel || !selectedColorId) {
      console.warn('No current model or color selected');
      return;
    }

    // 1. Trova l'ID della taglia primaria
    const primarySizeId = findSizeIdByLabel(currentModel, recommendation.size);
    
    if (!primarySizeId) {
      console.warn('Could not map size label to ID:', recommendation.size);
      alert(`Taglia ${recommendation.size} non trovata per questo prodotto`);
      return;
    }

    // 2. Verifica disponibilità per il colore corrente
    const stockResult = findBestAvailableSizeId(
      currentModel,
      selectedColorId,
      recommendation.size,
      [] // Le alternative sono già gestite nel modale
    );

    if (!stockResult.hasStock) {
      // Prova con le alternative suggerite dal modale
      console.log('Primary size not in stock, checking alternatives...');
      
      // Se il size finder ha delle alternative, proviamo quelle
      // (questo caso è già gestito nel modale, ma possiamo double-check)
      if (!recommendation.hasStock) {
        alert(`La taglia ${recommendation.size} non è disponibile nel colore selezionato`);
        return;
      }
    }

    // 3. Applica la taglia
    const finalSizeId = stockResult.sizeId || primarySizeId;
    
    console.log('Applying size:', {
      label: stockResult.usedLabel || recommendation.size,
      sizeId: finalSizeId,
      hasStock: stockResult.hasStock
    });

    setSelectedSizeId(finalSizeId);

    // 4. Aggiorna la variante
    const newVariant = findVariant(currentModel, selectedColorId, finalSizeId);
    if (newVariant) {
      setSelectedVariant(newVariant);
      console.log('Updated variant:', newVariant.title);
    }

    // 5. Feedback utente
    const appliedLabel = stockResult.usedLabel || recommendation.size;
    if (appliedLabel !== recommendation.size) {
      // È stata applicata una taglia alternativa
      setTimeout(() => {
        alert(`Taglia ${recommendation.size} non disponibile. Abbiamo selezionato ${appliedLabel} come alternativa.`);
      }, 300);
    }

    // 6. Telemetria
    console.log('sizeFinder_apply', {
      recommended: recommendation.size,
      applied: appliedLabel,
      confidence: recommendation.confidence,
      hasStock: stockResult.hasStock
    });

  }, [productModels, selectedType, selectedColorId, findVariant]);

  // FUNZIONI CARRELLO MODIFICATE
  const handleAddToCart = async () => {
    try {
      // Validazione: controlla se tutti i dati necessari sono presenti
      if (!selectedType || !selectedColorId || !selectedSizeId || !selectedVariant) {
        alert('Seleziona tipo, colore e taglia prima di aggiungere al carrello');
        return;
      }

      // Controlla se l'item esiste già nel carrello
      if (hasItem(selectedVariant.id, selectedVariant.id)) {
        alert('Questo articolo è già nel tuo carrello');
        return;
      }

      console.log('Adding to cart:', {
        type: selectedType,
        color: selectedColorId,
        size: selectedSizeId,
        variant: selectedVariant,
        crossSell: crossSellChecked
      });

      // Pulisci eventuali errori precedenti
      clearError();

      // Aggiungi al carrello usando il context
      await addFromProductDetail({
        product: {
          id: `${graphicName}_${selectedType}`,
          title: getCurrentModel()?.title || `Prodotto ${selectedType}`,
          image: getCurrentImages()[0]?.src,
          price: { min: selectedVariant.price }
        },
        selectedType,
        selectedColor: getSelectedColorName(),
        selectedSize: getCurrentModel()?.availableSizes?.find(s => s.id === selectedSizeId)?.title || selectedSizeId,
        selectedVariant: {
          id: selectedVariant.id,
          printifyVariantId: selectedVariant.id,
          price: selectedVariant.price,
          is_available: selectedVariant.is_available
        },
        crossSell: crossSellChecked
      });

      // Feedback positivo all'utente
      const itemName = `${selectedType === 'tshirt' ? 'T-Shirt' : 'Felpa'} ${getSelectedColorName()} ${getCurrentModel()?.availableSizes?.find(s => s.id === selectedSizeId)?.title || selectedSizeId}`;
      
      // Mostra notifica di successo (puoi personalizzare)
      if (window.confirm(`"${itemName}" aggiunta al carrello!\n\nVuoi continuare lo shopping o andare al carrello?`)) {
        // Utente vuole andare al carrello
        console.log('Redirect to cart requested');
        // TODO: Implementare navigazione al carrello
      }

      console.log('Item added to cart successfully');

    } catch (error) {
      console.error('Add to cart error:', error);
      
      // Gestione errori specifici
      let errorMessage = 'Errore durante l\'aggiunta al carrello';
      
      if (error.message.includes('already exists')) {
        errorMessage = 'Questo articolo è già nel tuo carrello';
      } else if (error.message.includes('required')) {
        errorMessage = 'Dati prodotto mancanti. Riprova.';
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Errore di connessione. Controlla la tua connessione internet.';
      }
      
      alert(`${errorMessage}\n\nDettagli: ${error.message}`);
    }
  };

  const handleBuyNow = async () => {
    try {
      // Prima aggiungi al carrello
      await handleAddToCart();
      
      // Poi reindirizza al checkout
      console.log('Redirecting to checkout');
      // TODO: Implementare navigazione al checkout
      alert('Redirect al checkout (da implementare)');
      
    } catch (error) {
      console.error('Buy now error:', error);
      alert('Errore durante l\'acquisto immediato');
    }
  };

  const handleToggleFavorite = useCallback(() => {
    const productId = `${graphicName}_${selectedType}`;
    toggleFavorite(productId);
  }, [graphicName, selectedType, toggleFavorite]);

  // --- RENDER HELPERS ---
  const getCurrentModel = () => productModels[selectedType];
  
  const getCurrentImages = () => {
    const model = getCurrentModel();
    if (!model) return [];
    if (selectedVariant) return getVariantImages(model, selectedVariant);
    if (selectedColorId) return getImagesForColor(model, selectedColorId);
    return model.images || [];
  };

  const getCurrentPrice = () => {
    if (selectedVariant && selectedVariant.price) {
      return formatPrice(selectedVariant.price);
    }
    const model = getCurrentModel();
    if (model?.price?.min) {
      return formatPrice(model.price.min);
    }
    return '25.00'; // Fallback
  };

  // MODIFICA FUNZIONI STATO BOTTONI
  const isAddToCartDisabled = () => {
    // Disabilitato se:
    // - Nessuna variante selezionata
    // - Variante non disponibile  
    // - Carrello in loading
    // - Articolo già nel carrello
    
    const noVariant = !selectedVariant;
    const notAvailable = selectedVariant && !selectedVariant.is_available;
    const isLoading = cartLoading;
    const alreadyInCart = selectedVariant && hasItem(selectedVariant.id, selectedVariant.id);
    
    return noVariant || notAvailable || isLoading || alreadyInCart;
  };

  // MODIFICA TESTO BOTTONE
  const getAddToCartButtonText = () => {
    if (cartLoading) return 'Aggiungendo...';
    if (!selectedVariant) return 'Seleziona opzioni';
    if (!selectedVariant.is_available) return 'Non disponibile';
    if (hasItem(selectedVariant.id, selectedVariant.id)) return 'Già nel carrello';
    return 'Aggiungi al carrello';
  };

  const getAvailabilityText = () => {
    if (!selectedVariant) return 'Seleziona una variante';
    if (!selectedVariant.is_enabled) return 'Esaurito';
    if (!selectedVariant.is_available) return 'Esaurito';
    return 'Disponibile';
  };

  // --- RENDER STATES ---
  if (loading) {
    return (
      <div className="product-detail-loading">
        <div className="loading-spinner"></div>
        <p>Caricamento prodotto...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="product-detail-error">
        <h2>Prodotto non trovato</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/products')} className="back-to-products">
          Torna ai prodotti
        </button>
      </div>
    );
  }

  const currentModel = getCurrentModel();
  const currentImages = getCurrentImages();
  const currentImage = currentImages[currentImageIndex];
  const cleanTitle = getCleanTitle(graphicName);

  // Calcola le taglie abilitate per il colore corrente
  const enabledSizesForCurrentColor = selectedColorId && currentModel
    ? new Set(getAvailableSizesForColor(currentModel, selectedColorId))
    : new Set();

  // --- MAIN RENDER ---
  return (
    <div className="product-detail-page">
      {/* Header */}
      <div className="product-detail-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <ArrowLeft size={20} />
          Indietro
        </button>
      </div>

      {/* Main Container */}
      <div className="product-detail-container">
        {/* Left Column - Images */}
        <div className="product-images">
          <div className="main-image-container">
            {currentImage ? (
              <img 
                src={currentImage.src} 
                alt={cleanTitle}
                className="main-image"
              />
            ) : (
              <div className="image-placeholder">
                <span>🖼️</span>
                <p>Immagine non disponibile</p>
              </div>
            )}

            {/* Favorite Heart */}
            <button
              className={`favorite-heart ${isFavorite(`${graphicName}_${selectedType}`) ? 'active' : ''}`}
              onClick={handleToggleFavorite}
            >
              <Heart size={24} />
            </button>
          </div>

          {/* Image Gallery */}
          {currentImages.length > 1 && (
            <div className="image-gallery">
              {currentImages.map((image, index) => (
                <div
                  key={index}
                  className={`gallery-thumb ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => handleImageChange(index)}
                >
                  <img src={image.src} alt={`${cleanTitle} - ${index + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column - Product Info */}
        <div className="product-info">
          {/* Title & Price */}
          <h1 className="product-title">{cleanTitle}</h1>
          <div className="product-price">€{getTotalPrice()}</div>
          {crossSellChecked && (
            <div className="price-breakdown">
              €{getCurrentPrice()} {selectedType === 'tshirt' ? 'T-shirt' : 'Felpa'} + €{getSweatshirtMinPrice()} Felpa
            </div>
          )}

          {/* DESCRIZIONE EDITORIALE */}
          <div className="product-description">
            <strong>{cleanTitle}</strong> – <strong>The Only One</strong>
            <br /><br />
            Una maglia unica, creata una sola volta.
            <br />
            Non appena diventa tua, sparisce per sempre dallo store.
            <br />
            Un design pensato per chi vuole distinguersi e possedere qualcosa che racconta davvero chi sei.
            <br />
            Solo chi sceglie <strong>{cleanTitle}</strong> entra nella storia di OnlyOne.
            <br />
            Un dettaglio che parla di te.
            <br />
            Destinato a restare unico.
            <br />
            <strong>The Only One</strong>
          </div>

          {/* Type Selector - SENZA LABEL E CONTATORI */}
          {availableTypes.length > 1 && (
            <div className="product-section">
              <div className="type-buttons">
                {availableTypes.map(type => {
                  return (
                    <button
                      key={type}
                      className={`type-button ${selectedType === type ? 'active' : ''}`}
                      onClick={() => handleTypeChange(type)}
                    >
                      {type === 'tshirt' ? 'T-shirt' : type === 'sweatshirt' ? 'Felpa' : 'Cappello'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* COLORI SOPRA TAGLIE con etichetta inline */}
          {currentModel?.availableColors?.length > 0 && (
            <div className="product-section">
              <div className="color-section-header">
                <span className="color-label">
                  Colore: {getSelectedColorName()}
                </span>
              </div>
              <div className="color-options">
                {currentModel.availableColors.map(color => {
                  const available = colorHasStock(currentModel, color.id);
                  const isActive = selectedColorId === color.id;
                  return (
                    <div
                      key={color.id}
                      className={`color-option ${isActive ? 'active' : ''} ${available ? '' : 'disabled'}`}
                      style={{ backgroundColor: getColorHex(color.title) }}
                      onClick={() => available && handleColorChange(color.id)}
                      title={available ? color.title : `${color.title} - Non disponibile nel set selezionato`}
                      aria-label={`Seleziona colore ${color.title}`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Size Selector - CON SIZE FINDER */}
          {currentModel?.availableSizes?.length > 0 && (
            <div className="product-section">
              <h3>
                Taglia
                <div className="size-helpers">
                  <button 
                    className="size-finder-button" 
                    onClick={handleSizeFinderOpen}
                    title="Trova la tua taglia ideale"
                  >
                    <Target size={16} />
                    Trova la mia taglia
                  </button>
                  <button 
                    className="size-guide-button" 
                    onClick={() => setShowSizeGuide(true)}
                  >
                    Guida alle taglie
                  </button>
                </div>
              </h3>
              <div className="size-options">
                {currentModel.availableSizes.map(size => {
                  const enabled = !selectedColorId || enabledSizesForCurrentColor.has(size.id);
                  const isActive = selectedSizeId === size.id;
                  return (
                    <button
                      key={size.id}
                      className={`size-option ${isActive ? 'active' : ''} ${enabled ? '' : 'disabled'}`}
                      onClick={() => enabled && handleSizeChange(size.id)}
                      aria-disabled={!enabled}
                    >
                      {size.title}
                    </button>
                  );
                })}
              </div>

              {/* MICRO-RIGA DISPONIBILITÀ */}
              {selectedVariant && (
                <div className="availability-inline">
                  <span className={`availability-dot ${selectedVariant.is_available ? 'available' : 'unavailable'}`}>●</span>
                  {selectedVariant.is_available ? 'Disponibile' : 'Esaurito'}
                </div>
              )}
            </div>
          )}

          {/* Cross-sell - TESTO MODIFICATO */}
          <div className="product-section">
            <label className="cross-sell-checkbox">
              <input
                type="checkbox"
                checked={crossSellChecked}
                onChange={(e) => setCrossSellChecked(e.target.checked)}
              />
              <span className="checkmark"></span>
              Aggiungi anche la felpa
            </label>
          </div>

          {/* Purchase Buttons - SEZIONE MODIFICATA */}
          <div className="purchase-buttons">
            <button
              className="add-to-cart-button"
              onClick={handleAddToCart}
              disabled={isAddToCartDisabled()}
            >
              <ShoppingCart size={20} />
              {getAddToCartButtonText()}
            </button>

            <button
              className="buy-now-button"
              onClick={handleBuyNow}
              disabled={isAddToCartDisabled()}
            >
              Acquista ora
            </button>
          </div>

          {/* NUOVO: Mostra errori carrello se presenti */}
          {cartError && (
            <div className="cart-error-banner" style={{
              backgroundColor: '#fee',
              border: '1px solid #fcc',
              borderRadius: '8px',
              padding: '12px',
              margin: '16px 0',
              color: '#c33',
              fontSize: '14px'
            }}>
              <strong>Errore carrello:</strong> {cartError}
              <button 
                onClick={clearError}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#c33',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  marginLeft: '8px',
                  fontSize: '12px'
                }}
              >
                ✕ Chiudi
              </button>
            </div>
          )}

          {/* NUOVO: Badge carrello (se ha items) */}
          {cartCount > 0 && (
            <div className="cart-status-info" style={{
              backgroundColor: '#e7f5e7',
              border: '1px solid #b8e6b8',
              borderRadius: '8px',
              padding: '12px',
              margin: '16px 0',
              color: '#2d5a2d',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              🛒 Hai <strong>{cartCount}</strong> {cartCount === 1 ? 'articolo' : 'articoli'} nel carrello
            </div>
          )}

          {/* Quick Payment */}
          <div className="quick-payment">
            <p>
              Pagamento rapido con{' '}
              <span className="payment-method">
                {paymentMethods[paymentMethodIndex]}
              </span>
            </p>
          </div>

          {/* Trust Badges */}
          <div className="trust-badges">
            <span>🚚 Spedizione gratuita</span>
            <span>💯 Garanzia qualità</span>
            <span>🔄 Reso facile</span>
          </div>
        </div>
      </div>

      {/* Size Guide Modal */}
      {showSizeGuide && (
        <div className="modal-overlay" onClick={() => setShowSizeGuide(false)}>
          <div className="size-guide-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Guida alle taglie</h3>
              <button className="modal-close" onClick={() => setShowSizeGuide(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-content">
              <p>Guida alle taglie per {selectedType === 'tshirt' ? 'T-shirt' : 'Felpa'}:</p>
              <table>
                <thead>
                  <tr>
                    <th>Taglia</th>
                    <th>Petto (cm)</th>
                    <th>Lunghezza (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr><td>S</td><td>46</td><td>66</td></tr>
                  <tr><td>M</td><td>51</td><td>69</td></tr>
                  <tr><td>L</td><td>56</td><td>72</td></tr>
                  <tr><td>XL</td><td>61</td><td>75</td></tr>
                  <tr><td>2XL</td><td>66</td><td>78</td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SIZE FINDER MODAL */}
      <SizeFinderModal
        isOpen={showSizeFinder}
        onClose={handleSizeFinderClose}
        onApply={handleSizeFinderApply}
        sizeChart={SIZE_CHART_TSHIRT}
        currentModel={currentModel}
        selectedColorId={selectedColorId}
        getAvailableSizesForColor={getAvailableSizesForColor}
        findVariant={findVariant}
      />
    </div>
  );
};

export default ProductDetailPage;