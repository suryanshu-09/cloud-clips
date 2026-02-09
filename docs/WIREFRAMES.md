# Cloud Clips - Key Screens Wireframes & Descriptions

## Overview
This document provides detailed wireframes and descriptions for the key screens in the Cloud Clips mobile application. These wireframes serve as the foundation for Figma designs and development implementation.

---

## Navigation Structure

```
┌─────────────────────────────────────┐
│  Tab Bar (5 tabs)                   │
│  [Home] [Discover] [Book] [Chat] [Profile]
│                                     │
│  Screen Flow:                       │
│  Home → Barber Profile → Booking Flow
│       ↓                              
│  Discover (Map) → Barber Profile → Booking
│       ↓
│  Appointments ←→ Appointment Detail
│       ↓
│  Chat ←→ Conversation
│       ↓
│  Profile ←→ Settings/Edit Profile
└─────────────────────────────────────┘
```

---

## 1. Home Screen

### Purpose
Primary entry point showing personalized content, featured barbers, and quick access to bookings.

### Wireframe

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  ☀️ Good morning, Alex!                 │
│  Ready for a fresh cut?                 │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 🔍 Search barbers, styles...   │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  📍 NEAR YOU                            │
│  ┌─────────────────────────────────┐   │
│  │ [MAP PREVIEW - Mini]            │   │
│  │    📍 You are here              │   │
│  │       • • •                     │   │
│  │    (Tap to open full map)       │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ✂️ FEATURED BARBERS                    │
│  ┌────────────┐ ┌────────────┐         │
│  │ [PHOTO]    │ │ [PHOTO]    │         │
│  │ ⭐ 4.9     │ │ ⭐ 4.8     │         │
│  │ Mike's     │ │ The Cut    │         │
│  │ $35        │ │ $40        │         │
│  │ 0.3 mi     │ │ 0.8 mi     │         │
│  └────────────┘ └────────────┘         │
│         ← swipe →                       │
├─────────────────────────────────────────┤
│  📅 UPCOMING APPOINTMENT                │
│  ┌─────────────────────────────────┐   │
│  │ [PHOTO]  Classic Cut with Mike  │   │
│  │          Today, 2:00 PM         │   │
│  │          [View Details →]       │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  🔥 POPULAR STYLES                      │
│  ┌────────┐ ┌────────┐ ┌────────┐      │
│  │[PHOTO] │ │[PHOTO] │ │[PHOTO] │      │
│  │ Fade   │ │ Pompa- │ │ Buzz   │      │
│  │        │ │ dour   │ │ Cut    │      │
│  └────────┘ └────────┘ └────────┘      │
├─────────────────────────────────────────┤
│  [🏠] [🔍] [📅] [💬] [👤]              │
│  Home  Discover Book Chat Profile       │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Greeting | Dynamic | Personalized based on time of day |
| Search Bar | Input | Global search with placeholder hint |
| Map Preview | Interactive | Shows nearby barbers, tap to expand |
| Featured Barbers | Horizontal Scroll | Curated barber cards with ratings/pricing |
| Upcoming Appointment | Card | Next booking with quick actions |
| Popular Styles | Grid | Visual style inspiration |

### Interactions
- **Pull to Refresh**: Refresh all home content
- **Card Tap**: Navigate to barber profile
- **Map Tap**: Navigate to full discovery map
- **Search Tap**: Focus search with keyboard

---

## 2. Discovery / Map Screen

### Purpose
Primary discovery interface for finding barbers by location with map and list views.

