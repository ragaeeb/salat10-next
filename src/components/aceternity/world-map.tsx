import DottedMap from 'dotted-map';
import { motion } from 'motion/react';
import Image from 'next/image';
import { useMemo, useRef } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface MapProps {
    dots?: Array<{
        start: { lat: number; lng: number; label?: string };
        end: { lat: number; lng: number; label?: string };
        label?: string;
    }>;
    lineColor?: string;
}

export default function WorldMap({ dots = [], lineColor }: MapProps) {
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    const arcColor = lineColor ?? '#ffffff';

    const svgMap = useMemo(() => {
        const map = new DottedMap({ grid: 'diagonal', height: 100 });
        return map.getSVG({ backgroundColor: 'transparent', color: '#ffffff66', radius: 0.22, shape: 'circle' });
    }, []);

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
        <div ref={containerRef} className="relative aspect-[2/1] w-full rounded-lg bg-card font-sans text-foreground">
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
                ref={svgRef}
                viewBox="0 0 800 400"
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
            >
                <title>World map with user locations</title>
                {dots.map((dot, index) => {
                    const startPoint = projectPoint(dot.start.lat, dot.start.lng);
                    const endPoint = projectPoint(dot.end.lat, dot.end.lng);
                    const pathId = `${dot.start.lat}-${dot.start.lng}-${dot.end.lat}-${dot.end.lng}-${index}`;
                    return (
                        <g key={`path-group-${pathId}`}>
                            <motion.path
                                d={createCurvedPath(startPoint, endPoint)}
                                fill="none"
                                stroke="url(#path-gradient)"
                                strokeWidth="1"
                                initial={{ pathLength: 0 }}
                                animate={{ pathLength: 1 }}
                                transition={{ delay: 0.5 * index, duration: 1, ease: 'easeOut' }}
                            />
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

                {dots.map((dot, index) => {
                    const point = projectPoint(dot.start.lat, dot.start.lng);
                    const dotId = `${dot.start.lat}-${dot.start.lng}-${index}`;
                    return (
                        <g key={`dot-${dotId}`}>
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="2"
                                fill={arcColor}
                                className="cursor-pointer"
                                data-tooltip={dot.start.label}
                            />
                            <circle
                                cx={point.x}
                                cy={point.y}
                                r="2"
                                fill={arcColor}
                                opacity="0.5"
                                className="pointer-events-none"
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
                    );
                })}
            </svg>

            {/* Overlay invisible divs for tooltips */}
            <div className="absolute inset-0 z-10">
                {dots.map((dot, index) => {
                    const point = projectPoint(dot.start.lat, dot.start.lng);
                    const left = `${(point.x / 800) * 100}%`;
                    const top = `${(point.y / 400) * 100}%`;
                    const label = dot.label || dot.start.label;
                    const tooltipId = `${dot.start.lat}-${dot.start.lng}-${index}`;

                    if (!label) {
                        return null;
                    }

                    return (
                        <Tooltip key={`tooltip-${tooltipId}`} delayDuration={0}>
                            <TooltipTrigger asChild>
                                <button
                                    type="button"
                                    className="-translate-x-1/2 -translate-y-1/2 absolute h-8 w-8 cursor-pointer rounded-full hover:bg-white/10"
                                    style={{ left, top }}
                                    aria-label={label}
                                />
                            </TooltipTrigger>
                            <TooltipContent side="top" className="font-medium">
                                {label}
                            </TooltipContent>
                        </Tooltip>
                    );
                })}
            </div>
        </div>
    );
}
