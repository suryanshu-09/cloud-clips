# React Native Client Examples

This directory contains example React Native components and hooks for integrating with the Cloud Clips GraphQL API.

## 📁 Structure

```
frontend-examples/
├── src/
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAuth.ts          # Authentication hook
│   │   ├── useBarberSearch.ts  # Barber search hook
│   │   ├── useAppointments.ts  # Appointments hook
│   │   └── useUserProfile.ts   # User profile hook
│   ├── components/               # React Native components
│   │   ├── BarberSearch.tsx   # Barber search component
│   │   ├── BarberProfile.tsx  # Barber profile component
│   │   ├── BookingForm.tsx    # Appointment booking form
│   │   └── UserProfile.tsx    # User profile component
│   ├── graphql/                 # GraphQL definitions
│   │   ├── queries.ts          # GraphQL queries
│   │   ├── mutations.ts        # GraphQL mutations
│   │   └── client.ts          # Apollo client setup
│   ├── types/                   # TypeScript types
│   │   ├── api.ts             # API response types
│   │   └── navigation.ts       # Navigation types
│   └── utils/                   # Utility functions
│       ├── auth.ts            # Authentication utilities
│       ├── storage.ts         # Local storage utilities
│       └── validation.ts      # Form validation
├── package.json
└── README.md
```

## 🚀 Quick Start

1. Install dependencies:
```bash
npm install @apollo/client graphql react-native react-native-safe-area-context react-native-vector-icons
```

2. Set up Apollo Client:
```typescript
// src/graphql/client.ts
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: 'http://localhost:8080/graphql',
});

export const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
```

3. Wrap your app with Apollo Provider:
```typescript
// App.tsx
import { ApolloProvider } from '@apollo/client';
import { client } from './src/graphql/client';

export default function App() {
  return (
    <ApolloProvider client={client}>
      {/* Your app components */}
    </ApolloProvider>
  );
}
```

## 📱 Example Components

### Barber Search Component

```typescript
// src/components/BarberSearch.tsx
import React, { useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useBarberSearch } from '../hooks/useBarberSearch';

export const BarberSearch: React.FC = () => {
  const [searchRadius, setSearchRadius] = useState(10);
  const { barbers, loading, error, refetch } = useBarberSearch(40.7128, -74.0060, searchRadius);

  const renderBarber = ({ item }) => (
    <TouchableOpacity style={styles.barberCard}>
      <Image 
        source={{ uri: item.user.avatar || 'https://via.placeholder.com/60' }} 
        style={styles.avatar} 
      />
      <View style={styles.barberInfo}>
        <Text style={styles.businessName}>{item.businessName}</Text>
        <Text style={styles.barberName}>{item.user.name}</Text>
        <Text style={styles.bio}>{item.bio}</Text>
        <View style={styles.ratingContainer}>
          <Text style={styles.rating}>⭐ {item.rating}</Text>
          <Text style={styles.reviews}>({item.totalReviews} reviews)</Text>
        </View>
        <Text style={styles.address}>{item.location.address}</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
        <Text>Loading barbers...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text>Error loading barbers: {error.message}</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={styles.retryButton}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={barbers}
        renderItem={renderBarber}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    color: '#007AFF',
    marginTop: 10,
  },
  listContainer: {
    padding: 16,
  },
  barberCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  barberInfo: {
    flex: 1,
  },
  businessName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  barberName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    color: '#888',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFA500',
    marginRight: 8,
  },
  reviews: {
    fontSize: 14,
    color: '#666',
  },
  address: {
    fontSize: 14,
    color: '#666',
  },
});
```

### Authentication Hook

```typescript
// src/hooks/useAuth.ts
import { useState, useCallback } from 'react';
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';
import AsyncStorage from '@react-native-async-storage/async';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      token
      user {
        id
        email
        name
        role
        avatar
      }
    }
  }
`;

const REGISTER_MUTATION = gql`
  mutation Register($input: RegisterInput!) {
    createUser(input: $input) {
      id
      email
      name
      role
      createdAt
    }
  }
`;

const ME_QUERY = gql`
  query Me {
    me {
      id
      email
      name
      role
      avatar
      location {
        coordinates
      }
    }
  }
`;

