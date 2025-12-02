# Testing Documentation for Cloud Clips

This document provides comprehensive information about the testing infrastructure for the Cloud Clips mobile application.

## Table of Contents

1. [Testing Stack](#testing-stack)
2. [Running Tests](#running-tests)
3. [Test Structure](#test-structure)
4. [Writing Tests](#writing-tests)
5. [Coverage Requirements](#coverage-requirements)
6. [E2E Testing with Maestro](#e2e-testing-with-maestro)

## Testing Stack

The project uses the following testing tools:

- **Jest**: JavaScript testing framework
- **React Native Testing Library**: Testing utilities for React Native
- **@testing-library/jest-native**: Custom Jest matchers for React Native
- **Axios Mock Adapter**: Mocking HTTP requests
- **Maestro**: End-to-end testing framework

## Running Tests

### Unit and Integration Tests

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test:watch

# Run tests with coverage
bun test --coverage

# Run specific test file
bun test useAuth.test.ts

# Run tests matching pattern
bun test --testNamePattern="should login successfully"
```

### E2E Tests

```bash
# Run all E2E tests with Maestro
bun test:e2e

# Run specific E2E test
maestro test .maestro/auth-flow.yaml

# Run E2E tests on specific device
maestro test --device emulator-5554 .maestro/booking-flow.yaml
```

## Test Structure

Tests are organized in the `src/__tests__` directory, mirroring the source code structure:

```
src/__tests__/
├── components/          # Component tests
│   ├── Button.test.tsx
│   └── Input.test.tsx
├── hooks/              # Hook tests
│   ├── useAuth.test.ts
│   └── useRegister.test.ts
├── features/           # Feature integration tests
│   ├── bookings.test.ts
│   └── payments.test.ts
├── services/           # Service tests
│   └── apiClient.test.ts
├── utils/              # Utility function tests
│   └── authSchemas.test.ts
└── integration/        # Full integration tests
    └── authFlow.test.ts
```

## Writing Tests

### Component Tests

Component tests should verify:
- Rendering with different props
- User interactions (press, input, etc.)
- State changes
- Error states
- Loading states

Example:

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('should handle press events', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <Button onPress={onPressMock}>Click me</Button>
    );
    
    fireEvent.press(getByText('Click me'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
```

### Hook Tests

Hook tests should verify:
- Initial state
- State updates
- Side effects
- Error handling
- Loading states

Example:

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/useAuth';

describe('useAuth', () => {
  let queryClient: QueryClient;
  
  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });
  
  const wrapper = ({ children }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
  
  it('should handle login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    result.current.login({
      email: 'test@example.com',
      password: 'password',
    });
    
    await waitFor(() => {
      expect(result.current.isLoggingIn).toBe(false);
    });
  });
});
```

### Integration Tests

Integration tests should verify:
- Complete user flows
- Multiple components working together
- API interactions
- State management across features

Example:

```typescript
describe('Authentication Flow', () => {
  it('should register, login, and logout', async () => {
    // Test complete auth flow
    // 1. Register new user
    // 2. Auto-login after registration
    // 3. Logout
    // 4. Login again
  });
});
```

### API Tests

API tests should verify:
- Request formatting
- Response handling
- Error handling
- Token refresh
- Request interceptors

Example:

```typescript
import MockAdapter from 'axios-mock-adapter';
import apiClient from '@/services/api/client';

describe('API Client', () => {
  let mock: MockAdapter;
  
  beforeEach(() => {
    mock = new MockAdapter(apiClient);
  });
  
  afterEach(() => {
    mock.restore();
  });
  
  it('should add authorization header', async () => {
    mock.onGet('/test').reply(200, { success: true });
    const response = await apiClient.get('/test');
    expect(response.data).toEqual({ success: true });
  });
});
```

## Coverage Requirements

The project aims for the following coverage thresholds:

- **Branches**: 70%
- **Functions**: 70%
- **Lines**: 70%
- **Statements**: 70%

These are configured in `jest.config.js`:

```javascript
coverageThreshold: {
  global: {
    branches: 70,
    functions: 70,
    lines: 70,
    statements: 70,
  },
}
```

## E2E Testing with Maestro

### Installation

```bash
# Install Maestro CLI
curl -Ls "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
```

### Writing E2E Tests

E2E tests are written in YAML format and located in `.maestro/` directory.

Example test structure:

```yaml
appId: com.cloudclips.app
---
# Test Name
- launchApp
- tapOn: "Button Text"
- inputText: "Text to input"
- assertVisible: "Expected Text"
```

### Available E2E Tests

1. **auth-flow.yaml**: Tests user registration and login
2. **booking-flow.yaml**: Tests the complete booking process

### Running E2E Tests

```bash
# Run all E2E tests
maestro test .maestro/

# Run specific test
maestro test .maestro/auth-flow.yaml

# Run on specific device
maestro test --device emulator-5554 .maestro/auth-flow.yaml

# Record test execution
maestro test --record .maestro/booking-flow.yaml
```

## Mocking

### Service Mocks

Services should be mocked in tests:

```typescript
jest.mock('@/features/auth/services/authService');
```

### Component Mocks

Complex components can be mocked:

```typescript
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));
```

### Storage Mocks

Storage is automatically mocked in `jest.setup.js`:

```typescript
jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => ({
    set: jest.fn(),
    getString: jest.fn(),
    delete: jest.fn(),
  })),
}));
```

## Best Practices

1. **Arrange-Act-Assert**: Structure tests clearly
2. **One assertion per test**: Keep tests focused
3. **Clear test names**: Describe what is being tested
4. **Clean up**: Reset mocks and state between tests
5. **Test user behavior**: Focus on what users do, not implementation details
6. **Mock external dependencies**: Keep tests fast and reliable
7. **Use data-testid**: For elements that are hard to query
8. **Test error states**: Don't just test the happy path

## Continuous Integration

Tests should run automatically on:
- Every commit (via pre-commit hook)
- Pull requests
- Before deployment

## Debugging Tests

```bash
# Run tests with verbose output
bun test --verbose

# Debug specific test
node --inspect-brk node_modules/.bin/jest --runInBand useAuth.test.ts

# Update snapshots
bun test -u
```

## Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Maestro Documentation](https://maestro.mobile.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
