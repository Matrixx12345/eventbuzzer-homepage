import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Hook that scrolls to top of page when route changes
 * Prevents users from seeing page content scrolled down when navigating to new pages
 */
export const useScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
};
