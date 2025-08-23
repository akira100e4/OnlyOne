// backend/models/database.js
var sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class Database {
  constructor() {
    const dbPath = path.join(__dirname, '../data/onlyone.db');
    
    // Crea cartella data se non esiste
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    this.db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('Errore apertura database:', err);
      } else {
        console.log('✅ Database SQLite connesso:', dbPath);
      }
    });

    // Inizializza le tabelle SINCRONAMENTE
    this.initTablesSync();
  }

  initTablesSync() {
    // Usa serialize per garantire che le query vengano eseguite in ordine
    this.db.serialize(() => {
      // Tabella prodotti OnlyOne
      this.db.run(`
        CREATE TABLE IF NOT EXISTS products (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          printify_id TEXT NOT NULL UNIQUE,
          onlyone_id TEXT NOT NULL UNIQUE,
          handle TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          description TEXT,
          status TEXT DEFAULT 'pending',
          price_min REAL,
          price_max REAL,
          currency TEXT DEFAULT 'EUR',
          images TEXT,
          variants TEXT,
          external_data TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          published_at DATETIME
        )
      `);

      // Tabella webhook events per idempotenza
      this.db.run(`
        CREATE TABLE IF NOT EXISTS webhook_events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          event_id TEXT NOT NULL UNIQUE,
          event_type TEXT NOT NULL,
          resource_type TEXT NOT NULL,
          resource_id TEXT NOT NULL,
          action TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          payload TEXT,
          processed_at DATETIME,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          retry_count INTEGER DEFAULT 0,
          error_message TEXT
        )
      `);

      // Tabella ordini (per dopo)
      this.db.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          printify_order_id TEXT NOT NULL UNIQUE,
          onlyone_order_id TEXT NOT NULL UNIQUE,
          customer_email TEXT,
          status TEXT DEFAULT 'created',
          total_amount REAL,
          items TEXT,
          shipping_address TEXT,
          tracking_info TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Indici per performance
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_products_printify_id ON products(printify_id)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_products_handle ON products(handle)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_products_status ON products(status)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id)`);
      this.db.run(`CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status)`, () => {
        console.log('✅ Tabelle database inizializzate');
      });
    });
  }

  // --- Products Methods ---
  async createProduct(productData) {
    return new Promise((resolve, reject) => {
      const {
        printify_id,
        onlyone_id,
        handle,
        title,
        description,
        price_min,
        price_max,
        currency,
        images,
        variants,
        external_data
      } = productData;

      const stmt = this.db.prepare(`
        INSERT INTO products (
          printify_id, onlyone_id, handle, title, description,
          price_min, price_max, currency, images, variants, external_data,
          status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
      `);

      stmt.run([
        printify_id,
        onlyone_id,
        handle,
        title,
        description || '',
        price_min,
        price_max,
        currency || 'EUR',
        JSON.stringify(images || []),
        JSON.stringify(variants || []),
        JSON.stringify(external_data || {})
      ], function(err) {
        stmt.finalize();
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, onlyone_id, handle });
        }
      });
    });
  }

  async getProductByPrintifyId(printifyId) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM products WHERE printify_id = ?',
        [printifyId],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row) {
              // Parse JSON fields
              row.images = JSON.parse(row.images || '[]');
              row.variants = JSON.parse(row.variants || '[]');
              row.external_data = JSON.parse(row.external_data || '{}');
            }
            resolve(row);
          }
        }
      );
    });
  }

  async getProductByHandle(handle) {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM products WHERE handle = ?',
        [handle],
        (err, row) => {
          if (err) {
            reject(err);
          } else {
            if (row) {
              row.images = JSON.parse(row.images || '[]');
              row.variants = JSON.parse(row.variants || '[]');
              row.external_data = JSON.parse(row.external_data || '{}');
            }
            resolve(row);
          }
        }
      );
    });
  }

  async updateProductStatus(printifyId, status, external_data = null) {
    return new Promise((resolve, reject) => {
      let query = 'UPDATE products SET status = ?, updated_at = CURRENT_TIMESTAMP';
      let params = [status, printifyId];
      
      if (status === 'published') {
        query += ', published_at = CURRENT_TIMESTAMP';
      }
      
      if (external_data) {
        query += ', external_data = ?';
        params = [status, JSON.stringify(external_data), printifyId];
      }
      
      query += ' WHERE printify_id = ?';

      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  async getAllProducts(status = null) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM products';
      let params = [];
      
      if (status) {
        query += ' WHERE status = ?';
        params = [status];
      }
      
      query += ' ORDER BY created_at DESC';

      this.db.all(query, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          // Parse JSON fields
          const products = rows.map(row => ({
            ...row,
            images: JSON.parse(row.images || '[]'),
            variants: JSON.parse(row.variants || '[]'),
            external_data: JSON.parse(row.external_data || '{}')
          }));
          resolve(products);
        }
      });
    });
  }

  // --- Webhook Events Methods ---
  async createWebhookEvent(eventData) {
    return new Promise((resolve, reject) => {
      const {
        event_id,
        event_type,
        resource_type,
        resource_id,
        action,
        payload
      } = eventData;

      const stmt = this.db.prepare(`
        INSERT INTO webhook_events (
          event_id, event_type, resource_type, resource_id, action, payload
        ) VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run([
        event_id,
        event_type,
        resource_type,
        resource_id,
        action,
        JSON.stringify(payload)
      ], function(err) {
        stmt.finalize();
        if (err) {
          if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            // Event already exists (idempotency)
            resolve({ exists: true, event_id });
          } else {
            reject(err);
          }
        } else {
          resolve({ id: this.lastID, event_id });
        }
      });
    });
  }

  async updateWebhookEventStatus(eventId, status, errorMessage = null) {
    return new Promise((resolve, reject) => {
      let query = 'UPDATE webhook_events SET status = ?, processed_at = CURRENT_TIMESTAMP';
      let params = [status, eventId];
      
      if (errorMessage) {
        query += ', error_message = ?, retry_count = retry_count + 1';
        params = [status, errorMessage, eventId];
      }
      
      query += ' WHERE event_id = ?';

      this.db.run(query, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  async getPendingWebhookEvents() {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM webhook_events WHERE status = ? ORDER BY created_at ASC',
        ['pending'],
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            const events = rows.map(row => ({
              ...row,
              payload: JSON.parse(row.payload || '{}')
            }));
            resolve(events);
          }
        }
      );
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve) => {
      this.db.close((err) => {
        if (err) {
          console.error('Errore chiusura database:', err);
        } else {
          console.log('Database chiuso');
        }
        resolve();
      });
    });
  }
}

// Export singleton instance
const database = new Database();
module.exports = database;