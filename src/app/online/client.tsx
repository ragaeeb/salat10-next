'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import WorldMap from '@/components/aceternity/world-map';
import { Button } from '@/components/ui/button';

/**
 * Online user data with optional location labels
 */
type OnlineUser = {
    lat: number;
    lon: number;
    page: string;
    lastSeen: number;
    city?: string;
    state?: string;
    country?: string;
};

/**
 * Get display label for user based on available location data
 * Priority: City > State > Country
 */
function getUserLabel(user: OnlineUser): string | undefined {
    if (user.city) {
        return user.city;
    }
    if (user.state) {
        return user.state;
    }
    if (user.country) {
        return user.country;
    }
    return undefined;
}

/**
 * Format time window display text
 */
function formatTimeWindow(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    return minutes === 1 ? '1 min' : `${minutes} mins`;
}

export function OnlineClient() {
    const [users, setUsers] = useState<OnlineUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [ttl, setTtl] = useState<number>(300); // Default 5 minutes

    useEffect(() => {
        const fetchOnlineUsers = async () => {
            try {
                const response = await fetch('/api/online');
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data.users || []);
                    if (data.ttl) {
                        setTtl(data.ttl);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch online users', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOnlineUsers();
    }, []);

    // Create dots for world map - one for each user
    const dots = users.map((user) => ({
        end: { lat: user.lat, lng: user.lon }, // Same point = just a dot
        label: getUserLabel(user),
        start: { lat: user.lat, lng: user.lon },
    }));

    const timeWindow = formatTimeWindow(ttl);
    const userCount = users.length;
    const userText = userCount === 1 ? 'user' : 'users';

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-3xl">Users Online Now</h1>
                        <p className="text-muted-foreground">
                            {loading ? 'Loading...' : `${userCount} ${userText} online in the last ${timeWindow}`}
                        </p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                        <Link href="/">
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Home
                        </Link>
                    </Button>
                </div>

                <div className="rounded-lg border border-border bg-card p-6">
                    {loading ? (
                        <div className="flex h-96 items-center justify-center">
                            <p className="text-muted-foreground">Loading map...</p>
                        </div>
                    ) : users.length > 0 ? (
                        <WorldMap dots={dots} />
                    ) : (
                        <div className="flex h-96 items-center justify-center">
                            <p className="text-muted-foreground">No users online at the moment</p>
                        </div>
                    )}
                </div>

                <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground text-sm">
                    <p>
                        Each dot represents an online user's location. Labels show the city, state, or country when
                        available. Presence data expires after {timeWindow} of inactivity.
                    </p>
                </div>
            </div>
        </div>
    );
}
