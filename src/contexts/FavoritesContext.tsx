import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface FavoriteEvent {
  id: string;
  slug: string;
  title: string;
  venue: string;
  location: string;
  image: string;
  date?: string;
  addedAt: number;
}

interface FavoritesContextType {
  favorites: FavoriteEvent[];
  addFavorite: (event: Omit<FavoriteEvent, "addedAt">) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (event: Omit<FavoriteEvent, "addedAt">) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};

export const FavoritesProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<FavoriteEvent[]>(() => {
    const stored = localStorage.getItem("eventbuzzer-favorites");
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem("eventbuzzer-favorites", JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (event: Omit<FavoriteEvent, "addedAt">) => {
    setFavorites((prev) => {
      if (prev.some((f) => f.id === event.id)) return prev;
      return [...prev, { ...event, addedAt: Date.now() }];
    });
  };

  const removeFavorite = (id: string) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const isFavorite = (id: string) => {
    return favorites.some((f) => f.id === id);
  };

  const toggleFavorite = (event: Omit<FavoriteEvent, "addedAt">) => {
    if (isFavorite(event.id)) {
      removeFavorite(event.id);
    } else {
      addFavorite(event);
    }
  };

  return (
    <FavoritesContext.Provider
      value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};
