# AGENTS.MD - Guide for AI Agents

This document helps AI agents understand the Salat10 project structure, conventions, and where to find specific functionality.

## Project Overview

Salat10 is a Next.js 16 application that displays Islamic prayer times with:
- Multiple viewing modes (card, parallax, table, graph)
- Accurate astronomical calculations
- Hijri calendar integration
- Contextual Islamic quotes
- Visual sky animations
- **Qibla finder with AR compass**
- **Real-time online users map with presence tracking**
- **Analytics and page view tracking**

**Tech Stack**: Next.js 16, React 19, Bun, TypeScript, Tailwind CSS, Zustand, Framer Motion, Upstash Redis

## File Organization

### Core Business Logic (`src/lib/`)

#### Prayer Time Calculations
- **`calculator.ts`** + **`calculator.test.ts`**
  - Functions: `daily()`, `monthly()`, `yearly()`, `getActiveEvent()`, `getNextEvent()`
  - Uses Adhan library for astronomical calculations
  - Returns formatted prayer times with labels and timestamps
  - **Key concept**: Handles day boundaries (midnight) - night prayers from yesterday can be active in early morning

#### Qibla Calculations
- **`qibla.ts`** + **`qibla.test.ts`**
  - Functions: `calculateQibla()`, `calculateRelativeRotation()`, `smoothHeading()`, `isPointingAtQibla()`
  - Compass utilities: `calculateHeadingStability()`, `getIOSCompassQuality()`, `formatDirectionInstruction()`
  - Uses great circle formula to calculate bearing from user location to Kaaba
  - Handles iOS/Android differences in DeviceOrientation API

#### Analytics & Presence Tracking
- **`analytics.ts`**
  - Client-side batched event tracking
  - Functions: `trackPageView()`, `trackEvent()`, `updatePresence()`, `flushPendingEvents()`
  - Session management: `getOrCreateSessionId()`
  - localStorage batching with configurable flush intervals
  - Real-time presence updates with location metadata (city/state/country)
  
- **`redis.ts`**
  - Upstash Redis client configuration
  - Key structure definitions for analytics and presence
  - TTL constants for data expiration
  
- **`security.ts`**
  - CORS validation: `validateOrigin()`, `createCorsHeaders()`
  - Origin/referer checking for API security

#### Store Utilities
- **`store-utils.ts`** + **`store-utils.test.ts`**
  - Functions: `hasValidCoordinates()`, `computePrayerTimesForDate()`, `findNextEventTime()`, `getMillisecondsUntilNextUpdate()`
  - Extracted from Zustand store for testability
  - Pure functions without side effects

#### Hijri Calendar
- **`hijri.ts`** + **`hijri.test.ts`**
  - Functions: `writeIslamicDate()`, `explainHijriConversion()`
  - Implements Kuwaiti algorithm for Gregorian to Hijri conversion
  - Returns Arabic transliterated month/day names
  - **Key concept**: Uses Julian Day Number calculations with 30-year cycles

#### Quote Filtering
- **`quotes.ts`** + **`quotes.test.ts`**
  - Functions: `filterQuotesByPresent()`, `getRandomQuote()`, `formatCitation()`
  - Complex filtering based on: Hijri month/date, weekday, current prayer, time windows
  - **Key concept**: 
    - `after: {events: ['isha']}` = show during Isha prayer
    - `before: {events: ['maghrib']}` = show when in the event immediately before Maghrib
    - `before: {events: ['maghrib'], diff: '1h'}` = show within 1 hour before Maghrib
  - Handles day boundary: when in `lastThirdOfTheNight`, next event is tomorrow's `fajr`

#### Settings & Configuration
- **`settings.ts`** + **`settings.test.ts`**: Calculation method presets (angles for different madhabs/regions)
- **`constants.ts`**: App-wide constants (default coordinates, method options)
- **`prayer-utils.ts`**: Helper hooks for active prayer, countdowns, day navigation

