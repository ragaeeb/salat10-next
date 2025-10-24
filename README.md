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

- **Interactive explanations** – A multi-step loader pauses on each astronomical and fiqh concept with optional deep-dive math trail, imagery, and achievements when a prayer time is derived.
- **Customisable calculations** – Configure latitude/longitude, method presets, or custom twilight angles with automatic detection and live JSON previews.
- **Hijri calendar insights** – Gregorian dates are mapped to Hijri with contextual narration so learners can trace the lunar calendar math.
- **Rich visuals** – Royal-blue theme, animated meteors, aurora-highlighted active prayers, motivational quotes with fade-in text, and world map storytelling.
- **Offline-friendly settings** – Location, angles, and timezone are persisted in local storage and can be restored at any time.

## Tech Stack

- [Next.js 16](https://nextjs.org/) with the App Router
- [React 19](https://react.dev/)
- [Bun](https://bun.sh/) for runtime, package management, and testing
- [Tailwind CSS](https://tailwindcss.com/) utilities with custom design tokens
- [Adhan](https://github.com/batoulapps/adhan-js) for the core prayer time calculations
- [Biome](https://biomejs.dev/) for linting and formatting

## Getting Started

1. **Install dependencies**

   ```bash
   bun install
   ```

2. **Run the development server**

   ```bash
   bun run dev
   ```

   Visit [http://localhost:3000](http://localhost:3000) to explore the app.

3. **Build for production**

   ```bash
   bun run build
   ```

## Testing

Unit tests are implemented with `bun:test` and live next to the modules they cover (for example `src/lib/calculator.test.ts`).

```bash
bun test
```

## Linting & Formatting

Biome manages both linting and formatting rules. Run the checker with:

```bash
bun run lint
```

## Project Structure

```
src/
├── app/                # Next.js routes (main explorer + settings)
├── components/         # Shared UI primitives and prayer-time specific components
├── hooks/              # Client-side hooks for settings, quotes, and explanations
├── lib/                # Calculation utilities, explanation builders, and helpers
└── components/ui/      # ShadCN & Magic UI based primitives
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing`
3. Commit with descriptive messages
4. Push the branch and open a Pull Request

## License

Licensed under the [MIT License](./LICENSE.MD).
