'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import { daily } from '@/lib/calculator';
import { writeIslamicDate } from '@/lib/hijri';

const salatLabels = {
    asr: 'ʿAṣr',
    dhuhr: 'Dhuhr',
    fajr: 'Fajr',
    isha: 'ʿIshāʾ',
    lastThirdOfTheNight: 'Last 1/3 Night Begins',
    maghrib: 'Maġrib',
    middleOfTheNight: '1/2 Night Begins',
    sunrise: 'Sunrise',
    tarawih: 'Tarawīḥ',
};

const calculationArgs = {
    fajrAngle: 12,
    ishaAngle: 12,
    latitude: '45.3506',
    longitude: '-75.793',
    method: 'NauticalTwilight',
    timeZone: 'America/Toronto',
};

export default function PrayerTimesPage() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const navigateDate = (delta: number) => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + delta);
        setCurrentDate(newDate);
    };

    const PrayerTimeRow = ({
        className = '',
        isMainPrayer = true,
        name,
        time,
    }: {
        className?: string;
        isMainPrayer?: boolean;
        name: string;
        time: string;
    }) => (
        <div className={`${className}`}>
            <span
                className={`font-bold ${isMainPrayer ? 'text-7xl lg:text-8xl' : 'text-5xl lg:text-6xl'} text-green-900`}
            >
                {name}
            </span>
            <span
                className={`font-bold ${isMainPrayer ? 'text-7xl lg:text-8xl' : 'text-5xl lg:text-6xl'} text-orange-600 ml-4`}
            >
                {time}
            </span>
        </div>
    );

    if (!mounted) {
        return null; // Prevent hydration mismatch
    }

    const result = daily(salatLabels, calculationArgs, currentDate);
    const hijri = writeIslamicDate(0, currentDate);

    return (
        <div className="min-h-screen relative">
            {/* Background Image - replace src with your actual image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
                style={{
                    backgroundImage: "url('/splash.png')",
                }}
            />

            {/* Content - centered on page */}
            <div className="relative z-10 min-h-screen flex items-center justify-center px-8">
                <div className="w-full max-w-4xl text-left">
                    {/* Date Navigation */}
                    <div className="flex items-center justify-center mb-6">
                        <button
                            className="p-2 text-green-900 hover:text-green-700 transition-colors bg-transparent border-none outline-none"
                            onClick={() => navigateDate(-1)}
                        >
                            <ChevronLeft size={24} />
                        </button>

                        <h3 className="mx-6 text-xl font-medium text-green-900">{result.date}</h3>

                        <button
                            className="p-2 text-green-900 hover:text-green-700 transition-colors bg-transparent border-none outline-none"
                            onClick={() => navigateDate(1)}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Hijri Date */}
                    <div className="text-center mb-8">
                        <h2 className="text-lg font-medium text-green-900">
                            {hijri.day}, {hijri.date} {hijri.month} {hijri.year} H
                        </h2>
                    </div>

                    {/* Prayer Times */}
                    <div className="space-y-4">
                        {result.timings.map((t) => (
                            <PrayerTimeRow isMainPrayer={t.isFard} key={t.event} name={t.label!} time={t.time} />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