#### Time & Formatting
- **`formatting.ts`** + **`formatting.test.ts`**: Date/time formatting with timezone support, coordinate formatting
- **`time.ts`** + **`time.test.ts`**: Date range parsing, URL params, schedule labels
- **`timeline.ts`** + **`timeline.test.ts`**: Normalize prayer times to [0..1] range for parallax scrolling

#### Visual Utilities
- **`colors.ts`** + **`colors.test.ts`**: Color interpolation, RGB/hex conversion, sky color calculations
- **`utils.ts`** + **`utils.test.ts`**: Class name merger using `clsx` and `tailwind-merge`

### SEO Configuration (`src/config/`)

- **`seo.ts`**: Centralized SEO metadata configuration
  - `BASE_URL`: App base URL (from env or default)
  - `SITE_URL`: Canonical site URL for CORS and security
  - `defaultMetadata`: Shared metadata with OpenGraph, Twitter cards
  - Page-specific metadata exports: `homeMetadata`, `parallaxMetadata`, `qiblaMetadata`, etc.
  - **Important**: Always set `metadataBase` to avoid build warnings

### State Management (`src/store/`)

- **`usePrayerStore.ts`** + **`usePrayerStore.test.ts`**
  - Zustand store with `zustand/persist` for localStorage
  - Manages: settings (including location metadata), computed prayer times, auto-recomputation
  - **New in Settings**: `city`, `state`, `country` fields for location metadata
  - **Key concept**: Automatically recalculates when settings change or at each prayer time
  - Exports selector hooks: `useSettings()`, `useCurrentData()`, `useHasValidCoordinates()`
  - **Testing**: Core logic extracted to `store-utils.ts` for unit testing

### Type Definitions (`src/types/`)

- **`settings.ts`**: Settings with location metadata (city/state/country), MethodValue
- **`hijri.ts`**: HijriDate
- **`quote.ts`**: Quote with filtering fields
- **`timeline.ts`**: Timeline, DayData, Timing
- **`graph.ts`**: Chart-related types
- **`prayer.ts`**: ComputedPrayerData (extracted from store)

### UI Components (`src/components/`)

#### Base UI (`src/components/ui/`)
- shadcn/ui primitives: Button, Calendar, Popover, Table, Tooltip, etc.
- Consistent styling with Tailwind CSS

#### Prayer-Specific (`src/components/prayer/`)
- **`prayer-times-card.tsx`**: Main card view with prayer times and countdown
- **`quote-card.tsx`**: Displays filtered motivational quote with copy functionality

#### Qibla Components (`src/components/qibla/`)
- **`arrow.tsx`**: AR compass arrow that rotates to point at Qibla
- **`info-card.tsx`**: Shows bearing, heading, accuracy, and direction instructions
- **`permissions-card.tsx`**: Handles camera/motion sensor permission requests with browser-specific instructions

#### Analytics
- **`analytics-provider.tsx`**: Client-side provider for page view tracking and presence updates
  - Automatically tracks route changes
  - Updates presence with location metadata (city/state/country) for online map
  - Handles event batching and flushing on unload

#### Visual Effects (`src/components/`)
- **`sky.tsx`**: Background color transitions (night → dawn → day → sunset)
- **`sun.tsx`**: Animated sun with color changes (red at sunrise/sunset, yellow at noon)
- **`moon.tsx`**: Moon rendering with proper visibility
- **`stars.tsx`**: Animated star field with shooting comets (only during last third of night)
- **`fajr-sky.tsx`**: Dawn gradient overlay
- **`sunset-sky.tsx`**: Sunset gradient overlay
- **`light-rays.tsx`**: Subtle rays near sunrise
- **`radial-gradient.tsx`**: Vignette effect

#### Magic UI (`src/components/magicui/`)
- **`aurora-text.tsx`**: Shimmering text effect for active prayer
- **`meteors.tsx`**: Animated falling meteors
- **`shiny-text.tsx`**: Glossy text effect
- **`text-animate.tsx`**: Staggered text animation

#### Tables & Charts
- **`timetable/prayer-timetable-table.tsx`**: Monthly/yearly prayer schedule table
- **`prayer-line-chart.tsx`**: Interactive time-series visualization using uPlot

