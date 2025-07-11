# Create Campaign Screen - Location Search Feature

## Overview

The CreateCampaignScreen now includes a comprehensive location selection feature that integrates with Google Maps Places API to provide real-time location autocomplete functionality.

## Features

### 🌍 Location Search Integration
- **Google Places API**: Integrated with Google Places Autocomplete API for accurate location suggestions
- **Real-time Search**: Live search results that update as the user types
- **Debounced Requests**: 300ms debounce delay to optimize API calls and improve performance
- **City Focus**: Configured to primarily suggest cities for better targeting

### 🔍 Search Experience
- **Minimum Query Length**: Requires at least 3 characters before triggering search
- **Loading States**: Visual feedback during search operations
- **Error Handling**: Graceful error handling with user-friendly messages
- **Empty States**: Informative messages for different scenarios

### 📱 User Interface
- **Modal Interface**: Clean modal overlay for location selection
- **Search Input**: Dedicated search field with search icon
- **Results List**: Scrollable list of location suggestions
- **Selected Locations**: Chip-based display of selected locations with remove functionality

## Technical Implementation

### TanStack Query Integration
The location search feature uses TanStack Query for optimal data fetching:

```typescript
const { 
  data: locationSearchResults = [], 
  isLoading: isLocationSearching, 
  error: locationSearchError 
} = useLocationSearch(debouncedLocationQuery);
```

### Debouncing
Search queries are debounced to prevent excessive API calls:

```typescript
useEffect(() => {
  const timeoutId = setTimeout(() => {
    setDebouncedLocationQuery(locationSearchQuery);
  }, 300);
  return () => clearTimeout(timeoutId);
}, [locationSearchQuery]);
```

### Error Handling
Comprehensive error handling includes:
- Network connectivity issues
- API quota limits
- Invalid responses
- User-friendly error messages

## Configuration

### Google Maps API Setup
The feature uses the Google Maps API key configured in:
- `src/config/googleMapsConfig.ts` - Main configuration
- Android `google-services.json` - Platform-specific key

### API Configuration
```typescript
export const GOOGLE_MAPS_CONFIG = {
  API_KEY: 'AIzaSyBamdG5TwWa4VjiVHo1rk4zgyMWHE4JQJc',
  PLACES_AUTOCOMPLETE_CONFIG: {
    types: '(cities)',
    language: 'en',
  },
  REQUEST_TIMEOUT: 10000,
  RATE_LIMIT: {
    maxRequestsPerMinute: 60,
    debounceDelay: 300,
  },
};
```

## Usage

### Adding Locations
1. Tap the "Add Location" button in the Audience Targeting section
2. Type at least 3 characters in the search field
3. Select from the suggested locations
4. The location will be added to the campaign targeting

### Removing Locations
1. Find the location chip in the selected locations list
2. Tap the "X" icon on the location chip
3. The location will be removed from targeting

## Data Flow

```
User Input → Debounced Query → TanStack Query → Google Places API → Results Display
     ↓
Selected Location → Campaign State → API Submission
```

## Testing

### Unit Tests
Comprehensive test suite covers:
- Location search functionality
- Debouncing behavior
- Error handling
- User interactions
- API integration

### Test File
`src/screens/adPassbook/__tests__/CreateCampaignScreen.test.tsx`

### Running Tests
```bash
npm test CreateCampaignScreen.test.tsx
```

## Performance Optimizations

### Caching
- TanStack Query provides automatic caching
- 10-minute stale time for location data
- Intelligent background refetching

### Rate Limiting
- 300ms debounce delay
- Maximum 60 requests per minute
- Automatic retry with exponential backoff

### Memory Management
- Automatic cleanup of timeouts
- Efficient re-rendering with React.memo patterns
- Optimized list rendering with FlatList

## Error Scenarios

### Handled Errors
1. **Network Connectivity**: Graceful fallback with user notification
2. **API Quota Exceeded**: No retry attempts, user-friendly message
3. **Invalid API Key**: Clear error message for developers
4. **Malformed Responses**: Validation and fallback handling

### Fallback Behavior
When API calls fail, the system:
1. Shows an error alert to the user
2. Provides demo location data for development
3. Maintains app functionality without crashing

## Future Enhancements

### Planned Features
- **Country Filtering**: Restrict searches to specific countries
- **Recent Locations**: Cache and suggest recently used locations
- **Geolocation**: Auto-detect user's current location
- **Custom Locations**: Allow manual location entry
- **Location Validation**: Verify location accuracy before submission

### Performance Improvements
- **Offline Support**: Cache popular locations for offline use
- **Predictive Search**: Pre-load common location suggestions
- **Advanced Caching**: Implement more sophisticated caching strategies

## Dependencies

### Required Packages
- `@tanstack/react-query`: Data fetching and caching
- `react-native-vector-icons`: UI icons
- `@react-native-async-storage/async-storage`: Local storage

### API Dependencies
- Google Places API
- Google Maps Platform account
- Valid API key with Places API enabled

## Troubleshooting

### Common Issues
1. **No Search Results**: Check API key validity and quota
2. **Slow Performance**: Verify network connectivity and API response times
3. **App Crashes**: Check error boundaries and exception handling

### Debug Mode
Enable debug logging by setting:
```typescript
console.log('[LocationSearch] Debug mode enabled');
```

## Security Considerations

### API Key Protection
- API key should be moved to environment variables in production
- Implement API key rotation strategy
- Monitor API usage and set up alerts

### Data Privacy
- Location data is not stored permanently
- User consent should be obtained for location targeting
- Comply with GDPR and other privacy regulations
