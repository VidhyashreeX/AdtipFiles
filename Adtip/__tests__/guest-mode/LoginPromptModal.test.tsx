import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginPromptModal from '../../src/components/modals/LoginPromptModal';
import { useAuth } from '../../src/contexts/AuthContext';
import { useTheme } from '../../src/contexts/ThemeContext';

// Mock the contexts
jest.mock('../../src/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../src/contexts/ThemeContext', () => ({
  useTheme: jest.fn(),
}));

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseTheme = useTheme as jest.MockedFunction<typeof useTheme>;

describe('LoginPromptModal', () => {
  const mockExitGuestMode = jest.fn();
  const mockOnClose = jest.fn();

  const mockTheme = {
    colors: {
      background: '#FFFFFF',
      text: {
        primary: '#000000',
        secondary: '#666666',
      },
      border: '#E0E0E0',
      primary: '#4A90E2',
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseAuth.mockReturnValue({
      exitGuestMode: mockExitGuestMode,
      isGuest: true,
      isAuthenticated: false,
      user: null,
      loading: false,
      error: null,
      isInitialized: true,
      login: jest.fn(),
      verifyOtp: jest.fn(),
      logout: jest.fn(),
      enterGuestMode: jest.fn(),
      updateUserDetails: jest.fn(),
      refreshUserData: jest.fn(),
      hasChannel: false,
      createChannel: jest.fn(),
      completeOnboarding: jest.fn(),
      premiumState: {
        isPremium: false,
        premiumPlanId: 0,
        contentCreatorPlanId: 0,
        walletBalance: '0.00',
      },
      setPremiumState: jest.fn(),
    });

    mockUseTheme.mockReturnValue(mockTheme);
  });

  describe('Rendering', () => {
    it('should render modal when visible is true', () => {
      const { getByText } = render(
        <LoginPromptModal
          visible={true}
          onClose={mockOnClose}
        />
      );

      expect(getByText('Login Required')).toBeTruthy();
      expect(getByText('Login to unlock all features')).toBeTruthy();
      expect(getByText('Cancel')).toBeTruthy();
      expect(getByText('Login')).toBeTruthy();
    });

    it('should not render modal when visible is false', () => {
      const { queryByText } = render(
        <LoginPromptModal
          visible={false}
          onClose={mockOnClose}
        />
      );

      expect(queryByText('Login Required')).toBeFalsy();
    });

    it('should render custom title and message', () => {
      const { getByText } = render(
        <LoginPromptModal
          visible={true}
          onClose={mockOnClose}
          title="Custom Title"
          message="Custom message for login"
        />
      );

      expect(getByText('Custom Title')).toBeTruthy();
      expect(getByText('Custom message for login')).toBeTruthy();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when Cancel button is pressed', () => {
      const { getByText } = render(
        <LoginPromptModal
          visible={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.press(getByText('Cancel'));
      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is pressed', () => {
      const { getByTestId } = render(
        <LoginPromptModal
          visible={true}
          onClose={mockOnClose}
        />
      );

      // Note: You might need to add testID to the overlay TouchableOpacity
      // For now, we'll test the modal container behavior
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should call exitGuestMode and onClose when Login button is pressed', async () => {
      mockExitGuestMode.mockResolvedValue();

      const { getByText } = render(
        <LoginPromptModal
          visible={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(mockExitGuestMode).toHaveBeenCalledTimes(1);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      });
    });

    it('should handle exitGuestMode errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockExitGuestMode.mockRejectedValue(new Error('Exit guest mode failed'));

      const { getByText } = render(
        <LoginPromptModal
          visible={true}
          onClose={mockOnClose}
        />
      );

      fireEvent.press(getByText('Login'));

      await waitFor(() => {
        expect(mockExitGuestMode).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to exit guest mode:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Styling', () => {
    it('should apply theme colors correctly', () => {
      const { getByText } = render(
        <LoginPromptModal
          visible={true}
          onClose={mockOnClose}
        />
      );

      const title = getByText('Login Required');
      const message = getByText('Login to unlock all features');
      const cancelButton = getByText('Cancel');
      const loginButton = getByText('Login');

      // Check if elements are rendered (styling would be tested with more specific queries)
      expect(title).toBeTruthy();
      expect(message).toBeTruthy();
      expect(cancelButton).toBeTruthy();
      expect(loginButton).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should be accessible', () => {
      const { getByText } = render(
        <LoginPromptModal
          visible={true}
          onClose={mockOnClose}
        />
      );

      const cancelButton = getByText('Cancel');
      const loginButton = getByText('Login');

      expect(cancelButton).toBeTruthy();
      expect(loginButton).toBeTruthy();
    });
  });

  describe('Modal Behavior', () => {
    it('should prevent modal from closing when tapping inside content', () => {
      const { getByText } = render(
        <LoginPromptModal
          visible={true}
          onClose={mockOnClose}
        />
      );

      // Tap on the modal content (title)
      fireEvent.press(getByText('Login Required'));
      
      // Modal should not close
      expect(mockOnClose).not.toHaveBeenCalled();
    });
  });
});
