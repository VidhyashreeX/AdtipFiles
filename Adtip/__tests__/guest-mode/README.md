# Guest Mode Testing Suite

This directory contains comprehensive tests for the guest mode functionality in the Adtip React Native application.

## Overview

The guest mode feature allows unauthenticated users to browse limited content without requiring login. This testing suite validates all aspects of the guest mode implementation.

## Test Coverage

### 1. AuthContext Guest Mode Tests (`AuthContext.guest.test.tsx`)
- ✅ Guest mode activation and deactivation
- ✅ State persistence across app restarts
- ✅ State cleanup during login/logout
- ✅ Error handling for guest mode operations
- ✅ Integration with existing authentication flow

### 2. API Service Guest Mode Tests (`ApiService.guest.test.ts`)
- ✅ Guest API calls without authentication tokens
- ✅ Request interceptor guest mode handling
- ✅ Public endpoint configuration
- ✅ Error handling for guest API calls
- ✅ Network error resilience

### 3. LoginPromptModal Tests (`LoginPromptModal.test.tsx`)
- ✅ Modal rendering and visibility
- ✅ User interactions (Cancel, Login buttons)
- ✅ Custom title and message support
- ✅ Theme integration
- ✅ Error handling for guest mode exit
- ✅ Accessibility compliance

### 4. Integration Tests (`GuestMode.integration.test.tsx`)
- ✅ Complete guest mode activation flow
- ✅ Content access in guest mode
- ✅ Restricted action handling
- ✅ State persistence validation
- ✅ Guest mode exit flow
- ✅ API integration testing

## Running Tests

### Prerequisites
```bash
npm install
# or
yarn install
```

### Run All Tests
```bash
# Run all guest mode tests with coverage
node __tests__/guest-mode/run-tests.js --coverage

# Run all tests without coverage
node __tests__/guest-mode/run-tests.js
```

### Run Individual Test Suites
```bash
# Run tests individually (one by one)
node __tests__/guest-mode/run-tests.js --individual

# Run specific test
node __tests__/guest-mode/run-tests.js --test=AuthContext
node __tests__/guest-mode/run-tests.js --test=ApiService
node __tests__/guest-mode/run-tests.js --test=LoginPromptModal
node __tests__/guest-mode/run-tests.js --test=integration
```

### Using Jest Directly
```bash
# Run with Jest configuration
npx jest --config=__tests__/guest-mode/jest.config.js

# Run specific test file
npx jest --config=__tests__/guest-mode/jest.config.js AuthContext.guest.test.tsx

# Run with coverage
npx jest --config=__tests__/guest-mode/jest.config.js --coverage
```

## Test Scenarios

### Guest Mode Activation
1. User clicks "Try Now" on onboarding screen
2. Guest mode state is set in AuthContext
3. Guest flag is persisted in AsyncStorage
4. Navigation bypasses login flow
5. User lands on MainNavigator

### Content Access
1. Guest users can view limited content
2. API calls use guest endpoints without auth tokens
3. Content is properly displayed in read-only mode
4. No authentication headers are sent

### Restricted Actions
1. Guest attempts to like/comment/share
2. LoginPromptModal is displayed
3. User can cancel or proceed to login
4. Guest state is properly cleaned up on login

### State Management
1. Guest mode persists across app restarts
2. Proper cleanup when transitioning to authenticated mode
3. State consistency across all components
4. Error handling for state operations

## Coverage Reports

After running tests with `--coverage`, view the coverage report:

```bash
# Open HTML coverage report
open coverage/guest-mode/index.html

# View text coverage summary
cat coverage/guest-mode/lcov-report/index.html
```

## Test Configuration

### Jest Configuration (`jest.config.js`)
- React Native preset
- Custom test environment setup
- Coverage collection from guest mode files
- Module name mapping for imports

### Setup File (`setup.js`)
- Mock React Native modules
- Mock navigation dependencies
- Mock AsyncStorage
- Global test utilities

## Debugging Tests

### Enable Verbose Output
```bash
node __tests__/guest-mode/run-tests.js --individual --verbose
```

### Debug Specific Test
```bash
# Add --debug flag to Jest
npx jest --config=__tests__/guest-mode/jest.config.js --debug AuthContext.guest.test.tsx
```

### Common Issues
1. **Mock not working**: Check setup.js for proper module mocking
2. **AsyncStorage errors**: Verify AsyncStorage mock implementation
3. **Navigation errors**: Ensure navigation mocks are properly configured
4. **Component rendering issues**: Check React Native component mocks

## Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Guest Mode Tests
  run: |
    node __tests__/guest-mode/run-tests.js --coverage
    
- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/guest-mode/lcov.info
```

### Test Metrics
- **Minimum Coverage**: 80%
- **Test Timeout**: 10 seconds
- **Max Test Duration**: 30 seconds per suite

## Contributing

When adding new guest mode features:

1. Add corresponding tests to appropriate test file
2. Update test scenarios in `run-tests.js`
3. Ensure coverage remains above 80%
4. Update this README with new test descriptions

## Troubleshooting

### Common Test Failures
1. **Timeout errors**: Increase timeout in jest.config.js
2. **Mock errors**: Verify all dependencies are properly mocked
3. **State errors**: Check AsyncStorage mock implementation
4. **Navigation errors**: Ensure navigation mocks match actual usage

### Performance Issues
1. Use `--runInBand` for serial test execution
2. Increase `--maxWorkers` for parallel execution
3. Use `--cache` for faster subsequent runs

## Related Documentation
- [Guest Mode Implementation Guide](../../docs/guest-mode.md)
- [API Documentation](../../docs/api.md)
- [Testing Guidelines](../../docs/testing.md)
