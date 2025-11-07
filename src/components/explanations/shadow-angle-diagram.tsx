import { motion } from 'framer-motion';
import { useId } from 'react';

type ShadowAngleDiagramProps = { shadowMultiplier?: number; width?: number; height?: number; className?: string };

export const ShadowAngleDiagram = ({
    shadowMultiplier = 1,
    width = 400,
    height = 350,
    className = '',
}: ShadowAngleDiagramProps) => {
    const uid = useId();
    const sunGradId = `sun-grad-${uid}`;
    const shadowGradId = `shadow-grad-${uid}`;

    const groundY = 250;
    const objectHeight = 100;
    const objectX = 150;
    const objectBase = groundY;
    const objectTop = objectBase - objectHeight;

    const shadowLength = objectHeight * shadowMultiplier;
    const shadowEnd = objectX + shadowLength;

    // Calculate sun angle
    const sunAngle = Math.atan(objectHeight / shadowLength) * (180 / Math.PI);
    const sunDistance = 200;
    const sunX = objectX + Math.cos(((90 - sunAngle) * Math.PI) / 180) * sunDistance;
    const sunY = objectTop - Math.sin(((90 - sunAngle) * Math.PI) / 180) * sunDistance;

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 400 350"
            className={className}
            style={{ background: 'linear-gradient(to bottom, #0ea5e9 0%, #7dd3fc 50%, #f0f9ff 100%)' }}
        >
            <title>Shadow Angle Diagram</title>
            <defs>
                <radialGradient id={sunGradId}>
                    <stop offset="0%" stopColor="#ffd700" />
                    <stop offset="100%" stopColor="#ff8c00" />
                </radialGradient>
                <linearGradient id={shadowGradId} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#1e293b" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#1e293b" stopOpacity="0.1" />
                </linearGradient>
            </defs>

            {/* Title */}
            <text x="200" y="25" fontSize="16" fill="#0f172a" textAnchor="middle" fontWeight="bold">
                ʿAṣr Shadow Calculation
            </text>

            {/* Ground */}
            <rect x="0" y={groundY} width="400" height="100" fill="#84cc16" opacity="0.3" />
            <line x1="50" y1={groundY} x2="380" y2={groundY} stroke="#65a30d" strokeWidth="3" />

            {/* Shadow */}
            <motion.path
                d={`M ${objectX} ${groundY} L ${shadowEnd} ${groundY} L ${objectX} ${objectTop} Z`}
                fill={`url(#${shadowGradId})`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                transition={{ duration: 1 }}
            />

            {/* Object (person/stick) */}
            <rect x={objectX - 8} y={objectTop} width="16" height={objectHeight} fill="#7c3aed" rx="4" />
            <circle cx={objectX} cy={objectTop - 12} r="12" fill="#7c3aed" />

            {/* Sun */}
            <motion.circle
                cx={sunX}
                cy={sunY}
                r="20"
                fill={`url(#${sunGradId})`}
                initial={{ scale: 0.8 }}
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Sun ray to object top */}
            <line
                x1={sunX}
                y1={sunY}
                x2={objectX}
                y2={objectTop}
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.7"
            />

            {/* Sun ray to shadow end */}
            <line
                x1={sunX}
                y1={sunY}
                x2={shadowEnd}
                y2={groundY}
                stroke="#fbbf24"
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.7"
            />

            {/* Object height measurement */}
            <line x1={objectX - 25} y1={objectTop} x2={objectX - 25} y2={groundY} stroke="#dc2626" strokeWidth="2" />
            <text
                x={objectX - 35}
                y={(objectTop + groundY) / 2}
                fontSize="12"
                fill="#dc2626"
                textAnchor="end"
                fontWeight="bold"
            >
                h
            </text>

            {/* Shadow length measurement */}
            <line x1={objectX} y1={groundY + 20} x2={shadowEnd} y2={groundY + 20} stroke="#0891b2" strokeWidth="2" />
            <text
                x={(objectX + shadowEnd) / 2}
                y={groundY + 35}
                fontSize="12"
                fill="#0891b2"
                textAnchor="middle"
                fontWeight="bold"
            >
                {shadowMultiplier === 1 ? '1h' : '2h'}
            </text>

            {/* Angle arc */}
            <path
                d={`M ${objectX + 40} ${groundY} A 40 40 0 0 0 ${objectX} ${groundY - 40}`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
            />
            <text x={objectX + 30} y={groundY - 25} fontSize="11" fill="#f59e0b" fontWeight="bold">
                {sunAngle.toFixed(1)}°
            </text>

            {/* Madhab label */}
            <g transform="translate(20, 290)">
                <rect width="360" height="50" fill="#1e293b" opacity="0.8" rx="8" />
                <text x="180" y="20" fontSize="12" fill="#fbbf24" textAnchor="middle" fontWeight="bold">
                    {shadowMultiplier === 1 ? 'Shāfiʿī, Mālikī, Ḥanbalī' : 'Ḥanafī'}
                </text>
                <text x="180" y="38" fontSize="10" fill="#cbd5e0" textAnchor="middle">
                    ʿAṣr begins when shadow length = {shadowMultiplier === 1 ? '1×' : '2×'} object height
                </text>
            </g>
        </svg>
    );
};