### Wireframe - Map View (Default)

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 🔍 Search location or barber   │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ [Price ▼] [Rating ▼] [Distance ▼]│  │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│                                         │
│         🗺️  FULL SCREEN MAP            │
│                                         │
│              ┌───┐                     │
│           ┌──┤ ⭐├──┐                  │
│           │4.9└───┘  │                  │
│        ┌──┤         ├──┐               │
│     ┌──┤ ⭐│    📍   │⭐├──┐            │
│     │4.7└──┤ (You)   ├──┘4.8│           │
│     │      └───┬─────┘      │           │
│  ┌──┤ ⭐        │         ⭐├──┐         │
│  │4.5└──────────┘         4.9┘ │         │
│  │                              │         │
│  │                              │         │
│  │                              │         │
│  └──────────────────────────────┘         │
│                                         │
│              [📍 Current Location]        │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ ━━━━━━━━ (Drag up to expand)    │   │
│  │ ┌──────────┐ ┌──────────┐       │   │
│  │ │ [PHOTO]  │ │ [PHOTO]  │       │   │
│  │ │ ⭐ 4.9   │ │ ⭐ 4.8   │       │   │
│  │ │ Mike's   │ │ Elite    │       │   │
│  │ │ Cuts     │ │ Barbers  │       │   │
│  │ │ 0.3 mi   │ │ 0.8 mi   │       │   │
│  │ └──────────┘ └──────────┘       │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  [🏠] [🔍] [📅] [💬] [👤]              │
│  Home  Discover Book Chat Profile       │
└─────────────────────────────────────────┘
```

### Wireframe - List View (Expanded)

```
┌─────────────────────────────────────────┐
│  [MAP ▼]  Showing 12 barbers nearby     │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ [PHOTO]              ⭐ 4.9     │   │
│  │                      127 revs   │   │
│  │ Mike's Classic Cuts             │   │
│  │ 📍 123 Main St • 0.3 mi         │   │
│  │ ✂️ Fades, Beards, Classic       │   │
│  │ 💵 From $35  [Book →]           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [PHOTO]              ⭐ 4.8     │   │
│  │                      89 revs    │   │
│  │ Elite Barber Shop               │   │
│  │ 📍 456 Oak Ave • 0.8 mi         │   │
│  │ ✂️ All styles, Hot towel        │   │
│  │ 💵 From $40  [Book →]           │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [PHOTO]              ⭐ 4.7     │   │
│  │                      203 revs   │   │
│  │ The Modern Cut                  │   │
│  │ 📍 789 Pine St • 1.2 mi         │   │
│  │ ✂️ Modern styles, Color         │   │
│  │ 💵 From $30  [Book →]           │   │
│  └─────────────────────────────────┘   │
│                                         │
│            [Load more...]               │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Search Bar | Input | Location or barber name search |
| Filter Pills | Chips | Price, Rating, Distance, Specialty |
| Map View | Interactive | OSM tiles with custom markers showing ratings |
| Barber Markers | Pins | Rating badges on map pins |
| Bottom Sheet | Draggable | Collapsible list of nearby barbers |
| Current Location FAB | Button | Center map on user's location |
| Barber Cards | List Items | Compact cards with key info |

### Interactions
- **Map Pin Tap**: Show barber preview card
- **Bottom Sheet Drag**: Expand/collapse between map and list
- **Filter Tap**: Open filter bottom sheet with options
- **Card Swipe**: Browse barbers horizontally when collapsed
- **List Scroll**: Infinite scroll for more results

---

## 3. Barber Profile Screen

### Purpose
Detailed view of a barber's business with portfolio, services, reviews, and booking CTA.

### Wireframe

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  ← Mike's Classic Cuts        [♡ Save] │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │                                 │   │
│  │     [HERO IMAGE CAROUSEL]      │   │
│  │                                 │   │
│  │     ○ ● ● ●                     │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  Mike's Classic Cuts         ✓ Verified │
│  ⭐ 4.9 (127 reviews)                   │
│  📍 123 Main St, Downtown    0.3 mi     │
│  🕐 Open now • Closes 8 PM              │
├─────────────────────────────────────────┤
│  [SERVICES] [REVIEWS] [ABOUT]           │
├─────────────────────────────────────────┤
│  SERVICES                               │
│  ┌─────────────────────────────────┐   │
│  │ ✂️ Classic Haircut        $35   │   │
│  │    45 min • Most popular        │   │
│  │                                 │   │
│  │ 🧔 Beard Trim             $20   │   │
│  │    20 min                       │   │
│  │                                 │   │
│  │ ✂️✂️ Haircut + Beard      $50   │   │
│  │    60 min • Best value          │   │
│  │                                 │   │
│  │ 🔥 Hot Towel Shave        $30   │   │
│  │    30 min                       │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ABOUT                                  │
│  Specializing in classic cuts and       │
│  modern fades with 10+ years of         │
│  experience. Certified barber with      │
│  a passion for precision.               │
│                                         │
│  ✂️ Fades, Classic cuts, Beard design   │
│  🗣️ English, Spanish                    │
│  🏆 Master Barber certified             │
├─────────────────────────────────────────┤
│  REVIEWS                    [See all]   │
│  ⭐⭐⭐⭐⭐ 4.9/5                        │
│  ━━━━━━━━━━━━━━━                        │
│  5★ ████████████████████ 85%           │
│  4★ ████████              10%           │
│  3★ ██                    3%            │
│  2★ █                     1%            │
│  1★ █                     1%            │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [AVATAR] John D.     ⭐⭐⭐⭐⭐   │   │
│  │ "Best fade I've ever had. Mike  │   │
│  │  really knows his craft..."     │   │
│  │ 2 days ago                      │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  LOCATION                               │
│  ┌─────────────────────────────────┐   │
│  │     [MINI MAP VIEW]             │   │
│  │         📍                      │   │
│  └─────────────────────────────────┘   │
│  123 Main Street, Suite 100             │
│  New York, NY 10001                     │
│  [Get Directions]                       │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │      [BOOK APPOINTMENT]         │   │
│  │         Starting at $35         │   │
│  └─────────────────────────────────┘   │
│  [🏠] [🔍] [📅] [💬] [👤]              │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Hero Carousel | Swipeable | 4-6 portfolio images |
| Header Info | Static | Name, verified badge, rating, location |
| Tab Navigation | Tabs | Services / Reviews / About |
| Services List | Accordion | Expandable service cards with pricing |
| Review Summary | Stats | Star breakdown with distribution |
| Recent Reviews | List | 2-3 most recent reviews |
| Mini Map | Static | Location preview with address |
| CTA Button | Fixed Bottom | "Book Appointment" with starting price |

