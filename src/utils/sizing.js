// src/utils/sizing.js - Motore di regole per Size Finder

/**
 * Tabella taglie T-shirt: petto (half-chest) x lunghezza in cm
 */
export const SIZE_CHART_TSHIRT = {
  S: { chest: 46, length: 66 },
  M: { chest: 51, length: 69 },
  L: { chest: 56, length: 72 },
  XL: { chest: 61, length: 75 },
  "2XL": { chest: 66, length: 78 }
};

/**
 * Array ordinato delle taglie per facilitare +1/-1
 */
export const SIZE_ORDER = ['S', 'M', 'L', 'XL', '2XL'];

/**
 * Calcola la taglia base usando la griglia altezza/peso
 * @param {number} heightCm - Altezza in cm
 * @param {number} weightKg - Peso in kg
 * @returns {string} Taglia base (S, M, L, XL, 2XL)
 */
export function baseSizeByHeightWeight(heightCm, weightKg) {
  // Validazione input
  if (!heightCm || !weightKg || heightCm < 120 || heightCm > 250 || weightKg < 30 || weightKg > 200) {
    console.warn('⚠️ Parametri altezza/peso fuori range valido');
    return 'M'; // fallback
  }

  // Griglia altezza/peso come da specifiche
  if (heightCm < 165) {
    if (weightKg < 55) return 'S';
    if (weightKg <= 65) return 'M';
    if (weightKg <= 75) return 'L';
    if (weightKg <= 85) return 'XL';
    return '2XL';
  }
  
  if (heightCm <= 175) {
    if (weightKg < 57) return 'S';
    if (weightKg <= 68) return 'M';
    if (weightKg <= 78) return 'L';
    if (weightKg <= 88) return 'XL';
    return '2XL';
  }
  
  if (heightCm <= 185) {
    if (weightKg < 60) return 'S';
    if (weightKg <= 72) return 'M';
    if (weightKg <= 82) return 'L';
    if (weightKg <= 92) return 'XL';
    return '2XL';
  }
  
  // heightCm > 185
  if (weightKg < 68) return 'M';
  if (weightKg <= 78) return 'L';
  if (weightKg <= 90) return 'XL';
  if (weightKg <= 110) return '2XL';
  return '2XL';
}

/**
 * Aggiusta la taglia base in base ai parametri aggiuntivi
 * @param {string} baseSize - Taglia base (S, M, L, XL, 2XL)
 * @param {Object} adjustments - Parametri di aggiustamento
 * @param {string} adjustments.shoulders - 'strette', 'normali', 'larghe'
 * @param {string} adjustments.fit - 'aderente', 'regular', 'oversize'
 * @param {string} adjustments.build - 'unisex', 'femminile'
 * @param {number} adjustments.heightCm - Altezza per regola femminile
 * @param {number} adjustments.weightKg - Peso per regola femminile
 * @returns {string} Taglia aggiustata
 */
export function adjustSize(baseSize, adjustments = {}) {
  const { shoulders = 'normali', fit = 'regular', build = 'unisex', heightCm = 0, weightKg = 0 } = adjustments;
  
  let currentIndex = SIZE_ORDER.indexOf(baseSize);
  if (currentIndex === -1) {
    console.warn('⚠️ Taglia base non valida:', baseSize);
    return 'M'; // fallback
  }

  // Aggiustamento spalle
  if (shoulders === 'larghe') {
    currentIndex += 1;
  } else if (shoulders === 'strette') {
    currentIndex -= 1;
  }

  // Aggiustamento fit
  if (fit === 'aderente') {
    currentIndex -= 1;
  } else if (fit === 'oversize') {
    currentIndex += 1;
  }

  // Aggiustamento build femminile
  if (build === 'femminile' && heightCm > 0 && weightKg > 0) {
    if (heightCm < 170 && weightKg < 60) {
      currentIndex -= 1;
    }
  }

  // Clamp tra S (0) e 2XL (4)
  currentIndex = Math.max(0, Math.min(SIZE_ORDER.length - 1, currentIndex));
  
  return SIZE_ORDER[currentIndex];
}

