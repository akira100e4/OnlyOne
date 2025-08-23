import React, { useState, useEffect } from 'react';
import printifyService from '../services/printifyService';

const DebugPrintify = () => {
  const [loading, setLoading] = useState(false);
  const [shopProducts, setShopProducts] = useState([]);
  const [error, setError] = useState(null);

  const loadShopProducts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔍 Caricamento prodotti dal tuo shop Printify...');
      const result = await printifyService.getShopProducts();
      
      console.log('📦 Prodotti ricevuti da Printify:', result);
      setShopProducts(result.data || []);
      
      if (result.data && result.data.length > 0) {
        console.log('✅ Primo prodotto esempio:', result.data[0]);
      }
    } catch (err) {
      console.error('❌ Errore caricamento shop Printify:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const testProductDetails = async (productId) => {
    try {
      console.log(`🔍 Caricamento dettagli prodotto ${productId}...`);
      const details = await printifyService.getProductDetails(productId);
      console.log('📋 Dettagli prodotto:', details);
      
      if (details) {
        const colors = await printifyService.getAvailableColors(productId);
        console.log('🎨 Colori disponibili:', colors);
        
        const sizes = await printifyService.getAvailableSizes(productId);
        console.log('📏 Taglie disponibili:', sizes);
      }
    } catch (err) {
      console.error('❌ Errore dettagli prodotto:', err);
    }
  };

  useEffect(() => {
    loadShopProducts();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      background: '#f5f5f5', 
      margin: '20px', 
      borderRadius: '8px',
      fontFamily: 'monospace'
    }}>
      <h2>🔧 Debug Printify API</h2>
      
      <button 
        onClick={loadShopProducts}
        disabled={loading}
        style={{
          padding: '10px 20px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Caricamento...' : 'Ricarica Prodotti Shop'}
      </button>

      {error && (
        <div style={{ 
          padding: '10px', 
          background: '#ff4444', 
          color: 'white', 
          borderRadius: '4px',
          marginBottom: '20px'
        }}>
          <strong>Errore API:</strong> {error}
        </div>
      )}

      <div style={{ marginBottom: '20px' }}>
        <strong>📊 Statistiche Shop:</strong>
        <ul>
          <li>Prodotti trovati: {shopProducts.length}</li>
          <li>API Status: {error ? '❌ Errore' : '✅ OK'}</li>
        </ul>
      </div>

      {shopProducts.length > 0 && (
        <div>
          <h3>📦 Prodotti nel tuo Shop Printify:</h3>
          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {shopProducts.map((product, index) => (
              <div 
                key={product.id} 
                style={{ 
                  border: '1px solid #ddd', 
                  padding: '10px', 
                  margin: '5px 0',
                  borderRadius: '4px',
                  background: 'white'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>#{index + 1} - ID: {product.id}</strong>
                    <div>📝 Titolo: "{product.title}"</div>
                    <div>🏷️ Tags: {product.tags?.join(', ') || 'Nessun tag'}</div>
                    <div>📊 Varianti: {product.variants?.length || 0}</div>
                  </div>
                  <button
                    onClick={() => testProductDetails(product.id)}
                    style={{
                      padding: '5px 10px',
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '3px',
                      cursor: 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    Test Dettagli
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {shopProducts.length === 0 && !loading && !error && (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          background: '#fff3cd', 
          borderRadius: '4px' 
        }}>
          ⚠️ Nessun prodotto trovato nel shop Printify
        </div>
      )}

      <div style={{ marginTop: '20px', fontSize: '12px', color: '#666' }}>
        <strong>💡 Come usare questo debug:</strong>
        <ol>
          <li>Clicca "Ricarica Prodotti Shop" per vedere cosa c'è nel tuo shop Printify</li>
          <li>Controlla i titoli dei prodotti Printify vs i tuoi nomi locali</li>
          <li>Clicca "Test Dettagli" per vedere colori e varianti</li>
          <li>Apri Console del browser (F12) per log dettagliati</li>
        </ol>
      </div>
    </div>
  );
};

export default DebugPrintify;