// src/data/products.js - Database prodotti OnlyOne

// Categorie prodotti
export const PRODUCT_CATEGORIES = {
  ANIMALS: 'animals',
  MYTHICAL: 'mythical', 
  CULTURAL: 'cultural',
  NATURE: 'nature',
  ABSTRACT: 'abstract'
};

// Tags per filtri
export const PRODUCT_TAGS = {
  POWER: 'power',
  ELEGANCE: 'elegance',
  MYSTERY: 'mystery',
  FREEDOM: 'freedom',
  STRENGTH: 'strength',
  WISDOM: 'wisdom',
  PASSION: 'passion',
  TRADITION: 'tradition',
  MODERN: 'modern',
  LUXURY: 'luxury'
};

// Database completo prodotti
export const PRODUCTS = [
  {
    id: 1,
    name: "Monarch Instinct",
    slug: "monarch-instinct",
    shortDescription: "Dominio. Silenzio. Potenza.",
    fullDescription: "Solo per chi guida, non segue. Il Monarch Instinct incarna la leadership naturale e l'istinto del comando. Ogni tratto è studiato per chi non ha bisogno di dimostrare il proprio potere, perché lo emana naturalmente.",
    
    // Pricing
    price: {
      current: 89,
      currency: "€",
      originalPrice: null, // Se in sconto
      discount: null
    },
    
    // Immagini
    images: {
      primary: "/products/Monarch.png",
      gallery: [
        "/products/Monarch.png",
        "/hero-images/1.png", // Immagini aggiuntive per il dettaglio
        "/hero-images/2.png"
      ],
      thumbnail: "/products/Monarch.png"
    },
    
    // Categorizzazione
    category: PRODUCT_CATEGORIES.ANIMALS,
    tags: [PRODUCT_TAGS.POWER, PRODUCT_TAGS.ELEGANCE, PRODUCT_TAGS.LUXURY],
    
    // Varianti (colori, taglie, etc.)
    variants: [
      {
        id: "monarch-black",
        name: "Midnight Black",
        color: "#000000",
        available: true,
        stock: 15
      },
      {
        id: "monarch-gold",
        name: "Royal Gold", 
        color: "#D4AF37",
        available: true,
        stock: 8
      }
    ],
    
    // Metadati
    isNew: false,
    isFeatured: true,
    isLimited: true,
    availability: "in_stock", // in_stock, low_stock, out_of_stock, pre_order
    stock: 23,
    
    // Dimensioni bolla (per layout masonry)
    bubbleSize: "large", // small, medium, large, xl
    aspectRatio: 0.7,
    
    // SEO & Social
    seo: {
      title: "Monarch Instinct - OnlyOne Exclusive",
      description: "Dominio naturale in forma d'arte. Pezzo unico per leader nati.",
      keywords: ["monarch", "leadership", "exclusive", "onlyone"]
    }
  },

  {
    id: 2,
    name: "Eyes of the Moon",
    slug: "eyes-of-the-moon",
    shortDescription: "Ombra preziosa, anima lucida.",
    fullDescription: "Per chi vola fuori rotta. Gli Eyes of the Moon catturano l'essenza del mistero felino e della saggezza notturna. Un pezzo che parla a chi trova bellezza nell'oscurità e forza nella solitudine.",
    
    price: {
      current: 75,
      currency: "€",
      originalPrice: null,
      discount: null
    },
    
    images: {
      primary: "/products/lion.png",
      gallery: [
        "/products/lion.png",
        "/hero-images/3.png",
        "/hero-images/4.png"
      ],
      thumbnail: "/products/lion.png"
    },
    
    category: PRODUCT_CATEGORIES.ANIMALS,
    tags: [PRODUCT_TAGS.MYSTERY, PRODUCT_TAGS.ELEGANCE, PRODUCT_TAGS.WISDOM],
    
    variants: [
      {
        id: "moon-silver",
        name: "Luna Silver",
        color: "#C0C0C0",
        available: true,
        stock: 12
      },
      {
        id: "moon-deep",
        name: "Deep Night",
        color: "#1a1a2e",
        available: true,
        stock: 6
      }
    ],
    
    isNew: true,
    isFeatured: false,
    isLimited: true,
    availability: "in_stock",
    stock: 18,
    
    bubbleSize: "medium",
    aspectRatio: 0.8,
    
    seo: {
      title: "Eyes of the Moon - Mystical OnlyOne",
      description: "Mistero felino e saggezza notturna. Per anime indipendenti.",
      keywords: ["cat", "moon", "mystery", "exclusive"]
    }
  },

  {
    id: 3,
    name: "New East",
    slug: "new-east",
    shortDescription: "Radici mobili. Libertà ferma.",
    fullDescription: "Non ti serve un porto. New East rappresenta l'equilibrio perfetto tra tradizione e modernità. Per chi porta le proprie radici ovunque vada, senza mai perdere la direzione.",
    
    price: {
      current: 92,
      currency: "€",
      originalPrice: 110,
      discount: 16
    },
    
    images: {
      primary: "/products/japan.png",
      gallery: [
        "/products/japan.png",
        "/hero-images/5.png",
        "/hero-images/6.png"
      ],
      thumbnail: "/products/japan.png"
    },
    
    category: PRODUCT_CATEGORIES.CULTURAL,
    tags: [PRODUCT_TAGS.TRADITION, PRODUCT_TAGS.MODERN, PRODUCT_TAGS.FREEDOM],
    
    variants: [
      {
        id: "east-crimson",
        name: "Crimson Rising",
        color: "#DC143C",
        available: true,
        stock: 10
      },
      {
        id: "east-ivory",
        name: "Ivory Zen",
        color: "#FFF8DC",
        available: false,
        stock: 0
      }
    ],
    
    isNew: false,
    isFeatured: true,
    isLimited: false,
    availability: "in_stock",
    stock: 10,
    
    bubbleSize: "large",
    aspectRatio: 0.6,
    
    seo: {
      title: "New East - Cultural OnlyOne",
      description: "Tradizione e modernità in equilibrio perfetto.",
      keywords: ["japan", "culture", "tradition", "modern"]
    }
  },

  {
    id: 4,
    name: "Dragon's Fire",
    slug: "dragons-fire", 
    shortDescription: "Nato per il fuoco.",
    fullDescription: "Creato per chi non chiede permesso. Dragon's Fire è l'incarnazione della forza primordiale e della passione indomabile. Per anime che bruciano di energia pura e non conoscono compromessi.",
    
    price: {
      current: 105,
      currency: "€",
      originalPrice: null,
      discount: null
    },
    
    images: {
      primary: "/products/dragon.png",
      gallery: [
        "/products/dragon.png",
        "/hero-images/7.png",
        "/hero-images/8.png"
      ],
      thumbnail: "/products/dragon.png"
    },
    
    category: PRODUCT_CATEGORIES.MYTHICAL,
    tags: [PRODUCT_TAGS.POWER, PRODUCT_TAGS.PASSION, PRODUCT_TAGS.STRENGTH],
    
    variants: [
      {
        id: "dragon-fire",
        name: "Flame Red",
        color: "#FF4500",
        available: true,
        stock: 5
      },
      {
        id: "dragon-ember",
        name: "Golden Ember",
        color: "#FFD700",
        available: true,
        stock: 7
      }
    ],
    
    isNew: false,
    isFeatured: true,
    isLimited: true,
    availability: "low_stock",
    stock: 12,
    
    bubbleSize: "xl",
    aspectRatio: 0.65,
    
    seo: {
      title: "Dragon's Fire - Mythical OnlyOne",
      description: "Forza primordiale per anime indomabili.",
      keywords: ["dragon", "fire", "power", "mythical"]
    }
  },

  {
    id: 5,
    name: "Capricorn's Path",
    slug: "capricorns-path",
    shortDescription: "Ambizione pura. Vetta eterna.",
    fullDescription: "Per chi scala senza guardare indietro. Capricorn's Path è dedicato agli instancabili, a chi trasforma ogni ostacolo in gradino. Un simbolo di determinazione che non conosce sconfitte.",
    
    price: {
      current: 78,
      currency: "€",
      originalPrice: null,
      discount: null
    },
    
    images: {
      primary: "/products/capricorno.png",
      gallery: [
        "/products/capricorno.png",
        "/hero-images/1.png",
        "/hero-images/3.png"
      ],
      thumbnail: "/products/capricorno.png"
    },
    
    category: PRODUCT_CATEGORIES.MYTHICAL,
    tags: [PRODUCT_TAGS.STRENGTH, PRODUCT_TAGS.WISDOM, PRODUCT_TAGS.POWER],
    
    variants: [
      {
        id: "capricorn-stone",
        name: "Mountain Stone",
        color: "#708090",
        available: true,
        stock: 14
      },
      {
        id: "capricorn-bronze",
        name: "Ancient Bronze",
        color: "#CD7F32",
        available: true,
        stock: 9
      }
    ],
    
    isNew: true,
    isFeatured: false,
    isLimited: false,
    availability: "in_stock",
    stock: 23,
    
    bubbleSize: "medium",
    aspectRatio: 0.75,
    
    seo: {
      title: "Capricorn's Path - Zodiac OnlyOne",
      description: "Ambizione e determinazione in forma d'arte.",
      keywords: ["capricorn", "zodiac", "ambition", "strength"]
    }
  },

  {
    id: 6,
    name: "Anchor's Hold",
    slug: "anchors-hold",
    shortDescription: "Stabilità nel caos. Pace nel moto.",
    fullDescription: "Per chi resta fermo quando tutto trema. Anchor's Hold rappresenta la forza della stabilità interiore e la capacità di rimanere centrati in ogni tempesta della vita.",
    
    price: {
      current: 67,
      currency: "€",
      originalPrice: 85,
      discount: 21
    },
    
    images: {
      primary: "/products/anchor.png",
      gallery: [
        "/products/anchor.png",
        "/hero-images/2.png",
        "/hero-images/4.png"
      ],
      thumbnail: "/products/anchor.png"
    },
    
    category: PRODUCT_CATEGORIES.NATURE,
    tags: [PRODUCT_TAGS.WISDOM, PRODUCT_TAGS.ELEGANCE, PRODUCT_TAGS.TRADITION],
    
    variants: [
      {
        id: "anchor-navy",
        name: "Deep Navy",
        color: "#000080",
        available: true,
        stock: 11
      },
      {
        id: "anchor-steel",
        name: "Steel Blue",
        color: "#4682B4",
        available: true,
        stock: 8
      }
    ],
    
    isNew: false,
    isFeatured: false,
    isLimited: false,
    availability: "in_stock",
    stock: 19,
    
    bubbleSize: "small",
    aspectRatio: 0.9,
    
    seo: {
      title: "Anchor's Hold - Maritime OnlyOne",
      description: "Stabilità interiore in ogni tempesta.",
      keywords: ["anchor", "stability", "maritime", "wisdom"]
    }
  },

  {
    id: 7,
    name: "Butterfly's Dream",
    slug: "butterflys-dream",
    shortDescription: "Trasformazione continua. Bellezza effimera.",
    fullDescription: "Per chi abbraccia il cambiamento come forma d'arte. Butterfly's Dream celebra la metamorfosi costante e la bellezza di chi non smette mai di evolversi.",
    
    price: {
      current: 58,
      currency: "€",
      originalPrice: null,
      discount: null
    },
    
    images: {
      primary: "/products/frafalla.png",
      gallery: [
        "/products/frafalla.png",
        "/hero-images/5.png",
        "/hero-images/7.png"
      ],
      thumbnail: "/products/frafalla.png"
    },
    
    category: PRODUCT_CATEGORIES.NATURE,
    tags: [PRODUCT_TAGS.FREEDOM, PRODUCT_TAGS.ELEGANCE, PRODUCT_TAGS.MODERN],
    
    variants: [
      {
        id: "butterfly-sunset",
        name: "Sunset Wings",
        color: "#FF6347",
        available: true,
        stock: 16
      },
      {
        id: "butterfly-lavender",
        name: "Lavender Fields",
        color: "#E6E6FA",
        available: true,
        stock: 12
      }
    ],
    
    isNew: true,
    isFeatured: false,
    isLimited: false,
    availability: "in_stock",
    stock: 28,
    
    bubbleSize: "medium",
    aspectRatio: 0.85,
    
    seo: {
      title: "Butterfly's Dream - Nature OnlyOne",
      description: "Metamorfosi e bellezza in continua evoluzione.",
      keywords: ["butterfly", "transformation", "nature", "freedom"]
    }
  }
];

