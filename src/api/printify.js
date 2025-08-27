// src/api/printify.js - Utility functions per Printify API
const API_BASE_URL = 'http://localhost:5001/api';

/**
 * Fetch del catalogo prodotti dal backend
 * @param {number} limit - Numero massimo di prodotti da recuperare (max 200)
 * @returns {Promise<Array>} Array di prodotti Printify
 */
export const fetchCatalog = async (limit = 200) => {
  try {
    const response = await fetch(`${API_BASE_URL}/catalog?limit=${limit}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.products || [];
  } catch (error) {
    console.error('Error fetching catalog:', error);
    throw error;
  }
};

/**
 * Normalizza il testo per il matching
 * @param {string} text - Testo da normalizzare
 * @returns {string} Testo normalizzato
 */
export const normalize = (text) => {
  return text
    .toLowerCase()
    .replace(/[_\-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Estrae le parole chiave da un nome grafico
 * @param {string} graphicName - Nome della grafica dalla URL
 * @returns {Array<string>} Array di parole chiave filtrate
 */
export const getGraphicWords = (graphicName) => {
  return normalize(graphicName)
    .split(' ')
    .filter(word => 
      word.length > 2 && 
      !['la','le','il','delle','degli','del','di','da','in','con','per','tra','fra'].includes(word)
    );
};

/**
 * Verifica se un titolo prodotto matcha le parole chiave
 * @param {string} title - Titolo del prodotto
 * @param {Array<string>} words - Parole chiave da cercare
 * @returns {boolean} True se almeno 1 parola chiave è presente
 */
export const isMatch = (title, words) => {
  const normalizedTitle = normalize(title);
  const hits = words.filter(word => normalizedTitle.includes(word));
  return hits.length >= 1; // Abbassato per essere più permissivo
};

/**
 * Determina se un prodotto è una T-shirt
 * @param {string} title - Titolo del prodotto
 * @returns {boolean} True se è una T-shirt
 */
export const isTshirt = (title) => {
  return /\bt\-?shirt\b|\btshirt\b/i.test(title);
};

/**
 * Determina se un prodotto è una felpa
 * @param {string} title - Titolo del prodotto
 * @returns {boolean} True se è una felpa
 */
export const isSweatshirt = (title) => {
  return /\bsweatshirt\b|\bfelpa\b/i.test(title);
};

/**
 * Determina il tipo di prodotto
 * @param {string} title - Titolo del prodotto
 * @returns {string} 'tshirt', 'sweatshirt', o 'other'
 */
export const getProductType = (title) => {
  if (isTshirt(title)) return 'tshirt';
  if (isSweatshirt(title)) return 'sweatshirt';
  return 'other';
};

/**
 * Mapping colori per swatch UI
 */
export const colorMapping = {
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

/**
 * Ottiene il colore esadecimale per uno swatch
 * @param {string} colorName - Nome del colore
 * @returns {string} Codice colore esadecimale
 */
export const getColorHex = (colorName) => {
  return colorMapping[colorName] || '#CCCCCC';
};

/**
 * Formatta il prezzo da centesimi a euro
 * @param {number} price - Prezzo in centesimi
 * @returns {string} Prezzo formattato (es. "25.00")
 */
export const formatPrice = (price) => {
  return (price / 100).toFixed(2);
};

/**
 * Pulisce e formatta il titolo della grafica
 * @param {string} graphicName - Nome della grafica dalla URL
 * @returns {string} Titolo pulito e formattato
 */
export const getCleanTitle = (graphicName) => {
  return normalize(graphicName)
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Utility per ricostruire opzioni da varianti
const slug = (s) =>
  String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const isSizeLabel = (s) =>
  /\b(XXS|XS|S|M|L|XL|2XL|3XL|4XL|5XL|One Size|Taglia Unica|Unica|Youth|Kid|Women|Men|\d{2}(?:cm|in)?)\b/i.test(String(s || ''));

const splitVariantTitle = (title) => {
  if (typeof title !== 'string') return { color: null, size: null };
  const parts = title.split(/\s*\/\s*/).map(p => p.trim()).filter(Boolean);
  // Printify in genere usa "Color / Size"
  if (parts.length >= 2) return { color: parts[0], size: parts[1] };
  // fallback euristico
  const p = parts[0] || '';
  return isSizeLabel(p) ? { color: null, size: p } : { color: p, size: null };
};

/**
 * Trova i prodotti Printify che matchano una grafica
 * @param {Array} allProducts - Tutti i prodotti del catalogo
 * @param {string} graphicName - Nome della grafica
 * @returns {Object} Oggetto con { tshirts: [...], sweatshirts: [...] }
 */
export const findMatchingProducts = (allProducts, graphicName) => {
  const words = getGraphicWords(graphicName);
  
  const matchingProducts = allProducts.filter(product => 
    product.title && isMatch(product.title, words)
  );

  return {
    tshirts: matchingProducts.filter(p => isTshirt(p.title)),
    sweatshirts: matchingProducts.filter(p => isSweatshirt(p.title)),
    all: matchingProducts
  };
};

/**
 * Processa un prodotto Printify per creare un model utilizzabile - VERSIONE ROBUSTA
 * @param {Object} product - Prodotto Printify
 * @returns {Object} Product model processato
 */
export const processProductModel = (product) => {
  console.log('🔧 Processing product model:', product.title);

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const rawOpts = Array.isArray(product?.options) ? product.options : [];

  // 1) Prova a individuare gli indici con opzioni native (nomi flessibili)
  let colorOptionIndex = rawOpts.findIndex(
    (opt) => typeof opt?.name === 'string' && /color|colour|colore/i.test(opt.name)
  );
  let sizeOptionIndex = rawOpts.findIndex(
    (opt) => typeof opt?.name === 'string' && /size|sizes|taglia|taglie/i.test(opt.name)
  );

  // 2) Se non abbiamo trovato le opzioni (o options è assente), ricostruiscile dalle varianti
  let availableColors = [];
  let availableSizes  = [];

  if (colorOptionIndex === -1 || sizeOptionIndex === -1 || rawOpts.length === 0) {
    console.log('🔧 Reconstructing options from variants...');
    // Ricostruzione: usiamo variant.title ("Color / Size") + variant.options per mappare ID->titolo
    const colorMap = new Map(); // key: colorId -> {id, title}
    const sizeMap  = new Map(); // key: sizeId  -> {id, title}

    for (const v of variants) {
      const { color, size } = splitVariantTitle(v.title);
      const hasOptArray = Array.isArray(v.options) && v.options.length >= 2;

      // Heuristica: Printify di solito ha [colorId, sizeId] in quest'ordine.
      const cId = hasOptArray ? v.options[0] : slug(color || 'color');
      const sId = hasOptArray ? v.options[1] : slug(size  || 'size');

      if (color && !colorMap.has(cId)) colorMap.set(cId, { id: cId, title: color });
      if (size  && !sizeMap.has(sId))  sizeMap.set(sId,  { id: sId,  title: size  });
    }

    availableColors = Array.from(colorMap.values());
    availableSizes  = Array.from(sizeMap.values());

    // Fissa gli indici coerenti con l'uso corrente del codice
    colorOptionIndex = 0;
    sizeOptionIndex  = 1;
  } else {
    // 3) Path "normale": options presente -> prendi i valori nativi
    availableColors = rawOpts[colorOptionIndex]?.values || [];
    availableSizes  = rawOpts[sizeOptionIndex]?.values  || [];
  }

  console.log('🔧 Option names:', rawOpts.map(o => o?.name));
  console.log('🔧 Color option index:', colorOptionIndex, 'name:', rawOpts[colorOptionIndex]?.name);
  console.log('🔧 Size option index:', sizeOptionIndex, 'name:', rawOpts[sizeOptionIndex]?.name);
  console.log('🔧 Available colors:', availableColors.map(c => c.title));
  console.log('🔧 Available sizes:',  availableSizes.map(s => s.title));

  return {
    ...product,
    colorOptionIndex,
    sizeOptionIndex,
    availableColors,
    availableSizes,
  };
};

/**
 * Trova una variante specifica per combinazione colore/taglia
 * @param {Object} productModel - Product model processato
 * @param {string} colorId - ID del colore selezionato
 * @param {string} sizeId - ID della taglia selezionata
 * @returns {Object|null} Variante trovata o null
 */
export const findVariant = (productModel, colorId, sizeId) => {
  if (!productModel || !productModel.variants) return null;

  return productModel.variants.find(variant => {
    if (!variant.options || variant.options.length < 2) return false;
    
    const variantColorId = variant.options[productModel.colorOptionIndex];
    const variantSizeId = variant.options[productModel.sizeOptionIndex];
    
    return variantColorId === colorId && variantSizeId === sizeId;
  });
};

/**
 * Ottiene le immagini per una variante specifica
 * @param {Object} productModel - Product model processato
 * @param {Object} variant - Variante selezionata
 * @returns {Array} Array di immagini da mostrare
 */
export const getVariantImages = (productModel, variant) => {
  if (!productModel) return [];

  // Se non c'è variante, usa le immagini del prodotto
  if (!variant) {
    return productModel.images || [];
  }

  // 1. Cerca immagini specifiche per la variant
  const variantImages = productModel.images?.filter(img => 
    img.variant_ids && img.variant_ids.includes(variant.id)
  ) || [];

  if (variantImages.length > 0) {
    return variantImages;
  }

  // 2. Fallback a immagini front/back
  const frontBackImages = productModel.images?.filter(img => 
    img.position === 'front' || img.position === 'back'
  ) || [];

  if (frontBackImages.length > 0) {
    return frontBackImages;
  }

  // 3. Fallback a tutte le immagini
  return productModel.images || [];
};

/**
 * Verifica se una variante è disponibile per l'acquisto
 * @param {Object} variant - Variante da verificare
 * @returns {boolean} True se disponibile
 */
export const isVariantAvailable = (variant) => {
  return variant && variant.is_enabled && variant.is_available;
};

/**
 * Ottiene il prezzo di una variante o del prodotto
 * @param {Object} variant - Variante selezionata (opzionale)
 * @param {Object} product - Prodotto di fallback
 * @returns {string} Prezzo formattato
 */
export const getPrice = (variant, product) => {
  if (variant && variant.price) {
    return formatPrice(variant.price);
  }
  
  if (product?.price?.min) {
    return formatPrice(product.price.min);
  }
  
  return '25.00'; // Fallback
};

/**
 * Ottiene il testo di disponibilità per la UI
 * @param {Object} variant - Variante selezionata
 * @returns {string} Testo di stato
 */
export const getAvailabilityText = (variant) => {
  if (!variant) return 'Seleziona una variante';
  if (!variant.is_enabled) return 'Non disponibile';
  if (!variant.is_available) return 'Esaurito';
  return 'Disponibile';
};

/**
 * Crea l'oggetto dati per l'aggiunta al carrello
 * @param {string} graphicName - Nome della grafica
 * @param {string} productType - Tipo prodotto (tshirt/sweatshirt)
 * @param {Object} variant - Variante selezionata
 * @param {Object} colorInfo - Informazioni colore
 * @param {Object} sizeInfo - Informazioni taglia
 * @returns {Object} Dati per il carrello
 */
export const createCartItem = (graphicName, productType, variant, colorInfo, sizeInfo) => {
  return {
    id: `${graphicName}_${productType}_${variant.id}`,
    graphicName,
    productType,
    variantId: variant.id,
    sku: variant.sku,
    price: variant.price,
    color: colorInfo?.title || 'N/A',
    size: sizeInfo?.title || 'N/A',
    quantity: 1,
    image: variant.image || null,
    title: `${getCleanTitle(graphicName)} - ${productType === 'tshirt' ? 'T-shirt' : 'Felpa'}`,
    timestamp: new Date().toISOString()
  };
};