#### World Map
- **`aceternity/world-map.tsx`**: Interactive world map using dotted-map library
  - Displays real-time online users as dots
  - Shows location labels (city > state > country priority)

### App Routes (`src/app/`)

#### Main Pages
- **`page.tsx`** + **`client.tsx`**: Card view (home) - shows daily times with countdown
- **`v2/page.tsx`**: Parallax view - scrollable sky with sun/moon animations
- **`settings/page.tsx`** + **`settings/client.tsx`**: Location and calculation settings
- **`timetable/page.tsx`**: Monthly/yearly table view
- **`graph/page.tsx`**: Prayer time visualization charts
- **`qibla/page.tsx`** + **`qibla/client.tsx`**: AR Qibla finder with camera and compass
- **`online/page.tsx`** + **`online/client.tsx`**: Real-time online users map
- **`explanations/page.tsx`**: Documentation about prayer time calculations

#### Page Structure Pattern
Most pages follow this pattern:
```typescript
// page.tsx - Server Component
export const metadata = pageMetadata; // Import from src/config/seo.ts

export default function Page() {
  return <ClientComponent />;
}

// client.tsx - Client Component with hooks
'use client';
export function ClientComponent() {
  // Hooks and state here
}
```

**Critical for Qibla page**: Use `dynamic` import with `ssr: false` to avoid `navigator is not defined` errors during build:
```typescript
const QiblaFinderClient = dynamic(() => import('./client'), { ssr: false });
```

#### API Routes
- **`api/geocode/route.ts`**: Convert address to coordinates using geocode.maps.co
  - Returns coordinates, display label, and location metadata (city/state/country)
  - Prioritizes: city/town/village > state_district > state > country
  
- **`api/track/route.ts`**: Analytics and presence tracking endpoint
  - Accepts batched pageview/event data
  - Accepts real-time presence updates with location metadata
  - Validates coordinates and enforces CORS
  - Stores data in Upstash Redis
  
- **`api/online/route.ts`**: Fetch currently online users
  - Returns list of active users with coordinates and location labels
  - Filters by TTL window (default 5 minutes)
  - Enforces CORS validation

### Custom Hooks (`src/hooks/`)

- **`use-days.ts`**: Manages multi-day buffer for scrolling (add prev/next day)
- **`use-scroll-tracking.ts`**: Converts scroll position to timeline progress [0..1]
- **`use-sun.ts`**: Calculates sun X/Y position and color based on timeline
- **`use-moon.ts`**: Calculates moon X/Y position and opacity
- **`use-sky.ts`**: Calculates sky color and gradient opacities
- **`use-motivational-quote.ts`**: Loads and filters quotes based on current prayer data
- **`use-prayer-chart.ts`**: Prepares data for uPlot charts
- **`use-camera.ts`**: Manages camera access with feature detection for getUserMedia
- **`use-qibla-compass.ts`**: Handles DeviceOrientation API with iOS/Android differences

## Common Patterns

### 1. Adding a New Prayer-Related Feature

**If it needs current prayer data:**
```typescript
import { useCurrentData } from '@/store/usePrayerStore';

export function MyComponent() {
  const currentData = useCurrentData();
  
  if (!currentData) return null;
  
  // Access prayer times
  const fajr = currentData.prayerTimes.fajr;
  const middle = currentData.sunnahTimes.middleOfTheNight;
}
```

**If it needs settings:**
```typescript
import { useSettings, usePrayerStore } from '@/store/usePrayerStore';

export function MyComponent() {
  const settings = useSettings();
  const updateSetting = usePrayerStore((state) => state.updateSetting);
  
  // Change a setting
  updateSetting('latitude', '43.6532');
}
```

### 2. Adding SEO Metadata

Always import from `src/config/seo.ts`:
```typescript
import { myPageMetadata } from '@/config/seo';

export const metadata = myPageMetadata;
```