/**
 * Trova la taglia più vicina basandosi sulla misura del petto
 * @param {number} chestCm - Misura del petto in cm
 * @returns {string} Taglia più vicina
 */
export function findSizeByChest(chestCm) {
  if (!chestCm || chestCm < 35 || chestCm > 80) {
    console.warn('⚠️ Misura petto fuori range valido:', chestCm);
    return 'M'; // fallback
  }

  let closestSize = 'M';
  let minDiff = Infinity;

  for (const [size, measures] of Object.entries(SIZE_CHART_TSHIRT)) {
    const diff = Math.abs(measures.chest - chestCm);
    if (diff < minDiff) {
      minDiff = diff;
      closestSize = size;
    }
  }

  return closestSize;
}

/**
 * Calcola il livello di confidenza della raccomandazione
 * @param {string} method - Metodo usato ('chest' o 'body')
 * @param {Object} params - Parametri originali
 * @returns {string} 'Alta', 'Media', o 'Bassa'
 */
function calculateConfidence(method, params = {}) {
  if (method === 'chest') {
    return 'Alta'; // Misura diretta = massima confidenza
  }

  const { heightCm = 0, weightKg = 0, shoulders = 'normali', fit = 'regular' } = params;

  // Confidenza Alta: parametri standard senza aggiustamenti estremi
  if (heightCm >= 160 && heightCm <= 190 && 
      weightKg >= 50 && weightKg <= 100 && 
      shoulders === 'normali' && 
      fit === 'regular') {
    return 'Alta';
  }

  // Confidenza Bassa: parametri estremi o molti aggiustamenti
  if (heightCm < 155 || heightCm > 195 || 
      weightKg < 45 || weightKg > 110 || 
      (shoulders !== 'normali' && fit !== 'regular')) {
    return 'Bassa';
  }

  // Tutto il resto = Media
  return 'Media';
}

/**
 * Genera alternative alla taglia principale (±1)
 * @param {string} primarySize - Taglia principale
 * @returns {Array<string>} Array di taglie alternative
 */
function generateAlternatives(primarySize) {
  const currentIndex = SIZE_ORDER.indexOf(primarySize);
  if (currentIndex === -1) return [];

  const alternatives = [];
  
  // Taglia più piccola
  if (currentIndex > 0) {
    alternatives.push(SIZE_ORDER[currentIndex - 1]);
  }
  
  // Taglia più grande
  if (currentIndex < SIZE_ORDER.length - 1) {
    alternatives.push(SIZE_ORDER[currentIndex + 1]);
  }

  return alternatives;
}

/**
 * Funzione principale di raccomandazione taglie
 * @param {Object} params - Parametri del quiz
 * @param {number} params.heightCm - Altezza in cm
 * @param {number} params.weightKg - Peso in kg
 * @param {string} params.shoulders - 'strette', 'normali', 'larghe'
 * @param {string} params.fit - 'aderente', 'regular', 'oversize'
 * @param {string} params.build - 'unisex', 'femminile'
 * @param {number} [params.favTeeChestCm] - Misura petto T-shirt preferita (opzionale)
 * @returns {Object} Raccomandazione completa
 */
export function recommendSize(params = {}) {
  const {
    heightCm,
    weightKg,
    shoulders = 'normali',
    fit = 'regular',
    build = 'unisex',
    favTeeChestCm
  } = params;

  console.log('🎯 Size recommendation input:', params);

  let recommendedSize;
  let method;
  let confidence;

  // Metodo 1: Misura diretta del petto (priorità massima)
  if (favTeeChestCm && favTeeChestCm > 0) {
    recommendedSize = findSizeByChest(favTeeChestCm);
    method = 'chest';
    confidence = 'Alta';
    console.log('📏 Using chest measurement method:', favTeeChestCm, '→', recommendedSize);
  }
  // Metodo 2: Algoritmo altezza/peso + aggiustamenti
  else if (heightCm && weightKg) {
    const baseSize = baseSizeByHeightWeight(heightCm, weightKg);
    recommendedSize = adjustSize(baseSize, { shoulders, fit, build, heightCm, weightKg });
    method = 'body';
    confidence = calculateConfidence('body', params);
    console.log('👤 Using body measurement method:', 
      `${heightCm}cm/${weightKg}kg`, '→', baseSize, '→', recommendedSize);
  }
  // Fallback
  else {
    console.warn('⚠️ Insufficient parameters for size recommendation');
    recommendedSize = 'M';
    method = 'fallback';
    confidence = 'Bassa';
  }

  // Genera alternative
  const alternatives = generateAlternatives(recommendedSize);
  
  // Misure del capo per la taglia consigliata
  const measures = SIZE_CHART_TSHIRT[recommendedSize] || SIZE_CHART_TSHIRT.M;

  const result = {
    size: recommendedSize,
    alt: alternatives,
    measures,
    confidence,
    method
  };

  console.log('✅ Size recommendation result:', result);
  return result;
}

