# Cloud Clips - Design System

## Design Philosophy

### Aesthetic Direction: Modern Editorial with Warm Minimalism

Cloud Clips combines **editorial sophistication** with **warm minimalism** to create a premium yet approachable experience. The design language draws inspiration from high-end lifestyle magazines and boutique hotel booking apps—clean, confident, and focused on visual storytelling.

### Why This Direction?

- **Trust & Professionalism**: Editorial layouts signal quality and credibility for service providers
- **Visual-First**: Barber work is inherently visual; the UI should amplify portfolio imagery
- **Accessibility**: Warm minimalism ensures the interface remains intuitive and uncluttered
- **Differentiation**: Moves away from generic "tech app" aesthetics toward boutique service marketplace feel

---

## Core Principles

1. **Content is King**: UI elements should frame content, not compete with it
2. **Generous Whitespace**: Breathing room creates perceived luxury and clarity
3. **Typography as Design**: Type hierarchy creates visual interest without heavy ornamentation
4. **Subtle Depth**: Soft shadows and layered cards create spatial hierarchy
5. **Warmth over Cold**: Earthy undertones make the app feel human and welcoming

---

## Color Palette

### Primary Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary-50` | `#faf8f5` | Backgrounds, page base |
| `--color-primary-100` | `#f5f0e8` | Card backgrounds, subtle fills |
| `--color-primary-200` | `#e8dcc8` | Borders, dividers |
| `--color-primary-300` | `#d4c4a8` | Secondary borders |
| `--color-primary-400` | `#b89f7d` | Muted accents |
| `--color-primary-500` | `#9c7b54` | **Primary brand color** - CTAs, key actions |
| `--color-primary-600` | `#7d6243` | Hover states |
| `--color-primary-700` | `#614a35` | Active states, emphasis text |
| `--color-primary-800` | `#4a3829` | Headings on light backgrounds |
| `--color-primary-900` | `#36281d` | Primary text color |

### Accent Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-accent-500` | `#c9a86c` | Gold accent - ratings, highlights, success |
| `--color-accent-600` | `#a88b56` | Accent hover states |

### Semantic Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-success-500` | `#22c55e` | Success states, confirmations |
| `--color-success-100` | `#dcfce7` | Success backgrounds |
| `--color-warning-500` | `#f59e0b` | Warnings, pending states |
| `--color-warning-100` | `#fef3c7` | Warning backgrounds |
| `--color-error-500` | `#ef4444` | Errors, destructive actions |
| `--color-error-100` | `#fee2e2` | Error backgrounds |
| `--color-info-500` | `#3b82f6` | Information, links |
| `--color-info-100` | `#dbeafe` | Info backgrounds |

### Neutral Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--color-white` | `#ffffff` | Pure white backgrounds |
| `--color-neutral-50` | `#fafaf9` | Subtle backgrounds |
| `--color-neutral-100` | `#f5f5f4` | Input backgrounds |
| `--color-neutral-200` | `#e7e5e4` | Borders |
| `--color-neutral-300` | `#d6d3d1` | Disabled states |
| `--color-neutral-400` | `#a8a29e` | Placeholder text |
| `--color-neutral-500` | `#78716c` | Secondary text |
| `--color-neutral-600` | `#57534e` | Body text |
| `--color-neutral-700` | `#44403c` | Strong body text |
| `--color-neutral-800` | `#292524` | Headings |
| `--color-neutral-900` | `#1c1917` | Primary text |

### Dark Mode Colors

| Token | Value | Usage |
|-------|-------|-------|
| `--color-dark-bg` | `#1a1814` | Dark mode background |
| `--color-dark-surface` | `#24201c` | Cards, surfaces |
| `--color-dark-elevated` | `#2d2924` | Elevated surfaces |
| `--color-dark-border` | `#3d3832` | Borders in dark mode |
| `--color-dark-text` | `#faf8f5` | Primary text dark mode |
| `--color-dark-text-secondary` | `#a8a29e` | Secondary text dark mode |

---

## Typography

### Font Families

| Purpose | Font | Fallback |
|---------|------|----------|
| Headings | **Playfair Display** | Georgia, serif |
| Body | **Inter** | system-ui, sans-serif |
| Accent/Labels | **Inter** (medium) | system-ui, sans-serif |

### Type Scale

