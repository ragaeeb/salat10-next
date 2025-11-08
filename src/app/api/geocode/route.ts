import { type NextRequest, NextResponse } from 'next/server';
import { validateOrigin } from '@/lib/security';

/**
 * Geocode API response from geocode.maps.co
 */
type GeocodeResult = {
    lat: string;
    lon: string;
    display_name: string;
    address?: {
        city?: string;
        town?: string;
        village?: string;
        state?: string;
        state_district?: string;
        country?: string;
        country_code?: string;
    };
    name?: string;
};

/**
 * Extract location details from geocode response
 * Priority: city/town/village > state_district > state > country
 *
 * @param result - Geocode API result
 * @returns Location details with city, state, and country
 */
function extractLocationDetails(result: GeocodeResult) {
    const address = result.address;

    // Get city name (try city, town, village, or use main name as fallback)
    const city = address?.city || address?.town || address?.village || result.name || undefined;

    // Get state (prefer state_district for more specific region, fall back to state)
    const state = address?.state_district || address?.state || undefined;

    // Get country
    const country = address?.country || undefined;

    return { city, country, state };
}

/**
 * Validate address format - reject suspicious patterns
 */
function isValidAddress(address: string): boolean {
    // Reject HTML tags, script content, and other suspicious patterns
    const invalidPatterns = [/<[^>]*>/, /<script/i, /javascript:/i, /on\w+=/i];
    return !invalidPatterns.some((pattern) => pattern.test(address));
}

/**
 * GET /api/geocode
 * Convert address to coordinates using geocode.maps.co API
 *
 * Query params:
 * - address: string - Address or location to geocode
 *
 * Returns:
 * - 200: { latitude: number, longitude: number, label: string, city?: string, state?: string, country?: string }
 * - 400: Missing or invalid address
 * - 404: Location not found
 * - 500: Server error or API error
 */
export async function GET(request: NextRequest) {
    const origin = request.headers.get('origin');
    const referer = request.headers.get('referer');

    if (!validateOrigin(origin, referer)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address?.trim()) {
        return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
    }

    if (!isValidAddress(address)) {
        return NextResponse.json({ error: 'Invalid address format' }, { status: 400 });
    }

    try {
        const apiKey = process.env.GEOCODE_API_KEY;
        const url = apiKey
            ? `https://geocode.maps.co/search?q=${encodeURIComponent(address)}&api_key=${apiKey}`
            : `https://geocode.maps.co/search?q=${encodeURIComponent(address)}`;

        const response = await fetch(url);

        if (!response.ok) {
            console.error('Geocode API error:', response.status, response.statusText);
            return NextResponse.json({ error: 'Failed to fetch from geocoding service' }, { status: 500 });
        }

        const data: GeocodeResult[] = await response.json();

        if (!Array.isArray(data) || data.length === 0) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }

        // Use first result
        const result = data[0]!;
        const latitude = Number.parseFloat(result.lat);
        const longitude = Number.parseFloat(result.lon);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return NextResponse.json({ error: 'Invalid coordinates in response' }, { status: 500 });
        }

        // Extract location details
        const { city, state, country } = extractLocationDetails(result);

        const responseData = {
            label: result.display_name,
            latitude,
            longitude,
            ...(city && { city }),
            ...(state && { state }),
            ...(country && { country }),
        };

        // Set CORS headers if origin is present
        const headers: Record<string, string> = {};
        if (origin) {
            headers['Access-Control-Allow-Origin'] = origin;
        }

        return NextResponse.json(responseData, { headers });
    } catch (error) {
        console.error('Geocode error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
