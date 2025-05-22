'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useEffect, useState } from 'react';

const mockHijriDate = {
    date: '25',
    day: 'al-Khamis',
    month: "Dū al-Qa'dah",
    year: '1446',
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

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'long',
            weekday: 'long',
            year: 'numeric',
        });
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

    return (
        <div className="min-h-screen relative">
            {/* Background Image - replace src with your actual image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage:
                        "url('https://dar-as-sahaba.com/static/splash-1e172f4f39271bc8bf06a1b9fddad1cb.jpg')",
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

                        <h3 className="mx-6 text-xl font-medium text-green-900">{formatDate(currentDate)}</h3>

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
                            {mockHijriDate.day}, {mockHijriDate.date} {mockHijriDate.month} {mockHijriDate.year} H
                        </h2>
                    </div>

                    {/* Prayer Times */}
                    <div className="space-y-4">
                        <PrayerTimeRow name="Fajr" time="4:04 AM" />

                        <PrayerTimeRow isMainPrayer={false} name="Sunrise" time="5:26 AM" />

                        <PrayerTimeRow name="Dhuhr" time="1:00 PM" />

                        <PrayerTimeRow name="'Aṣr" time="5:06 PM" />

                        <PrayerTimeRow name="Maghrib" time="8:35 PM" />

                        <PrayerTimeRow name="'Ishā'" time="9:57 PM" />

                        {/* Night Times */}
                        <div className="mt-8 space-y-2">
                            <PrayerTimeRow isMainPrayer={false} name="1/2 Night Begins" time="12:19 AM" />
                            <PrayerTimeRow isMainPrayer={false} name="Last 1/3 Night Begins" time="1:34 AM" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
