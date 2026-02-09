# Cloud Clips - Design Mood Board

## Overview
Design inspiration and visual direction for Cloud Clips - a premium barber booking and discovery mobile application.

---

## 1. Design Aesthetic Direction

### Chosen Direction: **Modern Minimal with Premium Accents**

A refined, sophisticated aesthetic that balances trustworthiness with modern appeal - perfect for a service-based booking platform.

#### Key Characteristics:
- **Clean & Spacious**: Generous whitespace (12-24px padding)
- **Premium Feel**: Subtle shadows, refined gradients
- **Trust Signals**: Clear hierarchy, professional imagery
- **Accessibility First**: WCAG AA compliant contrast ratios
- **Micro-interactions**: Thoughtful haptic feedback and smooth transitions

---

## 2. Inspiration Sources

### App References

#### A. **Airbnb** (Discovery & Trust)
- **Why**: Excellent discovery experience, trust-building through reviews
- **Takeaways**: 
  - Card-based listing layout with clear CTAs
  - Map integration with list toggle
  - Comprehensive filtering system
  - Review system integration

#### B. **ClassPass** (Booking Flow)
- **Why**: Seamless service booking with clear availability
- **Takeaways**:
  - Calendar/schedule selection UI
  - Service tier presentation
  - Clear pricing breakdown
  - Cancellation/reschedule flow

#### C. **Uber** (Map Integration)
- **Why**: Best-in-class location and map UX
- **Takeaways**:
  - Map-first discovery
  - Pin clustering for dense areas
  - Bottom sheet pattern for details
  - Real-time status updates

#### D. **Hims** (Healthcare Trust)
- **Why**: Medical-adjacent trust signals translate to grooming
- **Takeaways**:
  - Professional imagery
  - Clear credentials display
  - Simple, approachable UI
  - Subscription/service clarity

#### E. **Resy** (Appointment Booking)
- **Why**: Restaurant booking = service booking patterns
- **Takeaways**:
  - Time slot availability visualization
  - Party size/service selection
  - Special requests handling
  - Confirmation flows

### Web/Brand References

#### A. **Aesop** (Premium Aesthetic)
- **Why**: Minimal luxury that feels accessible
- **Takeaways**:
  - Botanical, earthy color palette
  - Elegant typography pairing
  - Generous spacing
  - Editorial imagery approach

#### B. **Glossier** (Approachable Premium)
- **Why**: Beauty industry trust building
- **Takeaways**:
  - Real user photography
  - Community-driven design
  - Soft, inviting colors
  - Mobile-first layouts

---

## 3. Color Palette

### Primary Colors

```
--primary-900: #0F172A     /* Deep navy - primary text */
--primary-800: #1E293B     /* Slate dark - headers */
--primary-700: #334155     /* Slate - secondary text */
--primary-600: #475569     /* Slate medium - tertiary text */
--primary-500: #64748B     /* Slate light - placeholders */
--primary-400: #94A3B8     /* Slate lighter - borders */
--primary-300: #CBD5E1     /* Slate subtle - dividers */
--primary-200: #E2E8F0     /* Light slate - backgrounds */
--primary-100: #F1F5F9     /* Very light - card backgrounds */
--primary-50:  #F8FAFC     /* Off-white - page background */
```

### Accent Colors

```
--accent-600: #7C3AED      /* Purple - primary accent/CTA */
--accent-500: #8B5CF6      /* Purple bright - active states */
--accent-400: #A78BFA      /* Purple light - hover states */
--accent-300: #C4B5FD      /* Purple softer - backgrounds */
--accent-100: #EDE9FE      /* Purple very light - subtle fills */
--accent-50:  #F5F3FF      /* Purple tint - light backgrounds */
```

### Semantic Colors

```
--success-500: #10B981     /* Green - success/confirmed */
--success-100: #D1FAE5     /* Green light - success backgrounds */
--warning-500: #F59E0B     /* Amber - warnings/pending */
--warning-100: #FEF3C7     /* Amber light - warning backgrounds */
--error-500:   #EF4444     /* Red - errors/cancelled */
--error-100:   #FEE2E2     /* Red light - error backgrounds */
--info-500:    #3B82F6     /* Blue - information/links */
--info-100:    #DBEAFE     /* Blue light - info backgrounds */
```

### Barber-Specific Accents

```
--copper-500: #B87333      /* Copper - barber accent */
--copper-100: #F5E6D3      /* Copper light - barber highlights */
--gold-500:   #D4AF37      /* Gold - premium/star ratings */
```

### Color Usage Patterns

