# Testing the Reviews Feature

## Overview
The reviews feature is now fully implemented with comprehensive mock data. You can test it in dev mode without needing a backend API.

## Prerequisites
- Dev mode is enabled: `EXPO_PUBLIC_DEV_MODE=true` in `.env` ✅
- App is running: `bun dev` in the mobile directory

## Mock Data Available

### Barbers with Reviews
All mock barbers now have reviews you can view:

1. **barber-1** (Mike's Barbershop) - 7 reviews
   - Average rating: 4.4 stars
   - Mix of 5-star, 4-star, and 3-star reviews
   - Some reviews include photos

2. **barber-2** (Sarah's Salon) - 4 reviews
   - Average rating: 4.75 stars
   - Mostly 5-star reviews with detailed comments
   - Includes before/after photos

3. **barber-3** (Elite Cuts) - 3 reviews
   - Average rating: 4.67 stars
   - Premium service feedback
   - Professional photos included

4. **barber-4** (Classic Barber) - 3 reviews
   - Average rating: 4.33 stars
   - Traditional barbershop experience
   - Consistent quality mentions

### Total Mock Reviews: 17

## How to Test

### 1. View Reviews on Barber Profile

**Steps:**
1. Open the app
2. Navigate to the home/discovery screen
3. Tap on any barber card
4. Scroll down to see the **Reviews** section

**What you'll see:**
- Review statistics card with:
  - Average rating displayed with star component
  - Total number of reviews
  - Rating distribution bar chart (5★ to 1★)
- Up to 5 most recent reviews showing:
  - Client avatar and name
  - Star rating
  - Review comment/text
  - Review photos (if any)
  - Relative date (e.g., "2 days ago")
- Empty state if no reviews exist

### 2. Test Different Barbers

**Try these specific barbers:**

**High-rated barber:**
- Navigate to "barber-1" (Mike's Barbershop)
- Should show 7 reviews with 4.4 average
- Mix of ratings from 3 to 5 stars

**Top-rated barber:**
- Navigate to "barber-2" (Sarah's Salon)
- Should show 4 reviews with 4.75 average
- Mostly excellent reviews

### 3. Interact with Reviews

**Photo Viewing:**
- Tap on review photos to view full size (handler ready, needs modal implementation)

**See All Button:**
- Shows up when there are reviews
- Currently logs action (can be connected to full reviews screen)

### 4. Review Statistics

Each barber profile shows:
- **Average Rating**: Calculated from all reviews
- **Total Reviews**: Count of all reviews
- **Distribution Chart**: Visual breakdown showing:
  - 5 stars: X reviews
  - 4 stars: X reviews
  - 3 stars: X reviews
  - 2 stars: X reviews
  - 1 star: X reviews

### 5. Test Review Form (Ready for Integration)

The `ReviewForm` component is ready to use:

**Features:**
- Interactive star rating selector
- Multi-line comment input (500 char limit)
- Photo upload interface (up to 5 photos)
- Submit and cancel buttons
- Loading states
- Error handling

**To test the form:**
You can manually render it in any screen:
```typescript
import { ReviewForm } from '@/components/review';

<ReviewForm
  appointmentId="test-appointment-1"
  barberId="barber-1"
  onSuccess={(review) => {
    console.log('Review submitted:', review);
  }}
/>
```

## Expected Behavior

### ✅ What Should Work

1. **View reviews** on any barber profile
2. **See realistic mock data** with avatars, names, comments
3. **View review photos** in horizontal scroll
4. **See rating distribution** chart
5. **Accurate star ratings** displayed throughout
6. **Relative dates** (e.g., "5 days ago", "2 weeks ago")
7. **Loading states** when fetching reviews
8. **Empty states** for barbers with no reviews

### 🔄 Loading States

- Brief loading spinner (500ms delay simulated)
- Shows "Loading reviews..." message
- Then displays reviews or empty state

### 📊 Review Statistics

Check that the numbers are calculated correctly:
- Average rating matches the displayed stars
- Total review count is accurate
- Distribution bars show correct percentages

## Verification Checklist

- [ ] Navigate to barber profile
- [ ] Reviews section appears at the bottom
- [ ] Statistics card shows average rating
- [ ] Rating distribution chart displays
- [ ] Individual review cards render properly
- [ ] Client avatars load
- [ ] Review photos appear (when present)
- [ ] Dates show as "X days ago"
- [ ] Star ratings display correctly
- [ ] Empty state appears for barbers without reviews
- [ ] "See All" button shows when reviews exist

## Mock Data Details

### Review Content Examples

**5-star reviews:**
- "Amazing haircut! Mike is very professional..."
- "Best haircut I've had in years!..."
- "Sarah is absolutely amazing!..."

**4-star reviews:**
- "Great service, very skilled barber..."
- "Good haircut, very clean lines..."

**3-star reviews:**
- "Decent haircut but had to wait 30 minutes..."

### Photo URLs
Real Unsplash images are used for review photos:
- Haircut photos
- Before/after shots
- Salon/barbershop interior shots

### Client Avatars
Generated from pravatar.cc with consistent images for each client

## Troubleshooting

### Reviews Not Showing?

1. **Check dev mode is enabled:**
   ```bash
   # In mobile/.env
   EXPO_PUBLIC_DEV_MODE=true
   ```

2. **Verify barber ID:**
   - Mock reviews use: `barber-1`, `barber-2`, `barber-3`, `barber-4`
   - Make sure you're viewing one of these barbers

3. **Check console for errors:**
   - Open React Native debugger
   - Look for any error messages

4. **Clear cache and restart:**
   ```bash
   bun dev --clear
   ```

### No Photos Showing?

- Check internet connection (images load from Unsplash)
- Verify image URLs are accessible
- Check network inspector in dev tools

### Statistics Wrong?

The statistics are calculated in real-time from the reviews:
- If you see mismatched numbers, check the `calculateStats` function
- Distribution should sum to total reviews

## Next Steps (Not Yet Implemented)

These features are designed but not yet connected:

1. **Full Review Screen** - "See All" button destination
2. **Image Gallery Modal** - Full-screen photo viewer
3. **Review Submission from Appointments** - Post-appointment review flow
4. **Edit/Delete Own Reviews** - User review management
5. **Report Reviews** - Moderation features
6. **Sort/Filter Reviews** - By rating, date, etc.

## API Integration (When Ready)

To switch from mock to real API:

1. Set `EXPO_PUBLIC_DEV_MODE=false` in `.env`
2. Configure backend URL
3. Ensure these endpoints exist:
   - `GET /barbers/:id/reviews`
   - `GET /barbers/:id/reviews/stats`
   - `POST /reviews`
   - etc.

The service layer is already set up to handle this switch automatically.

## Screenshots/Expected Views

### Barber Profile - Reviews Section
```
┌─────────────────────────────────┐
│  Reviews              See All → │
├─────────────────────────────────┤
│  ┌─────────────────────────┐   │
│  │ ⭐⭐⭐⭐⭐ 4.4           │   │
│  │ based on 7 reviews      │   │
│  │                          │   │
│  │ 5★ ████████░░  4       │   │
│  │ 4★ ████░░░░░░  2       │   │
│  │ 3★ ██░░░░░░░░  1       │   │
│  │ 2★ ░░░░░░░░░░  0       │   │
│  │ 1★ ░░░░░░░░░░  0       │   │
│  └─────────────────────────┘   │
│                                  │
│  ┌─────────────────────────┐   │
│  │ 👤 John Doe              │   │
│  │ ⭐⭐⭐⭐⭐  2 days ago   │   │
│  │ Amazing haircut! Very    │   │
│  │ professional and friendly│   │
│  │ [📷]                     │   │
│  └─────────────────────────┘   │
│                                  │
│  [More review cards...]         │
└─────────────────────────────────┘
```

## Summary

✅ **17 mock reviews** across 4 barbers
✅ **Realistic data** with names, avatars, photos
✅ **Full UI** implemented and ready
✅ **Statistics** calculated and displayed
✅ **Dev mode** enabled and working
✅ **Ready to test** right now!

Just navigate to any barber profile and scroll down to see reviews in action!
