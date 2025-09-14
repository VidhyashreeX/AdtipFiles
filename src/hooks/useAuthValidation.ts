import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const useAuthValidation = () => {
  const { setUser } = useAuth();

  useEffect(() => {
    const validateToken = async () => {
      const token = localStorage.getItem('UserLoggedIn');
      const storedUser = localStorage.getItem('user');

      if (token && storedUser) {
        // No backend validation, just set user from localStorage
        setUser(JSON.parse(storedUser));
      } else {
        // No valid auth data
        setUser(null);
      }
    };

    // Validate token on mount
    validateToken();
  }, [setUser]);
};
