# AGENTS.MD - Guide for AI Agents

This document helps AI agents understand the Salat10 project structure, conventions, and where to find specific functionality.

## Project Overview

Salat10 is a Next.js 16 application that displays Islamic prayer times with:
- Multiple viewing modes (card, parallax, table, graph)
- Accurate astronomical calculations
- Hijri calendar integration
- Contextual Islamic quotes
- Visual sky animations

**Tech Stack**: Next.js 16, React 19, Bun, TypeScript, Tailwind CSS, Zustand, Framer Motion

## File Organization

### Core Business Logic (`src/lib/`)

#### Prayer Time Calculations
- **`calculator.ts`** + **`calculator.test.ts`**
  - Functions: `daily()`, `monthly()`, `yearly()`, `getActiveEvent()`, `getNextEvent()`
  - Uses Adhan library for astronomical calculations
  - Returns formatted prayer times with labels and timestamps
  - **Key concept**: Handles day boundaries (midnight) - night prayers from yesterday can be active in early morning

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
- **`settings.ts`**: Calculation method presets (angles for different madhabs/regions)
- **`constants.ts`**: App-wide constants (default coordinates, method options)
- **`prayer-utils.ts`**: Helper hooks for active prayer, countdowns, day navigation

#### Time & Formatting
- **`formatting.ts`**: Date/time formatting with timezone support
- **`time.ts`**: Date range parsing, URL params, schedule labels
- **`timeline.ts`**: Normalize prayer times to [0..1] range for parallax scrolling

### State Management (`src/store/`)

- **`usePrayerStore.ts`**
  - Zustand store with `zustand/persist` for localStorage
  - Manages: settings, computed prayer times, auto-recomputation
  - **Key concept**: Automatically recalculates when settings change or at each prayer time
  - Exports selector hooks: `useSettings()`, `useCurrentData()`, `useHasValidCoordinates()`

### UI Components (`src/components/`)

#### Base UI (`src/components/ui/`)
- shadcn/ui primitives: Button, Calendar, Popover, Table, Tooltip, etc.
- Consistent styling with Tailwind CSS

#### Prayer-Specific (`src/components/prayer/`)
- **`prayer-times-card.tsx`**: Main card view with prayer times and countdown
- **`quote-card.tsx`**: Displays filtered motivational quote with copy functionality

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

### App Routes (`src/app/`)

#### Main Pages
- **`page.tsx`**: Card view (home) - shows daily times with countdown
- **`v2/page.tsx`**: Parallax view - scrollable sky with sun/moon animations
- **`settings/page.tsx`**: Location and calculation settings
- **`timetable/page.tsx`**: Monthly/yearly table view
- **`graph/page.tsx`**: Prayer time visualization charts

#### Page Structure Pattern
Most pages follow this pattern:
```typescript
// page.tsx - Server Component
export default async function Page({ searchParams }) {
  const resolvedParams = await searchParams;
  return <ClientComponent params={resolvedParams} />;
}

// client-component.tsx - Client Component with hooks
'use client';
export function ClientComponent({ params }) {
  // Hooks and state here
}
```

#### API Routes
- **`api/geocode/route.ts`**: Convert address to coordinates using geocode.maps.co

### Custom Hooks (`src/hooks/`)

- **`use-days.ts`**: Manages multi-day buffer for scrolling (add prev/next day)
- **`use-scroll-tracking.ts`**: Converts scroll position to timeline progress [0..1]
- **`use-sun.ts`**: Calculates sun X/Y position and color based on timeline
- **`use-moon.ts`**: Calculates moon X/Y position and opacity
- **`use-sky.ts`**: Calculates sky color and gradient opacities
- **`use-motivational-quote.ts`**: Loads and filters quotes based on current prayer data
- **`use-prayer-chart.ts`**: Prepares data for uPlot charts

### Type Definitions (`src/types/`)

- **`settings.ts`**: Settings, MethodValue
- **`hijri.ts`**: HijriDate
- **`quote.ts`**: Quote with filtering fields
- **`timeline.ts`**: Timeline, DayData, Timing
- **`graph.ts`**: Chart-related types

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

### 2. Adding a New Quote Filter

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

### 3. Adding a New Calculation Method

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

### 4. Adding Animation to Parallax View

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
- Use descriptive `describe` blocks: `describe('daily', () => { ... })`
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

## Environment Variables

```bash
# Optional - for address geocoding
GEOCODE_API_KEY=your_geocode_maps_co_api_key
```

Without the API key, users can still:
- Use browser geolocation
- Manually enter coordinates
- Enter timezone

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

## When to Create Tests

**Always test:**
- New calculation functions
- Date/time manipulation logic
- Filter/matching logic
- Day boundary scenarios

**Optional:**
- UI components (prefer integration tests)
- Simple utility functions
- Type-only changes

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

## Useful Commands

```bash
bun test                              # Run all tests
bun test --watch                      # Watch mode
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