Add new page metadata to `src/config/seo.ts`:
```typescript
export const myPageMetadata: Metadata = {
  title: 'My Page Title',
  description: 'My page description',
  alternates: {
    canonical: `${BASE_URL}/my-page`,
  },
};
```

### 3. Creating Client-Only Components (Camera, Sensors, Browser APIs)

Use dynamic import to prevent SSR errors:
```typescript
import dynamic from 'next/dynamic';

const BrowserOnlyComponent = dynamic(
  () => import('./browser-component'),
  { ssr: false, loading: () => <div>Loading...</div> }
);
```

### 4. Adding Location Metadata from Geocoding

When using the geocode API, capture location metadata:
```typescript
const response = await fetch(`/api/geocode?address=${encodeURIComponent(address)}`);
const result = await response.json();

// Result includes: latitude, longitude, label, city?, state?, country?
onSettingsChange((prev) => ({
  ...prev,
  latitude: result.latitude.toFixed(4),
  longitude: result.longitude.toFixed(4),
  address: result.label,
  ...(result.city && { city: result.city }),
  ...(result.state && { state: result.state }),
  ...(result.country && { country: result.country }),
}));
```

### 5. Tracking Analytics Events

**Page views** (automatic via AnalyticsProvider):
```typescript
// Already tracked automatically on route change
```

**Custom events**:
```typescript
import { trackEvent } from '@/lib/analytics';

await trackEvent('button_click', { button: 'share_quote' });
```

**Presence updates** (automatic via AnalyticsProvider with location metadata):
```typescript
// Automatically includes city, state, country when available
```

### 6. Adding a New Quote Filter

Edit `src/lib/quotes.ts` and add a new matcher function:
```typescript
const matchesMyFilter = (quote: Quote, data: ComputedPrayerData): boolean => {
  if (!quote.my_filter_field) {
    return true; // No filter specified = match all
  }
  
  // Your matching logic here
  return /* boolean */;
};

// Add to filterQuotesByPresent
const filtered = quotes.filter((quote) => {
  return (
    matchesHijriMonth(quote, hijri) &&
    matchesMyFilter(quote, data) && // <-- Add here
    // ... other matchers
  );
});
```

### 7. Adding a New Calculation Method

Edit `src/lib/constants.ts`:
```typescript
export const CALCULATION_METHOD_OPTIONS = [
  // ... existing methods
  { value: 'MyMethod' as const, label: 'My Method' },
] as const;
```

Edit `src/lib/settings.ts`:
```typescript
export const methodPresets: Record<MethodValue, MethodConfig> = {
  // ... existing presets
  MyMethod: { fajrAngle: 18, ishaAngle: 17, ishaInterval: 0 },
};
```

### 8. Adding Animation to Parallax View

Edit `src/app/v2/samaa.tsx` (sky), `shams.tsx` (sun), or `qamar.tsx` (moon):

```typescript
// In your hook (e.g., use-sun.ts)
export const useMySunEffect = (scrollProgress: MotionValue<number>, timeline: Timeline | null) => {
  return useTransform(scrollProgress, (p) => {
    if (!timeline) return 0;
    
    // Map timeline progress to your value
    if (p < timeline.sunrise) return /* before sunrise */;
    if (p < timeline.dhuhr) return /* morning */;
    // ... etc
  });
};

// In shams.tsx
const myEffect = useMySunEffect(scrollProgress, timeline);
```

## Testing Conventions

### Unit Tests Location
- Co-located with source: `src/lib/calculator.ts` → `src/lib/calculator.test.ts`
- Use descriptive `describe` and `it` blocks
- Use `it.only` for focused debugging (remove before commit)

### Common Test Patterns

**Prayer Time Tests:**
```typescript
const result = daily(labels, defaultConfig, new Date('2024-03-11T14:30:00-05:00'));
expect(result.timings.length).toBeGreaterThan(0);
```

**Day Boundary Tests:**
```typescript
// When testing early morning (after midnight, before Fajr)
const fajr = timings.find((t) => t.event === 'fajr')!;
const earlyMorning = fajr.value.getTime() - 30 * 60 * 1000; // 30 min before
const active = getActiveEvent(timings, earlyMorning);
expect(active).toBe('lastThirdOfTheNight'); // Yesterday's event
```