### Interactions
- **Image Swipe**: Browse portfolio photos
- **Tab Tap**: Switch between sections
- **Service Tap**: Expand/collapse details
- **Review Tap**: Open all reviews modal
- **Book Button**: Start booking flow
- **Save Button**: Add to favorites

---

## 4. Booking Flow - Service Selection

### Purpose
First step of booking - select services from the barber's menu.

### Wireframe

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  ← New Booking                          │
│  Step 1 of 5                            │
│  ━━━━━○○○○○                             │
├─────────────────────────────────────────┤
│  Select Services                        │
│  with Mike's Classic Cuts               │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ ✓ ✂️ Classic Haircut      $35   │   │
│  │   45 min                        │   │
│  │   [Selected]                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ □ 🧔 Beard Trim           $20   │   │
│  │   20 min                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ □ ✂️✂️ Haircut + Beard    $50   │   │
│  │   60 min • Save $5!             │   │
│  │   [Most Popular]                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ □ 🔥 Hot Towel Shave      $30   │   │
│  │   30 min                        │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────      │
│  Add special requests (optional)        │
│  ┌─────────────────────────────────┐   │
│  │ Any preferences or notes?      │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  Total: $35  |  45 min                  │
│  ┌─────────────────────────────────┐   │
│  │      [CONTINUE →]               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Progress Bar | Visual | 5-step booking progress |
| Service Cards | Selectable | Checkable cards with service details |
| Duration | Label | Estimated time per service |
| Popular Badge | Tag | Highlights most booked service |
| Savings Badge | Tag | Shows bundle discounts |
| Special Requests | Input | Optional notes field |
| Summary Bar | Fixed | Running total and duration |

### Interactions
- **Service Card Tap**: Toggle selection
- **Multiple Selection**: Can choose multiple services
- **Continue Button**: Proceed to date selection (disabled if no selection)

---

## 5. Booking Flow - Date & Time Selection

### Purpose
Select available date and time slot for the appointment.

### Wireframe

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  ← Select Date & Time                   │
│  Step 2 of 5                            │
│  ━━━━━━○○○○                             │
├─────────────────────────────────────────┤
│  [January 2026]                         │
│  ┌─────────────────────────────────┐   │
│  │ Su Mo Tu We Th Fr Sa            │   │
│  │     1  2  3  4  5  6            │   │
│  │  7  8  9  10 11 12 13           │   │
│  │  14 15 16 17 ●18 19 20          │   │
│  │  21 22 23 24 25 26 27           │   │
│  │  28 29 30 31                    │   │
│  │                                 │   │
│  │ ←        Today        →         │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  Saturday, January 18                   │
│  ✓ Available slots found                │
├─────────────────────────────────────────┤
│  MORNING                                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 9:00 │ │ 9:30 │ │10:00 │ │10:30 │   │
│  │  AM  │ │  AM  │ │  AM  │ │  AM  │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │11:00 │ │11:30 │ │      │ │      │   │
│  │  AM  │ │  AM  │ │      │ │      │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────────────┤
│  AFTERNOON                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │12:00 │ │12:30 │ │ 1:00 │ │ 1:30 │   │
│  │  PM  │ │  PM  │ │  PM  │ │  PM  │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 2:00 │ │ 2:30 │ │ 3:00 │ │ 3:30 │   │
│  │  PM  │ │  PM  │ │  PM  │ │  PM  │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
├─────────────────────────────────────────┤
│  EVENING                                │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐   │
│  │ 4:00 │ │ 4:30 │ │ 5:00 │ │ 5:30 │   │
│  │  PM  │ │  PM  │ │  PM  │ │  PM  │   │
│  └──────┘ └──────┘ └──────┘ └──────┘   │
│  ┌──────┐                               │
│  │ 6:00 │                               │
│  │  PM  │                               │
│  └──────┘                               │
├─────────────────────────────────────────┤
│  Selected: Sat, Jan 18 at 2:00 PM       │
│  ┌─────────────────────────────────┐   │
│  │      [CONTINUE →]               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Calendar | Interactive | Month view with availability indicators |
| Date Display | Label | Selected date header |
| Time Sections | Grouped | Morning / Afternoon / Evening |
| Time Slots | Grid | 30-minute intervals, selectable |
| Selected State | Visual | Highlighted selected slot |
| Unavailable | Disabled | Grayed-out booked slots |

