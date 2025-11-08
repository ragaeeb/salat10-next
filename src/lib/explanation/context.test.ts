import { describe, expect, it } from 'bun:test';
import { type CalculationParameters, type Coordinates, HighLatitudeRule, Madhab } from 'adhan';
import { buildCalculationContext } from './context';

describe('buildCalculationContext', () => {
    const coordinates: Coordinates = { latitude: 40.7128, longitude: -74.006 }; // New York
    const date = new Date('2025-01-15T12:00:00Z');
    const timeZone = 'America/New_York';

    const createParameters = (overrides: Partial<CalculationParameters> = {}): CalculationParameters =>
        ({
            adjustments: { asr: 0, dhuhr: 0, fajr: 0, isha: 0, maghrib: 0, sunrise: 0 },
            fajrAngle: 18,
            highLatitudeRule: HighLatitudeRule.MiddleOfTheNight,
            ishaAngle: 18,
            ishaInterval: 0,
            madhab: Madhab.Shafi,
            maghribAngle: 0,
            method: 'MuslimWorldLeague',
            methodAdjustments: { asr: 0, dhuhr: 0, fajr: 0, isha: 0, maghrib: 0, sunrise: 0 },
            nightPortions: () => ({ fajr: 1 / 6, isha: 1 / 6 }),
            shafaq: 'general',
            ...overrides,
        }) as any;

    describe('inputs', () => {
        it('should populate address', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'New York, NY',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.address).toBe('New York, NY');
        });

        it('should trim address whitespace', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: '  New York  ',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.address).toBe('New York');
        });

        it('should use default address for empty string', () => {
            const params = createParameters();
            const context = buildCalculationContext({ address: '', coordinates, date, parameters: params, timeZone });
            expect(context.inputs.address).toBe('your location');
        });

        it('should use default address for whitespace only', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: '   ',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.address).toBe('your location');
        });

        it('should populate coordinates', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.coordinates.latitude).toBe(40.7128);
            expect(context.inputs.coordinates.longitude).toBe(-74.006);
        });

        it('should populate timezone', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.timeZone).toBe('America/New_York');
        });

        it('should populate timezone label', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.timezoneLabel).toBeDefined();
            expect(typeof context.inputs.timezoneLabel).toBe('string');
        });

        it('should populate method', () => {
            const params = createParameters({ method: 'NorthAmerica' });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.method).toBe('NorthAmerica');
        });

        it('should use "Other" for undefined method', () => {
            const params = createParameters({ method: undefined as any });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.method).toBe('Other');
        });

        it('should populate madhab', () => {
            const params = createParameters({ madhab: Madhab.Hanafi });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.madhab).toBe(Madhab.Hanafi);
        });

        it('should populate highLatitudeRule as string', () => {
            const params = createParameters({ highLatitudeRule: HighLatitudeRule.SeventhOfTheNight });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.highLatitudeRule).toBe('seventhofthenight');
        });

        it('should use default highLatitudeRule if not string', () => {
            const params = createParameters({ highLatitudeRule: null as any });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.highLatitudeRule).toBe('middleofthenight');
        });

        it('should populate fajrAngle', () => {
            const params = createParameters({ fajrAngle: 15 });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.fajrAngle).toBe(15);
        });

        it('should populate ishaAngle', () => {
            const params = createParameters({ ishaAngle: 15 });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.ishaAngle).toBe(15);
        });

        it('should populate ishaInterval', () => {
            const params = createParameters({ ishaInterval: 90 });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.inputs.ishaInterval).toBe(90);
        });
    });

    describe('julian', () => {
        it('should calculate julian day', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.julian.day).toBeGreaterThan(2451545); // After J2000
        });

        it('should calculate julian century', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.julian.century).toBeGreaterThan(0); // After J2000
        });

        it('should have consistent julian values', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.julian.century).toBeCloseTo((context.julian.day - 2451545) / 36525, 5);
        });
    });

    describe('orbital', () => {
        it('should calculate mean longitude', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.orbital.meanLongitude).toBeGreaterThanOrEqual(0);
            expect(context.orbital.meanLongitude).toBeLessThan(360);
        });

        it('should calculate mean anomaly', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.orbital.meanAnomaly).toBeGreaterThanOrEqual(0);
            expect(context.orbital.meanAnomaly).toBeLessThan(360);
        });

        it('should calculate equation of center', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(Math.abs(context.orbital.equationOfCenter)).toBeLessThan(3);
        });

        it('should calculate apparent longitude', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.orbital.apparentLongitude).toBeGreaterThanOrEqual(0);
            expect(context.orbital.apparentLongitude).toBeLessThan(360);
        });

        it('should calculate lunar longitude', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.orbital.lunarLongitude).toBeGreaterThanOrEqual(0);
            expect(context.orbital.lunarLongitude).toBeLessThan(360);
        });

        it('should calculate ascending node', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.orbital.ascendingNode).toBeGreaterThanOrEqual(0);
            expect(context.orbital.ascendingNode).toBeLessThan(360);
        });
    });

    describe('obliquity', () => {
        it('should calculate mean obliquity', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.obliquity.mean).toBeGreaterThan(23);
            expect(context.obliquity.mean).toBeLessThan(24);
        });

        it('should calculate apparent obliquity', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.obliquity.apparent).toBeGreaterThan(23);
            expect(context.obliquity.apparent).toBeLessThan(24);
        });

        it('should calculate nutation in longitude', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(Math.abs(context.obliquity.nutationLongitude)).toBeLessThan(0.1);
        });

        it('should calculate nutation in obliquity', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(Math.abs(context.obliquity.nutationObliquity)).toBeLessThan(0.1);
        });
    });

    describe('solar', () => {
        it('should calculate declination', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.solar.declination).toBeGreaterThan(-24);
            expect(context.solar.declination).toBeLessThan(24);
        });

        it('should calculate right ascension', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.solar.rightAscension).toBeGreaterThanOrEqual(0);
            expect(context.solar.rightAscension).toBeLessThan(360);
        });

        it('should calculate sidereal time', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.solar.sidereal).toBeGreaterThanOrEqual(0);
            expect(context.solar.sidereal).toBeLessThan(360);
        });

        it('should calculate sidereal hours', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.solar.siderealHours).toBeCloseTo(context.solar.sidereal / 15, 5);
        });
    });

    describe('transit', () => {
        it('should calculate approximate transit fraction', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.transit.approxFraction).toBeGreaterThanOrEqual(0);
            expect(context.transit.approxFraction).toBeLessThan(1);
        });

        it('should calculate approximate transit date', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.transit.approxDate).toBeInstanceOf(Date);
            expect(context.transit.approxDate.getDate()).toBe(date.getDate());
        });

        it('should calculate solar noon', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.transit.solarNoon).toBeInstanceOf(Date);
        });

        it('should calculate sunrise', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.transit.sunrise).toBeInstanceOf(Date);
            expect(context.transit.sunrise.getTime()).toBeLessThan(context.transit.solarNoon.getTime());
        });

        it('should calculate sunset', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.transit.sunset).toBeInstanceOf(Date);
            expect(context.transit.sunset.getTime()).toBeGreaterThan(context.transit.solarNoon.getTime());
        });

        it('should calculate next day sunrise', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.transit.sunriseNext).toBeInstanceOf(Date);
            expect(context.transit.sunriseNext.getTime()).toBeGreaterThan(context.transit.sunset.getTime());
        });
    });

    describe('safeties', () => {
        it('should calculate night seconds', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.nightSeconds).toBeGreaterThan(0);
            expect(context.safeties.nightSeconds).toBeLessThan(86400); // Less than 24 hours
        });

        it('should calculate night hours', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.nightHours).toBeCloseTo(context.safeties.nightSeconds / 3600, 5);
        });

        it('should calculate night portions', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.nightPortions.fajr).toBeGreaterThan(0);
            expect(context.safeties.nightPortions.fajr).toBeLessThan(1);
            expect(context.safeties.nightPortions.isha).toBeGreaterThan(0);
            expect(context.safeties.nightPortions.isha).toBeLessThan(1);
        });

        it('should calculate fajr night seconds', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.fajrNightSeconds).toBeGreaterThan(0);
            expect(context.safeties.fajrNightSeconds).toBeLessThan(context.safeties.nightSeconds);
        });

        it('should calculate isha night seconds', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.ishaNightSeconds).toBeGreaterThan(0);
            expect(context.safeties.ishaNightSeconds).toBeLessThan(context.safeties.nightSeconds);
        });

        it('should calculate raw fajr time', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.rawFajr).toBeInstanceOf(Date);
        });

        it('should calculate raw isha time', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.rawIsha).toBeInstanceOf(Date);
        });

        it('should calculate safe fajr time', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.safeFajr).toBeInstanceOf(Date);
        });

        it('should calculate safe isha time', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.safeIsha).toBeInstanceOf(Date);
        });

        it('should calculate final fajr time', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.finalFajr).toBeInstanceOf(Date);
        });

        it('should calculate final isha time', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.finalIsha).toBeInstanceOf(Date);
        });

        it('should track if safe fajr was used', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(typeof context.safeties.usedSafeFajr).toBe('boolean');
        });

        it('should track if safe isha was used', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(typeof context.safeties.usedSafeIsha).toBe('boolean');
        });

        it('should detect Moonsighting method', () => {
            const params = createParameters({ method: 'MoonsightingCommittee' });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.usesMoonsighting).toBe(true);
        });

        it('should detect non-Moonsighting method', () => {
            const params = createParameters({ method: 'MuslimWorldLeague' });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.usesMoonsighting).toBe(false);
        });

        it('should detect isha interval usage', () => {
            const params = createParameters({ ishaInterval: 90 });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.usesIshaInterval).toBe(true);
        });

        it('should detect no isha interval', () => {
            const params = createParameters({ ishaInterval: 0 });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.usesIshaInterval).toBe(false);
        });

        it('should calculate morning coefficients', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.morningCoefficients.a).toBeGreaterThan(0);
            expect(context.safeties.morningCoefficients.b).toBeGreaterThan(0);
            expect(context.safeties.morningCoefficients.c).toBeGreaterThan(0);
            expect(context.safeties.morningCoefficients.d).toBeGreaterThan(0);
        });

        it('should calculate evening coefficients', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.eveningCoefficients.a).toBeGreaterThan(0);
            expect(context.safeties.eveningCoefficients.b).toBeGreaterThan(0);
            expect(context.safeties.eveningCoefficients.c).toBeGreaterThan(0);
            expect(context.safeties.eveningCoefficients.d).toBeGreaterThan(0);
        });

        it('should vary evening coefficients by shafaq type', () => {
            const params1 = createParameters({ shafaq: 'ahmer' });
            const params2 = createParameters({ shafaq: 'abyad' });
            const context1 = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params1,
                timeZone,
            });
            const context2 = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params2,
                timeZone,
            });
            expect(context1.safeties.eveningCoefficients.a).not.toBe(context2.safeties.eveningCoefficients.a);
        });

        it('should calculate morning adjustment minutes', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(typeof context.safeties.morningAdjustmentMinutes).toBe('number');
        });

        it('should calculate evening adjustment minutes', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(typeof context.safeties.eveningAdjustmentMinutes).toBe('number');
        });

        it('should calculate day of year value', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.dayOfYearValue).toBe(15); // Jan 15
        });

        it('should calculate days from solstice', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.daysFromSolstice).toBeGreaterThanOrEqual(0);
            expect(context.safeties.daysFromSolstice).toBeLessThan(366);
        });

        it('should calculate fajr offset minutes', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.fajrOffsetMinutes).toBeGreaterThan(0);
        });

        it('should calculate isha offset minutes', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.ishaOffsetMinutes).toBeGreaterThan(0);
        });

        it('should use isha interval when specified', () => {
            const params = createParameters({ ishaInterval: 90 });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            const ishaOffsetMinutes =
                (context.safeties.finalIsha.getTime() - context.transit.sunset.getTime()) / (1000 * 60);
            expect(ishaOffsetMinutes).toBeCloseTo(90, 0);
        });
    });

    describe('geometry', () => {
        it('should calculate Asr shadow for Shafi madhab', () => {
            const params = createParameters({ madhab: Madhab.Shafi });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.geometry.asrShadow).toBe(1);
        });

        it('should calculate Asr shadow for Hanafi madhab', () => {
            const params = createParameters({ madhab: Madhab.Hanafi });
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.geometry.asrShadow).toBe(2);
        });

        it('should calculate latitude-declination separation', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.geometry.latitudeDeclinationSeparation).toBeGreaterThanOrEqual(0);
        });
    });

    describe('adjustments', () => {
        it('should calculate approximate transit diff minutes', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(typeof context.adjustments.approxTransitDiffMinutes).toBe('number');
        });

        it('should determine transit direction', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(['earlier', 'later', 'exact']).toContain(context.adjustments.approxTransitDirection);
        });

        it('should mark exact when diff is zero', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            if (context.adjustments.approxTransitDiffMinutes === 0) {
                expect(context.adjustments.approxTransitDirection).toBe('exact');
            }
        });

        it('should mark later when diff is positive', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            if (context.adjustments.approxTransitDiffMinutes > 0) {
                expect(context.adjustments.approxTransitDirection).toBe('later');
            }
        });

        it('should mark earlier when diff is negative', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            if (context.adjustments.approxTransitDiffMinutes < 0) {
                expect(context.adjustments.approxTransitDirection).toBe('earlier');
            }
        });
    });

    describe('prayerTimes', () => {
        it('should calculate prayer times', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.prayerTimes).toBeDefined();
            expect(context.prayerTimes.fajr).toBeInstanceOf(Date);
            expect(context.prayerTimes.sunrise).toBeInstanceOf(Date);
            expect(context.prayerTimes.dhuhr).toBeInstanceOf(Date);
            expect(context.prayerTimes.asr).toBeInstanceOf(Date);
            expect(context.prayerTimes.maghrib).toBeInstanceOf(Date);
            expect(context.prayerTimes.isha).toBeInstanceOf(Date);
        });

        it('should have prayers in order', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.prayerTimes.fajr.getTime()).toBeLessThan(context.prayerTimes.sunrise.getTime());
            expect(context.prayerTimes.sunrise.getTime()).toBeLessThan(context.prayerTimes.dhuhr.getTime());
            expect(context.prayerTimes.dhuhr.getTime()).toBeLessThan(context.prayerTimes.asr.getTime());
            expect(context.prayerTimes.asr.getTime()).toBeLessThan(context.prayerTimes.maghrib.getTime());
            expect(context.prayerTimes.maghrib.getTime()).toBeLessThan(context.prayerTimes.isha.getTime());
        });
    });

    describe('sunnahTimes', () => {
        it('should calculate sunnah times', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.sunnahTimes).toBeDefined();
        });

        it('should have middle of night', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.sunnahTimes.middleOfTheNight).toBeInstanceOf(Date);
        });

        it('should have last third of night', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.sunnahTimes.lastThirdOfTheNight).toBeInstanceOf(Date);
        });
    });

    describe('hijri', () => {
        it('should calculate Hijri date', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.hijri).toBeDefined();
            expect(context.hijri.islamic.year).toBeGreaterThan(1400);
        });

        it('should have weekday name', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(typeof context.hijri.weekdayName).toBe('string');
            expect(context.hijri.weekdayName.length).toBeGreaterThan(0);
        });

        it('should have month name', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(typeof context.hijri.islamic.monthName).toBe('string');
            expect(context.hijri.islamic.monthName.length).toBeGreaterThan(0);
        });

        it('should have valid day', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.hijri.islamic.day).toBeGreaterThan(0);
            expect(context.hijri.islamic.day).toBeLessThanOrEqual(30);
        });

        it('should have valid month index', () => {
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date,
                parameters: params,
                timeZone,
            });
            expect(context.hijri.islamic.monthIndex).toBeGreaterThanOrEqual(0);
            expect(context.hijri.islamic.monthIndex).toBeLessThan(12);
        });
    });

    describe('edge cases', () => {
        it('should handle southern hemisphere coordinates', () => {
            const southCoords: Coordinates = { latitude: -33.8688, longitude: 151.2093 }; // Sydney
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'Sydney',
                coordinates: southCoords,
                date,
                parameters: params,
                timeZone: 'Australia/Sydney',
            });
            expect(context.inputs.coordinates.latitude).toBe(-33.8688);
            expect(context.prayerTimes.fajr).toBeInstanceOf(Date);
        });

        it('should handle high latitude coordinates', () => {
            const highCoords: Coordinates = { latitude: 64.8378, longitude: -147.7164 }; // Fairbanks, Alaska
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'Fairbanks',
                coordinates: highCoords,
                date,
                parameters: params,
                timeZone: 'America/Anchorage',
            });
            expect(context.safeties.usedSafeFajr || context.safeties.usedSafeIsha).toBeDefined();
        });

        it('should handle dates in different months', () => {
            const summerDate = new Date('2025-06-21T12:00:00Z');
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date: summerDate,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.dayOfYearValue).toBeGreaterThan(150);
        });

        it('should handle leap year dates', () => {
            const leapDate = new Date('2024-02-29T12:00:00Z');
            const params = createParameters();
            const context = buildCalculationContext({
                address: 'NYC',
                coordinates,
                date: leapDate,
                parameters: params,
                timeZone,
            });
            expect(context.safeties.dayOfYearValue).toBe(60);
        });

        it('should handle different calculation methods', () => {
            const methods = [
                'MuslimWorldLeague',
                'Egyptian',
                'Karachi',
                'UmmAlQura',
                'Dubai',
                'Qatar',
                'Kuwait',
                'Singapore',
                'NorthAmerica',
                'Tehran',
            ];
            methods.forEach((method) => {
                const params = createParameters({ method } as any);
                const context = buildCalculationContext({
                    address: 'NYC',
                    coordinates,
                    date,
                    parameters: params,
                    timeZone,
                });
                expect(context.inputs.method).toBe(method);
                expect(context.prayerTimes.fajr).toBeInstanceOf(Date);
            });
        });
    });
});
