# Comprehensive Testing Guide - VideoSDK CallKeep Integration

## Overview

This guide provides complete instructions for testing the VideoSDK CallKeep integration implementation. The testing suite covers all aspects of the call handling system with automated scripts, performance monitoring, and comprehensive validation.

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install

# Install testing dependencies
npm install --save-dev jest ts-jest @types/jest jest-html-reporters jest-junit detox
```

### Run All Tests
```bash
# Run complete test suite
node testing/scripts/runAllTests.js

# Run with E2E tests (requires device setup)
node testing/scripts/runAllTests.js --e2e

# Run specific test types
npm run test:unit
npm run test:integration
npm run test:performance
npm run test:e2e
```

## 📁 Test Structure

```
testing/
├── unit/                    # Unit tests for individual components
│   ├── CallFCMHandler.test.ts
│   ├── CallUICoordinator.test.ts
│   └── FCMMessageRouter.test.ts
├── integration/             # Integration tests for complete flows
│   └── CallFlow.test.ts
├── e2e/                     # End-to-end tests
│   └── CallKeepIntegration.e2e.ts
├── performance/             # Performance and load tests
│   └── CallPerformance.test.ts
├── mocks/                   # Mock data and services
│   └── FCMMessageMocks.ts
├── utils/                   # Testing utilities
│   └── TestingUtils.ts
├── setup/                   # Test configuration
│   ├── jest.setup.js
│   ├── globalSetup.js
│   └── globalTeardown.js
├── scripts/                 # Automated test execution
│   └── runAllTests.js
├── reports/                 # Generated test reports
└── jest.config.js          # Jest configuration
```

## 🧪 Test Categories

### 1. Unit Tests
**Purpose**: Test individual components in isolation
**Coverage**: 90%+ for critical components
**Duration**: ~30 seconds

**Key Test Files**:
- `CallFCMHandler.test.ts` - FCM message handling logic
- `CallUICoordinator.test.ts` - UI coordination logic
- `FCMMessageRouter.test.ts` - Message routing logic

**Run Command**:
```bash
npx jest testing/unit --coverage
```

### 2. Integration Tests
**Purpose**: Test complete call flows and component interactions
**Coverage**: All major call scenarios
**Duration**: ~60 seconds

**Key Test Files**:
- `CallFlow.test.ts` - Complete call lifecycle testing

**Run Command**:
```bash
npx jest testing/integration
```

### 3. Performance Tests
**Purpose**: Validate performance requirements and identify bottlenecks
**Metrics**: Response time, memory usage, throughput
**Duration**: ~120 seconds

**Key Test Files**:
- `CallPerformance.test.ts` - Performance benchmarks

**Performance Thresholds**:
- FCM message processing: <100ms
- Call UI display: <200ms
- Memory usage: <50MB during calls
- Concurrent operations: 50+ ops/second

**Run Command**:
```bash
npx jest testing/performance
```

### 4. E2E Tests
**Purpose**: Test real device scenarios and user interactions
**Requirements**: Physical device or simulator
**Duration**: ~300 seconds

**Key Test Files**:
- `CallKeepIntegration.e2e.ts` - Real device call scenarios

**Run Command**:
```bash
npx detox test --configuration ios.sim.debug
```

## 📊 Test Reports

### Automated Reports
Tests generate comprehensive reports in multiple formats:

1. **HTML Report**: `testing/reports/jest-report.html`
   - Interactive test results
   - Coverage visualization
   - Performance metrics

2. **JSON Report**: `testing/reports/test-report.json`
   - Machine-readable results
   - CI/CD integration data

3. **JUnit XML**: `testing/reports/junit.xml`
   - CI/CD system compatibility
   - Build pipeline integration

4. **Coverage Report**: `testing/coverage/lcov-report/index.html`
   - Line-by-line coverage
   - Branch coverage analysis

### Sample Report Structure
```json
{
  "summary": {
    "totalTests": 45,
    "totalPassed": 43,
    "totalFailed": 2,
    "successRate": "95.56%",
    "duration": "125.34s"
  },
  "details": {
    "unit": { "passed": 20, "failed": 0, "total": 20 },
    "integration": { "passed": 15, "failed": 1, "total": 16 },
    "performance": { "passed": 8, "failed": 1, "total": 9 }
  }
}
```

## 🎯 Success Criteria

### Functional Requirements
- ✅ 100% FCM message routing accuracy
- ✅ 95%+ CallKeep UI display success rate
- ✅ <2 second call acceptance response time
- ✅ 100% background call handling reliability
- ✅ Zero UI conflicts between CallKeep and custom UI

### Performance Requirements
- ✅ <50MB memory usage during calls
- ✅ <5% CPU usage for call handling
- ✅ <100ms FCM message processing time
- ✅ Zero memory leaks in 24-hour testing

### Reliability Requirements
- ✅ 99.9% uptime for call services
- ✅ Graceful degradation when CallKeep unavailable
- ✅ Automatic recovery from service failures
- ✅ Consistent behavior across app restarts

## 🔧 Test Configuration

### Jest Configuration
Key settings in `jest.config.js`:
- TypeScript support with ts-jest
- React Native preset
- Comprehensive mocking
- Coverage thresholds
- Multiple test projects

### Mock Services
Comprehensive mocking for:
- React Native APIs
- Firebase Messaging
- CallKeep
- AsyncStorage
- VideoSDK
- Navigation

## 🚨 Troubleshooting

### Common Issues

1. **Tests Timeout**
   ```bash
   # Increase timeout in jest.config.js
   testTimeout: 60000
   ```

2. **Mock Import Errors**
   ```bash
   # Check moduleNameMapper in jest.config.js
   # Ensure all React Native modules are mocked
   ```

3. **Coverage Threshold Failures**
   ```bash
   # Adjust thresholds in jest.config.js
   # Add more test cases for uncovered code
   ```

4. **E2E Test Failures**
   ```bash
   # Ensure device/simulator is running
   # Check Detox configuration
   # Verify app is built for testing
   ```

### Debug Mode
```bash
# Run tests with debug output
npx jest --verbose --no-cache

# Run specific test file
npx jest testing/unit/CallFCMHandler.test.ts --verbose

# Run tests in watch mode
npx jest --watch
```

## 📈 Continuous Integration

### CI/CD Integration
```yaml
# Example GitHub Actions workflow
- name: Run Tests
  run: |
    npm install
    node testing/scripts/runAllTests.js
    
- name: Upload Coverage
  uses: codecov/codecov-action@v1
  with:
    file: ./testing/coverage/lcov.info
```

### Quality Gates
- Minimum 80% code coverage
- All tests must pass
- Performance thresholds met
- No critical security vulnerabilities

## 🔄 Test Maintenance

### Regular Tasks
1. **Weekly**: Review test results and update thresholds
2. **Monthly**: Update mock data and test scenarios
3. **Quarterly**: Performance baseline review
4. **Release**: Full test suite execution

### Adding New Tests
1. Create test file in appropriate directory
2. Follow naming convention: `*.test.ts`
3. Use provided utilities and mocks
4. Update coverage thresholds if needed
5. Document test purpose and scenarios

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Detox E2E Testing](https://github.com/wix/Detox)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [VideoSDK Documentation](https://docs.videosdk.live/)
- [CallKeep Documentation](https://github.com/react-native-webrtc/react-native-callkeep)

## 🎉 Conclusion

This comprehensive testing suite ensures the VideoSDK CallKeep integration is robust, performant, and reliable across all scenarios. The automated testing pipeline provides confidence in code quality and helps maintain high standards throughout development.

For questions or issues, refer to the troubleshooting section or create an issue in the project repository.
