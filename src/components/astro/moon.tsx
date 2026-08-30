import { type MotionValue, motion, useMotionTemplate, useMotionValue, useTransform } from 'motion/react';
import { memo, useId } from 'react';

type MoonColor =
    | { r: number | MotionValue<number>; g: number | MotionValue<number>; b: number | MotionValue<number> }
    | undefined;

type MoonProps = {
    x: number | MotionValue<number>;
    y: number | MotionValue<number>;
    opacity: number | MotionValue<number>;
    /** Optional color; defaults to pure white if omitted */
    color?: MoonColor;

    /** Lunar cycle: 0 = new, 0.25 = first quarter, 0.5 = full */
    lunarCycle?: number;

    /** Size overrides */
    size?: number;
    width?: number;
    height?: number;
    className?: string;

    /** 3D spin controls (numbers or MotionValues). Default 0. */
    rotateX?: number | MotionValue<number>;
    rotateY?: number | MotionValue<number>; // ← great for a globe-like spin along horizontal travel
    rotateZ?: number | MotionValue<number>;
    /** Perspective for 3D rotation. Default 700. */
    perspective?: number;
};

/**
 * Animated moon component with phase control and 3D rotation
 *
 * Renders a realistic moon with:
 * - Crater details and surface texture
 * - Dynamic phase (full moon to crescent)
 * - Color control (defaults to white)
 * - Glow and halo effects
 * - Optional 3D rotation for globe-like spin
 * - Hardware-accelerated rendering with mix-blend-mode: screen
 *
 * Position and opacity are controlled via MotionValues for smooth timeline animation.
 * Phase is animated by overlaying a second circle that masks the moon body.
 *
 * @param {MoonProps} props - Component props
 * @param {number | MotionValue<number>} props.x - Horizontal position (percentage, 0-100)
 * @param {number | MotionValue<number>} props.y - Vertical position (percentage, 0-100)
 * @param {number | MotionValue<number>} props.opacity - Opacity (0-1)
 * @param {MoonColor} [props.color] - RGB color channels, defaults to white (255, 255, 255)
 * @param {number} [props.lunarCycle=0.5] - Lunar cycle fraction (0=new, 0.5=full)
 * @param {number} [props.size=80] - Size in pixels (width and height)
 * @param {number} [props.width] - Width override
 * @param {number} [props.height] - Height override
 * @param {string} [props.className] - Additional CSS classes
 * @param {number | MotionValue<number>} [props.rotateX=0] - 3D rotation around X axis (degrees)
 * @param {number | MotionValue<number>} [props.rotateY=0] - 3D rotation around Y axis (degrees)
 * @param {number | MotionValue<number>} [props.rotateZ=0] - 3D rotation around Z axis (degrees)
 * @param {number} [props.perspective=700] - 3D perspective depth in pixels
 *
 * @example
 * ```tsx
 * const { moonX, moonY, moonOpacity } = useMoon(scrollProgress, timeline);
 *
 * return (
 *   <Moon
 *     x={moonX}
 *     y={moonY}
 *     opacity={moonOpacity}
 *     lunarCycle={0.5} // full moon
 *     rotateY={spinValue}
 *   />
 * );
 * ```
 */
/**
 * Build the illuminated lunar-disc path for a normalized synodic cycle.
 */
export function getMoonPhasePath(lunarCycle: number): string {
    const cycle = ((lunarCycle % 1) + 1) % 1;
    const radius = Number((Math.abs(Math.cos(2 * Math.PI * cycle)) * 28).toFixed(3));
    const waxing = cycle < 0.5;
    const outerSweep = waxing ? 1 : 0;
    const terminatorSweep = waxing ? (cycle < 0.25 ? 0 : 1) : cycle < 0.75 ? 0 : 1;

    return `M 40 12 A 28 28 0 0 ${outerSweep} 40 68 A ${radius} 28 0 0 ${terminatorSweep} 40 12 Z`;
}

export const Moon = memo<MoonProps>(
    ({
        x,
        y,
        opacity,
        color,
        lunarCycle = 0.5,
        size = 80,
        width,
        height,
        className,
        rotateX = 0,
        rotateY = 0,
        rotateZ = 0,
        perspective = 700,
    }) => {
        const leftPct = useTransform(x as MotionValue<number>, (v) => `${v}%`);
        const topPct = useTransform(y as MotionValue<number>, (v) => `${v}%`);

        // fallback color channels if not passed as MotionValues
        const defaultChannel = useMotionValue(255);
        const rVal = color?.r ?? defaultChannel;
        const gVal = color?.g ?? defaultChannel;
        const bVal = color?.b ?? defaultChannel;

        const fill = useMotionTemplate`rgb(${rVal}, ${gVal}, ${bVal})`;

        const uid = useId();
        const glowId = `moonGlow-${uid}`;
        const haloId = `moonHalo-${uid}`;
        const maskId = `moonMask-${uid}`;

        const w = width ?? size;
        const h = height ?? size;

        const phasePath = getMoonPhasePath(lunarCycle);

        return (
            <motion.svg
                className={`pointer-events-none absolute z-30 ${className ?? ''}`}
                width={w}
                height={h}
                viewBox="0 0 80 80"
                preserveAspectRatio="xMidYMid meet"
                style={{
                    color: fill,
                    left: leftPct,
                    mixBlendMode: 'screen',
                    opacity,
                    perspective,
                    rotateX,
                    rotateY,
                    rotateZ,
                    top: topPct,
                    transform: 'translate(-50%, -50%) translate3d(0,0,0)',
                    transformStyle: 'preserve-3d',
                    willChange: 'transform, opacity',
                }}
                aria-hidden
                focusable="false"
            >
                <title>Moon</title>
                <defs>
                    {/* Soft atmospheric blur */}
                    <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    {/* Faint radial halo for night scattering */}
                    <radialGradient id={haloId} cx="50%" cy="50%" r="50%">
                        <stop offset="60%" stopColor="currentColor" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </radialGradient>

                    {/* Lunar phase mask: white shows, black hides */}
                    <mask id={maskId}>
                        <rect width="80" height="80" fill="black" />
                        <path d={phasePath} fill="white" />
                    </mask>
                </defs>

                <g mask={`url(#${maskId})`}>
                    <circle cx="40" cy="40" r="34" fill={`url(#${haloId})`} />
                    <circle cx="40" cy="40" r="24" fill="currentColor" opacity={0.6} filter={`url(#${glowId})`} />
                    <circle cx="40" cy="40" r="28" fill="currentColor" />
                    <g opacity={0.18} fill="#000">
                        <circle cx="33" cy="34" r="5" />
                        <circle cx="47" cy="30" r="3.5" />
                        <circle cx="42" cy="46" r="6" />
                        <circle cx="51" cy="44" r="2.5" />
                        <circle cx="30" cy="48" r="3" />
                        <circle cx="48" cy="52" r="2" />
                        <circle cx="27" cy="39" r="2" />
                        <path d="M 36,25 Q 42,22 45,27 Q 43,33 38,31 Z" />
                    </g>
                </g>
            </motion.svg>
        );
    },
);

Moon.displayName = 'Moon';
