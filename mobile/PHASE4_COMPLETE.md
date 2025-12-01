# Phase 4 Setup Complete: State Management & Services

Phase 4 of the initial setup has been completed. This includes all state management configuration, API clients, Firebase services, error tracking, and analytics.

## What Was Created

### 1. State Management (Jotai + MMKV)

#### Atoms Created:
- **authAtom.ts** - Authentication state with login/logout actions
- **userAtom.ts** - User profile and barber profile state
- **cartAtom.ts** - Shopping cart with add/remove/update actions
- **locationAtom.ts** - User location and saved locations
- **themeAtom.ts** - Theme preferences (color scheme, fonts)

All atoms use MMKV for persistent storage, meaning state survives app restarts.

#### Storage:
- **mmkv.ts** - MMKV storage instance with helper functions
- **storage.ts** - Storage adapter for Jotai persistence

### 2. TanStack Query Configuration

#### Files Created:
- **queryClient.ts** - Configured QueryClient with:
  - 5-minute cache time
  - 1-minute stale time
  - Automatic retry logic
  - Network-aware refetching
  - Comprehensive query keys factory

Query keys are organized by feature (auth, barbers, appointments, products, etc.) for easy invalidation and refetching.

### 3. API Client (Axios)

#### Files Created:
- **client.ts** - Axios instance with interceptors:
  - Automatic token injection
  - Token refresh on 401 errors
  - Error transformation to ApiError class
  - Request/response logging in development
  
- **endpoints.ts** - All API endpoint constants organized by domain

- **types.ts** - Common API types (pagination, responses, errors)

### 4. Firebase Services

#### Firebase Configuration:
- **config.ts** - Firebase app initialization with environment variables
- **auth.ts** - Authentication service:
  - Sign in/up with email/password
  - Password reset
  - Profile updates
  - Token management
  
- **messaging.ts** - Push notifications (FCM):
  - Permission requests
  - Expo Push Token generation
  - Local notifications
  - Badge management
  - Notification listeners
  
- **storage.ts** - Cloud storage:
  - File uploads with progress tracking
  - Avatar, portfolio, product, and chat image uploads
  - File deletion
  - Download URL generation

### 5. Error Tracking (Sentry)

#### Files Created:
- **sentry.ts** - Sentry configuration:
  - Exception capture
  - Message logging
  - Breadcrumb tracking
  - User context
  - Custom context and tags
  - Disabled in development

### 6. Analytics

#### Files Created:
- **analytics.ts** - Analytics service:
  - Firebase Analytics integration
  - Custom event logging
  - Screen view tracking
  - User properties
  - E-commerce events
  - Booking events
  - Auth events

## Environment Variables

Update your `.env` file with the following variables (see `.env.example`):

```bash
# API
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080

# Stripe
EXPO_PUBLIC_STRIPE_PUBLIC_KEY=pk_test_...

# Firebase
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=...

# Google Maps
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=...

# Sentry
EXPO_PUBLIC_SENTRY_DSN=...

# EAS
EXPO_PUBLIC_EAS_PROJECT_ID=...
```

## Usage Examples

### Using Atoms (State Management)

```typescript
import { useAtom, useSetAtom, useAtomValue } from 'jotai';
import { authAtom, loginAtom, currentUserAtom } from '@/store';

// In a component
function MyComponent() {
  // Read and write
  const [auth, setAuth] = useAtom(authAtom);
  
  // Write only
  const login = useSetAtom(loginAtom);
  
  // Read only
  const user = useAtomValue(currentUserAtom);
  
  const handleLogin = async () => {
    await login({ user, token, refreshToken });
  };
}
```

### Using API Client

```typescript
import apiClient, { handleApiError } from '@/services/api/client';
import { endpoints } from '@/services/api/endpoints';

// Make API call
try {
  const response = await apiClient.get(endpoints.barbers.list);
  console.log(response.data);
} catch (error) {
  const message = handleApiError(error);
  console.error(message);
}
```

### Using TanStack Query

```typescript
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/services/api/queryClient';
import apiClient from '@/services/api/client';

// Query example
function useBarbers() {
  return useQuery({
    queryKey: queryKeys.barbers.list(),
    queryFn: async () => {
      const response = await apiClient.get('/barbers');
      return response.data;
    },
  });
}

// Mutation example
function useCreateBooking() {
  return useMutation({
    mutationFn: async (data) => {
      const response = await apiClient.post('/appointments', data);
      return response.data;
    },
  });
}
```

### Using Firebase Services

```typescript
import { authService } from '@/services/firebase/auth';
import { storageService } from '@/services/firebase/storage';
import { messagingService } from '@/services/firebase/messaging';

// Auth
await authService.signIn(email, password);
await authService.signUp(email, password, name);

// Storage
const url = await storageService.uploadAvatar(userId, imageUri);

// Notifications
const token = await messagingService.getExpoPushToken();
await messagingService.requestPermissions();
```

### Using Analytics

```typescript
import { analyticsService } from '@/services/analytics/analytics';

// Log events
analyticsService.logScreenView('Home');
analyticsService.logLogin('email');
analyticsService.logViewBarber(barberId, barberName);
analyticsService.logPurchase(orderId, amount, items);
```

### Using Error Tracking

```typescript
import { errorTrackingService } from '@/services/errorTracking/sentry';

// Capture exception
try {
  // something
} catch (error) {
  errorTrackingService.captureException(error as Error, {
    context: 'additional info',
  });
}

// Set user context
errorTrackingService.setUser({ id: userId, email });

// Add breadcrumb
errorTrackingService.addBreadcrumb({
  message: 'User clicked button',
  level: 'info',
});
```

## Next Steps

Phase 4 is complete! The next phase is:

**Phase 5: Base Components**
- Create base UI components (Button, Input, Card, etc.)
- Create layout components (Header, SafeView, etc.)
- Setup error boundary component
- Create loading states and skeletons

## Important Notes

1. **MMKV Storage**: All atoms are persisted automatically. State survives app restarts.

2. **Token Refresh**: API client automatically refreshes tokens on 401 errors.

3. **Environment Variables**: Must be prefixed with `EXPO_PUBLIC_` to be accessible in React Native.

4. **Firebase Setup**: Configure Firebase project and add credentials to `.env` file.

5. **Sentry**: Only active in production builds. Disabled in development.

6. **Analytics**: Firebase Analytics only works on web. For native analytics, consider using Expo's analytics or another solution.

## File Structure

```
src/
├── services/
│   ├── api/
│   │   ├── client.ts          # Axios client with interceptors
│   │   ├── endpoints.ts       # API endpoint constants
│   │   ├── queryClient.ts     # TanStack Query configuration
│   │   └── types.ts           # API types
│   ├── storage/
│   │   └── mmkv.ts           # MMKV storage instance
│   ├── firebase/
│   │   ├── config.ts         # Firebase initialization
│   │   ├── auth.ts           # Auth service
│   │   ├── messaging.ts      # FCM service
│   │   └── storage.ts        # Storage service
│   ├── errorTracking/
│   │   └── sentry.ts         # Sentry configuration
│   └── analytics/
│       └── analytics.ts      # Analytics service
└── store/
    ├── atoms/
    │   ├── authAtom.ts       # Auth state
    │   ├── userAtom.ts       # User profile state
    │   ├── cartAtom.ts       # Cart state
    │   ├── locationAtom.ts   # Location state
    │   └── themeAtom.ts      # Theme state
    ├── utils/
    │   └── storage.ts        # Storage adapter
    └── index.ts              # Export all atoms
```
