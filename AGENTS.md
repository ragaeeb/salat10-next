# Agent Guide

Welcome! This repository powers the Salat10 Next prayer-time explorer. Please follow these house rules when making changes:

## Tooling & Commands

- Use **Bun** for everything: `bun install`, `bun run dev`, `bun run build`, `bun test`, and `bun run lint`.
- Biome replaced ESLint/Prettier. Format and lint with `bun run lint` only; do **not** add Prettier configs back.
- Unit tests live next to the modules they cover (e.g. `src/lib/calculator.test.ts`) and run via `bun test`. Add tests whenever you touch calculation logic.
- Avoid `ls -R`/`grep -R`; prefer `rg` as the codebase is sizeable.

## Code Style

- All client components belong under `src/components` and should remain composable. Shared UI primitives live in `src/components/ui/`.
- Hooks should live in `src/hooks/` and be prefixed with `use`. Keep side effects contained and document public hooks with JSDoc.
- Utility functions belong in `src/lib/`. Files under `src/lib/explanation/` mirror the Adhan math—preserve their structure and add comments/tests when changing formulas.
- The project uses TypeScript strict mode. Provide explicit types when returning objects from helpers.
- Maintain the royal blue/white theme—refer to existing gradient classes when adding new surfaces.

## Key Workflows

- The main prayer timeline is implemented in `src/app/page.tsx` and composed from `src/components/prayer/`. Keep that page lean by extracting new UI into dedicated components.
- Settings state and presets are handled in `src/lib/settings.ts`. Use helper functions (e.g., `createParameters`) instead of instantiating `CalculationParameters` manually.
- Explanations are built via `src/lib/explanation/`. If you expand narration, update corresponding tests and math trail helpers.

## Testing Expectations

- Modify calculations? Update or add the co-located `bun:test` suites alongside the affected modules.
- UI-only changes still require `bun run lint` and `bun test` to pass.
- When touching time-sensitive logic, assert against deterministic dates to avoid timezone flakiness.

## Miscellaneous

- Remote imagery must be added to `next.config.ts` `images.remotePatterns` before use.
- Settings persist in `localStorage`; ensure new keys use the existing `STORAGE_KEY` namespace.
- The footer pulls metadata from `package.json`. Keep `homepage`, `author`, and `version` accurate.

Happy shipping!
