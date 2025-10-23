'use client';

import DottedMap from 'dotted-map';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useMemo, useRef } from 'react';

import { useThemeMode } from '@/components/theme-provider';

interface MapProps {
    dots?: Array<{
        start: { lat: number; lng: number; label?: string };
        end: { lat: number; lng: number; label?: string };
    }>;
    lineColor?: string;
}

export default function WorldMap({ dots = [], lineColor }: MapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const { theme } = useThemeMode();

    const arcColor = lineColor ?? (theme === 'dark' ? '#ffffff' : '#0f88b3');
    const dotColor = theme === 'dark' ? '#ffffff66' : '#0f88b366';

    const svgMap = useMemo(() => {
        const map = new DottedMap({ grid: 'diagonal', height: 100 });
        return map.getSVG({ backgroundColor: 'transparent', color: dotColor, radius: 0.22, shape: 'circle' });
    }, [dotColor]);

    const projectPoint = (lat: number, lng: number) => {
        const x = (lng + 180) * (800 / 360);
        const y = (90 - lat) * (400 / 180);
        return { x, y };
    };

    const createCurvedPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
        const midX = (start.x + end.x) / 2;
        const midY = Math.min(start.y, end.y) - 50;
        return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
    };

    return (
        <div className="relative aspect-[2/1] w-full rounded-lg bg-card font-sans text-foreground">
            <Image
                alt="world map"
                className="pointer-events-none h-full w-full select-none [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)]"
                draggable={false}
                height={495}
                src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
                unoptimized
                width={1056}
            />
            <svg
                aria-hidden="true"
                ref={svgRef}
                viewBox="0 0 800 400"
                className="pointer-events-none absolute inset-0 h-full w-full select-none"
                focusable="false"
            >
                {dots.map((dot, index) => {
                    const startPoint = projectPoint(dot.start.lat, dot.start.lng);
                    const endPoint = projectPoint(dot.end.lat, dot.end.lng);
                    const dotKey = `${dot.start.lat}-${dot.start.lng}-${dot.end.lat}-${dot.end.lng}`;
                    return (
                        <g key={`path-group-${dotKey}`}>
                            <motion.path
                                d={createCurvedPath(startPoint, endPoint)}
                                fill="none"
                                stroke="url(#path-gradient)"
                                strokeWidth="1"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.5 * index, duration: 1, ease: 'easeOut' }}
                                key={`start-upper-${dotKey}`}
                            ></motion.path>
                        </g>
                    );
                })}

                <defs>
                    <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="white" stopOpacity="0" />
                        <stop offset="5%" stopColor={arcColor} stopOpacity="1" />
                        <stop offset="95%" stopColor={arcColor} stopOpacity="1" />
                        <stop offset="100%" stopColor="white" stopOpacity="0" />
                    </linearGradient>
                </defs>

                {dots.map((dot) => {
                    const dotKey = `${dot.start.lat}-${dot.start.lng}-${dot.end.lat}-${dot.end.lng}`;
                    return (
                        <g key={`points-group-${dotKey}`}>
                            <g key={`start-${dotKey}`}>
                                <circle
                                    cx={projectPoint(dot.start.lat, dot.start.lng).x}
                                    cy={projectPoint(dot.start.lat, dot.start.lng).y}
                                    r="2"
                                    fill={arcColor}
                                />
                                <circle
                                    cx={projectPoint(dot.start.lat, dot.start.lng).x}
                                    cy={projectPoint(dot.start.lat, dot.start.lng).y}
                                    r="2"
                                    fill={arcColor}
                                    opacity="0.5"
                                >
                                    <animate
                                        attributeName="r"
                                        from="2"
                                        to="8"
                                        dur="1.5s"
                                        begin="0s"
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        from="0.5"
                                        to="0"
                                        dur="1.5s"
                                        begin="0s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            </g>
                            <g key={`end-${dotKey}`}>
                                <circle
                                    cx={projectPoint(dot.end.lat, dot.end.lng).x}
                                    cy={projectPoint(dot.end.lat, dot.end.lng).y}
                                    r="2"
                                    fill={arcColor}
                                />
                                <circle
                                    cx={projectPoint(dot.end.lat, dot.end.lng).x}
                                    cy={projectPoint(dot.end.lat, dot.end.lng).y}
                                    r="2"
                                    fill={arcColor}
                                    opacity="0.5"
                                >
                                    <animate
                                        attributeName="r"
                                        from="2"
                                        to="8"
                                        dur="1.5s"
                                        begin="0s"
                                        repeatCount="indefinite"
                                    />
                                    <animate
                                        attributeName="opacity"
                                        from="0.5"
                                        to="0"
                                        dur="1.5s"
                                        begin="0s"
                                        repeatCount="indefinite"
                                    />
                                </circle>
                            </g>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}
