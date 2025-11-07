'use client';

import { ChevronLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import WorldMap from '@/components/aceternity/world-map';
import { Button } from '@/components/ui/button';

type OnlineUser = { lat: number; lon: number; page: string; lastSeen: number };

export function OnlineClient() {
    const [users, setUsers] = useState<OnlineUser[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOnlineUsers = async () => {
            try {
                const response = await fetch('/api/online');
                if (response.ok) {
                    const data = await response.json();
                    setUsers(data.users || []);
                }
            } catch (error) {
                console.error('Failed to fetch online users', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOnlineUsers();
    }, []);

    // Create dots for world map (connections from Mecca to each user)
    const mecca = { lat: 21.4225, lng: 39.8262 };
    const dots = users.map((user) => ({ end: { lat: user.lat, lng: user.lon }, start: mecca }));

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="mx-auto max-w-6xl space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="font-bold text-3xl">Users Online Now</h1>
                        <p className="text-muted-foreground">
                            {loading ? 'Loading...' : `${users.length} user${users.length === 1 ? '' : 's'} online`}
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
                        <WorldMap dots={dots} lineColor="#3b82f6" />
                    ) : (
                        <div className="flex h-96 items-center justify-center">
                            <p className="text-muted-foreground">No users online at the moment</p>
                        </div>
                    )}
                </div>

                <div className="rounded-lg border border-border bg-card p-4 text-muted-foreground text-sm">
                    <p>
                        Lines connect from Mecca to each online user's location. User presence is updated every 2
                        minutes and expires after 5 minutes of inactivity.
                    </p>
                </div>
            </div>
        </div>
    );
}
