# Salat10 - Islamic Prayer Times

Beautiful, accurate Islamic prayer times with visual astronomy and Hijri calendar integration.

[![wakatime](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/c086c613-a649-484a-be35-fccd9c27d714.svg)](https://wakatime.com/badge/user/a0b906ce-b8e7-4463-8bce-383238df6d4b/project/c086c613-a649-484a-be35-fccd9c27d714)
[![codecov](https://codecov.io/gh/ragaeeb/salat10-next/graph/badge.svg?token=4F7LER2188)](https://codecov.io/gh/ragaeeb/salat10-next)
[![Vercel Deploy](https://deploy-badge.vercel.app/vercel/salaten)](https://salaten.vercel.app)
[![typescript](https://badgen.net/badge/icon/typescript?icon=typescript&label&color=blue)](https://www.typescriptlang.org)
[![Node.js CI](https://github.com/ragaeeb/salat10-next/actions/workflows/build.yml/badge.svg)](https://github.com/ragaeeb/salat10-next/actions/workflows/build.yml)
![Bun](https://img.shields.io/badge/Bun-%23000000.svg?style=for-the-badge&logo=bun&logoColor=white)
![GitHub License](https://img.shields.io/github/license/ragaeeb/salat10-next)
[![Next.js 16](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6)](https://www.typescriptlang.org/)

## ✨ Features

### 📿 Prayer Times
- **Accurate calculations** using the [Adhan library](https://github.com/batoulapps/adhan-js)
- **Multiple calculation methods**: Muslim World League, ISNA, Umm al-Qura, and more
- **Auto-updates** at each prayer time transition
- **Customizable** Fajr/Isha angles and calculation parameters

### 🎨 Viewing Modes

#### Card View (Home)
- Clean, modern prayer time cards
- Live countdown to next prayer
- Active prayer highlighting with aurora effect
- Navigate between days with intuitive controls

#### Parallax View
- Immersive scrollable experience
- Animated sun and moon following prayer times
- Dynamic sky colors (night → dawn → day → sunset)
- Stars and meteors during night hours
- Smooth parallax scrolling

#### Timetable View
- Monthly and yearly prayer schedules
- Printable table format
- CSV export capability
- Comparative analysis across months

#### Graph View
- Interactive time-series charts
- Visualize prayer time patterns
- Compare different months
- Powered by uPlot for performance

### 🧭 Qibla Finder
- **AR compass** with camera overlay
- Real-time direction to Kaaba
- Smooth heading stabilization
- Visual alignment indicator
- iOS and Android support
- **Requires HTTPS** for camera/sensor access

### 📅 Hijri Calendar
- Accurate Gregorian to Hijri conversion
- Kuwaiti algorithm implementation
- Arabic transliterated month names
- Day-of-month names in Arabic

### 💬 Motivational Quotes
- Contextual Islamic quotes and hadiths
- Filtered by current prayer, time, Hijri date, weekday
- One-tap copy with citation
- Curated collection of authentic sources

### 🌍 Location & Settings
- Browser geolocation support
- Manual coordinate entry
- Address search (with API key)
- Timezone configuration
- Persistent settings in localStorage

## 🚀 Quick Start

### Prerequisites
- [Bun](https://bun.sh/) >= 1.3.1
- Node.js >= 22.x (for compatibility)

### Installation

```bash
# Clone the repository
git clone https://github.com/ragaeeb/salat10-next.git
cd salat10-next

# Install dependencies
bun install

# Run development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build

```bash
bun run build
bun run start
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file:

```bash
# Optional: For address geocoding
GEOCODE_API_KEY=your_geocode_maps_co_api_key
```

### Calculation Methods

The app supports multiple calculation methods:
- **Muslim World League**: Fajr 18°, Isha 17°
- **North America (ISNA)**: Fajr 15°, Isha 15°
- **Egyptian**: Fajr 19.5°, Isha 17.5°
- **Umm al-Qura**: Fajr 18.5°, Isha 90 min
- **Karachi**: Fajr 18°, Isha 18°
- **Tehran**: Fajr 17.7°, Isha 14°
- **Jafari**: Fajr 16°, Isha 14°
- **Moonsighting Committee**: Fajr 18°, Isha 18°
- **Dubai**: Fajr 18.2°, Isha 18.2°
- **Kuwait**: Fajr 18°, Isha 17.5°
- **Qatar**: Fajr 18°, Isha 90 min
- **Singapore**: Fajr 20°, Isha 18°
- **Other**: Custom angles

## 📱 Mobile Support

### iOS
- Camera access requires HTTPS (except localhost)
- Motion sensors require user permission (iOS 13+)
- Safari: Settings → Safari → Motion & Orientation Access

### Android
- Camera access requires HTTPS
- Compass uses `deviceorientationabsolute` event
- Works in Chrome, Firefox, Edge

### Brave Browser
- Stricter privacy defaults
- Settings → Site Permissions → Camera/Motion
- Recommended: Use Safari or Chrome for Qibla finder

## 🧪 Testing

```bash
# Run all tests
bun test

# Watch mode
bun test --watch

# Coverage report
bun test --coverage

# Specific file
bun test src/lib/calculator.test.ts
```

## 📐 Architecture

### Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Runtime**: React 19 with Server Components
- **Package Manager**: Bun
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS 4
- **State**: Zustand with persistence
- **Animation**: Framer Motion
- **Prayer Calculations**: Adhan 4.4.3
- **Charts**: uPlot
- **UI Components**: shadcn/ui + custom

### Key Directories
```text
src/
├── app/              # Next.js pages & routes
│   ├── page.tsx      # Home (card view)
│   ├── v2/           # Parallax view
│   ├── qibla/        # AR Qibla finder
│   ├── settings/     # Location & method config
│   ├── timetable/    # Monthly/yearly tables
│   └── graph/        # Time-series charts
├── components/       # React components
│   ├── ui/           # shadcn/ui primitives
│   ├── prayer/       # Prayer-specific UI
│   ├── qibla/        # Qibla finder UI
│   └── magicui/      # Animated effects
├── config/           # App configuration
│   └── seo.ts        # SEO metadata
├── hooks/            # Custom React hooks
├── lib/              # Business logic
│   ├── calculator.ts # Prayer time calculations
│   ├── qibla.ts      # Qibla direction & compass
│   ├── hijri.ts      # Hijri calendar
│   ├── quotes.ts     # Quote filtering
│   ├── store-utils.ts# Store utilities (testable)
│   └── *.test.ts     # Unit tests
├── store/            # Zustand state management
├── types/            # TypeScript definitions
└── data/             # Static data (quotes, etc.)
```

### Design Patterns
- **Server/Client Separation**: Pages use server components, logic in client components
- **Dynamic Imports**: Browser APIs loaded with `ssr: false`
- **Testable Logic**: Store utilities extracted as pure functions
- **Type Safety**: Strict TypeScript throughout
- **Composition**: Small, focused components
- **Hooks**: Custom hooks for reusable logic
- **Persistence**: Zustand with localStorage sync

## 🎯 SEO

The app includes comprehensive SEO:
- OpenGraph tags for social sharing
- Twitter card metadata
- Canonical URLs
- Structured data ready
- Responsive meta tags
- Sitemap and robots.txt
- Performance optimized

All SEO configuration centralized in `src/config/seo.ts`.

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Run `bun run lint` and `bun test`
5. Submit a pull request

See [AGENTS.MD](./AGENTS.MD) for detailed development guide.

## 📄 License

MIT © [Ragaeeb Haq](https://github.com/ragaeeb)

## 🙏 Acknowledgments

- [Adhan library](https://github.com/batoulapps/adhan-js) for accurate prayer calculations
- [shadcn/ui](https://ui.shadcn.com/) for beautiful components
- Islamic scholars and sources for authentic quotes

## 🔗 Links

- [Live Demo](https://salat10.app)
- [Report Issues](https://github.com/ragaeeb/salat10-next/issues)
- [Documentation](https://github.com/ragaeeb/salat10-next/blob/main/AGENTS.MD)

---

## Built with ❤️ for the Muslim community