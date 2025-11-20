# Cloud Clips Backend API Documentation

## 📋 Overview

This document describes the GraphQL API endpoints for the Cloud Clips mobile application. The backend provides a complete set of APIs for user management, barber profiles, appointments, and more.

## 🌐 Base URL

```
Development: http://localhost:8080/graphql
Production: https://api.cloudclips.com/graphql
```

## 🔐 Authentication

All protected operations require a JWT token in the Authorization header:

```http
Authorization: Bearer <jwt_token>
```

## 📊 GraphQL Schema

### Root Query Types

```graphql
type Query {
  # User operations
  users: [User]
  user(id: ID!): User
  
  # Barber operations
  barbers: [BarberProfile]
  barber(id: ID!): BarberProfile
  
  # Appointment operations
  appointments: [Appointment]
  appointment(id: ID!): Appointment
}
```

### Root Mutation Types

```graphql
type Mutation {
  # User operations
  createUser(input: CreateUserInput!): User
  updateUser(id: ID!, input: UpdateUserInput!): User
  deleteUser(id: ID!): Boolean
  
  # Barber operations
  createBarberProfile(input: CreateBarberProfileInput!): BarberProfile
  updateBarberProfile(id: ID!, input: UpdateBarberProfileInput!): BarberProfile
  deleteBarberProfile(id: ID!): Boolean
  
  # Appointment operations
  createAppointment(input: CreateAppointmentInput!): Appointment
  updateAppointment(id: ID!, input: UpdateAppointmentInput!): Appointment
  deleteAppointment(id: ID!): Boolean
}
```

## 🧑‍💼 User API

### Get All Users

```graphql
query GetUsers {
  users {
    id
    email
    name
    role
    avatar
    location {
      type
      coordinates
    }
    createdAt
    lastActive
    notificationPrefs {
      push
      sms
      email
    }
    authProvider
  }
}
```

