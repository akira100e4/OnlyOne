// src/services/printifyService.js - VERSIONE COMPLETA CON MATCHING MIGLIORATO
const PRINTIFY_API_BASE = 'https://api.printify.com/v1';
const PRINTIFY_TOKEN = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6ImZmMTc4NDk4YWNjMGVhMWY0ODI5ZmU3MWMyZTRkZDA1MzA1MWUyYTdkNjE0MTc2NzVmYjc4MWNhMDExY2M2NTEwZWNkMmU5YzhlZDI2ODVlIiwiaWF0IjoxNzUyODc1Mzk4LjI3MjQ0OSwibmJmIjoxNzUyODc1Mzk4LjI3MjQ1MiwiZXhwIjoxNzg0NDExMzk4LjI2NDUxNSwic3ViIjoiMjM4OTIwMzUiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.qmmYWRtndwTHJSB0P6dJgHBa-k0TndFjeSZBt7-iVRpdj3NIV--fDgYK1DqK32KPXOBaexZxniZy4loxpA0aJPGDNy14fKalloQjvhmxEEScprUmkAGQxIRja9XaFqTE0QFhkEAxqv8KainzEs9yDhEKdJidt-Eexz4_S3pvPQ-fgx-BZ_16KF2Xkr2XCWRtligxHYvD72UQsFvv0dptPXsyk7EHGIO3ZYOFEY6rWZc9JY5qlyq6zoAmuypMcUFkeT6-5pJlyVzEk31HFnbEj3ot9eeTvCwXtQQHAbpukgyw0Y6ayt2C7KGjlxktzUiVFD5E6zgFnnOqwXXxunWfn-Gzq_UoMtXgBFvPuukFx2kyDNnNhwddwZ9MfdVBWUmnynz0TT0pCzbyKfRrCSObiTi8qwC1oMdtjisT0yGpUWwBr4pgPjWIY006gSxLHZ0xPsVBFku6WvmHxvHWRZcngzu2-sEklKx_g_DOs4fvEkGxAt6XBCo1LZJuG0pq0ZnCgBnc7SxYyLPRwriVEHSaVBgJDd7i6ki-9MGR6V2Eb6OukCDbcriKwe7yBtSwSPlow4kbt20gfCPZQBUhqBL9Wz5RuLvVmpagMUUhR-QTSraK8hdZuTjT3klEC5IxG4n_ERRrNpuTz0iLvuvqQ3EEDVaue_IhEA_p4jtckDmHiZA';
const SHOP_ID = '23316709';

// Cache per ottimizzare le chiamate API
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minuti

