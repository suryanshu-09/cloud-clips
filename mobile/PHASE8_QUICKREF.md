# Phase 8 Quick Reference Guide

## Booking Feature Overview

Quick reference for using the booking feature implementation.

## Import Paths

```typescript
// Hooks
import { 
  useBooking, 
  useAppointments, 
  useAvailability 
} from '@/features/bookings';

// Components
import { 
  HaircutSelector, 
  DateTimePicker, 
  BookingSummary 
} from '@/components/booking';

// Types
import type { 
  Appointment, 
  CreateAppointmentDTO, 
  HairType, 
  LocationType 
} from '@/features/bookings';
```

## Key Hooks

### useBooking
```typescript
const { 
  createAppointment,    // Mutation to create
  updateAppointment,    // Mutation to update
  cancelAppointment,    // Mutation to cancel
  confirmAppointment,   // Barber confirms
  completeAppointment,  // Barber completes
  isCreating,          // Loading state
  createError          // Error state
} = useBooking({ 
  onSuccess, 
  onError 
});

// Create appointment
createAppointment.mutate({
  barberId: 'id',
  serviceType: 'haircut',
  hairType: 'straight',
  location: { type: 'in_salon' },
  scheduledFor: new Date(),
});
```

### useAppointments
```typescript
const { 
  appointments,  // Array of appointments
  isLoading,     // Loading state
  refetch        // Refetch function
} = useAppointments({
  filters: {
    status: 'confirmed',
    barberId: 'id'
  }
});

// Convenience hooks
useUpcomingAppointments()
usePastAppointments()
usePendingAppointments()
```

### useAvailability
```typescript
const { 
  availability,  // AvailabilityDay[]
  isLoading 
} = useAvailability({
  barberId: 'id',
  startDate: new Date(),
  endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  duration: 60
});

// Convenience hooks
useWeekAvailability(barberId, duration)   // Next 7 days
useMonthAvailability(barberId, duration)  // Next 30 days
```

## Components

### HaircutSelector
```typescript
<HaircutSelector 
  selected={hairType}
  onSelect={setHairType}
  disabled={false}
/>
```

### DateTimePicker
```typescript
<DateTimePicker 
  availability={availability}
  selectedDate={date}
  selectedTime={time}
  onDateSelect={setDate}
  onTimeSelect={setTime}
  isLoading={false}
/>
```

### BookingSummary
```typescript
<BookingSummary 
  barberName="John Doe"
  barberAvatar="url"
  serviceName="Haircut"
  servicePrice={50}
  serviceDuration={60}
  hairType="straight"
  scheduledFor={new Date()}
  location={{ type: 'in_salon', address: '123 Main St' }}
  specialRequests="Please be on time"
  discount={10}
  couponCode="SAVE10"
/>
```

## Types

### Hair Types
- `'straight'` - Straight hair
- `'wavy'` - Wavy hair
- `'curly'` - Curly hair

### Location Types
- `'in_home'` - In-home service
- `'in_salon'` - In-salon service

### Appointment Status
- `'pending'` - Awaiting confirmation
- `'confirmed'` - Confirmed by barber
- `'completed'` - Service completed
- `'cancelled'` - Cancelled by user/barber

### Payment Status
- `'pending'` - Payment not completed
- `'completed'` - Payment successful
- `'refunded'` - Payment refunded

## API Endpoints

All endpoints are prefixed with `/appointments`:

- `POST /appointments` - Create
- `GET /appointments/:id` - Get by ID
- `GET /appointments/me` - Get user's appointments
- `GET /appointments/barber/:barberId` - Get barber's appointments
- `PATCH /appointments/:id` - Update
- `POST /appointments/:id/cancel` - Cancel
- `POST /appointments/:id/confirm` - Confirm (barber)
- `POST /appointments/:id/complete` - Complete (barber)
- `GET /appointments/availability` - Get availability
- `POST /appointments/availability/check` - Check slot

## Common Patterns

### Complete Booking Flow
```typescript
function BookingFlow({ barberId, service }) {
  const [hairType, setHairType] = useState<HairType>();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState<Date>();
  
  const { availability } = useWeekAvailability(barberId, service.duration);
  const { createAppointment, isCreating } = useBooking({
    onSuccess: (appointment) => router.push(`/appointments/${appointment._id}`)
  });
  
  const handleBook = () => {
    createAppointment.mutate({
      barberId,
      serviceType: service.name,
      hairType,
      scheduledFor: time,
      location: { type: 'in_salon' },
    });
  };
  
  return (
    <View>
      <HaircutSelector selected={hairType} onSelect={setHairType} />
      <DateTimePicker 
        availability={availability}
        selectedDate={date}
        selectedTime={time}
        onDateSelect={setDate}
        onTimeSelect={setTime}
      />
      <Button onPress={handleBook} loading={isCreating}>
        Book Appointment
      </Button>
    </View>
  );
}
```

### Appointments List
```typescript
function AppointmentsList() {
  const { appointments, isLoading, refetch } = useUpcomingAppointments();
  
  if (isLoading) return <Skeleton />;
  
  return (
    <FlatList 
      data={appointments}
      onRefresh={refetch}
      renderItem={({ item }) => <AppointmentCard appointment={item} />}
    />
  );
}
```

### Barber Dashboard
```typescript
function BarberDashboard({ barberId }) {
  const { appointments } = useBarberAppointments({ barberId });
  const { confirmAppointment, completeAppointment } = useBooking();
  
  const handleConfirm = (id: string) => {
    confirmAppointment.mutate(id);
  };
  
  const handleComplete = (id: string) => {
    completeAppointment.mutate(id);
  };
}
```

## Cache Management

Query keys are centralized in `BOOKING_QUERY_KEYS`:

```typescript
// Manual cache invalidation
import { BOOKING_QUERY_KEYS } from '@/features/bookings';

queryClient.invalidateQueries({ 
  queryKey: BOOKING_QUERY_KEYS.appointments 
});

// Specific appointment
queryClient.invalidateQueries({ 
  queryKey: BOOKING_QUERY_KEYS.appointment(appointmentId) 
});
```

## Error Handling

```typescript
const { createAppointment, createError } = useBooking({
  onError: (error) => {
    if (error instanceof ApiError) {
      // Handle specific API errors
      showToast(error.message);
    }
  }
});

// Access error in component
if (createError) {
  return <ErrorView error={createError} />;
}
```

## Files Reference

- **Types**: `mobile/src/features/bookings/types.ts`
- **Service**: `mobile/src/features/bookings/services/bookingService.ts`
- **Hooks**: `mobile/src/features/bookings/hooks/`
- **Components**: `mobile/src/components/booking/`
- **Docs**: `mobile/PHASE8_COMPLETE.md`