| Level | Font | Size | Weight | Line Height | Letter Spacing | Usage |
|-------|------|------|--------|-------------|----------------|-------|
| Display | Playfair Display | 48px / 3rem | 700 | 1.1 | -0.02em | Hero headings |
| H1 | Playfair Display | 36px / 2.25rem | 700 | 1.2 | -0.02em | Screen titles |
| H2 | Playfair Display | 28px / 1.75rem | 600 | 1.25 | -0.01em | Section headers |
| H3 | Playfair Display | 24px / 1.5rem | 600 | 1.3 | -0.01em | Card titles |
| H4 | Inter | 20px / 1.25rem | 600 | 1.4 | 0 | Subsection titles |
| H5 | Inter | 18px / 1.125rem | 600 | 1.4 | 0 | List headers |
| H6 | Inter | 16px / 1rem | 600 | 1.5 | 0 | Small headers |
| Body Large | Inter | 18px / 1.125rem | 400 | 1.6 | 0 | Featured paragraphs |
| Body | Inter | 16px / 1rem | 400 | 1.6 | 0 | Primary body text |
| Body Small | Inter | 14px / 0.875rem | 400 | 1.5 | 0 | Secondary text |
| Caption | Inter | 12px / 0.75rem | 500 | 1.4 | 0.02em | Labels, captions |
| Overline | Inter | 12px / 0.75rem | 600 | 1.4 | 0.08em | ALL CAPS labels |

### Typography Guidelines

- **Headings**: Use Playfair Display for editorial elegance; keep line length short
- **Body**: Inter provides excellent readability at all sizes
- **Contrast**: Maintain 4.5:1 minimum contrast ratio for body text
- **Hierarchy**: Create clear distinction between heading levels through size and weight
- **Italics**: Use Playfair Display italic sparingly for quotes or emphasis

---

## Spacing System

### Base Unit: 4px

| Token | Value | Usage |
|-------|-------|-------|
| `--space-1` | 4px | Micro spacing, icon gaps |
| `--space-2` | 8px | Tight element spacing |
| `--space-3` | 12px | Default element spacing |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 20px | Card padding |
| `--space-6` | 24px | Section padding |
| `--space-8` | 32px | Large section gaps |
| `--space-10` | 40px | Screen padding |
| `--space-12` | 48px | Major section breaks |
| `--space-16` | 64px | Hero spacing |
| `--space-20` | 80px | Extra large gaps |

### Layout Spacing

- **Screen padding**: 20px (mobile), 24px (tablet)
- **Card padding**: 16px - 20px
- **Section gaps**: 24px - 32px
- **Element gaps**: 8px - 16px

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 4px | Small elements, tags |
| `--radius-md` | 8px | Buttons, inputs |
| `--radius-lg` | 12px | Cards, modals |
| `--radius-xl` | 16px | Large cards, containers |
| `--radius-2xl` | 24px | Featured cards, images |
| `--radius-full` | 9999px | Pills, avatars, badges |

### Radius Guidelines

