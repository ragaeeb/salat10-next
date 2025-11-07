import { motion } from 'framer-motion';
import { useId } from 'react';

type OrbitDiagramProps = { width?: number; height?: number; className?: string };

export const OrbitDiagram = ({ width = 400, height = 300, className = '' }: OrbitDiagramProps) => {
    const uid = useId();
    const gradientId = `orbit-gradient-${uid}`;
    const glowId = `sun-glow-${uid}`;

    // Ellipse parameters (exaggerated for visibility)
    const cx = 200;
    const cy = 150;
    const rx = 150;
    const ry = 100;
    const focusOffset = 75; // distance from center to focus

    // Sun at one focus
    const sunX = cx - focusOffset;
    const sunY = cy;

    // Perihelion (closest) and Aphelion (farthest)
    const perihelionX = sunX - (rx - focusOffset);
    const aphelionX = sunX + (rx - focusOffset);

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 400 300"
            className={`${className}`}
            style={{ background: '#0a0a1a' }}
        >
            <title>Orbit Diagram</title>
            <defs>
                <radialGradient id={gradientId}>
                    <stop offset="0%" stopColor="#ffd700" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#ff8c00" stopOpacity="0.3" />
                </radialGradient>
                <filter id={glowId}>
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            {/* Orbital path */}
            <ellipse
                cx={cx}
                cy={cy}
                rx={rx}
                ry={ry}
                fill="none"
                stroke="#4a5568"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.6"
            />

            {/* Center of ellipse (not where sun is!) */}
            <circle cx={cx} cy={cy} r="3" fill="#718096" opacity="0.5" />
            <text x={cx} y={cy - 10} fontSize="10" fill="#a0aec0" textAnchor="middle">
                Center
            </text>

            {/* Sun at focus */}
            <g filter={`url(#${glowId})`}>
                <circle cx={sunX} cy={sunY} r="20" fill={`url(#${gradientId})`} />
            </g>
            <text x={sunX} y={sunY + 35} fontSize="12" fill="#ffd700" textAnchor="middle" fontWeight="bold">
                Sun
            </text>

            {/* Perihelion point */}
            <motion.circle
                cx={perihelionX}
                cy={cy}
                r="8"
                fill="#60a5fa"
                initial={{ scale: 0 }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            />
            <text x={perihelionX} y={cy - 15} fontSize="11" fill="#60a5fa" textAnchor="middle">
                Perihelion
            </text>
            <text x={perihelionX} y={cy + 25} fontSize="9" fill="#93c5fd" textAnchor="middle">
                (closest)
            </text>

            {/* Aphelion point */}
            <circle cx={aphelionX} cy={cy} r="8" fill="#f87171" />
            <text x={aphelionX} y={cy - 15} fontSize="11" fill="#f87171" textAnchor="middle">
                Aphelion
            </text>
            <text x={aphelionX} y={cy + 25} fontSize="9" fill="#fca5a5" textAnchor="middle">
                (farthest)
            </text>

            {/* Distance lines */}
            <line x1={sunX} y1={sunY} x2={perihelionX} y2={cy} stroke="#60a5fa" strokeWidth="1.5" opacity="0.6" />
            <line x1={sunX} y1={sunY} x2={aphelionX} y2={cy} stroke="#f87171" strokeWidth="1.5" opacity="0.6" />

            {/* Earth at current position (top of orbit) */}
            <motion.g
                initial={{ offsetDistance: '0%' }}
                animate={{ offsetDistance: '100%' }}
                transition={{ duration: 10, ease: 'linear', repeat: Infinity }}
                style={{
                    offsetPath: `path('M ${cx - rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx + rx} ${cy} A ${rx} ${ry} 0 1 1 ${cx - rx} ${cy}')`,
                }}
            >
                <circle r="10" fill="#3b82f6" />
                <circle r="6" fill="#60a5fa" />
            </motion.g>

            {/* Annotation */}
            <text x="200" y="20" fontSize="14" fill="#e2e8f0" textAnchor="middle" fontWeight="bold">
                Earth's Elliptical Orbit
            </text>
            <text x="200" y="38" fontSize="10" fill="#cbd5e0" textAnchor="middle">
                The sun sits at one focus, not the center
            </text>

            {/* Legend */}
            <g transform="translate(10, 250)">
                <text fontSize="9" fill="#94a3b8" fontWeight="600">
                    Earth moves faster at perihelion
                </text>
                <text y="14" fontSize="9" fill="#94a3b8">
                    Equation of center corrects for this
                </text>
            </g>
        </svg>
    );
};
