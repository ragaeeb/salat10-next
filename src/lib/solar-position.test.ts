import { Coordinates, Madhab, PrayerTimes } from 'adhan';
import { SOLAR_ALTITUDE, degreesToRadians } from '@/lib/explanation/math';
import { createParameters } from '@/lib/settings';
import { getSolarPosition } from './solar-position';

describe('getSolarPosition', () => {
    const coordinates = new Coordinates(21.4225, 39.8262); // Makkah
    const params = createParameters({ fajrAngle: 18, ishaAngle: 17, ishaInterval: 0, method: 'MuslimWorldLeague' });
    params.madhab = Madhab.Shafi;

    it('matches sunrise altitude within tolerance', () => {
        const date = new Date(Date.UTC(2024, 2, 21, 0, 0, 0));
        const prayerTimes = new PrayerTimes(coordinates, date, params);
        const sunrisePosition = getSolarPosition({ coordinates, date: prayerTimes.sunrise });

        expect(Math.abs(sunrisePosition.altitude - SOLAR_ALTITUDE)).toBeLessThan(0.2);
        expect(sunrisePosition.azimuth).toBeGreaterThan(70);
        expect(sunrisePosition.azimuth).toBeLessThan(120);
    });

    it('peaks near solar noon with hour angle ~0', () => {
        const date = new Date(Date.UTC(2024, 5, 1, 0, 0, 0));
        const prayerTimes = new PrayerTimes(coordinates, date, params);
        const dhuhrPosition = getSolarPosition({ coordinates, date: prayerTimes.dhuhr });

        expect(Math.abs(dhuhrPosition.localHourAngle)).toBeLessThan(1);
        expect(dhuhrPosition.altitude).toBeGreaterThan(70);

        const preferredAzimuth = Math.abs(coordinates.latitude) >= Math.abs(dhuhrPosition.declination) ? 180 : 0;
        const azDiff = Math.min(
            Math.abs(dhuhrPosition.azimuth - preferredAzimuth),
            Math.abs(dhuhrPosition.azimuth - (preferredAzimuth + 360)),
        );
        expect(azDiff).toBeLessThan(30);
    });

    it('produces correct shadow ratio at Shafiʿī Asr', () => {
        const date = new Date(Date.UTC(2024, 8, 15, 0, 0, 0));
        const prayerTimes = new PrayerTimes(coordinates, date, params);
        const asrPosition = getSolarPosition({ coordinates, date: prayerTimes.asr });

        const shadowRatio = 1 / Math.tan(degreesToRadians(asrPosition.altitude));
        const baseline = Math.tan(degreesToRadians(Math.abs(coordinates.latitude - asrPosition.declination)));
        const expectedRatio = 1 + baseline;

        expect(shadowRatio).toBeGreaterThan(1);
        expect(shadowRatio).toBeCloseTo(expectedRatio, 1);
    });
});