### Interactions
- **Date Tap**: Select date, refresh time slots
- **Time Slot Tap**: Select time
- **Month Navigation**: Arrow buttons to change month
- **Continue Button**: Proceed to location selection

---

## 6. Booking Flow - Location Selection

### Purpose
Choose between in-salon service or in-home (mobile) service with address input.

### Wireframe

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  ← Select Location                      │
│  Step 3 of 5                            │
│  ━━━━━━━○○○                             │
├─────────────────────────────────────────┤
│  Where would you like your service?     │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │  🏪                             │   │
│  │  At the Barbershop              │   │
│  │                                 │   │
│  │  123 Main St, Suite 100         │   │
│  │  New York, NY 10001             │   │
│  │                                 │   │
│  │  ● Selected                     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │  🏠                             │   │
│  │  At Your Location               │   │
│  │  (+$15 travel fee)              │   │
│  │                                 │   │
│  │  Enter your address:            │   │
│  │  ┌─────────────────────────┐   │   │
│  │  │ Start typing address... │   │   │
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  □ Save this address            │   │
│  │  ○ Not Selected                 │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│                                         │
│  ─────────────────────────────────      │
│  Add parking instructions (optional)    │
│  ┌─────────────────────────────────┐   │
│  │ e.g., Park in visitor spot...  │   │
│  │                                 │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │      [CONTINUE →]               │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Location Options | Cards | Two choices: Shop vs. Home |
| Shop Address | Label | Barber's business address |
| Address Input | Search | Autocomplete address search |
| Travel Fee | Label | Additional cost for mobile service |
| Save Checkbox | Toggle | Remember address for future |
| Parking Notes | Input | Optional special instructions |

### Interactions
- **Option Tap**: Switch between shop/home
- **Address Input**: Autocomplete suggestions appear
- **Save Address**: Persist to user profile

---

## 7. Booking Flow - Review & Confirm

### Purpose
Final review of all booking details before payment.

### Wireframe

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  ← Review & Confirm                     │
│  Step 4 of 5                            │
│  ━━━━━━━━━○○                            │
├─────────────────────────────────────────┤
│  Booking Summary                        │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │  [PHOTO]                        │   │
│  │  Mike's Classic Cuts            │   │
│  │  ⭐ 4.9 (127 reviews)           │   │
│  │  📍 123 Main St, New York       │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  SERVICE                                │
│  Classic Haircut                  $35   │
│  Duration: 45 minutes                   │
├─────────────────────────────────────────┤
│  DATE & TIME                            │
│  Saturday, January 18                   │
│  2:00 PM - 2:45 PM                      │
│  [Change →]                             │
├─────────────────────────────────────────┤
│  LOCATION                               │
│  At the Barbershop                      │
│  123 Main St, Suite 100                 │
│  New York, NY 10001                     │
│  [Change →]                             │
├─────────────────────────────────────────┤
│  ─────────────────────────────────      │
│                                         │
│  💰 Price Breakdown                     │
│  ─────────────────────────────────      │
│  Classic Haircut                  $35   │
│  Subtotal                         $35   │
│  Tax (8.875%)                     $3.11 │
│  ─────────────────────────────────      │
│  Total                            $38.11│
│                                         │
├─────────────────────────────────────────┤
│  🎟️ Have a promo code? [Add]            │
├─────────────────────────────────────────┤
│  💳 Payment Method                      │
│  •••• 4242 Visa                   [▼]   │
├─────────────────────────────────────────┤
│  ℹ️ Cancellation Policy                 │
│  Free cancellation up to 24 hours       │
│  before appointment.                    │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │  Pay $38.11 & Book Now          │   │
│  └─────────────────────────────────┘   │
│  🔒 Secure payment with Stripe          │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Barber Summary | Card | Quick barber info with photo |
| Service Details | List | Selected service with price |
| Date/Time | Label | Formatted appointment time |
| Location | Label | Selected location with address |
| Price Breakdown | Table | Subtotal, tax, total calculation |
| Promo Code | Action | Expandable promo input |
| Payment Method | Dropdown | Saved cards or add new |
| Cancellation Policy | Info | Booking terms |
| CTA Button | Fixed | Pay and confirm booking |

