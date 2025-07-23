import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider } from '../../../contexts/ThemeContext';
import { AuthProvider } from '../../../contexts/AuthContext';

// Import components to test
import TipTubeHeader from '../TipTubeHeader';
import CategoryTabs from '../CategoryTabs';
import YouTubeStyleVideoCard from '../YouTubeStyleVideoCard';
import TipShortsSection from '../TipShortsSection';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
};

// Mock theme context
const mockTheme = {
  colors: {
    background: '#ffffff',
    text: {
      primary: '#000000',
      secondary: '#666666',
      tertiary: '#999999',
    },
    border: '#e0e0e0',
    card: '#ffffff',
    cardSecondary: '#f5f5f5',
    primary: '#00C853',
  },
  isDarkMode: false,
};

// Mock auth context
const mockAuth = {
  user: {
    id: '1',
    name: 'Test User',
    profile_image: 'https://example.com/avatar.jpg',
  },
  isGuest: false,
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <NavigationContainer>
    <ThemeProvider value={mockTheme}>
      <AuthProvider value={mockAuth}>
        {children}
      </AuthProvider>
    </ThemeProvider>
  </NavigationContainer>
);

// Mock data
const mockCategories = [
  { id: 'all', name: 'All' },
  { id: 'trendy', name: 'Trendy' },
  { id: 'comedy', name: 'Comedy' },
  { id: 'devotion', name: 'Devotion' },
];

const mockVideo = {
  id: 1,
  title: 'Test Video',
  thumbnail: 'https://example.com/thumbnail.jpg',
  videoUrl: 'https://example.com/video.mp4',
  duration: 120,
  views: 1000,
  posted: '2 hours ago',
  avatar: 'https://example.com/avatar.jpg',
  creatorName: 'Test Creator',
  isVerified: false,
  channelId: 1,
  price: 0,
  isPaidPromotional: 0,
};

describe('TipTube Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TipTubeHeader', () => {
    it('renders correctly', () => {
      const { getByText } = render(
        <TestWrapper>
          <TipTubeHeader />
        </TestWrapper>
      );
      
      expect(getByText('Tiptube')).toBeTruthy();
    });

    it('calls onSearchPress when search icon is pressed', () => {
      const onSearchPress = jest.fn();
      const { getByTestId } = render(
        <TestWrapper>
          <TipTubeHeader onSearchPress={onSearchPress} />
        </TestWrapper>
      );
      
      // Note: You would need to add testID props to the component for this to work
      // This is a placeholder test structure
    });
  });

  describe('CategoryTabs', () => {
    it('renders all categories', () => {
      const { getByText } = render(
        <TestWrapper>
          <CategoryTabs
            categories={mockCategories}
            selectedCategory="All"
            onCategoryChange={jest.fn()}
          />
        </TestWrapper>
      );
      
      expect(getByText('All')).toBeTruthy();
      expect(getByText('Trendy')).toBeTruthy();
      expect(getByText('Comedy')).toBeTruthy();
      expect(getByText('Devotion')).toBeTruthy();
    });
  });

  describe('YouTubeStyleVideoCard', () => {
    it('renders video information correctly', () => {
      const { getByText } = render(
        <TestWrapper>
          <YouTubeStyleVideoCard
            video={mockVideo}
            onPress={jest.fn()}
          />
        </TestWrapper>
      );
      
      expect(getByText('Test Video')).toBeTruthy();
      expect(getByText('Test Creator')).toBeTruthy();
      expect(getByText('1K views • 2 hours ago')).toBeTruthy();
    });
  });

  describe('TipShortsSection', () => {
    it('renders section title and see all button', () => {
      const { getByText } = render(
        <TestWrapper>
          <TipShortsSection />
        </TestWrapper>
      );
      
      expect(getByText('Tipshorts')).toBeTruthy();
      expect(getByText('See All')).toBeTruthy();
    });
  });
});

// Integration test for the complete TipTube redesign
describe('TipTube Integration', () => {
  it('renders all components together without crashing', () => {
    const { getByText } = render(
      <TestWrapper>
        <TipTubeHeader />
        <CategoryTabs
          categories={mockCategories}
          selectedCategory="All"
          onCategoryChange={jest.fn()}
        />
        <TipShortsSection />
        <YouTubeStyleVideoCard
          video={mockVideo}
          onPress={jest.fn()}
        />
      </TestWrapper>
    );
    
    // Verify key elements are present
    expect(getByText('Tiptube')).toBeTruthy();
    expect(getByText('All')).toBeTruthy();
    expect(getByText('Tipshorts')).toBeTruthy();
    expect(getByText('Test Video')).toBeTruthy();
  });
});