**Quote Filtering Tests:**
```typescript
const data = createPrayerData(new Date(2022, 3, 1, 21, 0, 0)); // Isha time
const quotes: Quote[] = [
  { after: { events: ['isha'] }, /* ... */ },
];
const filtered = filterQuotesByPresent(data, quotes);
expect(filtered.length).toBeGreaterThanOrEqual(1);
```

**Store Utility Tests:**
```typescript
import { computePrayerTimesForDate, hasValidCoordinates } from '@/lib/store-utils';

it('should validate coordinates', () => {
  expect(hasValidCoordinates(validSettings)).toBe(true);
  expect(hasValidCoordinates({ ...validSettings, latitude: 'invalid' })).toBe(false);
});
```

## Important Concepts

### Day Boundaries (Midnight)
- Islamic day starts at sunset, but code uses calendar days
- Night prayers (Isha, Middle, Last Third) can occur "tomorrow" (after midnight)
- When checking active event before Fajr, we're in "yesterday's" night prayers
- Example: At 2 AM on March 12, active event might be "March 11's lastThirdOfTheNight"

### Timeline Normalization
- Parallax view uses [0..1] range for scroll position
- Midnight is normalized to 0, next Fajr is 1.0
- Each prayer event gets a position: `fajr=0.05, sunrise=0.12, ...`
- Allows smooth interpolation of sun/moon positions and colors

### Quote Specificity
- Quotes with more filters are more specific
- Scoring: hijri_dates (20) > after/before (15) > hijri_months (10) > days (5)
- More specific quotes are shown first
- Fallback to generic quotes if no matches

### Auto-Recomputation
- Store schedules update at each prayer time transition
- Uses `setTimeout` to trigger at next event
- Clears timeout on unmount or settings change
- Recomputes immediately when settings change

### Qibla Calculation
- Uses great circle formula (same as adhan-js)
- Returns bearing 0-360° from North
- Smooth heading updates with low-pass filter to reduce jitter
- iOS uses `webkitCompassHeading`, Android uses `deviceorientationabsolute`

### Camera & Sensor Permissions
- **HTTPS required**: getUserMedia only works over HTTPS (except localhost)
- iOS Safari requires `DeviceOrientationEvent.requestPermission()` (iOS 13+)
- Use dynamic imports with `ssr: false` to prevent build errors
- Brave browser has stricter defaults - may need Settings → Site permissions

### Analytics & Presence Tracking
- **Client-side batching**: Events stored in localStorage and sent in batches
- **Real-time presence**: Updated immediately on page load/navigation
- **Location metadata**: City, state, country captured from geocoding and sent with presence
- **Session IDs**: Unique per browser tab using sessionStorage
- **TTL**: Presence expires after 5 minutes of inactivity
- **Redis storage**: All data stored in Upstash Redis with automatic expiration

### Location Metadata Priority
When displaying user locations on the online map:
1. **City** name (from city/town/village fields)
2. **State** name (from state_district or state)
3. **Country** name (as fallback)
4. **Undefined** if no location data available

## Environment Variables

```bash
# Optional - for address geocoding
GEOCODE_API_KEY=your_geocode_maps_co_api_key

# Required - for analytics and presence tracking
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Optional - analytics configuration
NEXT_PUBLIC_ANALYTICS_STORAGE_KEY=salat10_analytics
NEXT_PUBLIC_ANALYTICS_BATCH_SIZE=10
NEXT_PUBLIC_SESSION_ID_KEY=salat10_session_id
NEXT_PUBLIC_ANALYTICS_FLUSH_INTERVAL=3600000  # 1 hour in ms
```

## Common Debugging

### "Prayer times not showing"
1. Check if coordinates are valid: `useHasValidCoordinates()`
2. Check if store has hydrated: `useHasHydrated()`
3. Check if `currentData` is not null

