# Cloud Clips

## Overview

Cloud Clips is an on-demand barber and salon booking platform connecting clients with barbers for both in-salon and at-home services. Think "Uber for haircuts" - instant booking, real-time availability, seamless payments, and an integrated product marketplace.

---

## Tech Stack

### Frontend (Mobile App)
| Technology | Purpose |
|------------|---------|
| **React Native** | Cross-platform mobile framework |
| **Expo** | Development platform & build tools |
| **TypeScript** | Type-safe JavaScript |
| **NativeWind** | Tailwind CSS for React Native |
| **Expo Router** | File-based navigation |
| **Jotai** | Atomic state management |
| **TanStack Query** | Server state & caching |
| **React Native Maps** | Map integration |
| **React Hook Form + Zod** | Forms & validation |

### Backend
| Technology | Purpose |
|------------|---------|
| **Convex** | Real-time backend-as-a-service |
| **Convex Auth** | Authentication & user management |
| **Convex File Storage** | Image & file storage |
| **Convex HTTP Actions** | Payment webhooks & external APIs |

### Maps & Location
| Technology | Purpose |
|------------|---------|
| **OpenStreetMap** | Free, open-source maps |
| **Nominatim API** | Geocoding & address lookup |
| **OSRM / Valhalla** | Routing & distance calculation |
| **react-native-maps** | Map component with OSM tiles |

### Payments
| Technology | Purpose |
|------------|---------|
| **Stripe** | Payment processing |
| **Stripe Connect** | Split payments to barbers |

### Notifications
| Technology | Purpose |
|------------|---------|
| **Expo Notifications** | Push notifications |
| **Convex** | Real-time data sync |

---

## Why Convex + OpenStreetMaps?

### Why Convex over Supabase/Go?
1. **Real-time by default** - No WebSocket setup needed
2. **Type-safe API** - TypeScript functions with automatic client types
3. **Automatic caching** - Query results cached and invalidated automatically
4. **Atomic transactions** - Built-in ACID transactions
5. **File storage** - Integrated file storage with CDN
6. **Auth built-in** - Multiple auth providers out of the box
7. **Faster development** - No separate backend deployment
8. **Generous free tier** - 1M function calls/month, 1GB storage

### Why OpenStreetMaps over Google Maps?
1. **100% free** - No API quotas or billing
2. **Privacy-focused** - Open data, no tracking
3. **Full control** - Self-host if needed
4. **Offline capable** - Download tiles for offline use
5. **Custom styling** - Full control over map appearance
6. **No API keys** - For basic usage

---

## App Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      MOBILE APP                              │
│  React Native + Expo + NativeWind + Expo Router             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     CONVEX BACKEND                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Queries    │  │  Mutations   │  │   Actions    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  Scheduler   │  │    Auth      │  │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌─────────┐    ┌──────────┐    ┌──────────┐
        │ Stripe  │    │ OpenStreet│    │  Nominatim│
        │ Connect │    │   Map     │    │  Geocoding│
        └─────────┘    └──────────┘    └──────────┘