export const useAuth = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  const [loginMutation] = useMutation(LOGIN_MUTATION);
  const [registerMutation] = useMutation(REGISTER_MUTATION);
  const { data: meData, loading } = useQuery(ME_QUERY, {
    skip: !isAuthenticated,
  });

  // Initialize auth state from storage
  useCallback(async () => {
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
    }
  }, []);

  // Login function
  const login = useCallback(async (email: string, password: string) => {
    try {
      const result = await loginMutation({ variables: { email, password } });
      const { token, user: userData } = result.data?.login || {};
      
      if (token && userData) {
        await AsyncStorage.setItem('authToken', token);
        setIsAuthenticated(true);
        setUser(userData);
        return { success: true, user: userData };
      }
      
      return { success: false, error: 'Invalid credentials' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }, [loginMutation]);

  // Register function
  const register = useCallback(async (userData: any) => {
    try {
      const result = await registerMutation({ variables: { input: userData } });
      const user = result.data?.createUser;
      
      if (user) {
        return { success: true, user };
      }
      
      return { success: false, error: 'Registration failed' };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }, [registerMutation]);

  // Logout function
  const logout = useCallback(async () => {
    await AsyncStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  return {
    isAuthenticated,
    user,
    loading,
    login,
    register,
    logout,
  };
};
```

### Booking Form Component

```typescript
// src/components/BookingForm.tsx
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useBookAppointment } from '../hooks/useAppointments';

interface BookingFormProps {
  barberId: string;
  barberName: string;
  services: Array<{ name: string; price: number; duration: number }>;
}

export const BookingForm: React.FC<BookingFormProps> = ({
  barberId,
  barberName,
  services,
}) => {
  const [selectedService, setSelectedService] = useState(services[0]);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  
  const { bookAppointment, loading } = useBookAppointment();

  const handleBooking = async () => {
    if (!scheduledDate || !scheduledTime) {
      Alert.alert('Missing Information', 'Please select date and time');
      return;
    }

    try {
      const appointmentData = {
        clientId: 'current-user-id', // Get from auth context
        barberId,
        serviceType: selectedService.name,
        scheduledFor: `${scheduledDate}T${scheduledTime}:00Z`,
        duration: selectedService.duration,
        price: selectedService.price,
        location: {
          type: 'in_salon',
          address: 'Barber Shop Address',
        },
        specialRequests: specialRequests || null,
      };

      const appointment = await bookAppointment(appointmentData);
      
      Alert.alert(
        'Booking Confirmed!',
        `Your appointment with ${barberName} is confirmed for ${new Date(appointment.scheduledFor).toLocaleString()}`
      );
      
      // Reset form
      setScheduledDate('');
      setScheduledTime('');
      setSpecialRequests('');
    } catch (error) {
      Alert.alert('Booking Failed', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book with {barberName}</Text>
      
      <View style={styles.section}>
        <Text style={styles.label}>Select Service</Text>
        {services.map((service) => (
          <TouchableOpacity
            key={service.name}
            style={[
              styles.serviceOption,
              selectedService.name === service.name && styles.selectedService,
            ]}
            onPress={() => setSelectedService(service)}
          >
            <Text style={styles.serviceName}>{service.name}</Text>
            <Text style={styles.servicePrice}>${service.price}</Text>
            <Text style={styles.serviceDuration}>{service.duration}min</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Date</Text>
        <TextInput
          style={styles.input}
          value={scheduledDate}
          onChangeText={setScheduledDate}
          placeholder="YYYY-MM-DD"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Time</Text>
        <TextInput
          style={styles.input}
          value={scheduledTime}
          onChangeText={setScheduledTime}
          placeholder="HH:MM"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Special Requests (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={specialRequests}
          onChangeText={setSpecialRequests}
          placeholder="Any special requests..."
          multiline
          numberOfLines={3}
        />
      </View>

      <TouchableOpacity
        style={[styles.bookButton, loading && styles.disabledButton]}
        onPress={handleBooking}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.bookButtonText}>
            Book Appointment - ${selectedService.price}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  serviceOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedService: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
  },
  servicePrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  serviceDuration: {
    fontSize: 14,
    color: '#666',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  bookButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  bookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in your React Native project:

```env
# API Configuration
GRAPHQL_URI=http://localhost:8080/graphql
API_TIMEOUT=10000

# App Configuration
APP_NAME=CloudClips
APP_VERSION=1.0.0

# Feature Flags
ENABLE_PUSH_NOTIFICATIONS=true
ENABLE_LOCATION_SERVICES=true
```

### Apollo Client Configuration

```typescript
// src/graphql/client.ts
import { ApolloClient, InMemoryCache, createHttpLink, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import AsyncStorage from '@react-native-async-storage/async';

const httpLink = createHttpLink({
  uri: process.env.GRAPHQL_URI || 'http://localhost:8080/graphql',
});

const authLink = setContext(async (_, { headers }) => {
  const token = await AsyncStorage.getItem('authToken');
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`);
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

export const client = new ApolloClient({
  link: from([errorLink, authLink, httpLink]),
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});
```

## 🧪 Testing

### Mock Provider for Testing

```typescript
// src/test-utils/MockProvider.tsx
import React from 'react';
import { MockedProvider } from '@apollo/client/testing';
import { GET_BARBERS_QUERY } from '../graphql/queries';

const mockBarbers = [
  {
    id: '1',
    businessName: 'Elite Cuts',
    bio: 'Professional barber with 10+ years experience',
    rating: 4.8,
    totalReviews: 127,
    user: {
      name: 'John Doe',
      avatar: 'https://example.com/avatar.jpg',
    },
    location: {
      address: '123 Main St, Brooklyn, NY 11201',
    },
  },
];

const mocks = [
  {
    request: {
      query: GET_BARBERS_QUERY,
      variables: { lat: 40.7128, lng: -74.0060, radius: 10 },
    },
    result: {
      data: { barbers: mockBarbers },
    },
  },
];

export const MockProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <MockedProvider mocks={mocks}>{children}</MockedProvider>
);
```

### Component Testing Example

```typescript
// src/components/__tests__/BarberSearch.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { BarberSearch } from '../BarberSearch';
import { MockProvider } from '../../test-utils/MockProvider';

describe('BarberSearch', () => {
  it('should display barbers', async () => {
    const { getByText } = render(
      <MockProvider>
        <BarberSearch />
      </MockProvider>
    );

    await waitFor(() => {
      expect(getByText('Elite Cuts')).toBeTruthy();
      expect(getByText('Professional barber with 10+ years experience')).toBeTruthy();
      expect(getByText('⭐ 4.8')).toBeTruthy();
      expect(getByText('(127 reviews)')).toBeTruthy();
    });
  });

  it('should handle loading state', () => {
    const { getByText } = render(
      <MockProvider>
        <BarberSearch />
      </MockProvider>
    );

    // Initially shows loading
    expect(getByText('Loading barbers...')).toBeTruthy();
  });
});
```

This comprehensive documentation and example code provides everything needed to integrate the React Native frontend with the Cloud Clips GraphQL backend! 🚀