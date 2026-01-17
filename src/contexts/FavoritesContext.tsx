import React, { createContext, useContext, useState, useEffect } from 'react';

export interface FavoriteEvent {
  id: string;
  slug: string;
  title: string;
  venue: string;
  image: string;
  location: string;
  date: string;
  addedAt?: number;
}

interface FavoritesContextType {
  favorites: FavoriteEvent[];
  toggleFavorite: (event: FavoriteEvent) => void;
  isFavorite: (eventId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType>({
  favorites: [],
  toggleFavorite: () => {},
  isFavorite: () => false,
});

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

const STORAGE_KEY = 'eventbuzzer_favorites';

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>([]);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setFavorites(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading favorites from localStorage:', error);
      setFavorites([]);
    }
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    } catch (error) {
      console.error('Error saving favorites to localStorage:', error);
    }
  }, [favorites]);

  const toggleFavorite = (event: FavoriteEvent) => {
    setFavorites((prev) => {
      const exists = prev.some((fav) => fav.id === event.id);

      if (exists) {
        // Remove from favorites
        return prev.filter((fav) => fav.id !== event.id);
      } else {
        // Add to favorites with timestamp
        return [...prev, { ...event, addedAt: Date.now() }];
      }
    });
  };

  const isFavorite = (eventId: string) => {
    return favorites.some((fav) => fav.id === eventId);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};
