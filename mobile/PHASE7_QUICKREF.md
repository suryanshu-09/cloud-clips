# Phase 7 Quick Reference

## Barber Feature Usage

### Import the Feature
```typescript
import {
  useBarbers,
  useNearbyBarbers,
  useBarberProfile,
  useBarberSearch,
  type IBarberProfile,
  type IBarberSearchParams,
} from '@/features/barbers';
```

### Import Components
```typescript
import { BarberCard } from '@/components/barber/BarberCard';
import { BarberList } from '@/components/barber/BarberList';
import { ServiceList } from '@/components/barber/ServiceList';
```

## Hook Examples

### 1. Fetch All Barbers
```typescript
const { data, isLoading, error } = useBarbers({
  page: 1,
  limit: 20,
});

// Access: data.barbers, data.total, data.hasMore
```

### 2. Nearby Barbers (Location-Based)
```typescript
const { data, isLoading } = useNearbyBarbers({
  latitude: 40.7128,
  longitude: -74.0060,
  radius: 10, // in kilometers
});
```

### 3. Get Single Barber Profile
```typescript
const { data: barber, isLoading } = useBarberProfile(barberId);

// Access: barber.services, barber.gallery, barber.rating, etc.
```

### 4. Advanced Search with Filters
```typescript
const {
  data,
  updateSpecialties,
  updateServiceLocation,
  updateSortBy,
  resetFilters,
  hasActiveFilters,
} = useBarberSearch({
  specialties: ['Haircut', 'Fade'],
  serviceLocation: 'in_home',
  minRating: 4.0,
  sortBy: 'rating',
});

// Update filters
updateSpecialties(['Haircut', 'Beard Trim']);
updateServiceLocation('in_salon');
updateSortBy('distance');
resetFilters(); // Clear all filters
```

## Component Examples

### 1. BarberCard
```typescript
<BarberCard
  barber={barberProfile}
  showDistance={true}
  distance={2.5}
  onPress={() => navigateToProfile(barberProfile.id)}
/>
```

### 2. BarberList
```typescript
<BarberList
  barbers={barbers}
  isLoading={isLoading}
  isError={isError}
  error={error}
  onBarberPress={(barber) => router.push(`/barber/${barber.id}`)}
  onRetry={refetch}
  showDistance={true}
  refreshing={isRefreshing}
  onRefresh={handleRefresh}
/>
```

### 3. ServiceList
```typescript
<ServiceList
  services={barber.services}
  onServiceSelect={(service) => setSelectedService(service)}
  selectedServiceId={selectedService?.name}
  variant="default" // or "compact"
/>
```

## Screen Navigation

### Navigate to Barber Profile
```typescript
import { useRouter } from 'expo-router';

const router = useRouter();
router.push(`/(client)/booking/${barberId}`);
```

### From Profile to Booking
```typescript
// Inside barber profile screen
router.push(`/(client)/booking/form?barberId=${barberId}`);
```

## API Endpoints Used

- `GET /barbers` - List all barbers
- `GET /barbers/nearby` - Nearby barbers
- `GET /barbers/search` - Search with filters
- `GET /barbers/:id` - Single barber profile
- `GET /barbers/:id/availability` - Check availability
- `GET /barbers/:id/reviews` - Barber reviews
- `GET /barbers/:id/portfolio` - Barber gallery

## Type Definitions

### IBarberProfile
```typescript
{
  id: string;
  userId: string;
  businessName?: string;
  bio: string;
  specialties: string[];
  experience: number;
  serviceLocations: ('in_home' | 'in_salon')[];
  workingHours: Record<string, IWorkingHour>;
  services: IService[];
  gallery: IGalleryItem[];
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  location: ILocationWithAddress;
}
```

### IService
```typescript
{
  name: string;
  price: number;
  duration: number; // in minutes
  description?: string;
}
```

### IBarberSearchParams
```typescript
{
  latitude?: number;
  longitude?: number;
  radius?: number; // in km
  specialties?: string[];
  serviceLocation?: 'in_home' | 'in_salon';
  minRating?: number;
  sortBy?: 'distance' | 'rating' | 'price' | 'experience';
  page?: number;
  limit?: number;
}
```

## Location Integration

### Request Location Permission
```typescript
import * as Location from 'expo-location';

const { status } = await Location.requestForegroundPermissionsAsync();
if (status === 'granted') {
  const location = await Location.getCurrentPositionAsync({});
  const { latitude, longitude } = location.coords;
}
```

### Use with Nearby Barbers Hook
```typescript
const [location, setLocation] = useState(null);

useEffect(() => {
  (async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status === 'granted') {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
    }
  })();
}, []);

const { data } = useNearbyBarbers(
  location || { latitude: 0, longitude: 0 },
  { enabled: !!location }
);
```

## Common Patterns

### Loading State
```typescript
if (isLoading) {
  return <ActivityIndicator size="large" color="#0066CC" />;
}
```

### Error Handling
```typescript
if (isError) {
  return (
    <EmptyState
      title="Failed to load barbers"
      description={error?.message}
    />
  );
}
```

### Empty State
```typescript
if (barbers.length === 0) {
  return (
    <EmptyState
      title="No barbers found"
      description="Try adjusting your filters"
    />
  );
}
```

## TanStack Query Features

All hooks use TanStack Query, which provides:
- ✅ Automatic caching
- ✅ Background refetching
- ✅ Stale-while-revalidate
- ✅ Error retry logic
- ✅ Loading states
- ✅ Optimistic updates

### Query Keys
```typescript
['barbers'] // All barbers
['barbers', params] // Barbers with params
['barbers', 'nearby', params] // Nearby barbers
['barbers', 'search', searchParams] // Search results
['barber', barberId] // Single barber
['barber', barberId, 'availability', date] // Availability
['barber', barberId, 'reviews'] // Reviews
['barber', barberId, 'portfolio'] // Portfolio
```

## Stale Times
- Barber list: 5 minutes
- Nearby barbers: 2 minutes
- Barber profile: 10 minutes
- Availability: 1 minute
- Reviews: 5 minutes

---

**For full implementation details, see**: `PHASE7_COMPLETE.md`
