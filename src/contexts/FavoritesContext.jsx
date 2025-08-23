// src/contexts/FavoritesContext.jsx - ENHANCED VERSION
import React, { createContext, useContext } from 'react';
import useFavorites from '../hooks/useFavorites';

// Crea il Context
const FavoritesContext = createContext();

// Custom hook per usare il context
export const useFavoritesContext = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavoritesContext deve essere usato dentro FavoritesProvider');
  }
  return context;
};

// Provider Component
export const FavoritesProvider = ({ children }) => {
  // Istanza unica dell'hook
  const favoritesState = useFavorites();

  return (
    <FavoritesContext.Provider value={favoritesState}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;