```

---

## Core Features

### For Clients (Users)
1. **Discovery**
   - Map view with nearby barbers
   - Filter by price, rating, distance, specialties
   - List view with search
   - Barber profiles with portfolio

2. **Booking**
   - Prefilled haircut forms (fade, trim, etc.)
   - In-salon OR at-home service selection
   - Real-time availability calendar
   - Instant booking confirmation

3. **Payments**
   - Save payment methods
   - Apply promo codes
   - Split payment with Stripe Connect
   - Receipts & transaction history

4. **Communication**
   - In-app chat with barber
   - Push notifications for updates
   - Review & rating system

5. **Product Marketplace**
   - Browse hair products
   - Barber recommendations
   - Cart & checkout
   - Order tracking

### For Barbers
1. **Dashboard**
   - Upcoming appointments
   - Earnings overview
   - Quick availability toggle

2. **Profile Management**
   - Service pricing & duration
   - Portfolio gallery
   - Working hours & locations
   - Specialties & bio

3. **Schedule Management**
   - Weekly availability editor
   - Appointment calendar
   - Block time slots
   - Set travel radius (for home visits)

4. **Earnings**
   - Daily/weekly/monthly reports
   - Payout management
   - Transaction history
   - Tax documents

5. **Products & Offers**
   - List recommended products
   - Create discount coupons
   - Track coupon usage

### For Admins
1. **User Management**
   - Verify barber profiles
   - Handle disputes
   - User search & actions

2. **Analytics**
   - Booking trends
   - Revenue reports
   - User growth
   - Popular services

3. **Content Management**
   - Featured barbers
   - System-wide promotions
   - Product catalog

4. **Support**
   - Support tickets
   - Live chat support
   - Refund processing

---

## Database Schema (Convex)

```typescript
// users - Core user data (Convex Auth)
{
  _id: Id<"users">;
  email: string;
  name: string;
  phone?: string;
  avatar?: string;
  role: "client" | "barber" | "admin";
  createdAt: number;
  lastActiveAt: number;
}

// barberProfiles - Extended barber data
{
  _id: Id<"barberProfiles">;
  userId: Id<"users">;
  businessName: string;
  bio: string;
  specialties: string[];
  experience: number; // years
  serviceLocations: ("in_salon" | "in_home")[];
  workingHours: {
    [day: string]: { start: string; end: string; isAvailable: boolean };
  };
  services: { name: string; price: number; duration: number; description?: string }[];
  gallery: { storageId: string; type: "before" | "after" | "space" }[];
  location: { lat: number; lng: number; address: string };
  maxTravelDistance?: number; // km for in-home
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  stripeAccountId?: string;
}

// appointments
{
  _id: Id<"appointments">;
  clientId: Id<"users">;
  barberId: Id<"users">;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  serviceType: string;
  hairType?: "curly" | "straight" | "wavy";
  specialRequests?: string;
  locationType: "in_salon" | "in_home";
  address?: string;
  coordinates?: { lat: number; lng: number };
  scheduledFor: number; // timestamp
  duration: number; // minutes
  price: number;
  finalPrice: number;
  couponCode?: string;
  discountAmount: number;
  paymentStatus: "pending" | "authorized" | "captured" | "refunded";
  stripePaymentIntentId?: string;
  cancellationReason?: string;
  cancelledBy?: Id<"users">;
  createdAt: number;
}

// reviews
{
  _id: Id<"reviews">;
  appointmentId: Id<"appointments">;
  clientId: Id<"users">;
  barberId: Id<"users">;
  rating: number; // 1-5
  comment?: string;
  photos?: string[]; // storageIds
  createdAt: number;
}

// messages (chat)
{
  _id: Id<"messages">;
  appointmentId: Id<"appointments">;
  senderId: Id<"users">;
  content: string;
  createdAt: number;
  readAt?: number;
}

// products
{
  _id: Id<"products">;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[]; // storageIds
  stock: number;
  rating: number;
  totalReviews: number;
  barberId?: Id<"users">; // recommended by
  specs: Record<string, string>;
  isActive: boolean;
}

// orders
{
  _id: Id<"orders">;
  userId: Id<"users">;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  items: { productId: Id<"products">; quantity: number; price: number }[];
  totalAmount: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  paymentId?: string;
  createdAt: number;
}

// coupons
{
  _id: Id<"coupons">;
  code: string;
  type: "percentage" | "fixed";
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  validFrom: number;
  validUntil: number;
  usageLimit?: number;
  usageCount: number;
  applicableTo: {
    services?: boolean;
    products?: boolean;
    barberIds?: Id<"users">[];
  };
  createdBy: Id<"users">;
}