/**
 * Trova l'ID della taglia nel modello prodotto basandosi sull'etichetta
 * @param {Object} model - Modello prodotto con availableSizes
 * @param {string} label - Etichetta taglia (S, M, L, XL, 2XL)
 * @returns {string|null} ID della taglia o null se non trovata
 */
export function findSizeIdByLabel(model, label) {
  if (!model?.availableSizes || !label) return null;

  const normalizedLabel = label.toString().toUpperCase().replace(/\s+/g, '').replace(/\./g, '');
  
  const matchingSize = model.availableSizes.find(size => {
    const sizeTitle = size.title?.toString().toUpperCase().replace(/\s+/g, '').replace(/\./g, '') || '';
    return sizeTitle === normalizedLabel;
  });

  return matchingSize?.id || null;
}

/**
 * Trova la miglior taglia disponibile per un colore specifico
 * @param {Object} model - Modello prodotto
 * @param {string} colorId - ID del colore selezionato
 * @param {string} primaryLabel - Etichetta taglia primaria (es. "L")
 * @param {Array<string>} altLabels - Etichette alternative (es. ["M", "XL"])
 * @returns {Object} { sizeId: string|null, usedLabel: string|null, hasStock: boolean }
 */
export function findBestAvailableSizeId(model, colorId, primaryLabel, altLabels = []) {
  if (!model || !colorId) {
    return { sizeId: null, usedLabel: null, hasStock: false };
  }

  // Helper per verificare se una taglia è disponibile per il colore
  const isSizeAvailableForColor = (sizeId) => {
    return model.variants?.some(variant => {
      if (!variant.options || variant.options.length < 2) return false;
      const variantColorId = variant.options[model.colorOptionIndex];
      const variantSizeId = variant.options[model.sizeOptionIndex];
      return variantColorId === colorId && 
             variantSizeId === sizeId && 
             variant.is_available && 
             variant.is_enabled;
    }) || false;
  };

  // Prova con la taglia primaria
  const primarySizeId = findSizeIdByLabel(model, primaryLabel);
  if (primarySizeId && isSizeAvailableForColor(primarySizeId)) {
    return { sizeId: primarySizeId, usedLabel: primaryLabel, hasStock: true };
  }

  // Prova con le alternative in ordine
  for (const altLabel of altLabels) {
    const altSizeId = findSizeIdByLabel(model, altLabel);
    if (altSizeId && isSizeAvailableForColor(altSizeId)) {
      return { sizeId: altSizeId, usedLabel: altLabel, hasStock: true };
    }
  }

  // Nessuna taglia disponibile
  return { sizeId: primarySizeId, usedLabel: primaryLabel, hasStock: false };
}

/**
 * Valida i parametri del quiz
 * @param {Object} params - Parametri da validare
 * @returns {Object} { isValid: boolean, errors: Array<string> }
 */
