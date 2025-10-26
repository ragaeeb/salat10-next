'use client';
import type React from 'react';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ShootingStar {
    id: number;
    x: number;
    y: number;
    angle: number;
    scale: number;
    speed: number;
    distance: number;
}

interface ShootingStarsProps {
    minSpeed?: number;
    maxSpeed?: number;
    minDelay?: number;
    maxDelay?: number;
    starColor?: string;
    trailColor?: string;
    starWidth?: number;
    starHeight?: number;
    className?: string;
}

const getRandomStartPoint = () => {
    const side = Math.floor(Math.random() * 4);
    const offset = Math.random() * window.innerWidth;

    switch (side) {
        case 0:
            return { angle: 45, x: offset, y: 0 };
        case 1:
            return { angle: 135, x: window.innerWidth, y: offset };
        case 2:
            return { angle: 225, x: offset, y: window.innerHeight };
        case 3:
            return { angle: 315, x: 0, y: offset };
        default:
            return { angle: 45, x: 0, y: 0 };
    }
};
export const ShootingStars: React.FC<ShootingStarsProps> = ({
    minSpeed = 10,
    maxSpeed = 30,
    minDelay = 1200,
    maxDelay = 4200,
    starColor = '#9E00FF',
    trailColor = '#2EB9DF',
    starWidth = 10,
    starHeight = 1,
    className,
}) => {
    const [star, setStar] = useState<ShootingStar | null>(null);
    const svgRef = useRef<SVGSVGElement>(null);
    const gradientId = useId();
    const gradientRef = useMemo(
        () => `shooting-star-gradient-${gradientId.replace(/[^a-zA-Z0-9-_]/g, '')}`,
        [gradientId],
    );

    useEffect(() => {
        const createStar = () => {
            const { x, y, angle } = getRandomStartPoint();
            const newStar: ShootingStar = {
                angle,
                distance: 0,
                id: Date.now(),
                scale: 1,
                speed: Math.random() * (maxSpeed - minSpeed) + minSpeed,
                x,
                y,
            };
            setStar(newStar);

            const randomDelay = Math.random() * (maxDelay - minDelay) + minDelay;
            setTimeout(createStar, randomDelay);
        };

        createStar();

        return () => {};
    }, [minSpeed, maxSpeed, minDelay, maxDelay]);

    useEffect(() => {
        const moveStar = () => {
            if (star) {
                setStar((prevStar) => {
                    if (!prevStar) {
                        return null;
                    }
                    const newX = prevStar.x + prevStar.speed * Math.cos((prevStar.angle * Math.PI) / 180);
                    const newY = prevStar.y + prevStar.speed * Math.sin((prevStar.angle * Math.PI) / 180);
                    const newDistance = prevStar.distance + prevStar.speed;
                    const newScale = 1 + newDistance / 100;
                    if (newX < -20 || newX > window.innerWidth + 20 || newY < -20 || newY > window.innerHeight + 20) {
                        return null;
                    }
                    return { ...prevStar, distance: newDistance, scale: newScale, x: newX, y: newY };
                });
            }
        };

        const animationFrame = requestAnimationFrame(moveStar);
        return () => cancelAnimationFrame(animationFrame);
    }, [star]);

    return (
        <svg
            aria-hidden="true"
            ref={svgRef}
            className={cn('absolute inset-0 h-full w-full', className)}
            style={{ mixBlendMode: 'screen' }}
            focusable="false"
            role="presentation"
        >
            {star && (
                <rect
                    key={star.id}
                    x={star.x}
                    y={star.y}
                    width={starWidth * star.scale}
                    height={starHeight}
                    fill={`url(#${gradientRef})`}
                    transform={`rotate(${star.angle}, ${
                        star.x + (starWidth * star.scale) / 2
                    }, ${star.y + starHeight / 2})`}
                    opacity={0.95}
                />
            )}
            <defs>
                <linearGradient id={gradientRef} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={trailColor} stopOpacity={0} />
                    <stop offset="100%" stopColor={starColor} stopOpacity={1} />
                </linearGradient>
            </defs>
        </svg>
    );
};