// Funzioni utility per gestire i prodotti

/**
 * Ottieni prodotto per ID
 */
export const getProductById = (id) => {
  return PRODUCTS.find(product => product.id === parseInt(id));
};

/**
 * Ottieni prodotto per slug
 */
export const getProductBySlug = (slug) => {
  return PRODUCTS.find(product => product.slug === slug);
};

/**
 * Filtra prodotti per categoria
 */
export const getProductsByCategory = (category) => {
  return PRODUCTS.filter(product => product.category === category);
};

/**
 * Filtra prodotti per tag
 */
export const getProductsByTag = (tag) => {
  return PRODUCTS.filter(product => product.tags.includes(tag));
};

/**
 * Ottieni prodotti in evidenza
 */
export const getFeaturedProducts = () => {
  return PRODUCTS.filter(product => product.isFeatured);
};

/**
 * Ottieni nuovi prodotti
 */
export const getNewProducts = () => {
  return PRODUCTS.filter(product => product.isNew);
};

/**
 * Ottieni prodotti disponibili
 */
export const getAvailableProducts = () => {
  return PRODUCTS.filter(product => 
    product.availability === 'in_stock' || product.availability === 'low_stock'
  );
};

/**
 * Simula infinite scroll - restituisce batch di prodotti
 */
export const getProductsBatch = (page = 1, limit = 20) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    products: PRODUCTS.slice(startIndex, endIndex),
    hasMore: endIndex < PRODUCTS.length,
    total: PRODUCTS.length,
    page,
    limit
  };
};