| Usage | Color | Hex |
|-------|-------|-----|
| Primary CTA Buttons | Purple 600 | #7C3AED |
| Primary Text | Navy 900 | #0F172A |
| Secondary Text | Slate 600 | #475569 |
| Background | Off-White | #F8FAFC |
| Cards | White | #FFFFFF |
| Borders | Slate 300 | #CBD5E1 |
| Success | Green 500 | #10B981 |
| Error | Red 500 | #EF4444 |
| Warning | Amber 500 | #F59E0B |

---

## 4. Typography

### Font Families

#### Primary: **Inter**
- **Usage**: All UI text, body copy, buttons, labels
- **Weights**: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- **Rationale**: Clean, modern, excellent readability at all sizes

#### Display/Accent: **Playfair Display** (Optional)
- **Usage**: Hero headlines, brand moments
- **Weights**: 600 (Semibold), 700 (Bold)
- **Rationale**: Adds sophistication for premium moments

### Type Scale

| Style | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|--------|-------------|----------------|-------|
| **Hero** | 32px | 700 | 40px | -0.02em | Onboarding, empty states |
| **H1** | 28px | 700 | 36px | -0.02em | Screen titles |
| **H2** | 24px | 600 | 32px | -0.01em | Section headers |
| **H3** | 20px | 600 | 28px | -0.01em | Card titles |
| **H4** | 18px | 600 | 26px | 0 | Subsection titles |
| **Body Large** | 17px | 400 | 26px | 0 | Primary body text |
| **Body** | 16px | 400 | 24px | 0 | Standard body text |
| **Body Small** | 14px | 400 | 20px | 0 | Secondary text |
| **Caption** | 12px | 500 | 16px | 0.01em | Labels, timestamps |
| **Button** | 16px | 600 | 24px | 0.01em | Button text |
| **Overline** | 11px | 600 | 16px | 0.05em | Category labels |

### Typography Patterns

```
/* Headline Pattern */
font-family: 'Inter', sans-serif;
font-weight: 600-700;
color: #0F172A;
letter-spacing: -0.01em to -0.02em;

/* Body Pattern */
font-family: 'Inter', sans-serif;
font-weight: 400;
color: #475569;
line-height: 1.5;

/* Button Pattern */
font-family: 'Inter', sans-serif;
font-weight: 600;
color: #FFFFFF (on purple);
letter-spacing: 0.01em;

/* Label Pattern */
font-family: 'Inter', sans-serif;
font-weight: 500;
color: #64748B;
font-size: 12-14px;
```

---

## 5. Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| **space-1** | 4px | Tight spacing, icon padding |
| **space-2** | 8px | Related elements |
| **space-3** | 12px | Standard element gap |
| **space-4** | 16px | Default padding |
| **space-5** | 20px | Card padding |
| **space-6** | 24px | Section padding |
| **space-8** | 32px | Large gaps |
| **space-10** | 40px | Section breaks |
| **space-12** | 48px | Major sections |

### Spacing Patterns

- **Card Padding**: 16-20px
- **Screen Padding**: 16-24px horizontal
- **List Item Gap**: 12-16px
- **Section Gap**: 24-32px
- **Element Gap**: 8-12px

---

## 6. Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| **radius-sm** | 6px | Small buttons, tags |
| **radius-md** | 8px | Inputs, cards |
| **radius-lg** | 12px | Large cards, modals |
| **radius-xl** | 16px | Bottom sheets, dialogs |
| **radius-2xl** | 24px | Large modals |
| **radius-full** | 9999px | Pills, avatars, FABs |

---

## 7. Shadows

```css
/* Shadow SM - Subtle elevation */
box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);

/* Shadow MD - Cards, buttons */
box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05),
            0 2px 4px -2px rgba(15, 23, 42, 0.05);

/* Shadow LG - Elevated cards, modals */
box-shadow: 0 10px 15px -3px rgba(15, 23, 42, 0.08),
            0 4px 6px -4px rgba(15, 23, 42, 0.08);

/* Shadow XL - Bottom sheets, floating elements */
box-shadow: 0 20px 25px -5px rgba(15, 23, 42, 0.1),
            0 8px 10px -6px rgba(15, 23, 42, 0.1);
```

---

## 8. Component Inspiration

### Buttons

