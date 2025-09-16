// src/data/surveys.js - Mock data for survey offerwalls

export const surveyProviders = [
  {
    id: 'swagbucks',
    name: 'Swagbucks',
    description: 'Complete surveys & earn rewards',
    icon: '💰',
    color: '#FF6B35',
    gradientColors: ['#FF6B35', '#FF8E53'],
    url: 'https://www.swagbucks.com',
    earnings: '₹5-50',
    estimatedTime: '5-15 min',
    rating: 4.5,
    isActive: true
  },
  {
    id: 'toloka',
    name: 'Toloka',
    description: 'AI training tasks & micro jobs',
    icon: '🤖',
    color: '#4A90E2',
    gradientColors: ['#4A90E2', '#357ABD'],
    url: 'https://toloka.yandex.com',
    earnings: '₹2-25',
    estimatedTime: '2-10 min',
    rating: 4.3,
    isActive: true
  },
  {
    id: 'surveytime',
    name: 'SurveyTime',
    description: 'Quick surveys, instant rewards',
    icon: '⏰',
    color: '#50C878',
    gradientColors: ['#50C878', '#45B566'],
    url: 'https://surveytime.app',
    earnings: '₹10-30',
    estimatedTime: '3-12 min',
    rating: 4.2,
    isActive: true
  },
  {
    id: 'prime_opinion',
    name: 'Prime Opinion',
    description: 'Premium survey platform',
    icon: '⭐',
    color: '#9B59B6',
    gradientColors: ['#9B59B6', '#8E44AD'],
    url: 'https://www.primeopinion.com',
    earnings: '₹8-40',
    estimatedTime: '4-18 min',
    rating: 4.4,
    isActive: false // Coming soon
  },
  {
    id: 'opinion_world',
    name: 'Opinion World',
    description: 'Global surveys & rewards',
    icon: '🌍',
    color: '#E74C3C',
    gradientColors: ['#E74C3C', '#C0392B'],
    url: 'https://www.opinionworld.com',
    earnings: '₹6-35',
    estimatedTime: '5-20 min',
    rating: 4.1,
    isActive: false // Coming soon
  }
];

// Helper function to get active survey providers
export const getActiveSurveyProviders = () => {
  return surveyProviders.filter(provider => provider.isActive);
};

// Helper function to get coming soon survey providers
export const getComingSoonSurveyProviders = () => {
  return surveyProviders.filter(provider => !provider.isActive);
};

// Helper function to get survey provider by id
export const getSurveyProviderById = (id) => {
  return surveyProviders.find(provider => provider.id === id);
};