export function validateQuizParams(params = {}) {
  const errors = [];
  const { heightCm, weightKg, shoulders, fit, build, favTeeChestCm } = params;

  // Validazione altezza
  if (heightCm !== undefined && (typeof heightCm !== 'number' || heightCm < 140 || heightCm > 210)) {
    errors.push('Altezza deve essere tra 140 e 210 cm');
  }

  // Validazione peso
  if (weightKg !== undefined && (typeof weightKg !== 'number' || weightKg < 40 || weightKg > 130)) {
    errors.push('Peso deve essere tra 40 e 130 kg');
  }

  // Validazione spalle
  if (shoulders && !['strette', 'normali', 'larghe'].includes(shoulders)) {
    errors.push('Corporatura spalle non valida');
  }

  // Validazione fit
  if (fit && !['aderente', 'regular', 'oversize'].includes(fit)) {
    errors.push('Preferenza fit non valida');
  }

  // Validazione build
  if (build && !['unisex', 'femminile'].includes(build)) {
    errors.push('Struttura corpo non valida');
  }

  // Validazione misura petto (opzionale)
  if (favTeeChestCm !== undefined && (typeof favTeeChestCm !== 'number' || favTeeChestCm < 35 || favTeeChestCm > 80)) {
    errors.push('Misura petto deve essere tra 35 e 80 cm');
  }

  // Validazione combinazioni minime
  if (!favTeeChestCm && (!heightCm || !weightKg)) {
    errors.push('Inserire altezza e peso, oppure misura del petto');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Formatta la raccomandazione per l'UI
 * @param {Object} recommendation - Risultato di recommendSize
 * @param {Object} sizeChart - Tabella taglie da mostrare
 * @returns {Object} Dati formattati per l'UI
 */
export function formatRecommendationForUI(recommendation, sizeChart = SIZE_CHART_TSHIRT) {
  const { size, alt, measures, confidence, method } = recommendation;

  return {
    primarySize: size,
    alternatives: alt || [],
    measurements: {
      chest: measures?.chest || sizeChart[size]?.chest || 0,
      length: measures?.length || sizeChart[size]?.length || 0
    },
    confidence: confidence || 'Media',
    method: method || 'unknown',
    description: generateSizeDescription(size, confidence, method)
  };
}

/**
 * Genera una descrizione testuale della raccomandazione
 * @param {string} size - Taglia consigliata
 * @param {string} confidence - Livello di confidenza
 * @param {string} method - Metodo usato
 * @returns {string} Descrizione per l'utente
 */
function generateSizeDescription(size, confidence, method) {
  const confidenceText = {
    'Alta': 'Questa taglia dovrebbe calzarti perfettamente',
    'Media': 'Questa taglia dovrebbe essere adatta',
    'Bassa': 'Questa è la nostra migliore stima, considera le alternative'
  };

  const methodText = {
    'chest': ' basandoci sulla misura del tuo petto',
    'body': ' basandoci su altezza, peso e preferenze',
    'fallback': ' con i parametri disponibili'
  };

  return (confidenceText[confidence] || confidenceText['Media']) + 
         (methodText[method] || '');
}

/**
 * Debug utility per testare il motore
 */
export function testSizingEngine() {
  console.log('🧪 Testing sizing engine...');
  
  const testCases = [
    { name: 'Caso 1: 175cm/72kg regular', params: { heightCm: 175, weightKg: 72, shoulders: 'normali', fit: 'regular' }, expected: 'L' },
    { name: 'Caso 2: 182cm/60kg aderente', params: { heightCm: 182, weightKg: 60, fit: 'aderente' }, expected: 'M' },
    { name: 'Caso 3: 160cm/50kg femminile', params: { heightCm: 160, weightKg: 50, build: 'femminile' }, expected: 'S' },
    { name: 'Caso 4: Petto 51cm diretto', params: { favTeeChestCm: 51 }, expected: 'M' },
    { name: 'Caso 5: 190cm/95kg oversize', params: { heightCm: 190, weightKg: 95, fit: 'oversize' }, expected: '2XL' }
  ];

  testCases.forEach(test => {
    const result = recommendSize(test.params);
    const passed = result.size === test.expected;
    console.log(`${passed ? '✅' : '❌'} ${test.name}: ${result.size} (expected: ${test.expected})`);
    if (!passed) {
      console.log('   Params:', test.params);
      console.log('   Result:', result);
    }
  });

  console.log('🧪 Testing complete');
}

// Esporta tutto per facilità d'uso
export default {
  SIZE_CHART_TSHIRT,
  SIZE_ORDER,
  baseSizeByHeightWeight,
  adjustSize,
  findSizeByChest,
  recommendSize,
  findSizeIdByLabel,
  findBestAvailableSizeId,
  validateQuizParams,
  formatRecommendationForUI,
  testSizingEngine
};