// notifications
{
  _id: Id<"notifications">;
  userId: Id<"users">;
  type: "appointment" | "chat" | "promo" | "system" | "payment";
  title: string;
  body: string;
  data?: Record<string, any>;
  isRead: boolean;
  pushSent: boolean;
  createdAt: number;
}

// pushTokens - Expo push tokens
{
  _id: Id<"pushTokens">;
  userId: Id<"users">;
  token: string;
  platform: "ios" | "android";
  updatedAt: number;
}
```

---

## Convex Queries & Mutations

### Client Queries
```typescript
// Get nearby barbers with filters
getNearbyBarbers(args: {
  lat: number;
  lng: number;
  radius: number; // km
  filters?: { priceMin?: number; priceMax?: number; rating?: number; specialties?: string[] };
  sortBy: "distance" | "rating" | "price";
  cursor?: string;
  limit: number;
}): { barbers: BarberWithDistance[]; nextCursor?: string }

// Get barber profile
getBarberProfile(args: { barberId: Id<"users"> }): BarberProfile | null

// Get barber availability
getBarberAvailability(args: {
  barberId: Id<"users">;
  date: string; // YYYY-MM-DD
}): { slots: TimeSlot[] }

// Get user's appointments
getMyAppointments(args: {
  status?: AppointmentStatus;
  cursor?: string;
  limit: number;
}): { appointments: AppointmentWithDetails[]; nextCursor?: string }

// Get chat messages
getChatMessages(args: {
  appointmentId: Id<"appointments">;
  cursor?: string;
  limit: number;
}): { messages: Message[]; nextCursor?: string }

// Get notifications
getMyNotifications(args: {
  unreadOnly?: boolean;
  cursor?: string;
  limit: number;
}): { notifications: Notification[]; nextCursor?: string }
```

### Client Mutations
```typescript
// Book appointment
bookAppointment(args: {
  barberId: Id<"users">;
  serviceType: string;
  scheduledFor: number;
  locationType: "in_salon" | "in_home";
  address?: string;
  coordinates?: { lat: number; lng: number };
  hairType?: string;
  specialRequests?: string;
  couponCode?: string;
}): { appointmentId: Id<"appointments">; clientSecret: string }

// Cancel appointment
cancelAppointment(args: {
  appointmentId: Id<"appointments">;
  reason: string;
}): void

// Send chat message
sendMessage(args: {
  appointmentId: Id<"appointments">;
  content: string;
}): Id<"messages">

// Submit review
submitReview(args: {
  appointmentId: Id<"appointments">;
  rating: number;
  comment?: string;
  photos?: string[]; // storageIds
}): void

// Register push token
registerPushToken(args: { token: string; platform: "ios" | "android" }): void
```

### Barber Mutations
```typescript
// Update profile
updateBarberProfile(args: {
  businessName?: string;
  bio?: string;
  specialties?: string[];
  services?: Service[];
  workingHours?: WorkingHours;
  maxTravelDistance?: number;
}): void

// Update availability
updateAvailability(args: {
  date: string;
  slots: { start: string; end: string; isAvailable: boolean }[];
}): void

// Accept/decline appointment
updateAppointmentStatus(args: {
  appointmentId: Id<"appointments">;
  status: "confirmed" | "cancelled";
  reason?: string;
}): void

// Mark appointment complete
completeAppointment(args: {
  appointmentId: Id<"appointments">;
}): void

// Upload gallery images
uploadGalleryImages(args: {
  images: { storageId: string; type: "before" | "after" | "space" }[];
}): void
```

---

## Map Implementation (OpenStreetMap)

### Setup
```typescript
// Using react-native-maps with OSM tiles
import MapView, { UrlTile, Marker, Circle } from 'react-native-maps';

// OSM tile URL template
const OSM_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

<MapView
  initialRegion={{
    latitude: userLocation.lat,
    longitude: userLocation.lng,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  }}
