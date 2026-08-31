import { type MotionValue, motion, useMotionTemplate, useMotionValue, useTransform } from 'motion/react';
import { memo, useId } from 'react';

type SunProps = {
    x: number | MotionValue<number>;
    y: number | MotionValue<number>;
    opacity: number | MotionValue<number>;
    color: { r: MotionValue<number>; g: MotionValue<number>; b: MotionValue<number> };

    /** Dynamic ray rotation angle in degrees */
    rayRotation?: MotionValue<number> | number;
    /** Dynamic ray scale based on daylight progression */
    rayScale?: MotionValue<number> | number;
    /** Progressive sunrise-to-sunset glow factor (1 at sunrise down to 0 at sunset) */
    glowIntensity?: MotionValue<number> | number;
    /** Midday intensity factor (for backward compatibility) */
    middayIntensity?: MotionValue<number> | number;

    /** Optional sizing */
    size?: number; // sets both width & height
    width?: number; // overrides size for width
    height?: number; // overrides size for height
    className?: string; // optional extra classes
};

/**
 * Photorealistic animated sun component with physical atmospheric scattering,
 * optical diffraction glare, and dynamic time-of-day lighting.
 *
 * Features:
 * - Sunrise-to-sunset progressive glow adaptation (maximum rays/glow at sunrise, tapering to 0 at sunset)
 * - Delicate, ultra-thin diffraction spikes (anamorphic star glare) that rotate smoothly
 * - Atmospheric Rayleigh scattering haze that fades as the day progresses
 * - Horizon color transitions (warm crimson/amber at dawn/dusk to golden at noon)
 * - Brilliant white-hot solar core with high-dynamic-range bloom
 * - Large 400x400 coordinate canvas preventing any edge-clipping
 *
 * @param props - Sun configuration and animation MotionValues
 */