### Interactions
- **Change Links**: Navigate back to edit specific sections
- **Promo Code**: Expand input field, validate code
- **Payment Dropdown**: Show saved payment methods
- **Pay Button**: Process payment, create booking

---

## 8. Booking Flow - Confirmation

### Purpose
Success state with booking details and next steps.

### Wireframe

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│                                         │
│              [ILLUSTRATION]             │
│                                         │
│           ✓ Booking Confirmed!          │
│                                         │
│     You're all set for your             │
│     appointment with Mike               │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │  📅 Booking Reference           │   │
│  │  #CC-2026-0118-001              │   │
│  │                                 │   │
│  │  ✂️ Classic Haircut             │   │
│  │  📅 Sat, Jan 18 at 2:00 PM      │   │
│  │  📍 Mike's Classic Cuts         │   │
│  │     123 Main St, New York       │   │
│  │                                 │   │
│  │  [Add to Calendar]              │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  What's Next?                           │
│  • Arrive 5 minutes early               │
│  • Bring reference photos if desired    │
│  • You'll get a reminder 24h before     │
│  • Message Mike with any questions      │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │  [Message Mike]                 │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │  [View My Appointments]         │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [Book Another]                         │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Success Illustration | Visual | Animated checkmark or confirmation graphic |
| Booking Reference | Label | Unique booking ID |
| Booking Card | Summary | All appointment details in one card |
| Add to Calendar | Action | Export to device calendar |
| Next Steps | List | Helpful reminders |
| Message Button | CTA | Start chat with barber |
| View Appointments | CTA | Navigate to appointments list |
| Book Another | Tertiary | Return to discovery |

---

## 9. My Appointments Screen

### Purpose
View and manage all upcoming and past appointments.

### Wireframe

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  My Appointments                        │
├─────────────────────────────────────────┤
│  ┌────────────┐ ┌────────────┐         │
│  │ UPCOMING   │ │    PAST    │         │
│  │   ● 3      │ │            │         │
│  └────────────┘ └────────────┘         │
├─────────────────────────────────────────┤
│  TODAY                                  │
│  ┌─────────────────────────────────┐   │
│  │ [PHOTO]    ✂️ Classic Cut       │   │
│  │            Mike's Classic Cuts  │   │
│  │            Today, 2:00 PM       │   │
│  │            [View]  [Cancel]     │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  THIS WEEK                              │
│  ┌─────────────────────────────────┐   │
│  │ [PHOTO]    ✂️ Beard Trim        │   │
│  │            Elite Barbers        │   │
│  │            Wed, Jan 22, 10:30 AM│   │
│  │            [View] [Reschedule]  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [PHOTO]    ✂️ Haircut + Beard   │   │
│  │            The Modern Cut       │   │
│  │            Fri, Jan 24, 4:00 PM │   │
│  │            [View] [Reschedule]  │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  LATER                                  │
│  ┌─────────────────────────────────┐   │
│  │ [PHOTO]    ✂️ Classic Haircut   │   │
│  │            Mike's Classic Cuts  │   │
│  │            Feb 1, 11:00 AM      │   │
│  │            [View] [Reschedule]  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ─────────────────────────────────      │
│                                         │
│           [Load more...]                │
├─────────────────────────────────────────┤
│  [🏠] [🔍] [📅] [💬] [👤]              │
│  Home  Discover Book Chat Profile       │
└─────────────────────────────────────────┘
```

### Wireframe - Past Tab

```
┌─────────────────────────────────────────┤
│  PAST                                   │
├─────────────────────────────────────────┤
│  JANUARY 2026                           │
│  ┌─────────────────────────────────┐   │
│  │ [PHOTO]    ✂️ Classic Cut       │   │
│  │            Mike's Classic Cuts  │   │
│  │            Jan 10 • Completed   │   │
│  │            ⭐ Rate your cut     │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [PHOTO]    🧔 Beard Trim        │   │
│  │            Elite Barbers        │   │
│  │            Jan 5 • Completed    │   │
│  │            ⭐⭐⭐⭐⭐             │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  DECEMBER 2025                          │
│  ┌─────────────────────────────────┐   │
│  │ [PHOTO]    ✂️ Haircut + Beard   │   │
│  │            The Modern Cut       │   │
│  │            Dec 28 • Completed   │   │
│  │            ⭐⭐⭐⭐⭐             │   │
│  │            [Book Again →]       │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Tab Switcher | Segmented | Upcoming vs. Past toggle |
| Section Headers | Labels | Time-based grouping (Today, This Week, etc.) |
| Appointment Cards | List Items | Barber photo, service, time, actions |
| Status Badges | Labels | Confirmed, Completed, Cancelled |
| Action Buttons | Contextual | View/Reschedule/Cancel/Rate/Book Again |

