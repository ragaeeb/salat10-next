import { NextResponse } from 'next/server';

type GeocodeApiResponse = Array<{ lat: string; lon: string; display_name?: string }>;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address || address.trim().length === 0) {
        return NextResponse.json({ error: 'Address parameter is required' }, { status: 400 });
    }

    const apiKey = process.env.GEOCODE_API_KEY;
    if (!apiKey) {
        console.error('GEOCODE_API_KEY environment variable is not set');
        return NextResponse.json({ error: 'Geocoding service is not configured' }, { status: 500 });
    }

    try {
        const response = await fetch(
            `https://geocode.maps.co/search?q=${encodeURIComponent(address)}&limit=1&api_key=${apiKey}`,
            { headers: { Accept: 'application/json' } },
        );

        if (!response.ok) {
            console.error(`Geocoding API returned status ${response.status}`);
            return NextResponse.json({ error: 'Failed to fetch coordinates from geocoding service' }, { status: 502 });
        }

        const data = (await response.json()) as GeocodeApiResponse;

        if (!Array.isArray(data) || data.length === 0) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }

        const match = data[0];
        if (!match) {
            return NextResponse.json({ error: 'Location not found' }, { status: 404 });
        }

        const latitude = Number.parseFloat(match.lat);
        const longitude = Number.parseFloat(match.lon);

        if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
            return NextResponse.json({ error: 'Invalid coordinates received from service' }, { status: 502 });
        }

        return NextResponse.json({ label: match.display_name || null, latitude, longitude });
    } catch (error) {
        console.error('Geocoding request failed:', error);
        return NextResponse.json({ error: 'An error occurred while geocoding' }, { status: 500 });
    }
}
