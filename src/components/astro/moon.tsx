import {
    isMotionValue,
    type MotionValue,
    motion,
    useMotionTemplate,
    useMotionValue,
    useTransform,
} from 'framer-motion';
import { memo, useEffect, useId } from 'react';

type MoonColor =
    | { r: number | MotionValue<number>; g: number | MotionValue<number>; b: number | MotionValue<number> }
    | undefined;

type MoonProps = {
    x: number | MotionValue<number>;
    y: number | MotionValue<number>;
    opacity: number | MotionValue<number>;
    /** Optional color; defaults to pure white if omitted */
    color?: MoonColor;

    /** Phase: 1 = full … 0.25 = crescent; number or MotionValue. Default: 1 (full) */
    phase?: number | MotionValue<number>;

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
 * @param {number | MotionValue<number>} [props.phase=1] - Moon phase (1=full, 0.25=crescent)
 * @param {number} [props.size=80] - Size in pixels (width and height)
 * @param {number} [props.width] - Width override
 * @param {number} [props.height] - Height override
 * @param {string} [props.className] - Additional CSS classes
 * @param {number | MotionValue<number>} [props.rotateX=0] - 3D rotation around X axis (degrees)
 * @param {number | MotionValue<number>} [props.rotateY=0] - 3D rotation around Y axis (degrees)
 * @param {number | MotionValue<number>} [props.rotateZ=0] - 3D rotation around Z axis (degrees)
 * @param {number} [props.perspective=700] - 3D perspective distance
 *
 * @example
 * ```tsx
 * const { moonX, moonY, moonOpacity } = useMoon(scrollProgress, timeline);
 * return (
 *   <Moon
 *     x={moonX}
 *     y={moonY}
 *     opacity={moonOpacity}
 *     phase={0.75}
 *     rotateY={moonX} // spin as it travels
 *   />
 * );
 * ```
 */
export const Moon = memo<MoonProps>(function Moon({
    x,
    y,
    opacity,
    color, // optional
    phase = 1,
    size = 80,
    width,
    height,
    className,
    rotateX = 0,
    rotateY = 0,
    rotateZ = 0,
    perspective = 700,
}) {
    // --- position (percentages) ---
    const leftPct = useTransform(x as MotionValue<number>, (v) => `${v}%`);
    const topPct = useTransform(y as MotionValue<number>, (v) => `${v}%`);

    // --- color (defaults to white). We always build from internal MotionValues and "pipe" external ones if provided. ---
    const rMv = useMotionValue(255);
    const gMv = useMotionValue(255);
    const bMv = useMotionValue(255);

    useEffect(() => {
        // helper to pipe number/MotionValue into an internal MotionValue
        const wire = (src: number | MotionValue<number> | undefined, dest: MotionValue<number>, fallback: number) => {
            let unsub: (() => void) | undefined;
            if (src == null) {
                dest.set(fallback);
            } else if (typeof src === 'number') {
                dest.set(src);
            } else if (isMotionValue(src)) {
                dest.set(src.get());
                unsub = src.on('change', (v) => dest.set(v));
            }
            return () => unsub?.();
        };

        if (!color) {
            // default white
            rMv.set(255);
            gMv.set(255);
            bMv.set(255);
            return;
        }
        const cleanR = wire(color.r, rMv, 255);
        const cleanG = wire(color.g, gMv, 255);
        const cleanB = wire(color.b, bMv, 255);
        return () => {
            cleanR();
            cleanG();
            cleanB();
        };
    }, [color, rMv, gMv, bMv]);

    const fill = useMotionTemplate`rgb(${rMv}, ${gMv}, ${bMv})`;

    // --- phase ---
    const phaseMv = useMotionValue(1);
    useEffect(() => {
        let unsub: (() => void) | undefined;
        if (typeof phase === 'number') {
            phaseMv.set(Math.max(0, Math.min(1, phase)));
        } else if (isMotionValue(phase)) {
            phaseMv.set(phase.get());
            unsub = phase.on('change', (v) => phaseMv.set(Math.max(0, Math.min(1, v))));
        }
        return () => unsub?.();
    }, [phase, phaseMv]);

    // Cutout circle position/opacity to form the crescent as phase decreases
    const cutCx = useTransform(phaseMv, (v) => 40 + 28 * (1 - v)); // center→right shift
    const cutOpacity = useTransform(phaseMv, (v) => 1 - v);

    // --- sizing ---
    const w = width ?? size;
    const h = height ?? size;

    // --- unique IDs for defs ---
    const uid = useId();
    const glowId = `moonGlow-${uid}`;
    const haloId = `moonHalo-${uid}`;
    const craterId = `craterShade-${uid}`;
    const maskId = `moonPhase-${uid}`;

    return (
        // Wrapper handles 3D rotation + centering translate
        <motion.div
            className={`pointer-events-none absolute z-30 ${className ?? ''}`}
            style={{
                left: leftPct,
                opacity,
                rotateX,
                rotateY,
                rotateZ,
                top: topPct,
                transformOrigin: 'center center',
                transformPerspective: perspective,
                transformStyle: 'preserve-3d',
                // keep the element centered on (left%, top%)
                translateX: '-50%',
                translateY: '-50%',
            }}
            aria-hidden
        >
            <motion.svg
                width={w}
                height={h}
                viewBox="0 0 80 80"
                preserveAspectRatio="xMidYMid meet"
                // children read currentColor
                style={{ color: fill, mixBlendMode: 'screen', willChange: 'transform, opacity' }}
                focusable="false"
            >
                <title>Moon</title>
                <defs>
                    <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="8" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>

                    <radialGradient id={haloId} cx="50%" cy="50%" r="52%">
                        <stop offset="60%" stopColor="currentColor" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </radialGradient>

                    <radialGradient id={craterId} cx="50%" cy="45%" r="60%">
                        <stop offset="0%" stopColor="#000" stopOpacity="0.55" />
                        <stop offset="60%" stopColor="#000" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#000" stopOpacity="0" />
                    </radialGradient>

                    <mask id={maskId}>
                        <rect width="100%" height="100%" fill="black" />
                        <circle cx="40" cy="40" r="28" fill="white" />
                        {/* always present; fades at full */}
                        <motion.circle cx={cutCx} cy="40" r="28" fill="black" fillOpacity={cutOpacity} />
                    </mask>
                </defs>

                <g mask={`url(#${maskId})`}>
                    <motion.circle cx="40" cy="40" r="28" fill="currentColor" filter={`url(#${glowId})`} />
                    {/* craters */}
                    <g opacity="0.28">
                        <circle cx="28" cy="30" r="5" fill={`url(#${craterId})`} />
                        <circle cx="52" cy="34" r="6" fill={`url(#${craterId})`} />
                        <circle cx="38" cy="48" r="4" fill={`url(#${craterId})`} />
                        <circle cx="24" cy="46" r="3" fill={`url(#${craterId})`} />
                        <circle cx="50" cy="22" r="3.5" fill={`url(#${craterId})`} />
                    </g>
                    <g opacity="0.22">
                        <circle cx="26.5" cy="28.8" r="3.6" fill="#fff" />
                        <circle cx="50.5" cy="32.8" r="4.2" fill="#fff" />
                        <circle cx="37" cy="47" r="2.6" fill="#fff" />
                    </g>
                </g>
                <circle cx="40" cy="40" r="32" fill={`url(#${haloId})`} />
            </motion.svg>
        </motion.div>
    );
});

Moon.displayName = 'Moon';
