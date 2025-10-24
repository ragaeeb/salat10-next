'use client';

import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

export default function PrayerParallaxPage() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({ offset: ['start start', 'end end'], target: containerRef });

    // Sun moves from left (sunrise) to right (sunset)
    const sunX = useTransform(scrollYProgress, [0, 1], ['10%', '90%']);
    const sunY = useTransform(scrollYProgress, [0, 0.5, 1], ['80%', '20%', '80%']);

    // Sky color transitions from dawn to day to dusk
    const skyColor = useTransform(scrollYProgress, [0, 0.3, 0.7, 1], ['#87CEEB', '#4A90E2', '#FF6B35', '#1a1a2e']);

    return (
        <div ref={containerRef} className="relative">
            {/* Sky background */}
            <motion.div className="-z-10 fixed inset-0" style={{ backgroundColor: skyColor }} />

            {/* Sun */}
            <motion.div
                className="fixed h-24 w-24 rounded-full bg-yellow-400 shadow-2xl"
                style={{
                    boxShadow: '0 0 60px 20px rgba(255, 215, 0, 0.6)',
                    left: sunX,
                    top: sunY,
                    x: '-50%',
                    y: '-50%',
                }}
            />

            {/* Content */}
            <div className="relative z-10 flex min-h-[300vh] flex-col items-center justify-start px-8 pt-32">
                <motion.div
                    className="mb-[100vh] text-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="mb-4 font-bold text-6xl text-white drop-shadow-lg">Prayer Times</h1>
                    <p className="text-2xl text-white/90 drop-shadow-md">
                        Stay connected to your faith, wherever you are
                    </p>
                </motion.div>

                <motion.div
                    className="mb-[100vh] text-center"
                    style={{ opacity: useTransform(scrollYProgress, [0.3, 0.5], [0, 1]) }}
                >
                    <h2 className="mb-4 font-semibold text-4xl text-white drop-shadow-lg">From Dawn to Dusk</h2>
                    <p className="text-white/90 text-xl drop-shadow-md">
                        Accurate prayer times for every moment of the day
                    </p>
                </motion.div>

                <motion.div
                    className="text-center"
                    style={{ opacity: useTransform(scrollYProgress, [0.6, 0.8], [0, 1]) }}
                >
                    <h2 className="mb-4 font-semibold text-4xl text-white drop-shadow-lg">As the Sun Sets</h2>
                    <p className="text-white/90 text-xl drop-shadow-md">Never miss a prayer</p>
                </motion.div>
            </div>
        </div>
    );
}
