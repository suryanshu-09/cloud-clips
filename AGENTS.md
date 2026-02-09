# Agent Guidelines for Cloud Clips

## Tech Stack Overview

**Frontend**: React Native + Expo + NativeWind + TypeScript  
**Backend**: Convex (real-time BaaS)  
**Maps**: OpenStreetMap + Nominatim  
**Payments**: Stripe Connect  
**Auth**: Convex Auth  
**Storage**: Convex File Storage  

---

## Development Commands

```bash
# Mobile (from /mobile directory)
cd mobile
bun install           # Install dependencies
bun dev               # Start Expo dev server
bun android           # Run on Android
bun ios               # Run on iOS
bun lint              # Run ESLint
bun format            # Run Prettier
bun test              # Run tests

# Backend (Convex from /backend directory)
cd backend
npm install           # Install Convex dependencies
npx convex dev        # Start Convex dev server
npx convex deploy     # Deploy to production
```

---

## Project Structure

```
src/
├── app/                # Expo Router navigation
├── components/         # Reusable UI components
├── features/          # Feature-based modules
├── hooks/             # Custom hooks
├── services/          # API/external services
├── store/             # Jotai atoms
├── types/             # TypeScript types
└── utils/             # Helpers & constants
```

---

## Code Style & Conventions

### React Native / TypeScript

- Use functional components with hooks
- TypeScript strict mode enabled
- Props interfaces prefixed with 'I' (e.g., IButtonProps)
- Async functions prefixed with 'async'
- Use optional chaining and nullish coalescing

### Convex Integration

```typescript
// Import from generated files
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

// Use queries
const barbers = useQuery(api.barbers.getNearbyBarbers, {
  lat: location.lat,
  lng: location.lng,
  radius: 10
});

// Use mutations
const book = useMutation(api.appointments.bookAppointment);
```

### State Management

- **Jotai** - Local UI state
- **TanStack Query** - Server state (for non-Convex APIs like Stripe)
- **MMKV** - Persistent storage
- **Convex** - Real-time database state

### Component Rules

- One component per file
- PascalCase for component files and function names
- Props interface in same file unless shared
- Styles at bottom using NativeWind classes

### Import Order

```typescript
// 1. React/React Native
import { useState } from "react";
import { View, Text } from "react-native";

// 2. Expo
import { useRouter } from "expo-router";

// 3. Third-party
import { useQuery } from "convex/react";
import MapView from "react-native-maps";

// 4. Local
import { Button } from "@/components";
import { api } from "@/convex/_generated/api";
```

### Error Handling

```typescript
// Convex errors are typed
try {
  await bookAppointment({ ...args });
} catch (error) {
  if (error instanceof ConvexError) {
    // Handle specific Convex errors
  }
}

// React Error Boundaries for components
<ErrorBoundary fallback={<ErrorScreen />}>
  <App />
</ErrorBoundary>
```

---

## OpenStreetMap Guidelines

### Map Component

```typescript
import MapView, { UrlTile, Marker } from 'react-native-maps';

// Use OSM tiles
<MapView>
  <UrlTile urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png" />
  <Marker coordinate={{ lat, lng }} />
</MapView>
```

### Geocoding (Nominatim)

```typescript
// Always include User-Agent for Nominatim
const response = await fetch(
  `https://nominatim.openstreetmap.org/search?format=json&q=${address}`,
  { headers: { 'User-Agent': 'CloudClips/1.0' } }
);
```

### Rate Limits

- Nominatim: 1 request/second
- Cache results in MMKV
- Use debouncing for search inputs (300ms)

---

## Convex Patterns

### Queries

```typescript
// convex/barbers.ts
import { query } from "./_generated/server";

export const getNearbyBarbers = query({
  args: {
    lat: v.number(),
    lng: v.number(),
    radius: v.number(),
  },
  handler: async (ctx, args) => {
    const barbers = await ctx.db.query("barberProfiles").collect();
    
    // Filter by distance
    return barbers.filter(barber => {
      const distance = calculateDistance(
        args.lat, args.lng,
        barber.location.lat, barber.location.lng
      );
      return distance <= args.radius;
    });
  },
});
```

### Mutations

```typescript
// convex/appointments.ts
import { mutation } from "./_generated/server";

export const bookAppointment = mutation({
  args: {
    barberId: v.id("users"),
    scheduledFor: v.number(),
    // ...
  },
  handler: async (ctx, args) => {
    const userId = ctx.userId;
    if (!userId) throw new Error("Not authenticated");
    
    const appointment = await ctx.db.insert("appointments", {
      clientId: userId,
      barberId: args.barberId,
      scheduledFor: args.scheduledFor,
      status: "pending",
      createdAt: Date.now(),
    });
    
    return appointment;
  },
});
```

### Actions (External APIs)

```typescript
// convex/payments.ts
import { action } from "./_generated/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

export const createPaymentIntent = action({
  args: { amount: v.number(), barberAccountId: v.string() },
  handler: async (ctx, args) => {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: args.amount,
      currency: "usd",
      transfer_data: { destination: args.barberAccountId },
    });
    
    return { clientSecret: paymentIntent.client_secret };
  },
});
```

---

## Performance Guidelines

- Use Convex's automatic caching (queries revalidate automatically)
- FlatList for long lists (barbers, messages, products)
- Image optimization with Convex CDN
- Memoize expensive components with React.memo
- Debounce search inputs (300ms)
- Paginate with cursors, not offset

---

## Testing Guidelines

### Unit Tests

```typescript
// Component tests
import { render, screen } from '@testing-library/react-native';

test('renders barber card', () => {
  render(<BarberCard barber={mockBarber} />);
  expect(screen.getByText(mockBarber.businessName)).toBeTruthy();
});
```

### Convex Tests

```typescript
// convex/_tests/appointments.test.ts
import { test, expect } from "@jest/globals";

test("book appointment", async () => {
  const t = convexTest();
  const userId = await t.run(async (ctx) => {
    return await ctx.db.insert("users", { email: "test@test.com", ... });
  });
  
  const appointment = await t.mutation(api.appointments.bookAppointment, {
    barberId: "...",
    scheduledFor: Date.now(),
  });
  
  expect(appointment.status).toBe("pending");
});
```

---

## Git Workflow

- Feature branches from main
- Branch naming: `feature/description`, `bugfix/description`, `hotfix/description`
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`
- PRs require at least 1 review
- Squash and merge

---

## Security

- Never commit `.env` files
- Use Convex Auth for authentication
- RLS through Convex functions (check ctx.userId)
- Validate all inputs with Zod
- Sanitize user-generated content

---

## Resources

- **README.md** - Full project documentation
- **TODO.md** - Development roadmap and tasks
- **Convex Docs**: https://docs.convex.dev
- **OpenStreetMap Docs**: https://wiki.openstreetmap.org
- **Expo Docs**: https://docs.expo.dev
