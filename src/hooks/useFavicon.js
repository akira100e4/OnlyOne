// src/hooks/useFavicon.js
import { useEffect } from 'react';

export default function useFavicon(lightIcon, darkIcon) {
  useEffect(() => {
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');

    const updateFavicon = (isDark) => {
      const favicon = document.querySelector("link[rel='icon']") || document.createElement('link');
      favicon.rel = 'icon';
      favicon.type = 'image/png';
      favicon.href = isDark ? darkIcon : lightIcon;
      document.head.appendChild(favicon);
    };

    updateFavicon(matchMedia.matches); // iniziale
    matchMedia.addEventListener('change', (e) => updateFavicon(e.matches)); // cambia live

    return () => {
      matchMedia.removeEventListener('change', (e) => updateFavicon(e.matches));
    };
  }, [lightIcon, darkIcon]);
}
