import { MapPin, Navigation } from 'lucide-react';
import type React from 'react';
import { useState } from 'react';
import { toast } from 'sonner';

import { TimezoneCombobox } from '@/components/timezone-combobox';
import { Button } from '@/components/ui/button';
import type { Settings } from '@/types/settings';

/**
 * Props for the LocationSettings component
 */
type LocationSettingsProps = {
    /** Current settings state */
    settings: Settings;
    /** Handler for updating multiple settings at once */
    onSettingsChange: (updater: (prev: Settings) => Settings) => void;
    /** Handler for updating a single field */
    onFieldChange: (key: keyof Settings, value: string) => void;
};

/**
 * Geocoding request status
 */
type GeocodeStatus = 'idle' | 'loading';

/**
 * Browser geolocation request status
 */
type LocationStatus = 'idle' | 'loading';

/**
 * Default timezone fallback
 */
const DEFAULT_TZ = 'UTC';

/**
 * Gets browser's timezone using the Intl API.
 *
 * @returns IANA timezone identifier or UTC as fallback
 */
const getBrowserTimezone = (): string => {
    try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone ?? DEFAULT_TZ;
    } catch {
        return DEFAULT_TZ;
    }
};

/**
 * Location configuration panel for coordinates and timezone.
 *
 * Features:
 * - Manual address/label entry
 * - Geocoding API integration (auto-fill coordinates from address)
 * - Browser geolocation support
 * - Timezone selection via combobox
 * - Manual latitude/longitude entry
 *
 * Both geocoding and browser location automatically detect and set the timezone.
 * Updates city/state/country metadata when geocoding succeeds.
 *
 * @param props - Component configuration
 * @returns Form controls for location settings with loading states
 */
export function LocationSettings({ settings, onSettingsChange, onFieldChange }: LocationSettingsProps) {
    const [geocodeStatus, setGeocodeStatus] = useState<GeocodeStatus>('idle');
    const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle');

    const handleChange = (key: keyof Settings) => (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        onFieldChange(key, event.target.value);
    };

    /**
     * Request location from browser's Geolocation API
     * Updates coordinates and timezone on success
     */
    const requestBrowserLocation = () => {
        if (!('geolocation' in navigator)) {
            toast.error('Geolocation is not supported by your browser');
            return;
        }

        setLocationStatus('loading');

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude.toFixed(4);
                const lon = position.coords.longitude.toFixed(4);

                onSettingsChange((prev) => ({
                    ...prev,
                    latitude: lat,
                    longitude: lon,
                    timeZone: getBrowserTimezone(),
                }));
                setLocationStatus('idle');
                toast.success('Location updated from browser');
            },
            (error) => {
                console.warn('Geolocation error:', error);
                setLocationStatus('idle');
                if (error.code === error.PERMISSION_DENIED) {
                    toast.error('Location access denied. Please enable location permissions.');
                } else if (error.code === error.POSITION_UNAVAILABLE) {
                    toast.error('Location information unavailable.');
                } else if (error.code === error.TIMEOUT) {
                    toast.error('Timed out while retrieving location. Please try again.');
                } else {
                    toast.error('Unable to retrieve location. Please try again.');
                }
            },
            { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
        );
    };

    /**
     * Geocode address to coordinates using API
     * Updates coordinates, timezone, and location metadata (city/state/country)
     */
    const lookupCoordinates = async () => {
        if (!settings.address.trim()) {
            toast.error('Please enter an address or city first.');
            return;
        }

        setGeocodeStatus('loading');

        try {
            const response = await fetch(`/api/geocode?address=${encodeURIComponent(settings.address)}`);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to fetch coordinates');
            }

            const result = await response.json();

            // Ensure we have valid numbers
            if (typeof result.latitude !== 'number' || typeof result.longitude !== 'number') {
                throw new Error('Invalid coordinates received from API');
            }

            const lat = result.latitude.toFixed(4);
            const lon = result.longitude.toFixed(4);
            const label = result.label ?? settings.address;

            onSettingsChange((prev) => ({
                ...prev,
                address: label,
                latitude: lat,
                longitude: lon,
                timeZone: result.timeZone ?? getBrowserTimezone(),
                // Update location metadata if available
                ...(result.city && { city: result.city }),
                ...(result.state && { state: result.state }),
                ...(result.country && { country: result.country }),
            }));

            setGeocodeStatus('idle');
            toast.success(`Found coordinates near ${label}.`);
        } catch (error) {
            console.error('Geocode lookup failed:', error);
            setGeocodeStatus('idle');
            toast.error('Unable to look up that location right now. Please try again later.');
        }
    };

    return (
        <div className="space-y-5">
            <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                Address or label
                <input
                    className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground text-sm shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                    onChange={handleChange('address')}
                    placeholder="City, country"
                    type="text"
                    value={settings.address}
                />
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full gap-2 text-xs md:w-auto"
                    disabled={geocodeStatus === 'loading'}
                    onClick={lookupCoordinates}
                >
                    <MapPin className="h-3.5 w-3.5" />
                    {geocodeStatus === 'loading' ? 'Looking up…' : 'Auto-fill coordinates'}
                </Button>
            </label>

            <div className="flex flex-col gap-2 font-medium text-foreground text-sm">
                <span id="timezone-label">Timezone</span>
                <TimezoneCombobox
                    ariaLabelledBy="timezone-label"
                    value={settings.timeZone}
                    onChange={(zone) => onFieldChange('timeZone', zone)}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                    Latitude (°)
                    <input
                        className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground text-sm shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        onChange={handleChange('latitude')}
                        placeholder="45.3506"
                        type="text"
                        value={settings.latitude}
                    />
                </label>
                <label className="flex flex-col gap-2 font-medium text-foreground text-sm">
                    Longitude (°)
                    <input
                        className="rounded-xl border border-border/60 bg-background/60 px-4 py-3 text-foreground text-sm shadow-sm transition focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
                        onChange={handleChange('longitude')}
                        placeholder="-75.7930"
                        type="text"
                        value={settings.longitude}
                    />
                </label>
            </div>

            <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full gap-2 text-xs md:w-auto"
                disabled={locationStatus === 'loading'}
                onClick={requestBrowserLocation}
            >
                <Navigation className="h-3.5 w-3.5" />
                {locationStatus === 'loading' ? 'Getting location…' : 'Use my current location'}
            </Button>
        </div>
    );
}