### Interactions
- **Tab Toggle**: Switch between upcoming and past
- **Card Tap**: Open appointment detail
- **Action Buttons**: Contextual based on appointment status
- **Pull to Refresh**: Update appointment status

---

## 10. Appointment Detail Screen

### Purpose
Detailed view of a single appointment with all actions.

### Wireframe - Upcoming

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  ← Appointment Details                  │
├─────────────────────────────────────────┤
│  Status: Confirmed 🟢                   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │      [BARBER PHOTO]             │   │
│  │                                 │   │
│  │  Mike's Classic Cuts            │   │
│  │  ⭐ 4.9 (127 reviews)           │   │
│  │                                 │   │
│  │  [View Profile →]               │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  SERVICE                                │
│  Classic Haircut                        │
│  Duration: 45 minutes                   │
│  Price: $35.00                          │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  DATE & TIME                            │
│  Saturday, January 18, 2026             │
│  2:00 PM - 2:45 PM                      │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  LOCATION                               │
│  At the Barbershop                      │
│  123 Main St, Suite 100                 │
│  New York, NY 10001                     │
│  [📍 Get Directions]                    │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│  BOOKING DETAILS                        │
│  Reference: #CC-2026-0118-001           │
│  Booked on: Jan 15, 2026                │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
├─────────────────────────────────────────┤
│  NEED HELP?                             │
│  [Message Barber]  [Contact Support]    │
├─────────────────────────────────────────┤
│  CANCELLATION                           │
│  Free until Jan 17, 2:00 PM             │
│  After that: $10 fee                    │
│  ┌─────────────────────────────────┐   │
│  │     [Reschedule Appointment]    │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │     [Cancel Appointment]        │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Wireframe - Past (Completed)

