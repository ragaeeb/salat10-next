import { useId } from 'react';

export const AxialTiltDiagram = ({ width = 400, height = 350, className = '' }) => {
    const uid = useId();
    const earthGradient = `earth-grad-${uid}`;
    const sunGradient = `sun-grad-${uid}`;

    const earthX = 200;
    const earthY = 180;
    const earthRadius = 50;
    const tiltAngle = 23.4; // degrees

    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 400 350"
            className={className}
            style={{ background: '#0a0a1a' }}
        >
            <title>Axial Tilt Diagram</title>
            <defs>
                <radialGradient id={earthGradient}>
                    <stop offset="30%" stopColor="#3b82f6" />
                    <stop offset="70%" stopColor="#1e40af" />
                    <stop offset="100%" stopColor="#1e3a8a" />
                </radialGradient>
                <radialGradient id={sunGradient}>
                    <stop offset="0%" stopColor="#ffd700" />
                    <stop offset="100%" stopColor="#ff8c00" />
                </radialGradient>
                <linearGradient id="equator-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                    <stop offset="50%" stopColor="#10b981" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.3" />
                </linearGradient>
            </defs>

            {/* Title */}
            <text x="200" y="25" fontSize="16" fill="#e2e8f0" textAnchor="middle" fontWeight="bold">
                Earth's Axial Tilt
            </text>
            <text x="200" y="45" fontSize="11" fill="#cbd5e0" textAnchor="middle">
                23.4° tilt creates seasons and affects prayer times
            </text>

            {/* Orbital plane reference */}
            <line
                x1="50"
                y1={earthY}
                x2="350"
                y2={earthY}
                stroke="#4a5568"
                strokeWidth="2"
                strokeDasharray="10,5"
                opacity="0.4"
            />
            <text x="355" y={earthY + 5} fontSize="10" fill="#718096">
                Orbital plane
            </text>

            {/* Sun rays coming from left */}
            <g opacity="0.3">
                {[...Array(5)].map((_, i) => (
                    <line
                        key={i}
                        x1="0"
                        y1={earthY - 60 + i * 30}
                        x2="120"
                        y2={earthY - 60 + i * 30}
                        stroke="#fbbf24"
                        strokeWidth="2"
                    />
                ))}
            </g>
            <g transform="translate(40, 180)">
                <circle r="25" fill={`url(#${sunGradient})`} opacity="0.8" />
                <text y="45" fontSize="10" fill="#fbbf24" textAnchor="middle">
                    Sun
                </text>
            </g>

            {/* Earth */}
            <g transform={`translate(${earthX}, ${earthY})`}>
                {/* Earth sphere */}
                <circle r={earthRadius} fill={`url(#${earthGradient})`} />

                {/* Continents for realism */}
                <ellipse cx="10" cy="-5" rx="15" ry="20" fill="#065f46" opacity="0.6" transform="rotate(-15)" />
                <ellipse cx="-20" cy="10" rx="18" ry="12" fill="#065f46" opacity="0.6" transform="rotate(20)" />

                {/* Rotation axis (tilted) */}
                <line
                    x1="0"
                    y1={-earthRadius - 40}
                    x2="0"
                    y2={earthRadius + 40}
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                    transform={`rotate(${-tiltAngle})`}
                    opacity="0.9"
                />

                {/* North pole marker */}
                <g transform={`rotate(${-tiltAngle})`}>
                    <circle cy={-earthRadius - 45} r="4" fill="#fbbf24" />
                    <text y={-earthRadius - 50} fontSize="10" fill="#fcd34d" textAnchor="middle">
                        North Pole
                    </text>
                </g>

                {/* Equator */}
                <ellipse
                    rx={earthRadius}
                    ry="8"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2.5"
                    transform={`rotate(${-tiltAngle})`}
                    opacity="0.7"
                />
                <text x={earthRadius + 15} y="5" fontSize="9" fill="#10b981" transform={`rotate(${-tiltAngle})`}>
                    Equator
                </text>

                {/* Vertical reference line */}
                <line
                    x1="0"
                    y1={-earthRadius - 40}
                    x2="0"
                    y2={earthRadius + 40}
                    stroke="#64748b"
                    strokeWidth="1.5"
                    strokeDasharray="5,3"
                    opacity="0.5"
                />
            </g>

            {/* Tilt angle annotation */}
            <g transform={`translate(${earthX}, ${earthY})`}>
                <path
                    d={`M 0 ${-earthRadius - 25} A 30 30 0 0 1 ${Math.sin((tiltAngle * Math.PI) / 180) * 30} ${-Math.cos((tiltAngle * Math.PI) / 180) * 30 - earthRadius - 25}`}
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                />
                <text x="35" y={-earthRadius - 15} fontSize="12" fill="#fbbf24" fontWeight="bold">
                    23.4°
                </text>
            </g>

            {/* Explanatory text */}
            <g transform="translate(20, 300)">
                <text fontSize="10" fill="#94a3b8" fontWeight="600">
                    This tilt is called "obliquity of the ecliptic"
                </text>
                <text y="15" fontSize="9" fill="#94a3b8">
                    • Creates seasons as Earth orbits the sun
                </text>
                <text y="28" fontSize="9" fill="#94a3b8">
                    • Affects how high the sun gets in your sky
                </text>
                <text y="41" fontSize="9" fill="#94a3b8">
                    • Changes twilight duration at different latitudes
                </text>
            </g>
        </svg>
    );
};
