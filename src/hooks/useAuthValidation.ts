import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useAuthValidation = () => {
  const { setUser } = useAuth();

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('UserLoggedIn');
      const storedUser = localStorage.getItem('user');

      console.log('🔐 useAuthValidation - checking stored auth data:', {
        hasToken: !!token,
        hasUser: !!storedUser
      });

      if (token && storedUser) {
        // No backend validation, just set user from localStorage
        setUser(JSON.parse(storedUser));
        console.log('👤 User data set in context:', JSON.parse(storedUser));
      } else {
        // No valid auth data
        setUser(null);
        console.log('🔐 No stored auth data found');
      }
    };

    // Validate token on mount
    validateToken();
  }, [setUser]);
};
