// scripts/generateManifest.js — versione ESM compatibile con "type":"module"

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// __dirname compat in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurazione
const PRODUCTS_DIR = path.join(__dirname, '..', 'public', 'prodotti');
const MANIFEST_PATH = path.join(PRODUCTS_DIR, 'manifest.json');
const VALID_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp']);

// Pattern di altezze per creare varietà visiva
const HEIGHT_PATTERN = ['sm', 'md', 'lg', 'md', 'sm', 'lg'];

/**
 * Converte il nome del file in un titolo leggibile
 */
function fileNameToTitle(filename) {
  let name = filename.replace(/\.[^/.]+$/, '');
  try {
    name = decodeURIComponent(name);
  } catch (_) {}
  name = name.replace(/[_-]/g, ' ');
  name = name.replace(/\s?\d+$/, '');
  name = name.replace(/\s?final$/i, '');
  name = name.replace(/\s+/g, ' ').trim();
  name = name.replace(/\b\w+/g, (word) => {
    if (word === word.toUpperCase() && word.length > 1) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  });
  return name;
}

/**
 * Genera un ID slug dal titolo
 */
function titleToSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Genera il manifest dei prodotti
 */
async function generateManifest() {
  console.log('🔍 Cercando immagini in:', PRODUCTS_DIR);

  // Crea la directory se non esiste
  try {
    await fs.access(PRODUCTS_DIR);
  } catch {
    console.log('📁 Creazione directory prodotti...');
    await fs.mkdir(PRODUCTS_DIR, { recursive: true });
    console.log('⚠️  Directory creata. Aggiungi le immagini in public/prodotti/ e riesegui lo script.');
    return;
  }

  // Leggi tutti i file nella directory
  const files = await fs.readdir(PRODUCTS_DIR);

  // Filtra solo le immagini valide
  const imageFiles = files.filter((file) => VALID_EXTENSIONS.has(path.extname(file).toLowerCase()));

  if (imageFiles.length === 0) {
    console.log('⚠️  Nessuna immagine trovata in public/prodotti/');
    console.log('   Estensioni supportate:', [...VALID_EXTENSIONS].join(', '));

    await fs.writeFile(MANIFEST_PATH, JSON.stringify([], null, 2), 'utf8');
    console.log('📝 Creato manifest vuoto:', MANIFEST_PATH);
    return;
  }

  console.log(`📸 Trovate ${imageFiles.length} immagini`);

  // Ordina i file per nome (per consistenza)
  imageFiles.sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

  // Genera il manifest
  const manifest = imageFiles.map((filename, index) => {
    const title = fileNameToTitle(filename);
    const id = titleToSlug(title);
    const height = HEIGHT_PATTERN[index % HEIGHT_PATTERN.length];

    return {
      id: id || `product-${index}`,
      src: `/prodotti/${filename}`,
      title: title || `Prodotto ${index + 1}`,
      height,
      originalFilename: filename,
    };
  });

  // Scrivi il manifest
  await fs.writeFile(MANIFEST_PATH, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('✅ Manifest generato con successo!');
  console.log(`📝 File creato: ${MANIFEST_PATH}`);
  console.log(`📊 Prodotti nel catalogo: ${manifest.length}`);

  // Anteprima
  console.log('\n📋 Anteprima prodotti:');
  manifest.slice(0, 5).forEach((p) => {
    console.log(`   - ${p.title} (${p.height}) -> ${p.originalFilename}`);
  });
  if (manifest.length > 5) {
    console.log(`   ... e altri ${manifest.length - 5} prodotti`);
  }
}

// Esegui lo script
generateManifest().catch((error) => {
  console.error('❌ Errore durante la generazione del manifest:', error);
  process.exit(1);
});