```
┌─────────────────────────────────────────┐
│  Status: Completed ✓                    │
│  ...                                    │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │  HOW WAS YOUR EXPERIENCE?       │   │
│  │                                 │   │
│  │  [⭐] [⭐] [⭐] [⭐] [⭐]       │   │
│  │                                 │   │
│  │  Share your feedback (optional) │   │
│  │  ┌─────────────────────────┐   │   │
│  │  │ How did Mike do?...     │   │   │
│  │  └─────────────────────────┘   │   │
│  │                                 │   │
│  │  [Add Photos]                   │   │
│  │                                 │   │
│  │  [Submit Review]                │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │     [Book Again]                │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Status Badge | Label | Current appointment state |
| Barber Card | Summary | Photo, name, rating, profile link |
| Details Sections | Grouped | Service, Date/Time, Location |
| Booking Info | Metadata | Reference number, booking date |
| Action Buttons | Contextual | Reschedule, Cancel, Message |
| Cancellation Policy | Info | Deadline and fees |
| Review Form | Conditional | Appears after completion |

---

## 11. Chat List Screen

### Purpose
Overview of all active conversations with barbers.

### Wireframe

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  Messages                               │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 🔍 Search conversations        │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ [AVATAR] Mike's Classic Cuts ●2 │   │
│  │          "See you tomorrow!"    │   │
│  │          2m ago     📷          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [AVATAR] Elite Barbers          │   │
│  │          "Your appointment is   │   │
│  │           confirmed"            │   │
│  │          2h ago                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [AVATAR] The Modern Cut         │   │
│  │          "Thanks for the        │   │
│  │           review!"              │   │
│  │          2d ago        ✓✓       │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ [AVATAR] Downtown Cuts          │   │
│  │          "What time works for   │   │
│  │           you?"                 │   │
│  │          1w ago        ✓✓       │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  [🏠] [🔍] [📅] [💬] [👤]              │
│  Home  Discover Book Chat Profile       │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Search Bar | Input | Filter conversations |
| Conversation Items | List | Avatar, name, last message, timestamp |
| Unread Badge | Counter | Number of unread messages |
| Message Preview | Label | Truncated last message |
| Read Receipts | Icons | Checkmarks for read status |

---

## 12. Chat Conversation Screen

### Purpose
Individual conversation thread with a barber.

### Wireframe

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  ← Mike's Classic Cuts         [⋮]     │
│  ● Online now                           │
├─────────────────────────────────────────┤
│                                         │
│        Mon, Jan 13                      │
│                                         │
│  ┌─────────────────────────┐           │
│  │ Hi Mike! Do you have   │           │
│  │ any availability this  │           │
│  │ weekend?               │           │
│  │                  10:30 AM│           │
│  └─────────────────────────┘           │
│                                         │
│            ┌─────────────────────────┐ │
│            │ Hey! Yes, I have slots │ │
│            │ on Saturday afternoon. │ │
│            │ What time works for you?│ │
│            │ 10:32 AM ✓✓           │ │
│            └─────────────────────────┘ │
│                                         │
│        Today                            │
│                                         │
│  ┌─────────────────────────┐           │
│  │ I booked for 2 PM on   │           │
│  │ Saturday. See you then!│           │
│  │                  3:45 PM│           │
│  └─────────────────────────┘           │
│                                         │
│            ┌─────────────────────────┐ │
│            │ Perfect! See you       │ │
│            │ tomorrow. Can't wait   │ │
│            │ to give you a fresh    │ │
│            │ cut! ✂️                │ │
│            │ 4:00 PM ✓✓             │ │
│            └─────────────────────────┘ │
│                                         │
│            ┌─────────────────────────┐ │
│            │ [📷 Photo]             │ │
│            │ "See you tomorrow!"    │ │
│            │ 2m ago                 │ │
│            └─────────────────────────┘ │
│                                         │
│                                         │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ [📎]  Type a message...    [🎤]│   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Header | Info | Barber name, online status |
| Date Dividers | Labels | Group messages by date |
| Message Bubbles | Bubbles | User (right) vs. Barber (left) |
| Timestamps | Labels | Time sent |
| Read Receipts | Icons | Delivered/read status |
| Image Attachments | Media | Shared photos |
| Input Bar | Composer | Text input + attachment + send |

---

## 13. Profile Screen

### Purpose
User account management and settings.

### Wireframe

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  Profile                                │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │       [AVATAR - LARGE]          │   │
│  │                                 │   │
│  │        Alex Johnson             │   │
│  │     alex@example.com            │   │
│  │                                 │   │
│  │    [Edit Profile]  [Share]      │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 👤 Personal Information    >    │   │
│  ├─────────────────────────────────┤   │
│  │ 💳 Payment Methods         >    │   │
│  │    •••• 4242, •••• 8888         │   │
│  ├─────────────────────────────────┤   │
│  │ 📍 Saved Addresses         >    │   │
│  │    2 saved locations            │   │
│  ├─────────────────────────────────┤   │
│  │ 🎟️ My Coupons              >    │   │
│  │    3 active coupons             │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │ 🔔 Notifications           >    │   │
│  ├─────────────────────────────────┤   │
│  │ 🌙 Dark Mode                ○   │   │
│  ├─────────────────────────────────┤   │
│  │ 🌐 Language                >    │   │
│  │    English (US)                 │   │
│  ├─────────────────────────────────┤   │
│  │ ❓ Help & Support          >    │   │
│  ├─────────────────────────────────┤   │
│  │ 📝 Terms & Privacy         >    │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │     🔄 Switch to Barber Mode    │   │
│  └─────────────────────────────────┘   │
│                                         │
│        [Log Out]                        │
│                                         │
├─────────────────────────────────────────┤
│  [🏠] [🔍] [📅] [💬] [👤]              │
│  Home  Discover Book Chat Profile       │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Profile Header | Card | Avatar, name, email, quick actions |
| Account Section | Grouped | Personal info, payments, addresses |
| Preferences Section | Grouped | Notifications, theme, language |
| Support Section | Grouped | Help, terms, privacy |
| Barber Mode | Action | Toggle for barber accounts |
| Log Out | Action | Sign out button |

---

## 14. Barber Dashboard Screen (Barber Mode)

### Purpose
Barber-specific view for managing business, appointments, and earnings.

### Wireframe

```
┌─────────────────────────────────────────┐
│ ○●●●●●●●●●  9:41              🔋 100%  │
├─────────────────────────────────────────┤
│  Barber Dashboard                       │
│  [👤 Client Mode]                       │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │      "Good afternoon, Mike!"    │   │
│  │                                 │   │
│  │  📊 Quick Stats                 │   │
│  │  ┌──────────┬──────────┐       │   │
│  │  │ Today    │ This Week│       │   │
│  │  │    4     │    18    │       │   │
│  │  │ appts    │ appts    │       │   │
│  │  ├──────────┼──────────┤       │   │
│  │  │ $180     │ $890     │       │   │
│  │  │ earned   │ earned   │       │   │
│  │  └──────────┴──────────┘       │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  TODAY'S SCHEDULE                       │
│  ┌─────────────────────────────────┐   │
│  │ ● 1:00 PM - Alex Johnson        │   │
│  │   Classic Haircut          $35  │   │
│  │   [Confirmed 🟢]                │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ ● 2:00 PM - (Current)           │   │
│  │   Sam Smith                       │   │
│  │   Beard Trim               $20  │   │
│  │   [In Progress 🟡]              │   │
│  └─────────────────────────────────┘   │
│  ┌─────────────────────────────────┐   │
│  │ ● 3:00 PM - Chris Brown         │   │
│  │   Haircut + Beard          $50  │   │
│  │   [Confirmed 🟢]                │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐   │
│  │  📅 View Full Calendar      →   │   │
│  └─────────────────────────────────┘   │
├─────────────────────────────────────────┤
│  QUICK ACTIONS                          │
│  ┌──────────────┬──────────────┐       │
│  │ [✓ Check-in] │ [➕ Block   ]│       │
│  │    Client    │    Time      │       │
│  └──────────────┴──────────────┘       │
│  ┌──────────────┬──────────────┐       │
│  │ [💬 Messages ]│ [📊 Earnings ]│       │
│  │   (3 new)    │              │       │
│  └──────────────┴──────────────┘       │
├─────────────────────────────────────────┤
│  AVAILABILITY                           │
│  Status: ✅ Accepting bookings          │
│  ┌─────────────────────────────────┐   │
│  │  [Toggle: ◉ ON]                 │   │
│  └─────────────────────────────────┘   │
│  Next: Tomorrow, 9:00 AM - 8:00 PM      │
├─────────────────────────────────────────┤
│  [🏠] [📊] [⚙️] [💬] [👤]               │
│  Dash  Stats  Manage  Chat  Profile     │
└─────────────────────────────────────────┘
```

### Key Elements

| Element | Type | Description |
|---------|------|-------------|
| Stats Cards | Grid | Today's appointments and earnings |
| Schedule List | Timeline | Chronological appointment list |
| Status Badges | Labels | Confirmed, In Progress, etc. |
| Quick Actions | Grid | Common barber actions |
| Availability Toggle | Switch | Accept/decline new bookings |
| Tab Bar | Navigation | Dashboard, Stats, Manage, Chat, Profile |

---

## Screen Navigation Flow Summary

```
                        ┌──────────────┐
                        │   Splash /   │
                        │   Onboarding │
                        └──────┬───────┘
                               │
                               ▼
                        ┌──────────────┐
                        │     Home     │
                        └──────┬───────┘
                               │
            ┌──────────────────┼──────────────────┐
            │                  │                  │
            ▼                  ▼                  ▼
     ┌──────────────┐   ┌──────────────┐   ┌──────────────┐
     │  Discovery   │   │ Appointments │   │   Profile    │
     │   (Map)      │   │              │   │              │
     └──────┬───────┘   └──────┬───────┘   └──────┬───────┘
            │                  │                  │
            ▼                  ▼                  │
     ┌──────────────┐   ┌──────────────┐         │
     │Barber Profile│   │   Appt       │         │
     │              │   │   Detail     │         │
     └──────┬───────┘   └──────────────┘         │
            │                                     │
            ▼                                     │
     ┌──────────────┐                             │
     │   Booking    │                             │
     │    Flow      │                             │
     │  (5 steps)   │                             │
     └──────┬───────┘                             │
            │                                     │
            ▼                                     │
     ┌──────────────┐                             │
     │Confirmation  │                             │
     └──────────────┘                             │
                                                  │
            ┌─────────────────────────────────────┘
            │
            ▼
     ┌──────────────┐
     │   Barber     │
     │  Dashboard   │
     │  (Barber     │
     │   Mode)      │
     └──────────────┘
