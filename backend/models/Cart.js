// backend/models/Cart.js
const db = require('./database');

class Cart {
  constructor() {
    this.initTables();
  }

  // Inizializza tabelle database
  async initTables() {
    const createCartItemsTable = `
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
    `;

    try {
      await db.run(createCartItemsTable);
      console.log('✅ Cart tables initialized');
    } catch (error) {
      console.error('❌ Cart tables initialization failed:', error);
      throw error;
    }
  }

  // Genera ID univoco per cart item
  generateCartItemId() {
    return `cart_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Aggiungi item al carrello
  async addItem(itemData) {
    const {
      sessionId,
      productId,
      variantId = null,
      printifyVariantId = null,
      pricePerItem,
      productTitle,
      variantTitle = null,
      imageUrl = null,
      crossSell = false
    } = itemData;

    // Validazione dati obbligatori
    if (!sessionId || !productId || !pricePerItem || !productTitle) {
      throw new Error('Missing required cart item data');
    }

    const itemId = this.generateCartItemId();

    const insertQuery = `
      INSERT OR REPLACE INTO cart_items (
        id, session_id, product_id, variant_id, printify_variant_id,
        price_per_item, product_title, variant_title, image_url, cross_sell, added_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `;

    try {
      await db.run(insertQuery, [
        itemId,
        sessionId,
        productId,
        variantId,
        printifyVariantId,
        pricePerItem,
        productTitle,
        variantTitle,
        imageUrl,
        crossSell ? 1 : 0
      ]);

      console.log(`✅ Cart item added: ${itemId}`);
      return await this.getItem(itemId);
      
    } catch (error) {
      console.error('❌ Add cart item error:', error);
      throw error;
    }
  }

  // Recupera singolo item per ID
  async getItem(itemId) {
    const query = `SELECT * FROM cart_items WHERE id = ?`;
    
    try {
      const row = await db.get(query, [itemId]);
      return row ? this.formatCartItem(row) : null;
    } catch (error) {
      console.error('❌ Get cart item error:', error);
      throw error;
    }
  }

  // Recupera tutti gli items di una sessione
  async getCartItems(sessionId) {
    const query = `
      SELECT * FROM cart_items 
      WHERE session_id = ? 
      ORDER BY added_at DESC
    `;

    try {
      const rows = await db.all(query, [sessionId]);
      return rows.map(row => this.formatCartItem(row));
    } catch (error) {
      console.error('❌ Get cart items error:', error);
      throw error;
    }
  }

  // Conta items nel carrello
  async getCartCount(sessionId) {
    const query = `SELECT COUNT(*) as count FROM cart_items WHERE session_id = ?`;
    
    try {
      const result = await db.get(query, [sessionId]);
      return result.count || 0;
    } catch (error) {
      console.error('❌ Get cart count error:', error);
      throw error;
    }
  }

  // Calcola totale carrello
  async getCartTotal(sessionId) {
    const query = `
      SELECT 
        COUNT(*) as itemCount,
        SUM(price_per_item) as subtotal
      FROM cart_items 
      WHERE session_id = ?
    `;

    try {
      const result = await db.get(query, [sessionId]);
      return {
        itemCount: result.itemCount || 0,
        subtotal: result.subtotal || 0,
        total: result.subtotal || 0
      };
    } catch (error) {
      console.error('❌ Get cart total error:', error);
      throw error;
    }
  }

  // Rimuovi singolo item
  async removeItem(itemId) {
    const query = `DELETE FROM cart_items WHERE id = ?`;
    
    try {
      const result = await db.run(query, [itemId]);
      
      if (result.changes === 0) {
        throw new Error('Cart item not found');
      }
      
      console.log(`✅ Cart item removed: ${itemId}`);
      return { success: true, removedItemId: itemId };
      
    } catch (error) {
      console.error('❌ Remove cart item error:', error);
      throw error;
    }
  }

  // Svuota carrello completo
  async clearCart(sessionId) {
    const query = `DELETE FROM cart_items WHERE session_id = ?`;
    
    try {
      const result = await db.run(query, [sessionId]);
      
      console.log(`✅ Cart cleared: ${result.changes} items removed`);
      return { 
        success: true, 
        removedItems: result.changes,
        sessionId: sessionId
      };
      
    } catch (error) {
      console.error('❌ Clear cart error:', error);
      throw error;
    }
  }

  // Verifica se item esiste nel carrello
  async itemExists(sessionId, productId, variantId = null) {
    const query = `
      SELECT id FROM cart_items 
      WHERE session_id = ? AND product_id = ? AND variant_id IS ?
    `;
    
    try {
      const result = await db.get(query, [sessionId, productId, variantId]);
      return !!result;
    } catch (error) {
      console.error('❌ Check item exists error:', error);
      throw error;
    }
  }

  // Formatta cart item per frontend
  formatCartItem(row) {
    return {
      id: row.id,
      sessionId: row.session_id,
      productId: row.product_id,
      variantId: row.variant_id,
      printifyVariantId: row.printify_variant_id,
      pricePerItem: row.price_per_item,
      productTitle: row.product_title,
      variantTitle: row.variant_title,
      imageUrl: row.image_url,
      crossSell: !!row.cross_sell,
      addedAt: row.added_at
    };
  }

  // Stats per monitoring
  async getStats() {
    const queries = {
      totalItems: `SELECT COUNT(*) as count FROM cart_items`,
      totalSessions: `SELECT COUNT(DISTINCT session_id) as count FROM cart_items`,
      avgItemsPerSession: `
        SELECT AVG(item_count) as avg FROM (
          SELECT COUNT(*) as item_count FROM cart_items GROUP BY session_id
        )
      `
    };

    try {
      const stats = {};
      
      for (const [key, query] of Object.entries(queries)) {
        const result = await db.get(query);
        stats[key] = result.count || result.avg || 0;
      }

      return stats;
    } catch (error) {
      console.error('❌ Get cart stats error:', error);
      throw error;
    }
  }

  // Pulizia items vecchi
  async cleanupOldItems(daysOld = 30) {
    const query = `
      DELETE FROM cart_items 
      WHERE added_at < datetime('now', '-${daysOld} days')
    `;
    
    try {
      const result = await db.run(query);
      console.log(`✅ Cleaned up ${result.changes} old cart items`);
      return result.changes;
    } catch (error) {
      console.error('❌ Cleanup old cart items error:', error);
      throw error;
    }
  }
}

module.exports = new Cart();