export const Sun = memo<SunProps>(
    ({
        x,
        y,
        opacity,
        color,
        rayRotation = 0,
        rayScale = 1,
        glowIntensity,
        middayIntensity = 0.5,
        size = 260,
        width,
        height,
        className,
    }) => {
        const leftPct = useTransform(x as MotionValue<number>, (v) => `${v}%`);
        const topPct = useTransform(y as MotionValue<number>, (v) => `${v}%`);
        const fill = useMotionTemplate`rgb(${color.r}, ${color.g}, ${color.b})`;

        const uid = useId();
        const glowFilterId = `sunGlow-${uid}`;
        const deepBlurFilterId = `sunDeepBlur-${uid}`;
        const streakGlowFilterId = `sunStreakGlow-${uid}`;

        const outerAuraId = `sunOuterAura-${uid}`;
        const midCoronaId = `sunMidCorona-${uid}`;
        const innerBloomId = `sunInnerBloom-${uid}`;
        const coreGradId = `sunCoreGrad-${uid}`;
        const flareStreakGradId = `sunFlareStreak-${uid}`;
        const diagStreakGradId = `sunDiagStreak-${uid}`;

        const w = width ?? size;
        const h = height ?? size;

        // Fallbacks for number vs MotionValue props
        const defaultRotationMv = useMotionValue(typeof rayRotation === 'number' ? rayRotation : 0);
        const activeRayRotation = typeof rayRotation === 'number' ? defaultRotationMv : rayRotation;

        const defaultScaleMv = useMotionValue(typeof rayScale === 'number' ? rayScale : 1);
        const activeRayScale = typeof rayScale === 'number' ? defaultScaleMv : rayScale;

        // Glow factor: default to glowIntensity if provided, else fallback to middayIntensity
        const effectiveGlow = glowIntensity ?? middayIntensity;
        const defaultGlowMv = useMotionValue(typeof effectiveGlow === 'number' ? effectiveGlow : 0.5);
        const activeGlow = typeof effectiveGlow === 'number' ? defaultGlowMv : effectiveGlow;

        // Sunrise (1.0) -> Dhuhr (~0.5) -> Sunset (0.0): outer glow and rays progressively fade to zero
        const atmosphericAuraOpacity = useTransform(activeGlow, (g) => 0.65 * g);
        const midCoronaOpacity = useTransform(activeGlow, (g) => 0.7 * g);
        const innerBloomOpacity = useTransform(activeGlow, (g) => 0.2 + 0.65 * g);
        const flareOpacity = useTransform(activeGlow, (g) => 0.85 * g);

        // Perfectly centered SVG transform strings
        const glareTransform = useMotionTemplate`translate(200, 200) rotate(${activeRayRotation}) scale(${activeRayScale}) translate(-200, -200)`;

        return (
            <motion.svg
                className={`pointer-events-none absolute z-30 ${className ?? ''}`}
                width={w}
                height={h}
                viewBox="0 0 400 400"
                preserveAspectRatio="xMidYMid meet"
                style={{
                    color: fill,
                    left: leftPct,
                    mixBlendMode: 'screen',
                    opacity,
                    top: topPct,
                    transform: 'translate(-50%, -50%) translate3d(0,0,0)',
                    willChange: 'transform, opacity',
                }}
                aria-hidden
                focusable="false"
            >
                <title>Sun</title>
                <defs>
                    {/* Atmospheric bloom filter */}
                    <filter id={glowFilterId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="10" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Deep volumetric haze blur */}
                    <filter id={deepBlurFilterId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="24" />
                    </filter>

                    {/* Streak soft bloom */}
                    <filter id={streakGlowFilterId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="3" />
                    </filter>

                    {/* 1. Outermost Atmospheric Scattering Aura */}
                    <radialGradient id={outerAuraId} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0.45" />
                        <stop offset="35%" stopColor="currentColor" stopOpacity="0.2" />
                        <stop offset="65%" stopColor="currentColor" stopOpacity="0.06" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </radialGradient>

                    {/* 2. Mid Corona Gradient */}
                    <radialGradient id={midCoronaId} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                        <stop offset="25%" stopColor="currentColor" stopOpacity="0.8" />
                        <stop offset="55%" stopColor="currentColor" stopOpacity="0.35" />
                        <stop offset="85%" stopColor="currentColor" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </radialGradient>

                    {/* 3. Inner Solar Bloom */}
                    <radialGradient id={innerBloomId} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                        <stop offset="45%" stopColor="#ffffff" stopOpacity="0.9" />
                        <stop offset="70%" stopColor="currentColor" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </radialGradient>

                    {/* 4. Solar Core Gradient */}
                    <radialGradient id={coreGradId} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                        <stop offset="60%" stopColor="#ffffff" stopOpacity="0.98" />
                        <stop offset="85%" stopColor="currentColor" stopOpacity="0.85" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0.4" />
                    </radialGradient>

                    {/* Primary horizontal / vertical optical flare streak */}
                    <linearGradient id={flareStreakGradId} x1="0%" y1="50%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                        <stop offset="30%" stopColor="currentColor" stopOpacity="0.1" />
                        <stop offset="47%" stopColor="#ffffff" stopOpacity="0.75" />
                        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
                        <stop offset="53%" stopColor="#ffffff" stopOpacity="0.75" />
                        <stop offset="70%" stopColor="currentColor" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>

                    {/* Diagonal secondary optical flare streak */}
                    <linearGradient id={diagStreakGradId} x1="0%" y1="50%" x2="100%" y2="50%">
                        <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                        <stop offset="38%" stopColor="currentColor" stopOpacity="0.08" />
                        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.6" />
                        <stop offset="62%" stopColor="currentColor" stopOpacity="0.08" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {/* 1. Deep Atmospheric Scattering Wash (fades out progressively to sunset) */}
                <motion.circle
                    cx="200"
                    cy="200"
                    r="185"
                    fill={`url(#${outerAuraId})`}
                    filter={`url(#${deepBlurFilterId})`}
                    style={{ opacity: atmosphericAuraOpacity }}
                />

                {/* 2. Soft Mid Atmospheric Corona (fades out progressively to sunset) */}
                <motion.circle
                    cx="200"
                    cy="200"
                    r="115"
                    fill={`url(#${midCoronaId})`}
                    filter={`url(#${glowFilterId})`}
                    style={{ opacity: midCoronaOpacity }}
                />

                {/* 3. Subtle Optical Diffraction Star Glare (disappears completely by sunset) */}
                <motion.g transform={glareTransform} style={{ opacity: flareOpacity }}>
                    {/* Primary Horizontal & Vertical Diffraction Needle Spikes */}
                    <polygon
                        points="20,200 190,198.5 380,200 190,201.5"
                        fill={`url(#${flareStreakGradId})`}
                        filter={`url(#${streakGlowFilterId})`}
                    />
                    <polygon
                        points="200,20 198.5,190 200,380 201.5,190"
                        fill={`url(#${flareStreakGradId})`}
                        filter={`url(#${streakGlowFilterId})`}
                    />

                    {/* Diagonal Secondary Diffraction Needles */}
                    <g transform="rotate(45, 200, 200)">
                        <polygon
                            points="50,200 190,199 350,200 190,201"
                            fill={`url(#${diagStreakGradId})`}
                            filter={`url(#${streakGlowFilterId})`}
                            opacity={0.65}
                        />
                        <polygon
                            points="200,50 199,190 200,350 201,190"
                            fill={`url(#${diagStreakGradId})`}
                            filter={`url(#${streakGlowFilterId})`}
                            opacity={0.65}
                        />
                    </g>
                </motion.g>

                {/* 4. Inner Luminous Solar Bloom */}
                <motion.circle
                    cx="200"
                    cy="200"
                    r="56"
                    fill={`url(#${innerBloomId})`}
                    filter={`url(#${glowFilterId})`}
                    style={{ opacity: innerBloomOpacity }}
                />

                {/* 5. Radiant Solar Disk */}
                <circle cx="200" cy="200" r="34" fill={`url(#${coreGradId})`} filter={`url(#${glowFilterId})`} />
                <circle cx="200" cy="200" r="28" fill={`url(#${coreGradId})`} />

                {/* 6. Pure White-Hot Photosphere Core */}
                <circle cx="200" cy="200" r="18" fill="#ffffff" opacity="0.95" filter={`url(#${glowFilterId})`} />
                <circle cx="200" cy="200" r="13" fill="#ffffff" opacity="1" />
            </motion.svg>
        );
    },
);

Sun.displayName = 'Sun';
