import React, { createContext, useContext, useState, useEffect } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface SidebarContextType {
  state: 'expanded' | 'collapsed';
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
  isCollapsed: boolean;
}

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isMobile = useIsMobile();
  const [state, setState] = useState<'expanded' | 'collapsed'>(() => {
    // Respect previously stored preference. If none exists, default to
    // 'collapsed' on desktop (first visit should show sidebar closed).
    try {
      const stored = localStorage.getItem('sidebarState');
      if (isMobile) return 'collapsed';
      if (stored === 'expanded' || stored === 'collapsed') return stored as 'expanded' | 'collapsed';
      return 'collapsed';
    } catch (e) {
      return isMobile ? 'collapsed' : 'collapsed';
    }
  });
  const [open, setOpen] = useState(() => !isMobile && state === 'expanded');
  const [openMobile, setOpenMobile] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebarState', state);
    }
  }, [state, isMobile]);

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(prev => !prev);
    } else {
      setState(prev => (prev === 'expanded' ? 'collapsed' : 'expanded'));
      setOpen(prev => !prev);
    }
  }, [isMobile]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = React.useMemo(
    () => ({
      state,
      open,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggleSidebar,
      isCollapsed: state === 'collapsed',
    }),
    [state, open, openMobile, isMobile, toggleSidebar]
  );

  return (
    <SidebarContext.Provider value={contextValue}>
      {children}
    </SidebarContext.Provider>
  );
};
