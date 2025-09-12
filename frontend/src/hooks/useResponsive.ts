import { useState, useEffect } from 'react';

export type Breakpoint = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isLargeDesktop: boolean;
  currentBreakpoint: Breakpoint;
  width: number;
  height: number;
}

const breakpoints = {
  xs: 0,
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1400
};

export function useResponsive(): ResponsiveState {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isLargeDesktop: false,
    currentBreakpoint: 'xs',
    width: 0,
    height: 0
  });

  useEffect(() => {
    function updateResponsiveState() {
      const width = window.innerWidth;
      const height = window.innerHeight;

      let currentBreakpoint: Breakpoint = 'xs';
      
      if (width >= breakpoints['2xl']) currentBreakpoint = '2xl';
      else if (width >= breakpoints.xl) currentBreakpoint = 'xl';
      else if (width >= breakpoints.lg) currentBreakpoint = 'lg';
      else if (width >= breakpoints.md) currentBreakpoint = 'md';
      else if (width >= breakpoints.sm) currentBreakpoint = 'sm';
      else currentBreakpoint = 'xs';

      setState({
        isMobile: width < breakpoints.md,
        isTablet: width >= breakpoints.md && width < breakpoints.lg,
        isDesktop: width >= breakpoints.lg && width < breakpoints['2xl'],
        isLargeDesktop: width >= breakpoints['2xl'],
        currentBreakpoint,
        width,
        height
      });
    }

    // Initial call
    updateResponsiveState();

    // Add event listener
    window.addEventListener('resize', updateResponsiveState);

    // Cleanup
    return () => window.removeEventListener('resize', updateResponsiveState);
  }, []);

  return state;
}

export function useBreakpoint(breakpoint: Breakpoint): boolean {
  const { currentBreakpoint } = useResponsive();
  const breakpointOrder: Breakpoint[] = ['xs', 'sm', 'md', 'lg', 'xl', '2xl'];
  
  const currentIndex = breakpointOrder.indexOf(currentBreakpoint);
  const targetIndex = breakpointOrder.indexOf(breakpoint);
  
  return currentIndex >= targetIndex;
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}

// Predefined media queries
export const mediaQueries = {
  mobile: '(max-width: 767px)',
  tablet: '(min-width: 768px) and (max-width: 1023px)',
  desktop: '(min-width: 1024px)',
  largeDesktop: '(min-width: 1400px)',
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  darkMode: '(prefers-color-scheme: dark)',
  reducedMotion: '(prefers-reduced-motion: reduce)'
};

// Hook for common responsive patterns
export function useResponsivePatterns() {
  const { isMobile, isTablet, isDesktop, isLargeDesktop } = useResponsive();
  
  return {
    // Layout patterns
    showSidebar: isDesktop || isLargeDesktop,
    showMobileMenu: isMobile || isTablet,
    useCompactLayout: isMobile,
    useStandardLayout: isTablet || isDesktop,
    useExpandedLayout: isLargeDesktop,
    
    // Component patterns
    showFullNavigation: isDesktop || isLargeDesktop,
    showHamburgerMenu: isMobile || isTablet,
    useCardLayout: isMobile || isTablet,
    useTableLayout: isDesktop || isLargeDesktop,
    useGridLayout: isDesktop || isLargeDesktop,
    
    // Text patterns
    useSmallText: isMobile,
    useMediumText: isTablet,
    useLargeText: isDesktop || isLargeDesktop,
    
    // Spacing patterns
    useCompactSpacing: isMobile,
    useStandardSpacing: isTablet || isDesktop,
    useExpandedSpacing: isLargeDesktop,
    
    // Interaction patterns
    useTouchInteractions: isMobile || isTablet,
    useMouseInteractions: isDesktop || isLargeDesktop,
    showHoverEffects: isDesktop || isLargeDesktop,
    
    // Content patterns
    showFullContent: isDesktop || isLargeDesktop,
    showCondensedContent: isMobile || isTablet,
    useMultiColumnLayout: isDesktop || isLargeDesktop,
    useSingleColumnLayout: isMobile || isTablet
  };
}