```

---

## Responsive Considerations

### Mobile-First Breakpoints

| Breakpoint | Width | Adjustments |
|------------|-------|-------------|
| Mobile | 320-480px | Single column, full-width cards |
| Tablet | 480-768px | 2-column grids where appropriate |
| Large | 768px+ | Optimized spacing, larger touch targets |

### Key Responsive Patterns

- **Cards**: Stack vertically on mobile, 2-column on tablet
- **Map/List**: 60/40 split on large screens, full overlay on mobile
- **Booking Flow**: Maintain step-by-step on all sizes
- **Typography**: Scale down 10-15% on smaller screens

---

## Accessibility Notes

### Screen Reader Support

- All interactive elements have descriptive labels
- Navigation landmarks properly marked
- Focus indicators visible on all tappable elements
- Heading hierarchy maintained (H1 → H2 → H3)

### Touch Targets

- Minimum 44x44pt for all buttons
- Adequate spacing between adjacent targets
- Swipe gestures have alternatives

### Visual Accessibility

- WCAG AA contrast ratios (4.5:1 for body text)
- Color not used as sole indicator of state
- Text scales up to 200% without breaking layout

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-09 | Initial wireframe documentation |

---

## Next Steps

1. **Figma Design**: Create high-fidelity designs based on these wireframes
2. **Prototype**: Build interactive prototype for user testing
3. **Design Tokens**: Extract styles to shared design tokens
4. **Component Library**: Build React Native components from wireframes
5. **Accessibility Audit**: Test with screen readers and accessibility tools
