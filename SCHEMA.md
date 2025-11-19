# Database Schema for Cloud Clips

## User Collection
```typescript
interface User {
  _id: ObjectId;
  email: string;
  phone: string;
  name: string;
  avatar?: string;
  role: 'client' | 'barber' | 'admin';
  location: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  createdAt: Date;
  lastActive: Date;
  notificationPrefs: {
    push: boolean;
    sms: boolean;
    email: boolean;
  };
  authProvider: 'email' | 'google' | 'apple';
  stripeCustomerId?: string;
}
```

## BarberProfile Collection
```typescript
interface BarberProfile {
  _id: ObjectId;
  userId: ObjectId; // ref: User
  businessName?: string;
  bio: string;
  specialties: string[];
  experience: number; // years
  serviceLocations: ('in_home' | 'in_salon')[];
  workingHours: {
    [day: string]: { // monday, tuesday, etc.
      start: string; // HH:mm
      end: string;
      isAvailable: boolean;
    }
  };
  services: {
    name: string;
    price: number;
    duration: number; // minutes
    description?: string;
  }[];
  gallery: {
    url: string;
    type: 'before' | 'after' | 'space';
  }[];
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  location: {
    type: 'Point';
    coordinates: [number, number];
    address: string;
  };
}
```

## Appointment Collection
```typescript
interface Appointment {
  _id: ObjectId;
  clientId: ObjectId; // ref: User
  barberId: ObjectId; // ref: User
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  serviceType: string; // ref: BarberProfile.services
  hairType: 'curly' | 'straight' | 'wavy';
  specialRequests?: string;
  location: {
    type: 'in_home' | 'in_salon';
    address?: string;
    coordinates?: [number, number];
  };
  scheduledFor: Date;
  duration: number; // minutes
  price: number;
  appliedCouponId?: ObjectId;
  paymentStatus: 'pending' | 'completed' | 'refunded';
  paymentId?: string; // Stripe/Razorpay ID
  createdAt: Date;
  updatedAt: Date;
}
```

## Review Collection
```typescript
interface Review {
  _id: ObjectId;
  appointmentId: ObjectId; // ref: Appointment
  clientId: ObjectId; // ref: User
  barberId: ObjectId; // ref: User
  rating: number; // 1-5
  comment?: string;
  photos?: string[];
  createdAt: Date;
}
```

## Product Collection
```typescript
interface Product {
  _id: ObjectId;
  name: string;
  description: string;
  category: string;
  price: number;
  images: string[];
  stock: number;
  rating: number;
  totalReviews: number;
  barberId?: ObjectId; // if recommended by specific barber
  specs: {
    [key: string]: string; // e.g. size, weight, etc.
  };
}
```

## Order Collection
```typescript
interface Order {
  _id: ObjectId;
  userId: ObjectId; // ref: User
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  items: {
    productId: ObjectId;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  shippingAddress: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    zip: string;
  };
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

## Coupon Collection
```typescript
interface Coupon {
  _id: ObjectId;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  validFrom: Date;
  validUntil: Date;
  usageLimit?: number;
  usageCount: number;
  applicableTo: {
    services?: boolean;
    products?: boolean;
    categories?: string[];
    barberIds?: ObjectId[];
  };
}
```

## Chat Collection
```typescript
interface ChatMessage {
  _id: ObjectId;
  appointmentId: ObjectId;
  senderId: ObjectId; // ref: User
  receiverId: ObjectId; // ref: User
  content: string;
  createdAt: Date;
  readAt?: Date;
}
```

## Notification Collection
```typescript
interface Notification {
  _id: ObjectId;
  userId: ObjectId; // ref: User
  type: 'appointment' | 'chat' | 'promo' | 'system';
  title: string;
  body: string;
  data?: object;
  isRead: boolean;
  createdAt: Date;
}
```

## Indexes

Essential indexes for performance:
```typescript
// User Collection
db.users.createIndex({ "location": "2dsphere" });
db.users.createIndex({ "email": 1 }, { unique: true });

// BarberProfile Collection
db.barberProfiles.createIndex({ "location": "2dsphere" });
db.barberProfiles.createIndex({ "userId": 1 }, { unique: true });
db.barberProfiles.createIndex({ "rating": -1 });

// Appointment Collection
db.appointments.createIndex({ "clientId": 1 });
db.appointments.createIndex({ "barberId": 1 });
db.appointments.createIndex({ "scheduledFor": 1 });
db.appointments.createIndex({ "status": 1 });

// Review Collection
db.reviews.createIndex({ "barberId": 1 });
db.reviews.createIndex({ "appointmentId": 1 }, { unique: true });

// Product Collection
db.products.createIndex({ "category": 1 });
db.products.createIndex({ "barberId": 1 });

// Coupon Collection
db.coupons.createIndex({ "code": 1 }, { unique: true });

// Chat Collection
db.chatMessages.createIndex({ "appointmentId": 1 });
db.chatMessages.createIndex({ 
  "senderId": 1, 
  "receiverId": 1, 
  "createdAt": -1 
});

// Notification Collection
db.notifications.createIndex({ "userId": 1, "createdAt": -1 });
db.notifications.createIndex({ "userId": 1, "isRead": 1 });
```

## Relations Overview

- User -> BarberProfile (1:1 for barbers)
- User -> Appointment (1:N as client or barber)
- Appointment -> Review (1:1)
- User -> Order (1:N)
- User -> ChatMessage (1:N)
- User -> Notification (1:N)
- BarberProfile -> Product (1:N for recommendations)
- Appointment -> ChatMessage (1:N)

## Notes

1. Using MongoDB for flexibility and geospatial queries
2. Implemented optimistic concurrency with updatedAt fields
3. Soft delete recommended for most collections
4. Implement caching for frequently accessed data:
   - BarberProfile locations
   - Active coupons
   - Product catalog
5. Consider implementing change streams for real-time features