**Primary Button**
- Background: Purple 600 (#7C3AED)
- Text: White, 16px, Semibold
- Padding: 16px vertical, 24px horizontal
- Border Radius: 12px
- Shadow: Shadow MD
- Active: Scale 0.98, darker background

**Secondary Button**
- Background: White
- Border: 1px solid Slate 300
- Text: Navy 900, 16px, Semibold
- Padding: 16px vertical, 24px horizontal
- Border Radius: 12px

**Tertiary/Ghost Button**
- Background: Transparent
- Text: Purple 600, 16px, Semibold
- Padding: 12px

### Cards

**Barber Card**
- Background: White
- Border Radius: 12px
- Shadow: Shadow MD
- Padding: 0 (image bleeds) + 16px (content area)
- Image aspect ratio: 16:9 or 4:3
- Structure: Image → Rating badge → Name → Location → Price → CTA

**Service Card**
- Background: White
- Border Radius: 12px
- Border: 1px solid Slate 200
- Padding: 16px
- Selected state: Purple border + light purple background

### Inputs

**Text Input**
- Background: White
- Border: 1px solid Slate 300
- Border Radius: 12px
- Padding: 16px
- Font: 16px Regular
- Focus: Purple 500 border, subtle shadow
- Error: Red 500 border

**Search Input**
- Background: Slate 100
- Border: None
- Border Radius: 12px
- Left icon: Search icon (Slate 400)
- Padding: 12px 16px 12px 44px

### Navigation

**Bottom Tab Bar**
- Background: White
- Height: 64px + safe area
- Shadow: Shadow LG (top only)
- Active: Purple 600 icon + label
- Inactive: Slate 400 icon + label

**Top Navigation**
- Background: Transparent (scrolls to white)
- Height: 56px
- Back button: Chevron left, Slate 700

### Status Indicators

**Status Badges**
```
Pending:    Amber 100 bg + Amber 600 text
Confirmed:  Green 100 bg + Green 600 text
Completed:  Slate 100 bg + Slate 600 text
Cancelled:  Red 100 bg + Red 600 text
```

**Rating Badge**
- Background: Gold with subtle gradient
- Icon: Star (filled)
- Text: White or Navy (on light)
- Size: 24-32px height

---

## 9. Screen-Specific Inspiration

### Discovery/Map Screen

**Layout Pattern** (From Airbnb + Uber):
- Map takes 60-70% of screen
- Bottom sheet with barber list (30-40%)
- Floating search bar at top
- Filter pills horizontally scrollable
- Current location FAB (bottom right)
- Pull up to expand list, down to collapse

**Card Layout**:
- Horizontal scroll in collapsed state
- Vertical list in expanded state
- Distance badge on each card
- Rating prominently displayed
- Quick book CTA

### Barber Profile Screen

**Layout Pattern** (From Resy + ClassPass):
- Hero image carousel (gallery)
- Sticky header with barber name
- Tab navigation: Services | Reviews | About
- Floating "Book Now" button (fixed bottom)
- Key info: Rating, distance, years experience
- Portfolio grid

**Sections**:
1. **Header**: Name, verified badge, rating, distance
2. **Gallery**: Swipeable images (4-6 photos)
3. **About**: Bio, specialties, languages
4. **Services**: Expandable list with pricing
5. **Reviews**: Star breakdown, recent reviews
6. **Location**: Mini map, address, hours

### Booking Flow

**Layout Pattern** (From Resy + Calendly):
- Step indicator at top
- Large touch targets for time selection
- Calendar view (month view, available dates highlighted)
- Time slot grid (morning/afternoon/evening sections)
- Service selection cards
- Price breakdown in summary
- Clear back/next navigation

**Steps**:
1. Select Service (card grid)
2. Select Date (calendar)
3. Select Time (time slot grid)
4. Add Details (notes, address)
5. Review & Confirm

### Appointments Screen

**Layout Pattern** (From ClassPass + Resy):
- Segmented control: Upcoming | Past
- Upcoming: Large cards with actions (reschedule, cancel)
- Past: Compact cards with "Book Again" CTA
- Empty state with illustration
- Pull to refresh

### Chat Screen

**Layout Pattern** (From WhatsApp + Airbnb):
- Message bubbles (rounded rectangles)
- Timestamps grouped by day
- Avatar in header
- Input bar fixed at bottom
- Voice note option (optional)
- Image attachment support

---

## 10. Imagery Guidelines

### Photography Style

**Barber Photos**:
- Professional headshots for profiles
- Environmental portraits (at work)
- Consistent lighting (bright, natural)
- Background: Clean, minimal, or shop environment
- Aspect ratio: 1:1 for avatars, 4:3 or 16:9 for galleries

**Haircut/Portfolio Photos**:
- Before/after format (optional)
- Consistent angles for comparison
- Good lighting showing detail
- Clean backgrounds or blurred backgrounds
- Multiple angles when possible

**Shop Photos**:
- Wide shots showing environment
- Detail shots (chairs, products, decor)
- Clean, well-lit spaces
- Professional photography preferred

### Placeholders

**No Image State**:
- Background: Slate 100
- Icon: Scissors or user icon (Slate 300)
- Maintain aspect ratio of intended image

### Illustrations

**Style**: 
- Flat vector illustrations
- Monoline or simple filled shapes
- Purple accent color
- Friendly, approachable characters
- Use for empty states, onboarding, confirmations

---

## 11. Animation & Motion

### Principles
- **Purposeful**: Every animation guides or informs
- **Quick**: 200-300ms for most transitions
- **Smooth**: Easing curves for natural feel
- **Subtle**: Enhance, don't distract

### Patterns

**Page Transitions**:
```
Duration: 300ms
Easing: ease-out
Effect: Fade + slight slide from right (iOS style)
```

**Button Press**:
```
Duration: 100ms
Effect: Scale to 0.97
Easing: ease-out
Haptic: Light impact
```

**Card Hover/Press**:
```
Duration: 150ms
Effect: Scale 1.02 + shadow increase
Easing: ease-in-out
```

**List Items**:
```
Duration: 200ms
Effect: Fade in + slide up (staggered 50ms)
Easing: ease-out
```

**Bottom Sheet**:
```
Duration: 300ms
Effect: Slide up from bottom
Easing: spring (damping: 0.8)
Backdrop: Fade in
```

**Skeleton Loading**:
```
Duration: 1200ms loop
Effect: Shimmer gradient sweep
Background: Slate 200
Shimmer: White 20% opacity
```

---

## 12. Empty States

### Patterns

**No Results (Search)**:
- Illustration: Search/magnifying glass
- Title: "No barbers found"
- Subtitle: "Try adjusting your filters or search area"
- Action: "Clear filters" button

**No Appointments**:
- Illustration: Calendar with scissors
- Title: "No appointments yet"
- Subtitle: "Book your first haircut and it'll appear here"
- Action: "Find Barbers" CTA

**No Internet**:
- Illustration: Disconnected/cloud
- Title: "You're offline"
- Subtitle: "Check your connection and try again"
- Action: "Retry" button

---

## 13. Accessibility Considerations

### Color Contrast
- All text meets WCAG AA (4.5:1 for body, 3:1 for large)
- Don't rely on color alone for status (icons + text)
- Focus states clearly visible

### Touch Targets
- Minimum 44x44pt for all interactive elements
- Adequate spacing between elements

### Screen Reader Support
- Descriptive labels for all icons
- Heading hierarchy (H1 → H2 → H3)
- Alt text for all images
- Status announcements for loading/success/error

### Reduced Motion
- Respect system preference
- Disable parallax, reduce transition durations
- Maintain functionality without animations

---

## 14. Platform-Specific Considerations

### iOS
- Follow iOS Human Interface Guidelines
- Use SF Symbols where appropriate
- Support for Dynamic Type
- Safe area insets for notched devices
- Swipe-back gesture support

### Android
- Follow Material 3 guidelines
- System back button handling
- Status bar theming
- Support for edge-to-edge
- Ripple effects on touch

---

## 15. Key Screen Summary

| Screen | Primary Goal | Key Elements |
|--------|--------------|--------------|
| **Discovery** | Find barbers | Map, search, filters, card list |
| **Barber Profile** | Evaluate & decide | Gallery, services, reviews, CTA |
| **Booking** | Schedule appointment | Service, date/time, details, confirm |
| **Appointments** | Manage bookings | List, details, actions |
| **Chat** | Communication | Messages, input, media |
| **Profile** | Account management | Info, settings, payment methods |
| **Barber Dashboard** | Manage business | Stats, calendar, earnings |

---

## 16. Design Resources

### Tools
- **Figma**: Primary design tool
- **Unsplash**: Stock photography
- **Feather Icons**: Icon system
- **Google Fonts**: Inter, Playfair Display

### References
- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines)
- [Material Design 3](https://m3.material.io/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Summary

Cloud Clips follows a **Modern Minimal with Premium Accents** design direction that prioritizes:

1. **Trust & Clarity**: Clear hierarchy, professional imagery, accessible design
2. **Ease of Discovery**: Map-first approach, smart filtering, intuitive navigation
3. **Seamless Booking**: Streamlined flow, clear pricing, transparent availability
4. **Premium Feel**: Subtle shadows, refined colors, thoughtful micro-interactions
5. **Accessibility First**: WCAG compliant, screen reader support, inclusive design

This mood board serves as the foundation for all design decisions in the Cloud Clips application.
