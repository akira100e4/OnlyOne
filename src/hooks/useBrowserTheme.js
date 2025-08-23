// src/hooks/useBrowserTheme.js
import { useEffect } from 'react';

const useBrowserTheme = (themeColor = '#181818') => {
  useEffect(() => {
    console.log(`🎨 Cambiando tema browser a: ${themeColor}`);
    
    // 1. Aggiorna il meta tag theme-color principale
    let themeColorMeta = document.querySelector('meta[name="theme-color"]:not([media])');
    if (!themeColorMeta) {
      themeColorMeta = document.createElement('meta');
      themeColorMeta.name = 'theme-color';
      document.head.appendChild(themeColorMeta);
    }
    themeColorMeta.content = themeColor;
    
    // 2. Aggiorna i meta tag con media queries
    const updateMediaTheme = (media) => {
      let mediaMeta = document.querySelector(`meta[name="theme-color"][media="${media}"]`);
      if (!mediaMeta) {
        mediaMeta = document.createElement('meta');
        mediaMeta.name = 'theme-color';
        mediaMeta.media = media;
        document.head.appendChild(mediaMeta);
      }
      mediaMeta.content = themeColor;
    };
    
    updateMediaTheme('(prefers-color-scheme: light)');
    updateMediaTheme('(prefers-color-scheme: dark)');
    
    // 3. Safari iOS - Status bar style
    let appleMeta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!appleMeta) {
      appleMeta = document.createElement('meta');
      appleMeta.name = 'apple-mobile-web-app-status-bar-style';
      document.head.appendChild(appleMeta);
    }
    
    // Determina lo stile in base al colore
    const isDark = themeColor === '#181818';
    appleMeta.content = isDark ? 'black-translucent' : 'default';
    
    // 4. Edge/Chrome - Navigation button color  
    let msNavMeta = document.querySelector('meta[name="msapplication-navbutton-color"]');
    if (!msNavMeta) {
      msNavMeta = document.createElement('meta');
      msNavMeta.name = 'msapplication-navbutton-color';
      document.head.appendChild(msNavMeta);
    }
    msNavMeta.content = themeColor;
    
    // 5. Color scheme hint
    let colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
    if (!colorSchemeMeta) {
      colorSchemeMeta = document.createElement('meta');
      colorSchemeMeta.name = 'color-scheme';
      document.head.appendChild(colorSchemeMeta);
    }
    colorSchemeMeta.content = isDark ? 'dark' : 'light';
    
    console.log(`✅ Tema browser aggiornato: ${isDark ? 'SCURO' : 'CHIARO'}`);
    
  }, [themeColor]);
};

export default useBrowserTheme;