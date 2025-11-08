'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import WorldMap from '@/components/aceternity/world-map';
import { Button } from '@/components/ui/button';
import { TooltipProvider } from '@/components/ui/tooltip';

type OnlineUser = {
    userId: string;
    lat: number;
    lon: number;
    page: string;
    lastSeen: number;
    city?: string;
    state?: string;
    country?: string;
};

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

function formatTimeWindow(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    return minutes === 1 ? '1 min' : `${minutes} mins`;
}

export function OnlineClient() {
    const [users, setUsers] = useState<OnlineUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [ttl, setTtl] = useState<number>(300);

    useEffect(() => {
        const fetchOnlineUsers = async () => {
            try {
                const response = await fetch('/api/online');
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data.users || []);
                    if (typeof data.ttl === 'number') {
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

    // Create dots using userId as key to avoid duplicates
    const dots: Array<{
        start: { lat: number; lng: number; label?: string };
        end: { lat: number; lng: number; label?: string };
        label?: string;
    }> = users.map((user) => {
        const label = getUserLabel(user);
        return {
            end: { lat: user.lat, lng: user.lon },
            start: { lat: user.lat, lng: user.lon },
            ...(label && { label }),
        };
    });

    const timeWindow = formatTimeWindow(ttl);
    const userCount = users.length;
    const userText = userCount === 1 ? 'user' : 'users';

    return (
        <TooltipProvider>
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
                            Each dot represents an online user's location. Hover over dots to see location labels.
                            Presence data expires after {timeWindow} of inactivity.
                        </p>
                    </div>
                </div>
            </div>
        </TooltipProvider>
    );
}