// Utility per chiamate API
const apiRequest = async (endpoint, options = {}) => {
  const url = `${PRINTIFY_API_BASE}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${PRINTIFY_TOKEN}`,
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });

    if (!response.ok) {
      throw new Error(`Printify API Error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Printify API Error:', error);
    throw error;
  }
};

// Cache helper
const getCached = (key) => {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  return null;
};

const setCache = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
};

// Ottieni tutti i prodotti dal shop
export const getShopProducts = async () => {
  const cacheKey = 'shop_products';
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const data = await apiRequest(`/shops/${SHOP_ID}/products.json`);
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Errore caricamento prodotti shop:', error);
    return { data: [] };
  }
};

// Ottieni dettagli prodotto specifico con varianti
export const getProductDetails = async (productId) => {
  const cacheKey = `product_${productId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const data = await apiRequest(`/shops/${SHOP_ID}/products/${productId}.json`);
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error(`Errore caricamento prodotto ${productId}:`, error);
    return null;
  }
};

// Ottieni le immagini di preview per tutte le varianti di un prodotto
export const getProductVariantImages = async (productId) => {
  try {
    const product = await getProductDetails(productId);
    if (!product || !product.variants) return [];

    // Estrai tutte le varianti con le loro immagini
    const variants = product.variants.map(variant => ({
      id: variant.id,
      title: variant.title,
      price: variant.price,
      isAvailable: variant.is_available,
      color: extractColorFromTitle(variant.title),
      image: variant.image || product.images?.[0]?.src,
      options: variant.options // size, color, etc.
    }));

    return variants;
  } catch (error) {
    console.error('Errore caricamento varianti:', error);
    return [];
  }
};

// Estrai il colore dal titolo della variante
const extractColorFromTitle = (title) => {
  const colors = [
    'White', 'Black', 'Navy', 'Red', 'Blue', 'Green', 'Yellow', 'Orange',
    'Purple', 'Pink', 'Brown', 'Grey', 'Gray', 'Heather', 'Military',
    'Kelly', 'Royal', 'Burgundy', 'Natural', 'Silver', 'Asphalt'
  ];
  
  const found = colors.find(color => 
    title.toLowerCase().includes(color.toLowerCase())
  );
  
  return found || 'Default';
};

// Ottieni i colori disponibili per un prodotto
export const getAvailableColors = async (productId) => {
  try {
    const variants = await getProductVariantImages(productId);
    
    // Raggruppa per colore e prendi la prima variante per ogni colore
    const colorMap = new Map();
    
    variants.forEach(variant => {
      const color = variant.color;
      if (!colorMap.has(color)) {
        colorMap.set(color, {
          name: color,
          image: variant.image,
          variants: []
        });
      }
      colorMap.get(color).variants.push(variant);
    });

    return Array.from(colorMap.values());
  } catch (error) {
    console.error('Errore caricamento colori:', error);
    return [];
  }
};

// Genera mockup personalizzato per un design
export const generateProductMockup = async (productId, variantId, imageUrl) => {
  try {
    const mockupData = await apiRequest(`/shops/${SHOP_ID}/products/${productId}/mockups.json`, {
      method: 'POST',
      body: JSON.stringify({
        variant_ids: [variantId],
        format: 'jpg',
        width: 1000
      })
    });

    return mockupData;
  } catch (error) {
    console.error('Errore generazione mockup:', error);
    return null;
  }
};

// Ottieni informazioni sui blueprint (tipo di prodotto)
export const getProductBlueprint = async (blueprintId) => {
  const cacheKey = `blueprint_${blueprintId}`;
  const cached = getCached(cacheKey);
  if (cached) return cached;

  try {
    const data = await apiRequest(`/catalog/blueprints/${blueprintId}.json`);
    setCache(cacheKey, data);
    return data;
  } catch (error) {
    console.error('Errore caricamento blueprint:', error);
    return null;
  }
};

// 🔥 NUOVA VERSIONE: Mappa i tuoi prodotti locali con quelli Printify - MATCHING MIGLIORATO
export const mapLocalToRemoteProduct = async (localProductId) => {
  try {
    console.log(`🔍 Searching for local product: "${localProductId}"`);
    
    // 1. Normalizza il nome locale
    const normalizedName = normalizeProductName(localProductId);
    console.log(`📝 Normalized name: "${normalizedName}"`);
    
    // 2. Ottieni tutti i prodotti dal shop
    const shopProducts = await getShopProducts();
    console.log(`📦 Total products in shop: ${shopProducts.data?.length || 0}`);
    
    if (!shopProducts.data || shopProducts.data.length === 0) {
      console.warn('❌ No products found in Printify shop');
      return null;
    }

    // 3. Cerca corrispondenze con pattern matching flessibile
    const matches = findProductMatches(shopProducts.data, normalizedName, localProductId);
    console.log(`🎯 Found ${matches.length} matches:`, matches.map(m => m.title));

    if (matches.length === 0) {
      console.warn(`❌ No matches found for "${localProductId}"`);
      return null;
    }

    // 4. Scegli il migliore match (priorità: tshirt > sweatshirt > hat)
    const bestMatch = selectBestMatch(matches);
    console.log(`✅ Best match selected: "${bestMatch.title}" (ID: ${bestMatch.id})`);

    // 5. Carica i dettagli completi del prodotto
    return await getProductDetails(bestMatch.id);

  } catch (error) {
    console.error('❌ Error mapping local to remote product:', error);
    return null;
  }
};

// Helper: Normalizza il nome del prodotto locale
const normalizeProductName = (localProductId) => {
  return localProductId
    .split('-')                    // "il-cavallo-spettrale" → ["il", "cavallo", "spettrale"]
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()) // Capitalizza
    .join(' ');                    // → "Il Cavallo Spettrale"
};

