import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiGetCompanyList } from '@/api';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Component that checks if the user has an existing company and redirects accordingly
 * - If user has a company, redirects to seller dashboard
 * - If user doesn't have a company, redirects to seller registration
 */
const BecomeAdvertiserRedirect: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkExistingCompany = async () => {
      try {
        if (!user?.id) {
          // Redirect to login if user is not authenticated
          navigate('/login', { replace: true });
          return;
        }

        // Check if user already has a company
        const companiesResponse = await apiGetCompanyList(user.id.toString());
        if (companiesResponse.data && companiesResponse.data.status === 200) {
          const companiesList = companiesResponse.data.data || [];
          if (companiesList.length > 0) {
            // Store the selected company
            localStorage.setItem('selectedCompany', JSON.stringify(companiesList[0]));
            // Redirect to seller dashboard if user already has company
            navigate('/seller/dashboard', { replace: true });
            return;
          }
        }
        
        // If no company found, redirect to the registration page
        navigate('/become-seller-full', { replace: true });
      } catch (error) {
        console.error('Error checking company:', error);
        // On error, redirect to registration page as fallback
        navigate('/become-seller-full', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    checkExistingCompany();
  }, [navigate, user]);

  // Show a loading spinner while checking
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adtip-teal mx-auto mb-4"></div>
        <p className="text-gray-600">Checking account status...</p>
      </div>
    </div>
  );
};

export default BecomeAdvertiserRedirect;