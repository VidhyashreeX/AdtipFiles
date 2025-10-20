import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { initAuthRedirect } from '../utils/authRedirect';

interface AuthModalContextType {
  showLoginModal: boolean;
  showOTPModal: boolean;
  phoneNumber: string;
  email: string;
  tempUserId: string;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  openOTPModal: (phone: string, userId: string) => void;
  closeOTPModal: () => void;
  setPhoneNumber: (phone: string) => void;
  setEmail: (email: string) => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const useAuthModal = () => {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error('useAuthModal must be used within AuthModalProvider');
  }
  return context;
};

export const AuthModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [tempUserId, setTempUserId] = useState('');

  const openLoginModal = () => {
    setShowLoginModal(true);
  };

  const closeLoginModal = () => {
    setShowLoginModal(false);
  };

  const openOTPModal = (phone: string, userId: string) => {
    setPhoneNumber(phone);
    setTempUserId(userId);
    setShowLoginModal(false);
    setShowOTPModal(true);
  };

  const closeOTPModal = () => {
    setShowOTPModal(false);
    setPhoneNumber('');
    setEmail('');
    setTempUserId('');
  };

  // Initialize the centralized auth redirect system
  useEffect(() => {
    initAuthRedirect({
      openLoginModal,
      openOTPModal
    });
  }, []);

  return (
    <AuthModalContext.Provider
      value={{
        showLoginModal,
        showOTPModal,
        phoneNumber,
        email,
        tempUserId,
        openLoginModal,
        closeLoginModal,
        openOTPModal,
        closeOTPModal,
        setPhoneNumber,
        setEmail,
      }}
    >
      {children}
    </AuthModalContext.Provider>
  );
};
