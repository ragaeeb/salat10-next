# Salat10

Salat10 is an educational prayer time explorer built with Next.js 16 and Bun. It walks visitors through the complete chain of astronomical calculations used to determine the five daily prayers, pairs the math with plain-language narration, and surfaces prophetic narrations and seasonal safeguards along the way.

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/c086c613-a649-484a-be35-fccd9c27d714.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/c086c613-a649-484a-be35-fccd9c27d714)
[![codecov](https://codecov.io/gh/ragaeeb/salat10-next/graph/badge.svg?token=4F7LER2188)](https://codecov.io/gh/ragaeeb/salat10-next)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/salaten)](https://salaten.vercel.app)
[![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)](https://www.typescriptlang.org)
[![Node.js CI](https://github.com/ragaeeb/salat10-next/actions/workflows/build.yml/badge.svg)](https://github.com/ragaeeb/salat10-next/actions/workflows/build.yml)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![GitHub License](https://img.shields.io/github/license/ragaeeb/salat10-next)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

### Prayer Time Calculation & Display
- **Multiple viewing modes**:
  - **Card View**: Interactive daily prayer times with countdown to next prayer
  - **Parallax View** (`/v2`): Immersive scrollable sky animation showing sun/moon positions throughout the day
  - **Timetable View**: Monthly/yearly prayer schedules with customizable date formats
  - **Graph View**: Visual charts comparing prayer times across date ranges

- **Accurate calculations** using the [Adhan](https://github.com/batoulapps/adhan-js) library with:
  - Customizable calculation methods (Muslim World League, ISNA, Egyptian, etc.)
  - Custom Fajr and Isha angles
  - Configurable Isha interval
  - Support for all five daily prayers plus Sunnah times (middle of night, last third of night)

### Location & Timezone Support
- **Automatic location detection** via browser geolocation
- **Address geocoding** - enter a city name to auto-fill coordinates
- **Timezone management** with searchable combobox of all IANA timezones
- **Persistent settings** stored in browser local storage

### Islamic Calendar (Hijri)
- **Automatic Hijri date conversion** using the Kuwaiti algorithm
- **Detailed conversion explanations** showing the mathematical steps
- **Full Arabic transliteration** for months and weekdays
- **Month boundary handling** with proper year transitions

### Contextual Quotes & Narrations
- **Smart quote filtering** based on:
  - Current prayer time (e.g., quotes specific to Fajr time)
  - Hijri month (e.g., Ramadan-specific narrations)
  - Hijri date (e.g., special occasions)
  - Day of week (e.g., Friday-specific quotes)
  - Time windows (e.g., "last hour before Maghrib")
- **Proper citation formatting** with source references
- **Copy to clipboard** functionality for sharing

### Visual Experience
- **Animated sky backgrounds** that change based on time of day:
  - Gradient transitions from night to dawn to day to sunset
  - Animated stars with shooting comets during last third of night
  - Sun and moon positioning that follows actual astronomical calculations
  - Aurora effects highlighting active prayer times
- **Smooth animations** using Framer Motion
- **Responsive design** optimized for mobile and desktop
- **Dark-themed interface** with royal blue accents

### Data Visualization
- **Interactive line charts** showing prayer time trends over date ranges
- **Configurable date ranges** with calendar picker
- **Event selection** to focus on specific prayer times
- **Export-friendly tables** with customizable date formatting

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) with App Router and React Server Components
- **Runtime**: [Bun](https://bun.sh/) for fast package management and testing
- **UI Library**: [React 19](https://react.dev/) with hooks and modern patterns
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom design tokens
- **Animations**: [Framer Motion](https://www.framer.com/motion/) for smooth transitions
- **Charts**: [uPlot](https://github.com/leeoniya/uPlot) for high-performance time-series graphs
- **Prayer Times**: [Adhan](https://github.com/batoulapps/adhan-js) for accurate astronomical calculations
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) with persistence
- **Linting/Formatting**: [Biome](https://biomejs.dev/) for fast, unified tooling
- **Testing**: Bun's built-in test runner with comprehensive coverage

## Getting Started

### Prerequisites
- Bun 1.3.1 or higher
- Node.js 22.x or higher (for compatibility)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ragaeeb/salat10-next.git
   cd salat10-next
   ```

2. **Install dependencies**
   ```bash
   bun install
   ```

3. **Set up environment variables** (optional)
   
   For geocoding functionality, create a `.env.local` file:
   ```bash
   GEOCODE_API_KEY=your_geocode_maps_co_api_key
   ```
   
   Without this key, users can still manually enter coordinates or use browser geolocation.

4. **Run the development server**
   ```bash
   bun run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to explore the app.

5. **Build for production**
   ```bash
   bun run build
   bun run start
   ```

## Testing

The project includes comprehensive unit tests covering:
- Prayer time calculations and active event detection
- Hijri calendar conversion algorithms
- Quote filtering logic with complex time-based rules
- Day boundary handling and timezone edge cases

Run tests:
```bash
bun test                    # Run all tests
bun test src/lib/calculator.test.ts  # Run specific test file
bun test --coverage         # Generate coverage report
```

## Linting & Formatting

Biome handles both linting and formatting with a single tool:

```bash
bun run lint                # Check for issues
bun run lint --write        # Auto-fix issues
```

## Project Structure

```
src/
├── app/                          # Next.js App Router pages
│   ├── api/geocode/             # Geocoding API endpoint
│   ├── graph/                   # Prayer time visualization
│   ├── settings/                # Location and calculation settings
│   ├── timetable/               # Monthly/yearly prayer schedules
│   ├── v2/                      # Parallax scrolling view
│   ├── layout.tsx               # Root layout with global styles
│   └── page.tsx                 # Main card view (home page)
│
├── components/                   # Reusable UI components
│   ├── magicui/                 # Animated components (aurora, meteors, etc.)
│   ├── prayer/                  # Prayer-specific components
│   ├── timetable/               # Table components
│   ├── ui/                      # Base UI primitives (shadcn/ui)
│   ├── moon.tsx                 # Moon rendering component
│   ├── sun.tsx                  # Sun rendering component
│   ├── sky.tsx                  # Sky background with gradients
│   └── stars.tsx                # Animated star field
│
├── hooks/                        # Custom React hooks
│   ├── use-days.ts              # Multi-day buffer management
│   ├── use-moon.ts              # Moon position calculations
│   ├── use-motivational-quote.ts # Quote loading and filtering
│   ├── use-prayer-chart.ts      # Chart data preparation
│   ├── use-scroll-tracking.ts   # Parallax scroll logic
│   ├── use-sky.ts               # Sky color transitions
│   └── use-sun.ts               # Sun position and color
│
├── lib/                          # Core business logic
│   ├── calculator.ts            # Prayer time calculations (daily/monthly/yearly)
│   ├── calculator.test.ts       # Calculator tests
│   ├── constants.ts             # App-wide constants
│   ├── formatting.ts            # Date/time formatting utilities
│   ├── hijri.ts                 # Hijri calendar conversion
│   ├── hijri.test.ts            # Hijri conversion tests
│   ├── prayer-utils.ts          # Prayer-related helper functions
│   ├── quotes.ts                # Quote filtering logic
│   ├── quotes.test.ts           # Quote filtering tests
│   ├── salat-labels.ts          # Prayer name translations
│   ├── settings.ts              # Calculation method presets
│   ├── time.ts                  # Time manipulation utilities
│   ├── timeline.ts              # Normalized timeline for parallax
│   └── utils.ts                 # General utilities
│
├── store/                        # State management
│   └── usePrayerStore.ts        # Zustand store with persistence
│
├── types/                        # TypeScript type definitions
│   ├── graph.ts                 # Chart-related types
│   ├── hijri.ts                 # Hijri date types
│   ├── quote.ts                 # Quote structure types
│   ├── settings.ts              # Settings types
│   └── timeline.ts              # Timeline types
│
└── globals.css                   # Global styles and Tailwind imports
```

### Key Files

- **`src/lib/calculator.ts`**: Core prayer time calculations using the Adhan library
- **`src/lib/hijri.ts`**: Kuwaiti algorithm for Islamic calendar conversion
- **`src/lib/quotes.ts`**: Complex filtering logic for contextual quotes
- **`src/store/usePrayerStore.ts`**: Centralized state with automatic recomputation
- **`src/app/v2/page.tsx`**: Parallax scrolling experience with sky animations
- **`public/quotes.json`**: Curated collection of Islamic narrations and quotes

## API Routes

### `/api/geocode`
Converts an address or city name to coordinates using the geocode.maps.co API.

**Query Parameters:**
- `address` (required): City name or address

**Response:**
```json
{
  "latitude": 43.6532,
  "longitude": -79.3832,
  "label": "Toronto, Ontario, Canada"
}
```

## Configuration

### Calculation Methods
Salat10 supports these preset calculation methods:
- Muslim World League (default)
- Islamic Society of North America (ISNA)
- Egyptian General Authority of Survey
- Umm al-Qura University, Makkah
- University of Islamic Sciences, Karachi
- Institute of Geophysics, University of Tehran
- Shia Ithna-Ashari (Jafari)
- Gulf Region
- Kuwait
- Qatar
- Singapore
- North America
- Custom (manual angle configuration)

### Local Storage
Settings are persisted in `localStorage` under the key from `package.json`. The store includes:
- Coordinates (latitude/longitude)
- Timezone (IANA format)
- Calculation method and angles
- Address label

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Write tests for your changes
4. Ensure tests pass: `bun test`
5. Commit with descriptive messages: `git commit -m "feat: add amazing feature"`
6. Push the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

### Code Style
- Use Biome for formatting and linting
- Write tests for new functionality
- Follow existing patterns for hooks and components
- Use TypeScript strict mode
- Document complex algorithms

## License

Licensed under the [MIT License](./LICENSE.MD).

## Acknowledgments

- [Adhan](https://github.com/batoulapps/adhan-js) for accurate prayer time calculations
- [geocode.maps.co](https://geocode.maps.co/) for address geocoding
- Islamic scholars for the Kuwaiti algorithm implementation
- The Muslim community for feedback and quotes
