import { useState, useCallback } from 'react';
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

export const useEventFilters = () => {
  const [searchParams] = useSearchParams();

  const [filters, setFilters] = useState<FilterState>({
    category: null,
    categoryId: null,
    mood: searchParams.get('tags') || null,
    city: "",
    radius: 25,
    time: null,
    date: undefined,
    search: searchParams.get('source') || "",
  });

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