/**
 * Ricerca prodotti per nome/descrizione
 */
export const searchProducts = (query) => {
  const searchTerm = query.toLowerCase();
  return PRODUCTS.filter(product => 
    product.name.toLowerCase().includes(searchTerm) ||
    product.shortDescription.toLowerCase().includes(searchTerm) ||
    product.fullDescription.toLowerCase().includes(searchTerm) ||
    product.tags.some(tag => tag.toLowerCase().includes(searchTerm))
  );
};

/**
 * Ordina prodotti
 */
export const sortProducts = (products, sortBy = 'featured') => {
  const sortedProducts = [...products];
  
  switch (sortBy) {
    case 'name_asc':
      return sortedProducts.sort((a, b) => a.name.localeCompare(b.name));
    
    case 'name_desc':
      return sortedProducts.sort((a, b) => b.name.localeCompare(a.name));
    
    case 'price_asc':
      return sortedProducts.sort((a, b) => a.price.current - b.price.current);
    
    case 'price_desc':
      return sortedProducts.sort((a, b) => b.price.current - a.price.current);
    
    case 'newest':
      return sortedProducts.sort((a, b) => {
        if (a.isNew && !b.isNew) return -1;
        if (!a.isNew && b.isNew) return 1;
        return 0;
      });
    
    case 'featured':
    default:
      return sortedProducts.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return 0;
      });
  }
};

// Export default del database completo
export default PRODUCTS;