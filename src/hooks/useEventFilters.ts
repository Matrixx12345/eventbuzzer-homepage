import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { externalSupabase as supabase } from '@/integrations/supabase/externalClient';

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

  // Dynamic category slug to ID mapping (loaded from Supabase)
  const [categorySlugToId, setCategorySlugToId] = useState<Record<string, number>>({});

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
      categoryId: null, // Will be set once categories are loaded
      mood: urlMood || null,
      city: urlCity,
      radius: urlRadius ? parseInt(urlRadius, 10) : 25,
      time: urlTime || null,
      date: urlDate ? new Date(urlDate) : undefined,
      search: urlSearch,
    };
  });

  // Load categories from Supabase to build slug-to-ID mapping
  useEffect(() => {
    const loadCategories = async () => {
      const { data, error } = await supabase
        .from("taxonomy")
        .select("id, slug")
        .eq("type", "main")
        .eq("is_active", true);

      if (error) {
        console.error("Error loading categories for filters:", error);
        return;
      }

      if (data) {
        const mapping: Record<string, number> = {};
        data.forEach((cat: any) => {
          mapping[cat.slug] = cat.id;
        });
        setCategorySlugToId(mapping);
      }
    };
    loadCategories();
  }, []);

  // Update filters when URL parameters OR categorySlugToId mapping changes
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
  }, [searchParams, categorySlugToId]);

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