### Get User by ID

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    email
    name
    role
    avatar
    location {
      type
      coordinates
    }
    createdAt
    lastActive
    notificationPrefs {
      push
      sms
      email
    }
    authProvider
  }
}
```

### Create User

```graphql
mutation CreateUser($input: CreateUserInput!) {
  createUser(input: $input) {
    id
    email
    name
    role
    createdAt
  }
}
```

**Input:**
```json
{
  "input": {
    "email": "john.doe@example.com",
    "name": "John Doe",
    "password": "securePassword123",
    "role": "client",
    "phone": "+1234567890",
    "location": {
      "type": "Point",
      "coordinates": [-74.0060, 40.7128]
    }
  }
}
```

### Update User

```graphql
mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
  updateUser(id: $id, input: $input) {
    id
    email
    name
    avatar
    lastActive
  }
}
```

**Input:**
```json
{
  "id": "user-id-here",
  "input": {
    "name": "Updated Name",
    "avatar": "https://example.com/avatar.jpg",
    "notificationPrefs": {
      "push": true,
      "sms": false,
      "email": true
    }
  }
}
```

## 💈 Barber Profile API

### Get All Barbers

```graphql
query GetBarbers {
  barbers {
    id
    userId
    businessName
    bio
    specialties
    experience
    serviceLocations
    workingHours
    services {
      name
      price
      duration
      description
    }
    gallery {
      url
      type
    }
    rating
    totalReviews
    isVerified
    location {
      type
      coordinates
      address
    }
    user {
      name
      email
      avatar
    }
  }
}
```

### Get Barber by ID

```graphql
query GetBarber($id: ID!) {
  barber(id: $id) {
    id
    userId
    businessName
    bio
    specialties
    experience
    serviceLocations
    workingHours
    services {
      name
      price
      duration
      description
    }
    gallery {
      url
      type
    }
    rating
    totalReviews
    isVerified
    location {
      type
      coordinates
      address
    }
    user {
      name
      email
      avatar
      phone
    }
  }
}
```

### Create Barber Profile

```graphql
mutation CreateBarberProfile($input: CreateBarberProfileInput!) {
  createBarberProfile(input: $input) {
    id
    businessName
    bio
    rating
    isVerified
    createdAt
  }
}
```

**Input:**
```json
{
  "input": {
    "userId": "user-id-here",
    "businessName": "Elite Cuts",
    "bio": "Professional barber with 10+ years experience",
    "specialties": ["Fade", "Beard Trim", "Classic Cut"],
    "experience": 10,
    "serviceLocations": ["in_salon", "in_home"],
    "workingHours": {
      "monday": {
        "start": "09:00",
        "end": "18:00",
        "isAvailable": true
      },
      "tuesday": {
        "start": "09:00",
        "end": "18:00",
        "isAvailable": true
      }
    },
    "services": [
      {
        "name": "Basic Cut",
        "price": 25.00,
        "duration": 30,
        "description": "Simple haircut"
      },
      {
        "name": "Fade",
        "price": 35.00,
        "duration": 45,
        "description": "Professional fade cut"
      }
    ],
    "location": {
      "type": "Point",
      "coordinates": [-73.935242, 40.730610],
      "address": "123 Main St, Brooklyn, NY 11201"
    }
  }
}
```

## 📅 Appointment API

### Get All Appointments

```graphql
query GetAppointments {
  appointments {
    id
    clientId
    barberId
    status
    serviceType
    hairType
    specialRequests
    location {
      type
      address
      coordinates
    }
    scheduledFor
    duration
    price
    paymentStatus
    createdAt
    updatedAt
    client {
      id
      name
      email
      avatar
    }
    barber {
      id
      name
      email
      avatar
      businessName
    }
  }
}
```

### Get Appointments for User

```graphql
query GetUserAppointments($userId: ID!) {
  appointments(filter: { clientId: $userId }) {
    id
    status
    serviceType
    scheduledFor
    price
    barber {
      name
      businessName
      avatar
    }
  }
}
```

### Create Appointment

```graphql
mutation CreateAppointment($input: CreateAppointmentInput!) {
  createAppointment(input: $input) {
    id
    status
    serviceType
    scheduledFor
    price
    createdAt
  }
}
```

**Input:**
```json
{
  "input": {
    "clientId": "client-id-here",
    "barberId": "barber-id-here",
    "serviceType": "Fade",
    "hairType": "straight",
    "specialRequests": "Make it a low fade",
    "location": {
      "type": "in_salon",
      "address": "123 Main St, Brooklyn, NY 11201",
      "coordinates": [-73.935242, 40.730610]
    },
    "scheduledFor": "2024-01-15T14:30:00Z",
    "duration": 45,
    "price": 35.00
  }
}
```

### Update Appointment Status

```graphql
mutation UpdateAppointment($id: ID!, $input: UpdateAppointmentInput!) {
  updateAppointment(id: $id, input: $input) {
    id
    status
    updatedAt
  }
}
```

**Input:**
```json
{
  "id": "appointment-id-here",
  "input": {
    "status": "confirmed"
  }
}
```

## 🔍 Search & Filtering

### Search Barbers by Location

```graphql
query SearchBarbers($lat: Float!, $lng: Float!, $radius: Float!) {
  barbers(filter: {
    location: {
      latitude: $lat
      longitude: $lng
      radius: $radius
    }
  }) {
    id
    businessName
    bio
    rating
    location {
      coordinates
      address
    }
    user {
      name
      avatar
    }
  }
}
```

### Filter Barbers by Services

```graphql
query SearchBarbersByServices($services: [String!]!) {
  barbers(filter: {
    services: $services
  }) {
    id
    businessName
    services {
      name
      price
      duration
    }
    rating
  }
}
```

## 📱 React Native Integration Examples

### Apollo Client Setup

```typescript
import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';