// Helper: Trova tutti i match possibili
const findProductMatches = (products, normalizedName, originalId) => {
  const matches = [];
  
  products.forEach(product => {
    const title = product.title || '';
    
    // Test 1: Match esatto normalizzato
    if (title.includes(normalizedName)) {
      matches.push({ ...product, matchType: 'exact_normalized', priority: 1 });
      return;
    }
    
    // Test 2: Match case-insensitive
    if (title.toLowerCase().includes(normalizedName.toLowerCase())) {
      matches.push({ ...product, matchType: 'case_insensitive', priority: 2 });
      return;
    }
    
    // Test 3: Match con underscore invece di spazi
    const underscoreName = normalizedName.replace(/\s+/g, '_');
    if (title.includes(underscoreName)) {
      matches.push({ ...product, matchType: 'underscore', priority: 3 });
      return;
    }
    
    // Test 4: Match con original ID
    if (title.toLowerCase().includes(originalId.toLowerCase())) {
      matches.push({ ...product, matchType: 'original_id', priority: 4 });
      return;
    }
  });
  
  return matches;
};

// Helper: Seleziona il miglior match basato su priorità tipo prodotto
const selectBestMatch = (matches) => {
  // Ordina per priorità del match type
  matches.sort((a, b) => a.priority - b.priority);
  
  // All'interno dello stesso tipo di match, priorità per tipo prodotto
  const typeOrder = ['tshirt', 'sweatshirt', 'hoodie', 'hat', 'cap'];
  
  return matches.sort((a, b) => {
    // Prima ordina per priorità di match
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    
    // Poi per tipo prodotto
    const aType = getProductTypeFromTitle(a.title);
    const bType = getProductTypeFromTitle(b.title);
    
    const aIndex = typeOrder.indexOf(aType);
    const bIndex = typeOrder.indexOf(bType);
    
    const aOrder = aIndex === -1 ? 999 : aIndex;
    const bOrder = bIndex === -1 ? 999 : bIndex;
    
    return aOrder - bOrder;
  })[0];
};

// Helper: Estrae il tipo di prodotto dal titolo
const getProductTypeFromTitle = (title) => {
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('tshirt') || titleLower.includes('t-shirt')) return 'tshirt';
  if (titleLower.includes('sweatshirt') || titleLower.includes('hoodie')) return 'sweatshirt';
  if (titleLower.includes('hat') || titleLower.includes('cap')) return 'hat';
  
  return 'unknown';
};

// Helper per determinare il tipo di prodotto e prezzo
export const getProductTypeAndPrice = (blueprintId, title) => {
  const titleLower = title?.toLowerCase() || '';
  const blueprintStr = blueprintId?.toString() || '';

  // Identificazione tipo prodotto
  if (titleLower.includes('hoodie') || titleLower.includes('sweatshirt') || blueprintStr.includes('hoodie')) {
    return { type: 'hoodie', price: 35, label: 'Hoodie' };
  }
  
  if (titleLower.includes('hat') || titleLower.includes('cap') || titleLower.includes('beanie') || blueprintStr.includes('hat')) {
    return { type: 'hat', price: 20, label: 'Hat' };
  }

  // Default: T-shirt
  return { type: 'tshirt', price: 25, label: 'T-shirt' };
};

// Ottieni tutte le taglie disponibili per un prodotto
export const getAvailableSizes = async (productId) => {
  try {
    const variants = await getProductVariantImages(productId);
    const sizes = new Set();

    variants.forEach(variant => {
      // Estrai taglia dalle options o dal title
      variant.options?.forEach(option => {
        if (option.name?.toLowerCase().includes('size')) {
          sizes.add(option.value);
        }
      });
    });

    // Se non troviamo taglie nelle options, proviamo dal title
    if (sizes.size === 0) {
      variants.forEach(variant => {
        const sizeMatch = variant.title.match(/\b(XS|S|M|L|XL|XXL|2XL|3XL)\b/);
        if (sizeMatch) {
          sizes.add(sizeMatch[1]);
        }
      });
    }

    return Array.from(sizes).sort((a, b) => {
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '2XL', '3XL'];
      return sizeOrder.indexOf(a) - sizeOrder.indexOf(b);
    });
  } catch (error) {
    console.error('Errore caricamento taglie:', error);
    return ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']; // Fallback
  }
};

export default {
  getShopProducts,
  getProductDetails,
  getProductVariantImages,
  getAvailableColors,
  generateProductMockup,
  getProductBlueprint,
  mapLocalToRemoteProduct,
  getProductTypeAndPrice,
  getAvailableSizes
};