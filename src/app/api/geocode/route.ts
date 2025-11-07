import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createCorsHeaders, validateOrigin } from '@/lib/security';

type GeocodeApiResponse = Array<{ lat: string; lon: string; display_name?: string }>;

const SUSPICIOUS_PATTERNS = [/<script/i, /javascript:/i, /on\w+=/i, /data:text\/html/i];

export function validateAddress(address: string | null): { valid: boolean; error?: string } {
    if (!address?.trim()) {
        return { error: 'Address parameter is required', valid: false };
    }
    if (address.length > 200) {
        return { error: 'Address too long (max 200 characters)', valid: false };
    }
    if (SUSPICIOUS_PATTERNS.some((pattern) => pattern.test(address))) {
        return { error: 'Invalid address format', valid: false };
    }
    return { valid: true };
}

export function validateCoordinates(lat: number, lon: number): boolean {
    return Number.isFinite(lat) && Number.isFinite(lon) && lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180;
}

type ErrorResponse = { error: string; status: number };
type GeoCodeResponse = { lat: number; lon: number; label?: string };

export async function fetchGeocode(address: string, apiKey: string): Promise<GeoCodeResponse | ErrorResponse> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const response = await fetch(
            `https://geocode.maps.co/search?q=${encodeURIComponent(address)}&limit=1&api_key=${apiKey}`,
            { headers: { Accept: 'application/json' }, signal: controller.signal },
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.error(`Geocoding API error: ${response.status}`);
            return { error: 'Geocoding service error', status: 502 };
        }

        const data: GeocodeApiResponse = await response.json();

        if (!Array.isArray(data) || data.length === 0 || !data[0]) {
            return { error: 'Location not found', status: 404 };
        }

        const [match] = data;
        const lat = Number.parseFloat(match.lat);
        const lon = Number.parseFloat(match.lon);

        if (!validateCoordinates(lat, lon)) {
            return { error: 'Invalid coordinates from service', status: 502 };
        }

        return { ...(match.display_name && { label: match.display_name }), lat, lon };
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            return { error: 'Request timeout', status: 504 };
        }
        console.error('Geocoding failed:', error);
        return { error: 'Service error', status: 500 };
    }
}

export async function GET(request: NextRequest) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    if (!validateOrigin(origin, referer)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    const addressValidation = validateAddress(address);
    if (!addressValidation.valid) {
        return NextResponse.json({ error: addressValidation.error }, { status: 400 });
    }

    const apiKey = process.env.GEOCODE_API_KEY;
    if (!apiKey) {
        console.error('GEOCODE_API_KEY not configured');
        return NextResponse.json({ error: 'Service unavailable' }, { status: 500 });
    }

    const result = await fetchGeocode(address!, apiKey);

    if ('error' in result) {
        return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(
        { label: result.label, latitude: result.lat, longitude: result.lon },
        { headers: createCorsHeaders(origin) },
    );
}
