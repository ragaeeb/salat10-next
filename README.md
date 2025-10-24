# Salat10 Next

Salat10 Next is an educational prayer time explorer built with Next.js 16 and Bun. It walks visitors through the complete chain of astronomical calculations used to determine the five daily prayers, pairs the math with plain-language narration, and surfaces prophetic narrations and seasonal safeguards along the way.

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

Unit tests are implemented with `bun:test` and live under the `tests/` directory.

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
