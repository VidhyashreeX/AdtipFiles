import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import CreateCampaignScreen from '../CreateCampaignScreen';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    goBack: jest.fn(),
  }),
  useRoute: () => ({
    params: {},
  }),
}));

jest.mock('../../../contexts/TabNavigatorContext', () => ({
  useTabNavigator: () => ({
    contentPaddingBottom: 80,
  }),
}));

jest.mock('../../../services/ApiService');
jest.mock('../../../services/CloudflareUploadService');
jest.mock('react-native-image-picker');
jest.mock('react-native-create-thumbnail');

// Mock Google Maps API response
const mockGooglePlacesResponse = {
  predictions: [
    {
      place_id: 'ChIJOwg_06VPwokRYv534QaPC8g',
      description: 'New York, NY, USA',
      structured_formatting: {
        main_text: 'New York',
        secondary_text: 'NY, USA',
      },
      types: ['locality', 'political'],
      terms: [
        { offset: 0, value: 'New York' },
        { offset: 10, value: 'NY' },
        { offset: 14, value: 'USA' },
      ],
    },
    {
      place_id: 'ChIJE9on3F3HwoAR9AhGJW_fL-I',
      description: 'Los Angeles, CA, USA',
      structured_formatting: {
        main_text: 'Los Angeles',
        secondary_text: 'CA, USA',
      },
      types: ['locality', 'political'],
      terms: [
        { offset: 0, value: 'Los Angeles' },
        { offset: 13, value: 'CA' },
        { offset: 17, value: 'USA' },
      ],
    },
  ],
  status: 'OK',
};

// Mock fetch for Google Places API
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(mockGooglePlacesResponse),
  })
) as jest.Mock;

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = createTestQueryClient();
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

describe('CreateCampaignScreen Location Search', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders location search functionality', async () => {
    render(
      <TestWrapper>
        <CreateCampaignScreen />
      </TestWrapper>
    );

    // Check if the "Add Location" button is present
    expect(screen.getByText('Add Location')).toBeTruthy();
  });

  it('opens location search modal when Add Location is pressed', async () => {
    render(
      <TestWrapper>
        <CreateCampaignScreen />
      </TestWrapper>
    );

    // Press the Add Location button
    fireEvent.press(screen.getByText('Add Location'));

    // Check if modal opens
    await waitFor(() => {
      expect(screen.getByText('Select Locations')).toBeTruthy();
      expect(screen.getByPlaceholderText('Search for cities, states, countries...')).toBeTruthy();
    });
  });

  it('performs location search with debouncing', async () => {
    render(
      <TestWrapper>
        <CreateCampaignScreen />
      </TestWrapper>
    );

    // Open the location modal
    fireEvent.press(screen.getByText('Add Location'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search for cities, states, countries...')).toBeTruthy();
    });

    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search for cities, states, countries...');
    fireEvent.changeText(searchInput, 'New York');

    // Wait for debounced search to trigger
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('maps.googleapis.com/maps/api/place/autocomplete/json'),
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    }, { timeout: 1000 });
  });

  it('displays search results correctly', async () => {
    render(
      <TestWrapper>
        <CreateCampaignScreen />
      </TestWrapper>
    );

    // Open the location modal
    fireEvent.press(screen.getByText('Add Location'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search for cities, states, countries...')).toBeTruthy();
    });

    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search for cities, states, countries...');
    fireEvent.changeText(searchInput, 'New York');

    // Wait for search results to appear
    await waitFor(() => {
      expect(screen.getByText('New York')).toBeTruthy();
      expect(screen.getByText('NY, USA')).toBeTruthy();
      expect(screen.getByText('Los Angeles')).toBeTruthy();
      expect(screen.getByText('CA, USA')).toBeTruthy();
    });
  });

  it('adds location when search result is selected', async () => {
    render(
      <TestWrapper>
        <CreateCampaignScreen />
      </TestWrapper>
    );

    // Open the location modal
    fireEvent.press(screen.getByText('Add Location'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search for cities, states, countries...')).toBeTruthy();
    });

    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search for cities, states, countries...');
    fireEvent.changeText(searchInput, 'New York');

    // Wait for search results and select one
    await waitFor(() => {
      expect(screen.getByText('New York')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('New York'));

    // Check if location was added and modal closed
    await waitFor(() => {
      expect(screen.queryByText('Select Locations')).toBeNull();
    });

    // Check if the selected location appears in the campaign
    expect(screen.getByText('New York')).toBeTruthy();
  });

  it('shows appropriate empty states', async () => {
    render(
      <TestWrapper>
        <CreateCampaignScreen />
      </TestWrapper>
    );

    // Open the location modal
    fireEvent.press(screen.getByText('Add Location'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search for cities, states, countries...')).toBeTruthy();
    });

    // Check initial empty state
    expect(screen.getByText('Type at least 3 characters to search')).toBeTruthy();

    // Type less than 3 characters
    const searchInput = screen.getByPlaceholderText('Search for cities, states, countries...');
    fireEvent.changeText(searchInput, 'NY');

    // Should still show the same message
    expect(screen.getByText('Type at least 3 characters to search')).toBeTruthy();
  });

  it('handles API errors gracefully', async () => {
    // Mock fetch to return an error
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(
      <TestWrapper>
        <CreateCampaignScreen />
      </TestWrapper>
    );

    // Open the location modal
    fireEvent.press(screen.getByText('Add Location'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search for cities, states, countries...')).toBeTruthy();
    });

    // Type in the search input
    const searchInput = screen.getByPlaceholderText('Search for cities, states, countries...');
    fireEvent.changeText(searchInput, 'New York');

    // Wait for error handling
    await waitFor(() => {
      // The error should be handled gracefully without crashing
      expect(screen.getByPlaceholderText('Search for cities, states, countries...')).toBeTruthy();
    });
  });

  it('removes selected locations', async () => {
    render(
      <TestWrapper>
        <CreateCampaignScreen />
      </TestWrapper>
    );

    // First, add a location
    fireEvent.press(screen.getByText('Add Location'));

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search for cities, states, countries...')).toBeTruthy();
    });

    const searchInput = screen.getByPlaceholderText('Search for cities, states, countries...');
    fireEvent.changeText(searchInput, 'New York');

    await waitFor(() => {
      expect(screen.getByText('New York')).toBeTruthy();
    });

    fireEvent.press(screen.getByText('New York'));

    // Wait for modal to close and location to be added
    await waitFor(() => {
      expect(screen.queryByText('Select Locations')).toBeNull();
    });

    // Now find and press the remove button (X icon)
    const removeButtons = screen.getAllByTestId('remove-location');
    if (removeButtons.length > 0) {
      fireEvent.press(removeButtons[0]);
    }

    // Check if location was removed
    await waitFor(() => {
      expect(screen.queryByText('New York')).toBeNull();
    });
  });
});
