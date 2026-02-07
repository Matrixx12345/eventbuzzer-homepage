import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export interface FilterState {
  category: string | null;
  categoryId: number | null;
  mood: string | null;
  city: string;
  radius: number;
  time: string | null;
  date: Date | undefined;
  search: string;
}

// Category slug to ID mapping
const categorySlugToId: Record<string, number> = {
  "musik-party": 1,
  "kunst-kultur": 2,
  "kulinarik-genuss": 3,
  "natur-ausfluege": 4,
  "maerkte-stadtfeste": 5,
};

export const useEventFilters = () => {
  const [searchParams] = useSearchParams();

  // Initialize filters from URL parameters on mount
  const [filters, setFilters] = useState<FilterState>(() => {
    const urlCategory = searchParams.get('category');
    const urlMood = searchParams.get('quickFilter') || searchParams.get('tags');
    const urlCity = searchParams.get('city') || "";
    const urlRadius = searchParams.get('radius');
    const urlTime = searchParams.get('time');
    const urlDate = searchParams.get('date');
    const urlSearch = searchParams.get('source') || searchParams.get('search') || "";

    return {
      category: urlCategory || null,
      categoryId: urlCategory ? categorySlugToId[urlCategory] || null : null,
      mood: urlMood || null,
      city: urlCity,
      radius: urlRadius ? parseInt(urlRadius, 10) : 25,
      time: urlTime || null,
      date: urlDate ? new Date(urlDate) : undefined,
      search: urlSearch,
    };
  });

  // Update filters when URL parameters change
  useEffect(() => {
    const urlCategory = searchParams.get('category');
    const urlMood = searchParams.get('quickFilter') || searchParams.get('tags');
    const urlCity = searchParams.get('city') || "";
    const urlRadius = searchParams.get('radius');
    const urlTime = searchParams.get('time');
    const urlDate = searchParams.get('date');
    const urlSearch = searchParams.get('source') || searchParams.get('search') || "";

    setFilters({
      category: urlCategory || null,
      categoryId: urlCategory ? categorySlugToId[urlCategory] || null : null,
      mood: urlMood || null,
      city: urlCity,
      radius: urlRadius ? parseInt(urlRadius, 10) : 25,
      time: urlTime || null,
      date: urlDate ? new Date(urlDate) : undefined,
      search: urlSearch,
    });
  }, [searchParams]);

  const handleCategoryChange = useCallback((categoryId: number | null, categorySlug: string | null) => {
    setFilters(prev => ({ ...prev, categoryId, category: categorySlug }));
  }, []);

  const handleMoodChange = useCallback((mood: string | null) => {
    setFilters(prev => ({ ...prev, mood }));
  }, []);

  const handleCityChange = useCallback((city: string) => {
    setFilters(prev => ({ ...prev, city }));
  }, []);

  const handleRadiusChange = useCallback((radius: number) => {
    setFilters(prev => ({ ...prev, radius }));
  }, []);

  const handleTimeChange = useCallback((time: string | null) => {
    setFilters(prev => ({ ...prev, time }));
  }, []);

  const handleDateChange = useCallback((date: Date | undefined) => {
    setFilters(prev => ({ ...prev, date }));
  }, []);

  const handleSearchChange = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  return {
    filters,
    handleCategoryChange,
    handleMoodChange,
    handleCityChange,
    handleRadiusChange,
    handleTimeChange,
    handleDateChange,
    handleSearchChange,
  };
};