### "Wrong active prayer showing"
1. Check timezone matches user's actual timezone
2. Verify current time with `data.date`
3. Check if night events need yesterday's adjustment

### "Parallax view stuck/jerky"
1. Verify `totalHeight` is set correctly
2. Check `scrollProgress` MotionValue updates
3. Ensure `timeline` is not null

### "Quotes not filtering correctly"
1. Log `getCurrentEventName()` to see active event
2. Check if we're in a day boundary scenario (after midnight)
3. Verify quote filter fields match expected values

### "navigator is not defined" error during build
1. Use dynamic import: `dynamic(() => import('./component'), { ssr: false })`
2. Ensure browser APIs are only accessed in `useEffect` or event handlers
3. Check that the component is actually client-side (`'use client'` directive)

### "Qibla compass not working on mobile"
1. Verify app is served over HTTPS (required for camera/sensors on iOS)
2. Check browser permissions in Settings
3. For Brave: Check Settings → Site permissions → Camera/Motion
4. For Safari: Check Settings → Safari → Camera/Motion & Orientation Access

### "Online users map not showing data"
1. Check Upstash Redis connection (verify env variables)
2. Verify CORS headers are correct (check origin validation)
3. Check browser console for API errors
4. Ensure valid coordinates are being sent with presence updates

### "Geocoding not returning location metadata"
1. Check geocode API response format in browser network tab
2. Verify extractLocationDetails() is prioritizing fields correctly
3. Test with different location queries (some may not have city data)

## When to Create Tests

**Always test:**
- New calculation functions
- Date/time manipulation logic
- Filter/matching logic
- Day boundary scenarios
- Store utilities (pure functions)
- API validation functions

**Optional:**
- UI components (prefer integration tests)
- Simple utility functions
- Type-only changes

**Test Coverage Goal:**
- Aim for 100% coverage on core logic (`lib/` modules)
- Store logic tested via extracted utilities
- Use `bun test --coverage` to check

## Code Style

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use arrow functions for callbacks
- Use `null` over `undefined` for "no value"
- Use descriptive variable names except:
  - `i`, `j` for loop indices
  - `e` for event handlers
  - `p` for progress (0-1 range)
- Use `biome` for formatting (runs on commit)
- **Add JSDoc comments** for:
  - All exported functions
  - React components (props description)
  - Type definitions (property descriptions)
  - Complex algorithms or business logic

## JSDoc Standards

### Functions
```typescript
/**
 * Calculate Qibla direction from coordinates
 * 
 * @param lat - User's latitude in degrees
 * @param lon - User's longitude in degrees
 * @returns Bearing in degrees (0-360) from North to Kaaba
 */
export function calculateQibla(lat: number, lon: number): number {
  // ...
}
```

### React Components
```typescript
/**
 * Prayer times card displaying daily schedule with countdown
 * 
 * Features:
 * - Active prayer highlighting
 * - Navigation between days
 * - Quick links to other views
 */
export function PrayerTimesCard({ activeEvent, timings }: PrayerTimesCardProps) {
  // ...
}
```

### Types
```typescript
/**
 * Application settings for prayer time calculations and location
 */
export type Settings = {
  /** User-provided address or location label */
  address: string;
  
  /** Latitude coordinate (as string for form input) */
  latitude: string;
  
  // ... other properties
};
```

## Useful Commands

```bash
bun test                              # Run all tests
bun test --watch                      # Watch mode
bun test --coverage                   # With coverage report
bun test src/lib/calculator.test.ts   # Specific file
bun run lint                          # Check code style
bun run lint --write                  # Auto-fix issues
bun run dev                           # Dev server
bun run build                         # Production build
```

## Questions or Issues?

- Check existing tests for examples
- Look for similar patterns in codebase
- Test day boundary scenarios (before Fajr, after midnight)
- Consider timezone implications
- Verify against actual prayer times using a reference
- For Qibla/camera issues: Ensure HTTPS and proper permissions
- For analytics issues: Check Redis connection and CORS validation
- For geocoding issues: Test API response format and field extraction