const httpLink = createHttpLink({
  uri: 'http://localhost:8080/graphql',
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`,
  },
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
});
```

### User Authentication Hook

```typescript
import { useMutation, useQuery } from '@apollo/client';
import { gql } from '@apollo/client';

const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(input: { email: $email, password: $password }) {
      token
      user {
        id
        email
        name
        role
      }
    }
  }
`;

export const useLogin = () => {
  const [login, { loading, error }] = useMutation(LOGIN_MUTATION);
  
  const handleLogin = async (email: string, password: string) => {
    try {
      const result = await login({ variables: { email, password } });
      const token = result.data?.login?.token;
      if (token) {
        localStorage.setItem('token', token);
      }
      return result.data;
    } catch (err) {
      console.error('Login failed:', err);
      throw err;
    }
  };
  
  return { handleLogin, loading, error };
};
```

### Barber Search Hook

```typescript
const SEARCH_BARBERS_QUERY = gql`
  query SearchBarbers($lat: Float!, $lng: Float!, $radius: Float!) {
    barbers(filter: {
      location: {
        latitude: $lat
        longitude: $lng
        radius: $radius
      }
    }) {
      id
      businessName
      bio
      rating
      totalReviews
      isVerified
      location {
        coordinates
        address
      }
      user {
        name
        avatar
      }
      services {
        name
        price
        duration
      }
    }
  }
`;

export const useBarberSearch = (lat: number, lng: number, radius: number = 10) => {
  const { data, loading, error, refetch } = useQuery(SEARCH_BARBERS_QUERY, {
    variables: { lat, lng, radius },
    skip: !lat || !lng,
  });
  
  return {
    barbers: data?.barbers || [],
    loading,
    error,
    refetch,
  };
};
```

### Appointment Booking Hook

```typescript
const CREATE_APPOINTMENT_MUTATION = gql`
  mutation CreateAppointment($input: CreateAppointmentInput!) {
    createAppointment(input: $input) {
      id
      status
      serviceType
      scheduledFor
      price
      client {
        id
        name
      }
      barber {
        id
        name
        businessName
      }
    }
  }
`;

export const useBookAppointment = () => {
  const [createAppointment, { loading, error }] = useMutation(CREATE_APPOINTMENT_MUTATION);
  
  const bookAppointment = async (appointmentData: CreateAppointmentInput) => {
    try {
      const result = await createAppointment({
        variables: { input: appointmentData },
        refetchQueries: ['GetUserAppointments'],
      });
      return result.data?.createAppointment;
    } catch (err) {
      console.error('Booking failed:', err);
      throw err;
    }
  };
  
  return { bookAppointment, loading, error };
};
```

### User Profile Hook

```typescript
const GET_USER_QUERY = gql`
  query GetUser($id: ID!) {
    user(id: $id) {
      id
      email
      name
      role
      avatar
      location {
        coordinates
      }
      notificationPrefs {
        push
        sms
        email
      }
      createdAt
    }
  }
`;

export const useUserProfile = (userId: string) => {
  const { data, loading, error } = useQuery(GET_USER_QUERY, {
    variables: { id: userId },
    skip: !userId,
  });
  
  return {
    user: data?.user,
    loading,
    error,
  };
};
```

## 🚨 Error Handling

### GraphQL Error Response Format

```json
{
  "errors": [
    {
      "message": "User not found",
      "locations": [
        {
          "line": 2,
          "column": 3
        }
      ],
      "path": ["user"],
      "extensions": {
        "code": "NOT_FOUND"
      }
    }
  ],
  "data": null
}
```

### Error Handling in React Native

```typescript
import { useQuery } from '@apollo/client';

const useSafeQuery = (query, options) => {
  const { data, error, loading, ...rest } = useQuery(query, {
    onError: (error) => {
      console.error('GraphQL Error:', error);
      // Handle different error types
      if (error.networkError) {
        // Network error
        Alert.alert('Network Error', 'Please check your internet connection');
      } else if (error.graphQLErrors) {
        // GraphQL errors
        error.graphQLErrors.forEach((err) => {
          switch (err.extensions?.code) {
            case 'UNAUTHENTICATED':
              Alert.alert('Authentication Error', 'Please login again');
              break;
            case 'FORBIDDEN':
              Alert.alert('Access Denied', 'You don\'t have permission');
              break;
            default:
              Alert.alert('Error', err.message);
          }
        });
      }
    },
    ...options,
  });
  
  return { data, error, loading, ...rest };
};
```

## 🔄 Real-time Updates

### WebSocket Connection Setup

```typescript
import { WebSocketLink } from '@apollo/client/link/ws';

const wsLink = new WebSocketLink({
  uri: `ws://localhost:8080/graphql`,
  options: {
    reconnect: true,
    connectionParams: () => ({
      authorization: `Bearer ${localStorage.getItem('token')}`,
    }),
  },
});
```

### Subscription Example

```graphql
subscription AppointmentUpdated($userId: ID!) {
  appointmentUpdated(userId: $userId) {
    id
    status
    scheduledFor
    barber {
      name
      businessName
    }
  }
}
```

## 📱 React Native Components

### Barber Search Component

```typescript
import React, { useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { useBarberSearch } from '../hooks/useBarberSearch';

interface BarberSearchProps {
  userLocation: { latitude: number; longitude: number };
}

export const BarberSearch: React.FC<BarberSearchProps> = ({ userLocation }) => {
  const [searchRadius, setSearchRadius] = useState(10);
  const { barbers, loading, error } = useBarberSearch(
    userLocation.latitude,
    userLocation.longitude,
    searchRadius
  );

  const renderBarber = ({ item }) => (
    <TouchableOpacity style={styles.barberCard}>
      <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
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

  if (loading) return <Text>Loading barbers...</Text>;
  if (error) return <Text>Error loading barbers</Text>;

  return (
    <View style={styles.container}>
      <FlatList
        data={barbers}
        renderItem={renderBarber}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
```

### Appointment Booking Component

```typescript
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useBookAppointment } from '../hooks/useBookAppointment';

interface BookingProps {
  barberId: string;
  serviceType: string;
  scheduledTime: string;
  userId: string;
}

export const AppointmentBooking: React.FC<BookingProps> = ({
  barberId,
  serviceType,
  scheduledTime,
  userId,
}) => {
  const { bookAppointment, loading } = useBookAppointment();

  const handleBooking = async () => {
    try {
      const appointment = await bookAppointment({
        clientId: userId,
        barberId,
        serviceType,
        scheduledFor: scheduledTime,
        location: {
          type: 'in_salon',
          address: 'Barber Shop Address',
        },
        duration: 45,
        price: 35.00,
      });

      Alert.alert(
        'Booking Confirmed!',
        `Your appointment is confirmed for ${new Date(appointment.scheduledFor).toLocaleString()}`
      );
    } catch (error) {
      Alert.alert('Booking Failed', error.message);
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.bookButton, loading && styles.disabled]}
      onPress={handleBooking}
      disabled={loading}
    >
      <Text style={styles.bookButtonText}>
        {loading ? 'Booking...' : 'Book Appointment'}
      </Text>
    </TouchableOpacity>
  );
};
```

## 🧪 Testing API Calls

### Mocking GraphQL in Tests

```typescript
import { MockedProvider } from '@apollo/client/testing';
import { renderHook, act } from '@testing-library/react-hooks';
import { useBarberSearch } from '../hooks/useBarberSearch';

const mockBarbers = [
  {
    id: '1',
    businessName: 'Elite Cuts',
    bio: 'Professional barber',
    rating: 4.8,
    user: { name: 'John Doe', avatar: 'https://example.com/avatar.jpg' },
  },
];

const mocks = [
  {
    request: {
      query: SEARCH_BARBERS_QUERY,
      variables: { lat: 40.7128, lng: -74.0060, radius: 10 },
    },
    result: {
      data: { barbers: mockBarbers },
    },
  },
];

test('should return barbers for given location', async () => {
  const wrapper = ({ children }) => (
    <MockedProvider mocks={mocks}>{children}</MockedProvider>
  );

  const { result } = renderHook(() => useBarberSearch(40.7128, -74.0060, 10), {
    wrapper,
  });

  await act(async () => {
    await result.current[0].refetch();
  });

  expect(result.current.barbers).toEqual(mockBarbers);
  expect(result.current.loading).toBe(false);
  expect(result.current.error).toBeUndefined();
});
```

## 📚 Additional Resources

- [Apollo Client Documentation](https://www.apollographql.com/docs/react/)
- [GraphQL Best Practices](https://graphql.org/learn/best-practices/)
- [React Native Testing](https://reactnative.dev/docs/testing-overview)
- [Error Handling Patterns](https://kentcdodds.com/posts/error-handling-in-react-native)

## 🔧 Development Tools

### GraphQL Playground
Access the interactive GraphQL playground at:
```
http://localhost:8080/graphql
```

### Schema Introspection
Query the schema to explore available types:

```graphql
query IntrospectionQuery {
  __schema {
    queryType {
      fields {
        name
        description
        type {
          name
          kind
          ofType {
            name
            kind
          }
        }
      }
    }
  }
}
```

This comprehensive API documentation provides everything needed for React Native frontend integration with the Cloud Clips backend! 🚀