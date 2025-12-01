# Mock Services Guide

## Overview

The Cloud Clips app includes comprehensive mock services for development and testing without requiring a backend server. This allows you to develop and test the frontend independently.

## Enabling Mock Mode

Mock services are controlled by the `EXPO_PUBLIC_DEV_MODE` environment variable in your `.env` file:

```env
# Enable mock services
EXPO_PUBLIC_DEV_MODE=true

# Disable mock services (use real API)
EXPO_PUBLIC_DEV_MODE=false
```

When `DEV_MODE=true`, all services automatically use mock data instead of making real API calls.

## Available Mock Services

### 1. Auth Service (`mockAuthService.ts`)

**Test Accounts**:
```
Clients:
- client1@test.com / password123
- client2@test.com / password123

Barbers:
- barber1@test.com / password123
- barber2@test.com / password123
```

**Features**:
- Login/Register
- Password reset
- Profile updates
- Account deletion

### 2. Barber Service (`mockBarberService.ts`)

**Mock Data**: 4 barber profiles with:
- Business names and bios
- Services and pricing
- Working hours
- Locations in Chennai
- Gallery images
- Ratings and reviews

**Features**:
- List all barbers
- Search barbers
- Get nearby barbers (with distance calculation)
- Get barber profile
- Get availability
- Get reviews
- Update profile
- Upload portfolio images

**Mock Barbers**:
1. **Mike's Barber Shop** (barber-1)
   - Specialties: Fades, Tapers, Beard Trim
   - Price range: $20-$40
   - Rating: 4.8/5

2. **Sarah's Style Studio** (barber-2)
   - Specialties: Modern Cuts, Color, Highlights
   - Price range: $35-$95
   - Rating: 4.9/5

3. **Classic Cuts** (barber-3)
   - Specialties: Classic Cuts, Pompadour
   - Price range: $20-$45
   - Rating: 4.7/5

4. **The Gentleman's Room** (barber-4)
   - Specialties: Executive Cuts, Beard Sculpting
   - Price range: $35-$65
   - Rating: 4.9/5

### 3. Booking Service (`mockBookingService.ts`)

**Mock Data**: 3 sample appointments with different statuses

**Features**:
- Create appointments
- Get appointment by ID
- Get user appointments (with filters)
- Get barber appointments
- Update appointments
- Cancel appointments
- Confirm appointments (barber)
- Complete appointments (barber)
- Get availability (auto-generated slots)
- Check slot availability

**Appointment Statuses**:
- `pending` - Awaiting confirmation
- `confirmed` - Confirmed by barber
- `completed` - Service completed
- `cancelled` - Cancelled

## How It Works

### Automatic Service Switching

The services automatically switch between mock and real implementations:

```typescript
// barberService.ts
const USE_MOCK = process.env.EXPO_PUBLIC_DEV_MODE === 'true';
export const barberService = USE_MOCK ? mockBarberService : realBarberService;
```

### No Code Changes Required

Your app code remains the same whether using mock or real services:

```typescript
// This works with both mock and real services
const { data: barbers } = useBarbers();
const { createAppointment } = useBooking();
```

## Mock Data Persistence

Mock data persists **only during the app session**. When you reload the app:
- Mock appointments reset
- Custom registered users are lost
- Predefined test accounts remain available

For persistent development data, use a real backend.

## Network Delays

Mock services simulate realistic network delays:
- Fast operations: 300ms (get by ID)
- Normal operations: 500ms (list queries)
- Slow operations: 800ms (create, upload)

This helps test loading states and UI feedback.

## Development Workflow

### 1. Pure Frontend Development
```env
EXPO_PUBLIC_DEV_MODE=true
```
- Work on UI/UX without backend
- Test all user flows
- Develop component logic

### 2. Backend Integration Testing
```env
EXPO_PUBLIC_DEV_MODE=false
EXPO_PUBLIC_API_BASE_URL=http://localhost:8080
```
- Test real API calls
- Verify data structures
- Debug integration issues

### 3. Production
```env
EXPO_PUBLIC_DEV_MODE=false
EXPO_PUBLIC_API_BASE_URL=https://api.yourapp.com
```
- Use production backend
- Real user data

## Testing Different Scenarios

### Test as Client
1. Login with `client1@test.com`
2. Browse barbers
3. Create appointments
4. View appointment history

### Test as Barber
1. Login with `barber1@test.com`
2. View incoming appointments
3. Confirm/complete appointments
4. Manage profile and services

### Test Edge Cases
Mock services include realistic data for testing:
- Different appointment statuses
- Various service types and prices
- Multiple locations
- Past and future appointments
- Applied coupons and discounts

## Customizing Mock Data

You can modify the mock data in the service files:

**Add More Barbers**:
Edit `mockBarberService.ts` and add to the `MOCK_BARBERS` array.

**Add Test Appointments**:
Edit `mockBookingService.ts` and add to `MOCK_APPOINTMENTS`.

**Add Test Accounts**:
Edit `mockAuthService.ts` and add to `MOCK_USERS`.

## Console Logs

Mock services log important actions:
```
[MOCK] Password reset email sent to: user@test.com
[MOCK] Appointment cancelled. Reason: Change of plans
```

This helps debug and understand what's happening during development.

## Limitations

Mock services have some limitations:

1. **No Real Authentication**: Mock tokens are just strings
2. **No Data Persistence**: Resets on app reload
3. **Simplified Logic**: Some business rules may be simplified
4. **No Real-time Updates**: No WebSocket/real-time features
5. **Limited Validation**: Less strict than real backend

## Troubleshooting

### Service Still Making Real API Calls

1. Check `.env` file: `EXPO_PUBLIC_DEV_MODE=true`
2. Restart Metro bundler (may need to clear cache)
3. Verify environment variable is loaded:
   ```typescript
   console.log('DEV_MODE:', process.env.EXPO_PUBLIC_DEV_MODE);
   ```

### Mock Data Not Showing

1. Check console for errors
2. Verify imports are correct
3. Ensure mock service files exist
4. Check network delay hasn't timed out

### Cannot Login with Test Accounts

1. Use exact email/password from mock service
2. Check `mockAuthService.ts` for available accounts
3. Try creating a new account (will work in mock mode)

## Best Practices

1. **Keep Mock Data Realistic**: Match production data structures
2. **Test Both Modes**: Regularly switch between mock and real
3. **Update Mocks with API Changes**: Keep in sync with backend
4. **Use for E2E Tests**: Great for automated testing
5. **Document Custom Scenarios**: Add comments for special test cases

## Files Reference

- `mobile/src/features/auth/services/mockAuthService.ts`
- `mobile/src/features/barbers/services/mockBarberService.ts`
- `mobile/src/features/bookings/services/mockBookingService.ts`
- `mobile/.env.example` - Environment variables
- `mobile/DEV_MODE_GUIDE.md` - General dev mode guide

## Summary

Mock services let you:
- ✅ Develop without backend
- ✅ Test all user flows
- ✅ Create predictable test scenarios
- ✅ Work offline
- ✅ Speed up development

Simply set `EXPO_PUBLIC_DEV_MODE=true` and you're ready to go!
