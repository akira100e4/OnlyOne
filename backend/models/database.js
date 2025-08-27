// backend/models/database.js (SOSTITUISCI COMPLETAMENTE)
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '../data/onlyone.db');

class Database {
  constructor() {
    this.db = null;
    this.isConnected = false;
    this.init();
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(DB_PATH, (err) => {
        if (err) {
          console.error('❌ Database connection failed:', err);
          reject(err);
        } else {
          console.log('✅ Database connected:', DB_PATH);
          this.isConnected = true;
          this.setupTables().then(resolve).catch(reject);
        }
      });
    });
  }

  async setupTables() {
    console.log('🔧 Setting up database tables...');
    
    try {
      // Abilita foreign keys
      await this.run('PRAGMA foreign_keys = ON');
      
      // Tabella principale per cache prodotti (esistente)
      await this.run(`
        CREATE TABLE IF NOT EXISTS products_cache (
          id TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 🛒 NUOVA: Tabella cart items
      await this.run(`
        CREATE TABLE IF NOT EXISTS cart_items (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          variant_id TEXT,
          printify_variant_id INTEGER,
          price_per_item REAL NOT NULL,
          product_title TEXT NOT NULL,
          variant_title TEXT,
          image_url TEXT,
          cross_sell BOOLEAN DEFAULT 0,
          added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(session_id, product_id, variant_id)
        )
      `);

      // 🛒 INDICI per prestazioni cart
      await this.run(`
        CREATE INDEX IF NOT EXISTS idx_cart_session 
        ON cart_items(session_id)
      `);

      await this.run(`
        CREATE INDEX IF NOT EXISTS idx_cart_added_at 
        ON cart_items(added_at)
      `);

      // 🛒 FUTURA: Tabella ordini (per checkout)
      await this.run(`
        CREATE TABLE IF NOT EXISTS orders (
          id TEXT PRIMARY KEY,
          session_id TEXT NOT NULL,
          customer_email TEXT,
          customer_name TEXT,
          customer_address TEXT,
          status TEXT DEFAULT 'pending',
          subtotal REAL NOT NULL,
          shipping REAL DEFAULT 0,
          tax REAL DEFAULT 0,
          total REAL NOT NULL,
          printify_order_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 🛒 FUTURA: Tabella order items
      await this.run(`
        CREATE TABLE IF NOT EXISTS order_items (
          id TEXT PRIMARY KEY,
          order_id TEXT NOT NULL,
          product_id TEXT NOT NULL,
          variant_id TEXT,
          printify_variant_id INTEGER,
          price_per_item REAL NOT NULL,
          product_title TEXT NOT NULL,
          variant_title TEXT,
          image_url TEXT,
          cross_sell BOOLEAN DEFAULT 0,
          FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
        )
      `);

      // Tabella per sessioni utente (future use)
      await this.run(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
          user_agent TEXT,
          ip_address TEXT
        )
      `);

      console.log('✅ All database tables ready');
      
    } catch (error) {
      console.error('❌ Database setup failed:', error);
      throw error;
    }
  }

  // Wrapper per query con Promise
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('❌ Database run error:', err);
          console.error('SQL:', sql);
          console.error('Params:', params);
          reject(err);
        } else {
          resolve({ 
            lastID: this.lastID, 
            changes: this.changes 
          });
        }
      });
    });
  }

  // Wrapper per query singola con Promise
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          console.error('❌ Database get error:', err);
          console.error('SQL:', sql);
          console.error('Params:', params);
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Wrapper per query multiple con Promise
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('❌ Database all error:', err);
          console.error('SQL:', sql);
          console.error('Params:', params);
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  // Esegui query in transazione
  async transaction(queries) {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run('BEGIN TRANSACTION');
        
        try {
          const results = [];
          
          for (const { sql, params } of queries) {
            this.db.run(sql, params, function(err) {
              if (err) {
                this.db.run('ROLLBACK');
                reject(err);
                return;
              }
              results.push({
                lastID: this.lastID,
                changes: this.changes
              });
            });
          }
          
          this.db.run('COMMIT', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(results);
            }
          });
          
        } catch (error) {
          this.db.run('ROLLBACK');
          reject(error);
        }
      });
    });
  }

  // Health check database
  async healthCheck() {
    try {
      await this.get('SELECT 1 as health');
      return {
        connected: this.isConnected,
        status: 'healthy',
        path: DB_PATH
      };
    } catch (error) {
      return {
        connected: false,
        status: 'unhealthy',
        error: error.message,
        path: DB_PATH
      };
    }
  }

  // Statistiche database
  async getStats() {
    try {
      const [
        productsCount,
        cartItemsCount,
        ordersCount,
        sessionsCount
      ] = await Promise.all([
        this.get('SELECT COUNT(*) as count FROM products_cache'),
        this.get('SELECT COUNT(*) as count FROM cart_items'),
        this.get('SELECT COUNT(*) as count FROM orders'),
        this.get('SELECT COUNT(*) as count FROM user_sessions')
      ]);

      return {
        products: productsCount?.count || 0,
        cartItems: cartItemsCount?.count || 0,
        orders: ordersCount?.count || 0,
        sessions: sessionsCount?.count || 0,
        isConnected: this.isConnected
      };
      
    } catch (error) {
      console.error('❌ Database stats error:', error);
      return {
        error: error.message,
        isConnected: this.isConnected
      };
    }
  }

  // Pulizia database (manutenzione)
  async cleanup(daysOld = 30) {
    try {
      console.log(`🧹 Cleaning up database (>${daysOld} days old)...`);
      
      const results = await Promise.all([
        // Pulisci cart items vecchi
        this.run(`
          DELETE FROM cart_items 
          WHERE added_at < datetime('now', '-${daysOld} days')
        `),
        
        // Pulisci sessioni inattive
        this.run(`
          DELETE FROM user_sessions 
          WHERE last_activity < datetime('now', '-${daysOld} days')
        `),
        
        // Pulisci cache prodotti vecchia (opzionale)
        this.run(`
          DELETE FROM products_cache 
          WHERE updated_at < datetime('now', '-${daysOld * 2} days')
        `)
      ]);

      const totalCleaned = results.reduce((sum, r) => sum + (r.changes || 0), 0);
      
      console.log(`✅ Database cleanup completed: ${totalCleaned} records removed`);
      
      return {
        cleaned: totalCleaned,
        cartItems: results[0].changes,
        sessions: results[1].changes,
        cache: results[2].changes
      };
      
    } catch (error) {
      console.error('❌ Database cleanup error:', error);
      throw error;
    }
  }

  // Chiusura connessione
  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('❌ Database close error:', err);
          } else {
            console.log('✅ Database connection closed');
          }
          this.isConnected = false;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

// Singleton instance
const database = new Database();

module.exports = database;