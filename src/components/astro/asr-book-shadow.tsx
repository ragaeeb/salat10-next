'use client';

import { type MotionValue, motion, useMotionValueEvent, useTransform } from 'motion/react';
import Image from 'next/image';
import { memo, useState } from 'react';
import { calculateAsrShadowMetrics, calculateAsrTransitionState } from '@/lib/asr-shadow';
import type { Timeline } from '@/types/timeline';

type AsrBookShadowProps = {
    /** Observer latitude in degrees */
    latitude: number;
    /** Current normalized progress (0 to 1) */
    progress: MotionValue<number>;
    /** Prayer timeline */
    timeline: Timeline | null;
    /** Sizing overrides */
    className?: string;
};

const BOOK_HEIGHT = 46;
const BOOK_WIDTH = 30;
const BOOK_DEPTH = 7;

/**
 * 2.5D Animated Islamic Book & Dynamic Optical Asr Shadow
 *
 * Visually demonstrates the classical astronomical definition of ʿAṣr:
 * - Translates upward from behind the timings card after Dhuhr (solar noon zenith).
 * - As the sun progresses westward (left), a shadow is cast eastward (to the right) along the container's top surface.
 * - The shadow lengthens until ʿAṣr time, when the added shadow ratio reaches exactly 1:1 with the book's height.
 * - At ʿAṣr time, the book drops 90° clockwise on its side directly onto the shadow with animated page scattering & flipping physics.
 * - Near Maghrib, the book smoothly sets with the sun by descending behind the card and fading out.
 */
