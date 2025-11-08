import { memo } from 'react';

/**
 * Radial gradient overlay component
 *
 * Adds a subtle blue radial enhancement at the top center of the sky.
 * Creates atmospheric depth by simulating light scattering in the upper atmosphere.
 * Always visible at fixed opacity as a background enhancement layer.
 *
 * @example
 * ```tsx
 * return (
 *   <>
 *     <SkyBackground />
 *     <RadialGradientOverlay />
 *   </>
 * );
 * ```
 */
export const RadialGradientOverlay = memo(() => (
    <div className="absolute inset-0 z-10 bg-[radial-gradient(circle_at_top,_rgba(135,206,235,0.4),_transparent_65%)]" />
));

RadialGradientOverlay.displayName = 'RadialGradientOverlay';