- **Buttons**: 8px for standard, 9999px for pill style
- **Cards**: 12px - 16px for primary cards
- **Images**: 16px - 24px for featured images
- **Inputs**: 8px for form fields
- **Avatars**: 9999px (circular)

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` | Subtle depth |
| `--shadow-md` | `0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)` | Cards |
| `--shadow-lg` | `0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05)` | Elevated cards |
| `--shadow-xl` | `0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)` | Modals, dropdowns |
| `--shadow-2xl` | `0 25px 50px -12px rgba(0,0,0,0.1)` | Overlays |

### Shadow Guidelines

- Use warm-tinted shadows (subtle brown undertone) to match color palette
- Avoid harsh black shadows; keep opacity low (5-10%)
- Layer shadows for depth: small + medium for elevated cards
- Dark mode shadows should be more pronounced due to dark backgrounds

---

## Components

### Buttons

#### Primary Button
- Background: `--color-primary-500`
- Text: White
- Border radius: 8px (standard) or 9999px (pill)
- Padding: 16px horizontal, 14px vertical
- Font: Inter 600, 16px
- Hover: `--color-primary-600`
- Active: `--color-primary-700`

#### Secondary Button
- Background: Transparent
- Border: 1.5px solid `--color-primary-500`
- Text: `--color-primary-600`
- Border radius: 8px
- Padding: 16px horizontal, 14px vertical
- Hover: Background `--color-primary-50`

#### Ghost Button
- Background: Transparent
- Text: `--color-neutral-700`
- Hover: Background `--color-neutral-100`

#### Button Sizes

| Size | Padding | Font Size |
|------|---------|-----------|
| Small | 12px x, 10px y | 14px |
| Medium | 16px x, 14px y | 16px |
| Large | 24px x, 16px y | 18px |

### Cards

#### Standard Card
- Background: White or `--color-primary-50`
- Border radius: 12px
- Shadow: `--shadow-md`
- Padding: 16px - 20px
- Border: 1px solid `--color-neutral-200` (subtle)

#### Elevated Card
- Background: White
- Border radius: 16px
- Shadow: `--shadow-lg`
- Padding: 20px - 24px

#### Featured Card (Barber Portfolio)
- Background: White
- Border radius: 24px (top corners) or 24px (all)
- Shadow: `--shadow-xl`
- Full-bleed image with overlay gradient

### Inputs

#### Text Input
- Background: `--color-neutral-50`
- Border: 1px solid `--color-neutral-200`
- Border radius: 8px
- Padding: 14px 16px
- Font: Inter 400, 16px
- Focus: Border `--color-primary-500`, shadow ring
- Placeholder: `--color-neutral-400`

#### Search Input
- Background: White
- Border: 1px solid `--color-neutral-200`
- Border radius: 9999px (pill)
- Left icon: Search icon, `--color-neutral-400`
- Padding: 12px 16px 12px 44px

### Badges/Tags

#### Status Badge
- Border radius: 9999px
- Padding: 4px 12px
- Font: Inter 500, 12px
- Background varies by status (success, warning, error, info)

#### Specialty Tag
- Background: `--color-primary-100`
- Text: `--color-primary-700`
- Border radius: 6px
- Padding: 4px 10px
- Font: Inter 500, 12px

### Avatars

| Size | Dimensions | Usage |
|------|------------|-------|
| XS | 24px | Inline mentions |
| Small | 32px | Lists, comments |
| Medium | 48px | Cards, headers |
| Large | 64px | Profiles |
| XL | 80px | Profile headers |
| XXL | 120px | Full profile |

- Border radius: 9999px (circular)
- Border: 2px solid white (for overlap effects)
- Shadow: `--shadow-sm` for standalone avatars

### Navigation

#### Tab Bar
- Background: White with `--shadow-lg` (top only)
- Active icon: `--color-primary-500`
- Inactive icon: `--color-neutral-400`
- Active indicator: 4px dot or underline

#### Header
- Background: White or transparent with blur
- Border bottom: 1px solid `--color-neutral-200` (when scrolled)
- Height: 56px
- Title: H4 (20px)

---

## Patterns

### Barber Card Pattern
- Full-width card with horizontal layout
- Avatar: 80px on left
- Content: Business name (H5), bio snippet, rating, specialties
- Bottom row: Rating stars, experience, starting price
- Background: White with `--shadow-md`
- Border radius: 16px
- Press state: Scale 0.98, shadow reduces

### Booking Flow Pattern
1. **Service Selection**: Large tappable cards with icon + price
2. **Date/Time**: Calendar grid with available slots highlighted
3. **Location**: Map preview with address confirmation
4. **Confirmation**: Summary card with all details

### Map Integration
- Map: Full screen with location markers
- Marker: Custom pin with rating badge
- Bottom sheet: Scrollable barber list overlay
- Search bar: Floating pill above map

### Empty States
- Icon: 64px, `--color-neutral-300`
- Title: H4, `--color-neutral-800`
- Description: Body, `--color-neutral-500`
- CTA: Secondary button
- Layout: Centered, generous padding (48px+)

### Loading States
- Skeleton: `--color-neutral-100` to `--color-neutral-200` shimmer
- Pulse: Subtle opacity animation
- Spinner: `--color-primary-500`, 24px

---

## Iconography

### Icon Style
- **Style**: Outlined, 1.5px stroke weight
- **Library**: Lucide React (lucide-react-native)
- **Size**: 20px default, 16px small, 24px large
- **Color**: Inherit from text color

### Icon Guidelines
- Use consistent sizing within contexts
- Maintain 1.5px stroke for visibility
- Icons should align with text baseline
- Prefer outlined over filled for lighter aesthetic

### Common Icons

| Usage | Icon |
|-------|------|
| Navigation | Home, Search, Calendar, User |
| Actions | ChevronRight, Plus, X, Check |
| Status | Star, Heart, MapPin, Clock |
| Barber | Scissors, Sparkles, Crown |
| Commerce | ShoppingBag, CreditCard, Tag |

---

## Animation & Micro-interactions

### Timing

| Duration | Usage |
|----------|-------|
| 100ms | Micro-interactions (button press) |
| 200ms | Quick transitions (color, opacity) |
| 300ms | Standard transitions (position, scale) |
| 400ms | Page transitions |
| 500ms | Complex animations |

### Easing

| Name | Value | Usage |
|------|-------|-------|
| ease-out | `cubic-bezier(0, 0, 0.2, 1)` | UI interactions |
| ease-in-out | `cubic-bezier(0.4, 0, 0.2, 1)` | Symmetric animations |
| spring | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful bounces |

### Interactions

#### Button Press
- Scale: 1.0 → 0.97
- Duration: 100ms
- Easing: ease-out

#### Card Press
- Scale: 1.0 → 0.98
- Shadow: Reduce by one level
- Duration: 150ms

#### Page Transition
- Slide: 20px horizontal
- Opacity: 0 → 1
- Duration: 300ms
- Easing: ease-in-out

#### List Item Enter
- Translate Y: 10px → 0
- Opacity: 0 → 1
- Duration: 300ms
- Stagger: 50ms between items

#### Bottom Sheet
- Translate Y: 100% → 0
- Backdrop opacity: 0 → 0.5
- Duration: 400ms
- Easing: ease-out

---

## Responsive Behavior

### Breakpoints

| Breakpoint | Width | Adjustments |
|------------|-------|-------------|
| Mobile | < 480px | Default, single column |
| Tablet | 480px - 768px | Larger cards, 2-column grids |
| Desktop | > 768px | Full layout, sidebar nav |

### Mobile-First Considerations
- Touch targets: Minimum 44px
- Font sizes: Never below 14px for body text
- Card padding: 16px minimum
- Spacing: 20px screen padding

---

## Dark Mode

### Strategy
- **Background**: Warm dark (`#1a1814`) instead of pure black
- **Surfaces**: Layered warm grays
- **Accents**: Maintain gold accent (`--color-accent-500`)
- **Text**: Warm white (`#faf8f5`) for comfort
- **Shadows**: More pronounced for depth perception