>
  <UrlTile urlTemplate={OSM_TILE_URL} />
  
  {barbers.map(barber => (
    <Marker
      key={barber._id}
      coordinate={{ latitude: barber.location.lat, longitude: barber.location.lng }}
      title={barber.businessName}
      description={`${barber.rating}★`}
    >
      <CustomMarker rating={barber.rating} />
    </Marker>
  ))}
  
  {/* Search radius circle */}
  <Circle
    center={userLocation}
    radius={radiusKm * 1000}
    strokeColor="rgba(0, 150, 255, 0.5)"
    fillColor="rgba(0, 150, 255, 0.1)"
  />
</MapView>
```

### Geocoding (Nominatim)
```typescript
// Address to coordinates
async function geocodeAddress(address: string): Promise<{ lat: number; lng: number }> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`
  );
  const data = await response.json();
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

// Reverse geocoding
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
  );
  const data = await response.json();
  return data.display_name;
}
```

---

## Payment Flow (Stripe Connect)

### Setup
1. Barbers onboard with Stripe Connect Express
2. Platform takes commission (e.g., 15%)
3. Barber receives remainder

### Booking Flow
```typescript
// 1. Client books appointment
// Creates PaymentIntent with application_fee_amount

// 2. Client confirms payment
// Payment authorized (not captured yet)

// 3. Appointment completed
// Payment captured to barber's account

// 4. If cancelled
// Payment cancelled/refunded
```

### Convex Action
```typescript
// convex/payments.ts
import { action } from "./_generated/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2023-10-16" });

export const createPaymentIntent = action({
  args: {
    appointmentId: v.id("appointments"),
    amount: v.number(), // cents
    barberStripeAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    const platformFee = Math.round(args.amount * 0.15); // 15% commission
    
    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: "usd",
      application_fee_amount: platformFee,
      transfer_data: {
        destination: args.barberStripeAccountId,
      },
      metadata: { appointmentId: args.appointmentId },
    });
    
    return { clientSecret: paymentIntent.client_secret! };
  },
});
```

---

## Real-time Features

### Live Chat
Convex automatically syncs messages in real-time:
```typescript
// Frontend - Auto-updates when new messages arrive
const messages = useQuery(api.messages.getChatMessages, { appointmentId });

// Convex - Optimistic updates
export const sendMessage = mutation({
  args: { appointmentId: v.id("appointments"), content: v.string() },
  handler: async (ctx, args) => {
    const message = await ctx.db.insert("messages", {
      appointmentId: args.appointmentId,
      senderId: ctx.userId,
      content: args.content,
      createdAt: Date.now(),
    });
    
    // Trigger push notification
    await ctx.scheduler.runAfter(0, api.pushNotifications.sendChatNotification, {
      appointmentId: args.appointmentId,
      messageId: message,
    });
    
    return message;
  },
});
```

### Live Availability
Barber's availability updates instantly for all clients:
```typescript
const availability = useQuery(api.barbers.getAvailability, { 
  barberId, 
  date 
});
```

---

## Push Notifications (Expo)

### Setup
```typescript
// services/notifications.ts
import * as Notifications from 'expo-notifications';

export async function registerForPushNotificationsAsync() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') return null;
  
  const token = (await Notifications.getExpoPushTokenAsync()).data;
  return token;
}
```

### Convex Scheduler for Notifications
```typescript
// convex/notifications.ts
export const scheduleAppointmentReminder = internalMutation({
  args: { appointmentId: v.id("appointments"), reminderTime: v.number() },
  handler: async (ctx, args) => {
    await ctx.scheduler.runAt(args.reminderTime, api.pushNotifications.sendReminder, {
      appointmentId: args.appointmentId,
    });
  },
});
```

---

## File Storage (Convex)

### Upload Flow
```typescript
// 1. Generate upload URL
const { uploadUrl, storageId } = await api.storage.generateUploadUrl();

// 2. Upload file
await fetch(uploadUrl, { method: "POST", body: file });

// 3. Save storageId in database
await api.users.updateAvatar({ storageId });

// 4. Get URL for display
const imageUrl = `${CONVEX_SITE_URL}/api/storage/${storageId}`;
```

