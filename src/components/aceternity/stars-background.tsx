'use client';
import type React from 'react';
import { type RefObject, useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

type StarProps = { x: number; y: number; radius: number; opacity: number; twinkleSpeed: number | null };

type StarBackgroundProps = {
    starDensity?: number;
    allStarsTwinkle?: boolean;
    twinkleProbability?: number;
    minTwinkleSpeed?: number;
    maxTwinkleSpeed?: number;
    className?: string;
};

type StarGenerationOptions = {
    allStarsTwinkle: boolean;
    maxTwinkleSpeed: number;
    minTwinkleSpeed: number;
    starDensity: number;
    twinkleProbability: number;
};

const generateStars = (width: number, height: number, options: StarGenerationOptions): StarProps[] => {
    const { allStarsTwinkle, maxTwinkleSpeed, minTwinkleSpeed, starDensity, twinkleProbability } = options;
    const area = width * height;
    const numStars = Math.floor(area * starDensity);

    return Array.from({ length: numStars }, () => {
        const shouldTwinkle = allStarsTwinkle || Math.random() < twinkleProbability;
        return {
            opacity: Math.random() * 0.5 + 0.5,
            radius: Math.random() * 0.5 + 1, // Increased from 0.05 + 0.5 to 0.5 + 1
            twinkleSpeed: shouldTwinkle ? minTwinkleSpeed + Math.random() * (maxTwinkleSpeed - minTwinkleSpeed) : null,
            x: Math.random() * width,
            y: Math.random() * height,
        };
    });
};

export const StarsBackground: React.FC<StarBackgroundProps> = ({
    starDensity = 0.00015,
    allStarsTwinkle = true,
    twinkleProbability = 0.7,
    minTwinkleSpeed = 0.5,
    maxTwinkleSpeed = 1,
    className,
}) => {
    const [stars, setStars] = useState<StarProps[]>([]);
    const canvasRef: RefObject<HTMLCanvasElement | null> = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const updateStars = () => {
            if (canvasRef.current) {
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    return;
                }

                const { width, height } = canvas.getBoundingClientRect();
                canvas.width = width;
                canvas.height = height;
                setStars(
                    generateStars(width, height, {
                        allStarsTwinkle,
                        maxTwinkleSpeed,
                        minTwinkleSpeed,
                        starDensity,
                        twinkleProbability,
                    }),
                );
            }
        };

        updateStars();

        const resizeObserver = new ResizeObserver(updateStars);
        if (canvasRef.current) {
            resizeObserver.observe(canvasRef.current);
        }

        return () => {
            if (canvasRef.current) {
                resizeObserver.unobserve(canvasRef.current);
            }
        };
    }, [allStarsTwinkle, maxTwinkleSpeed, minTwinkleSpeed, starDensity, twinkleProbability]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) {
            return;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) {
            return;
        }

        let animationFrameId: number;

        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            stars.forEach((star) => {
                ctx.beginPath();
                ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity})`;
                ctx.fill();

                if (star.twinkleSpeed !== null) {
                    star.opacity = 0.5 + Math.abs(Math.sin((Date.now() * 0.001) / star.twinkleSpeed) * 0.5);
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            cancelAnimationFrame(animationFrameId);
        };
    }, [stars]);

    return <canvas ref={canvasRef} className={cn('absolute inset-0 h-full w-full', className)} />;
};