export const AsrBookShadow = memo<AsrBookShadowProps>(({ latitude, progress, timeline, className }) => {
    // Reactive drop state for physics-based Framer Motion animations
    const [isDropped, setIsDropped] = useState(false);

    useMotionValueEvent(progress, 'change', (p) => {
        if (!timeline) {
            return;
        }
        const metrics = calculateAsrShadowMetrics(p, timeline.dhuhr, timeline.asr, latitude);
        setIsDropped(metrics.addedShadowRatio >= 0.98);
    });

    // Dynamic transition & shadow calculations
    const transitionOpacity = useTransform(progress, (p) => {
        if (!timeline) {
            return 0;
        }
        return calculateAsrTransitionState(p, timeline.dhuhr, timeline.maghrib).opacity;
    });

    const descendOffset = useTransform(progress, (p) => {
        if (!timeline) {
            return 65;
        }
        return calculateAsrTransitionState(p, timeline.dhuhr, timeline.maghrib).descendOffset;
    });

    const addedShadowRatio = useTransform(progress, (p) => {
        if (!timeline) {
            return 0;
        }
        return calculateAsrShadowMetrics(p, timeline.dhuhr, timeline.asr, latitude).addedShadowRatio;
    });

    const shadowLength = useTransform(addedShadowRatio, (ratio) => Math.max(0, BOOK_HEIGHT * ratio));

    // Shadow only exists on the container roof; fades away immediately during rise/descent
    const shadowOpacity = useTransform(descendOffset, (offset) => Math.max(0, 1 - offset / 8));

    return (
        <motion.div
            aria-hidden="true"
            className={`pointer-events-none absolute -top-12 right-0 left-0 z-0 flex justify-center ${className ?? ''}`}
            style={{ opacity: transitionOpacity, y: descendOffset }}
        >
            <div className="relative h-12 w-72">
                {/* 1. Optical Cast Shadow along the container roof (fades out during rise/descent) */}
                <motion.div
                    className="absolute bottom-0 h-2 origin-left rounded-r-full"
                    style={{
                        background:
                            'linear-gradient(to right, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 80%, transparent 100%)',
                        filter: 'blur(1px)',
                        left: `calc(50% - 20px + ${BOOK_WIDTH}px)`,
                        opacity: shadowOpacity,
                        width: shadowLength,
                    }}
                />

                {/* 2. 2.5D Animated Islamic Book */}
                <motion.div
                    animate={{ rotate: isDropped ? 90 : 0 }}
                    className="absolute bottom-0"
                    style={{
                        height: BOOK_HEIGHT,
                        left: 'calc(50% - 20px)',
                        transformOrigin: 'bottom right',
                        width: BOOK_WIDTH,
                    }}
                    transition={{ damping: 15, mass: 0.5, stiffness: 220, type: 'spring' }}
                >
                    {/* Layer 1: Back Cover & Spine (Matches App Icon's Celestial Blue Gradient) */}
                    <div
                        className="absolute inset-0 rounded-[3px] shadow-md"
                        style={{ background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)' }}
                    >
                        {/* Book Spine */}
                        <div
                            className="absolute top-0 bottom-0 left-0 w-1.5 rounded-l-[3px]"
                            style={{
                                background:
                                    'linear-gradient(to right, rgba(0,0,0,0.3) 0%, #38bdf8 45%, rgba(255,255,255,0.35) 100%)',
                            }}
                        />
                    </div>

                    {/* Layer 2: Right/Top 3D Gilded Pages Block */}
                    <motion.div
                        animate={{ opacity: isDropped ? 0.6 : 1 }}
                        className="pointer-events-none absolute inset-0"
                        transition={{ duration: 0.3 }}
                    >
                        {/* Right Gilded Edge */}
                        <svg
                            aria-hidden="true"
                            className="absolute top-0 bottom-0 overflow-visible"
                            height={BOOK_HEIGHT}
                            style={{ left: BOOK_WIDTH }}
                            width={BOOK_DEPTH}
                        >
                            <title>Right Gilded Edge</title>
                            <polygon
                                fill="url(#gildedEdge)"
                                points={`0,0 ${BOOK_DEPTH},-${BOOK_DEPTH * 0.4} ${BOOK_DEPTH},${BOOK_HEIGHT - BOOK_DEPTH * 0.4} 0,${BOOK_HEIGHT}`}
                            />
                            <defs>
                                <linearGradient id="gildedEdge" x1="0%" x2="100%" y1="0%" y2="0%">
                                    <stop offset="0%" stopColor="#f3e8d2" />
                                    <stop offset="50%" stopColor="#d8c59f" />
                                    <stop offset="100%" stopColor="#bfa370" />
                                </linearGradient>
                            </defs>
                        </svg>

                        {/* Top Gilded Edge */}
                        <svg
                            aria-hidden="true"
                            className="absolute top-0 left-0 overflow-visible"
                            height={BOOK_DEPTH}
                            style={{ top: -BOOK_DEPTH * 0.4 }}
                            width={BOOK_WIDTH + BOOK_DEPTH}
                        >
                            <title>Top Gilded Edge</title>
                            <polygon
                                fill="#eadeca"
                                points={`0,${BOOK_DEPTH * 0.4} ${BOOK_DEPTH},0 ${BOOK_WIDTH + BOOK_DEPTH},0 ${BOOK_WIDTH},${BOOK_DEPTH * 0.4}`}
                            />
                        </svg>
                    </motion.div>

                    {/* Layer 3: Fanned Inner Pages (Subtle, elegant page scatter while staying in one piece) */}
                    <div className="absolute inset-0">
                        {/* Page Leaf 3 */}
                        <motion.div
                            animate={{ rotate: isDropped ? -2 : 0, x: isDropped ? 0.8 : 0 }}
                            className="absolute top-0.5 right-1 bottom-0.5 left-1 rounded-[2px] bg-[#f8f3ea] shadow-xs"
                            style={{ transformOrigin: 'left center' }}
                            transition={{ damping: 14, delay: 0.08, stiffness: 200, type: 'spring' }}
                        />

                        {/* Page Leaf 2 */}
                        <motion.div
                            animate={{ rotate: isDropped ? -3.5 : 0, x: isDropped ? 1.4 : 0 }}
                            className="absolute top-0.5 right-1.5 bottom-0.5 left-0.5 rounded-[2px] bg-[#fdfaf2] shadow-xs"
                            style={{ transformOrigin: 'left center' }}
                            transition={{ damping: 13, delay: 0.05, stiffness: 190, type: 'spring' }}
                        >
                            <div className="flex flex-col gap-1 px-1 pt-1.5 opacity-25">
                                <div className="h-[1px] w-full bg-[#8c734b]" />
                                <div className="h-[1px] w-full bg-[#8c734b]" />
                                <div className="h-[1px] w-3/4 bg-[#8c734b]" />
                            </div>
                        </motion.div>

                        {/* Top Page Leaf 1 */}
                        <motion.div
                            animate={{ rotate: isDropped ? -5 : 0, x: isDropped ? 2.0 : 0 }}
                            className="absolute top-0.5 right-1.5 bottom-0.5 left-0.5 rounded-[2px] bg-[#fffdf8] shadow-sm"
                            style={{ transformOrigin: 'left center' }}
                            transition={{ damping: 12, delay: 0.03, stiffness: 180, type: 'spring' }}
                        >
                            <div className="flex flex-col gap-1 px-1.5 pt-1.5 opacity-30">
                                <div className="h-[1px] w-full bg-[#8c734b]" />
                                <div className="h-[1px] w-full bg-[#8c734b]" />
                                <div className="h-[1px] w-2/3 bg-[#8c734b]" />
                            </div>
                        </motion.div>
                    </div>

                    {/* Layer 4: Front Cover (Matches App Icon's Celestial Blue Gradient & White/Sky-Blue Trim) */}
                    <motion.div
                        animate={{ rotate: isDropped ? -6 : 0 }}
                        className="absolute inset-0 rounded-[3px] p-[2.5px] shadow-md"
                        style={{
                            background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 50%, #075985 100%)',
                            transformOrigin: 'left center',
                        }}
                        transition={{ damping: 14, delay: 0.02, stiffness: 180, type: 'spring' }}
                    >
                        {/* Frame Border with Cover Artwork */}
                        <div className="relative h-full w-full overflow-hidden rounded-[2px] border border-white/40 shadow-inner">
                            <Image
                                alt="Salat10 Book Cover"
                                className="h-full w-full object-cover object-center"
                                height={BOOK_HEIGHT}
                                priority
                                src="/book-cover.png"
                                width={BOOK_WIDTH}
                            />
                            {/* Inlay Border */}
                            <div className="pointer-events-none absolute inset-0 rounded-[2px] border border-sky-200/30" />
                        </div>
                    </motion.div>

                    {/* Layer 5: Light Blue / Silk Cyan Ribbon Bookmark */}
                    <motion.div
                        animate={{ rotate: isDropped ? 22 : 0 }}
                        className="absolute -bottom-2.5 left-1/2 z-10"
                        style={{ transformOrigin: 'top center' }}
                        transition={{ damping: 12, delay: 0.05, stiffness: 180, type: 'spring' }}
                    >
                        <svg aria-hidden="true" height="10" viewBox="0 0 7 10" width="7">
                            <title>Bookmark Ribbon</title>
                            <defs>
                                <linearGradient id="silkBlueBookmark" x1="0%" x2="100%" y1="0%" y2="0%">
                                    <stop offset="0%" stopColor="#38bdf8" />
                                    <stop offset="50%" stopColor="#7dd3fc" />
                                    <stop offset="100%" stopColor="#0284c7" />
                                </linearGradient>
                            </defs>
                            <polygon fill="url(#silkBlueBookmark)" points="0,0 7,0 7,9 3.5,7 0,9" />
                        </svg>
                    </motion.div>
                </motion.div>
            </div>
        </motion.div>
    );
});

AsrBookShadow.displayName = 'AsrBookShadow';