---

## Security (Row-Level Security)

Convex uses implicit role-based access through auth:
```typescript
// Only barber can update their own profile
export const updateBarberProfile = mutation({
  args: { ... },
  handler: async (ctx, args) => {
    const userId = ctx.userId;
    if (!userId) throw new Error("Not authenticated");
    
    const profile = await ctx.db.query("barberProfiles")
      .withIndex("userId", q => q.eq("userId", userId))
      .first();
      
    if (!profile) throw new Error("Profile not found");
    
    await ctx.db.patch(profile._id, { ...args });
  },
});

// Only appointment participants can see chat
export const getChatMessages = query({
  args: { appointmentId: v.id("appointments"), ... },
  handler: async (ctx, args) => {
    const userId = ctx.userId;
    const appointment = await ctx.db.get(args.appointmentId);
    
    if (appointment.clientId !== userId && appointment.barberId !== userId) {
      throw new Error("Unauthorized");
    }
    
    return ctx.db.query("messages")
      .withIndex("appointmentId", q => q.eq("appointmentId", args.appointmentId))
      .order("desc")
      .take(args.limit);
  },
});
```

---

## Offline Support

### TanStack Query + MMKV
```typescript
// Persistent cache
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

// Persist to MMKV
const storage = new MMKV();
const persistCache = new PersistQueryClient({
  queryClient,
  persister: createAsyncStoragePersister({ storage }),
});
```

### Optimistic Updates
```typescript
const bookMutation = useMutation({
  mutationFn: api.appointments.bookAppointment,
  onMutate: async (newBooking) => {
    // Optimistically add to appointments list
    await queryClient.cancelQueries({ queryKey: ['appointments'] });
    const previous = queryClient.getQueryData(['appointments']);
    queryClient.setQueryData(['appointments'], (old: any) => [...old, newBooking]);
    return { previous };
  },
  onError: (err, newBooking, context) => {
    // Rollback on error
    queryClient.setQueryData(['appointments'], context?.previous);
  },
});
```

---

## Performance Optimizations

1. **Pagination** - All list queries use cursor-based pagination
2. **Image Optimization** - Convex serves images via CDN with automatic resizing
3. **Query Debouncing** - Search inputs debounced at 300ms
4. **Memoization** - React.memo for expensive components
5. **FlatList** - Virtualized lists for long data
6. **Lazy Loading** - Routes loaded on demand
7. **Asset Optimization** - Images compressed, fonts subsetted

---

## Development Commands

```bash
# Mobile
cd mobile
bun install
bun dev              # Start Expo
cd ..

# Backend (Convex)
cd backend
npm install
npx convex dev       # Start Convex dev server
```

---

## Environment Variables

```bash
# Mobile (.env)
EXPO_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
EXPO_PUBLIC_MAPS_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png

# Convex (convex/.env)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## Deployment

### Mobile (Expo EAS)
```bash
cd mobile
eas build --platform ios     # iOS build
eas build --platform android # Android build
eas submit --platform ios    # Submit to App Store
eas submit --platform android # Submit to Play Store
```

### Backend (Convex)
```bash
cd backend
npx convex deploy
```

---

## Monitoring

- **Convex Dashboard** - Query performance, errors, logs
- **Sentry** - Error tracking (React Native SDK)
- **Expo Insights** - App analytics
- **Stripe Dashboard** - Payment monitoring

---

## Future Enhancements

1. **AI Hairstyle Recommendations** - Suggest styles based on face shape
2. **AR Try-On** - Preview hairstyles using AR
3. **Multi-language** - i18n support
4. **Loyalty Program** - Points system for frequent bookings
5. **Barber Teams** - Multi-barber salon management
6. **Video Consultations** - Pre-appointment video calls
7. **Subscription Plans** - Monthly unlimited cuts

---

## License

MIT