### Dark Mode Tokens

| Element | Light | Dark |
|---------|-------|------|
| Background | `--color-primary-50` | `--color-dark-bg` |
| Surface | White | `--color-dark-surface` |
| Border | `--color-neutral-200` | `--color-dark-border` |
| Primary Text | `--color-neutral-900` | `--color-dark-text` |
| Secondary Text | `--color-neutral-500` | `--color-dark-text-secondary` |

---

## Implementation Notes

### Tailwind Configuration

```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#faf8f5',
          100: '#f5f0e8',
          200: '#e8dcc8',
          300: '#d4c4a8',
          400: '#b89f7d',
          500: '#9c7b54',
          600: '#7d6243',
          700: '#614a35',
          800: '#4a3829',
          900: '#36281d',
        },
        accent: {
          500: '#c9a86c',
          600: '#a88b56',
        },
        dark: {
          bg: '#1a1814',
          surface: '#24201c',
          elevated: '#2d2924',
          border: '#3d3832',
        },
      },
      fontFamily: {
        heading: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -2px rgba(0,0,0,0.05)',
        'card-lg': '0 10px 15px -3px rgba(0,0,0,0.05), 0 4px 6px -4px rgba(0,0,0,0.05)',
        'card-xl': '0 20px 25px -5px rgba(0,0,0,0.05), 0 8px 10px -6px rgba(0,0,0,0.05)',
      },
    },
  },
};
```

### Font Loading (Expo)

```typescript
import { useFonts } from 'expo-font';
import { PlayfairDisplay_600SemiBold, PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';

export function useAppFonts() {
  const [fontsLoaded] = useFonts({
    'PlayfairDisplay-SemiBold': PlayfairDisplay_600SemiBold,
    'PlayfairDisplay-Bold': PlayfairDisplay_700Bold,
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  return fontsLoaded;
}
```

### Migration Path

1. **Phase 1**: Update color tokens in Tailwind config
2. **Phase 2**: Implement typography system
3. **Phase 3**: Update component library
4. **Phase 4**: Refactor screens to new patterns
5. **Phase 5**: Add dark mode support
6. **Phase 6**: Polish animations and micro-interactions

---

## Accessibility

### Requirements
- **Contrast**: 4.5:1 minimum for body text, 3:1 for large text
- **Touch targets**: 44px minimum
- **Focus states**: Visible focus indicators on all interactive elements
- **Screen readers**: Meaningful labels, proper heading hierarchy
- **Motion**: Respect `prefers-reduced-motion`

### Testing Checklist
- [ ] Color contrast validated
- [ ] Screen reader navigation tested
- [ ] Keyboard navigation functional
- [ ] Touch target sizes verified
- [ ] Font scaling tested (up to 200%)

---

## Mood Board References

### Visual References

1. **Aesop** - Warm, earthy tones; editorial product photography
2. **Airbnb** - Clean cards, generous whitespace, human-focused
3. **Headspace** - Approachable, warm colors without being childish
4. **Kinfolk Magazine** - Editorial layout, natural tones, lifestyle photography
5. **Glossier** - Clean aesthetic, product-focused, warm neutrals

### Photography Style
- Natural lighting with warm tones
- Lifestyle-focused rather than studio
- Barber-client interactions
- Detail shots of tools and techniques
- Warm color grading (amber, cream, soft browns)

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-02-09 | Initial design system documentation |

---

## Contributing

When adding new components or patterns:
1. Follow existing naming conventions
2. Document in this file
3. Include usage examples
4. Test for accessibility
5. Verify dark mode compatibility
