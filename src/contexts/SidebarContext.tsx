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
    const stored = localStorage.getItem('sidebarState');
    return isMobile ? 'collapsed' : stored === 'collapsed' ? 'collapsed' : 'expanded';
  });
  const [open, setOpen] = useState(!isMobile);
  const [openMobile, setOpenMobile] = useState(false);

  useEffect(() => {
    if (!isMobile) {
      localStorage.setItem('sidebarState', state);
    }
  }, [state, isMobile]);

  const toggleSidebar = () => {
    if (isMobile) {
      setOpenMobile(prev => !prev);
    } else {
      setState(prev => (prev === 'expanded' ? 'collapsed' : 'expanded'));
      setOpen(prev => !prev);
    }
  };

  return (
    <SidebarContext.Provider      value={{
        state,
        open,
        setOpen,
        openMobile,
        setOpenMobile,
        isMobile,
        toggleSidebar,
        isCollapsed: state === 'collapsed',
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
};
