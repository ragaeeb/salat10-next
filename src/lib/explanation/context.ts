import { type CalculationParameters, type Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import { explainHijriConversion, type HijriExplanation } from '@/lib/hijri';
import {
    apparentObliquityOfTheEcliptic,
    apparentSolarLongitude,
    approximateTransit,
    ascendingLunarNodeLongitude,
    correctedHourAngle,
    correctedTransit,
    dateByAddingDays,
    dateByAddingSeconds,
    dayOfYear,
    daysSinceSolstice,
    degreesToRadians,
    evaluateSeasonalAdjustment,
    fractionalDayToDate,
    hoursToDate,
    julianCentury,
    julianDay,
    meanLunarLongitude,
    meanObliquityOfTheEcliptic,
    meanSiderealTime,
    meanSolarAnomaly,
    meanSolarLongitude,
    nutationInLongitude,
    nutationInObliquity,
    radiansToDegrees,
    SECONDS_PER_HOUR,
    SOLAR_ALTITUDE,
    seasonAdjustedEveningTwilight,
    seasonAdjustedMorningTwilight,
    shortTimeZone,
    solarEquationOfTheCenter,
    unwindAngle,
} from './math';

/**
 * Input parameters for prayer time calculations
 */
export interface CalculationInputs {
    /** User-friendly location description */
    address: string;
    /** Geographic coordinates of observer */
    coordinates: Coordinates;
    /** Date to calculate prayer times for */
    date: Date;
    /** Calculation method and angle parameters */
    parameters: CalculationParameters;
    /** IANA timezone identifier (e.g., "America/New_York") */
    timeZone: string;
}

/**
 * Complete calculation context with all intermediate and final values
 * Used for displaying step-by-step explanations of prayer time calculations
 */
export interface CalculationContext {
    /** User inputs and configuration */
    inputs: {
        /** Location description */
        address: string;
        /** Geographic coordinates */
        coordinates: Coordinates;
        /** IANA timezone identifier */
        timeZone: string;
        /** Short timezone label (e.g., "EST") */
        timezoneLabel: string;
        /** Calculation method name */
        method: string;
        /** Juristic school (Shafi or Hanafi) */
        madhab: string;
        /** High latitude rule applied */
        highLatitudeRule: string;
        /** Fajr angle in degrees below horizon */
        fajrAngle: number;
        /** Isha angle in degrees below horizon */
        ishaAngle: number;
        /** Isha interval in minutes after Maghrib (0 if not used) */
        ishaInterval: number;
    };
    /** Julian calendar values */
    julian: {
        /** Julian Day Number */
        day: number;
        /** Julian centuries since J2000.0 epoch */
        century: number;
    };
    /** Orbital mechanics values */
    orbital: {
        /** Mean longitude of Sun in degrees */
        meanLongitude: number;
        /** Mean anomaly of Sun in degrees */
        meanAnomaly: number;
        /** Equation of center correction in degrees */
        equationOfCenter: number;
        /** Apparent longitude of Sun in degrees */
        apparentLongitude: number;
        /** Mean longitude of Moon in degrees */
        lunarLongitude: number;
        /** Longitude of Moon's ascending node in degrees */
        ascendingNode: number;
    };
    /** Earth's axial tilt values */
    obliquity: {
        /** Mean obliquity of ecliptic in degrees */
        mean: number;
        /** Apparent obliquity with nutation in degrees */
        apparent: number;
        /** Nutation in longitude in degrees */
        nutationLongitude: number;
        /** Nutation in obliquity in degrees */
        nutationObliquity: number;
    };
    /** Solar position values */
    solar: {
        /** Solar declination in degrees */
        declination: number;
        /** Solar right ascension in degrees */
        rightAscension: number;
        /** Apparent sidereal time in degrees */
        sidereal: number;
        /** Apparent sidereal time in hours */
        siderealHours: number;
    };
    /** Solar transit and rise/set times */
    transit: {
        /** Approximate transit as fraction of day (0-1) */
        approxFraction: number;
        /** Approximate transit time */
        approxDate: Date;
        /** Solar noon (corrected transit) */
        solarNoon: Date;
        /** Sunrise time */
        sunrise: Date;
        /** Sunset time */
        sunset: Date;
        /** Next day's sunrise time */
        sunriseNext: Date;
    };
    /** High latitude safety calculations */
    safeties: {
        /** Night duration in seconds */
        nightSeconds: number;
        /** Night duration in hours */
        nightHours: number;
        /** Night portion fractions for Fajr and Isha */
        nightPortions: { fajr: number; isha: number };
        /** Fajr portion of night in seconds */
        fajrNightSeconds: number;
        /** Isha portion of night in seconds */
        ishaNightSeconds: number;
        /** Raw Fajr time from angle calculation */
        rawFajr: Date;
        /** Raw Isha time from angle or interval */
        rawIsha: Date;
        /** Safe Fajr time from high latitude rule */
        safeFajr: Date;
        /** Safe Isha time from high latitude rule */
        safeIsha: Date;
        /** Final Fajr time (raw or safe) */
        finalFajr: Date;
        /** Final Isha time (raw or safe) */
        finalIsha: Date;
        /** Whether safe Fajr was used */
        usedSafeFajr: boolean;
        /** Whether safe Isha was used */
        usedSafeIsha: boolean;
        /** Whether Moonsighting Committee method is used */
        usesMoonsighting: boolean;
        /** Whether Isha interval is used instead of angle */
        usesIshaInterval: boolean;
        /** Morning twilight seasonal coefficients */
        morningCoefficients: { a: number; b: number; c: number; d: number };
        /** Evening twilight seasonal coefficients */
        eveningCoefficients: { a: number; b: number; c: number; d: number };
        /** Morning adjustment in minutes */
        morningAdjustmentMinutes: number;
        /** Evening adjustment in minutes */
        eveningAdjustmentMinutes: number;
        /** Day of year (1-366) */
        dayOfYearValue: number;
        /** Days since winter solstice */
        daysFromSolstice: number;
        /** Minutes from Fajr to sunrise */
        fajrOffsetMinutes: number;
        /** Minutes from sunset to Isha */
        ishaOffsetMinutes: number;
    };
    /** Geometric calculations */
    geometry: {
        /** Shadow length ratio for Asr (1 for Shafi, 2 for Hanafi) */
        asrShadow: number;
        /** Absolute difference between latitude and declination */
        latitudeDeclinationSeparation: number;
    };
    /** Transit timing adjustments */
    adjustments: {
        /** Difference in minutes between approximate and corrected transit */
        approxTransitDiffMinutes: number;
        /** Direction of correction */
        approxTransitDirection: 'earlier' | 'later' | 'exact';
    };
    /** Calculated prayer times */
    prayerTimes: PrayerTimes;
    /** Calculated sunnah times (Qiyam, etc.) */
    sunnahTimes: SunnahTimes;
    /** Hijri calendar conversion details */
    hijri: HijriExplanation;
}

/**
 * Solar coordinates for a given Julian Day
 * Calculates declination, right ascension, and sidereal time
 */
class SolarCoordinates {
    /** Solar declination in degrees */
    declination: number;
    /** Solar right ascension in degrees */
    rightAscension: number;
    /** Apparent sidereal time in degrees */
    apparentSiderealTime: number;

    /**
     * Calculate solar coordinates for given Julian Day
     * @param julianDayValue - Julian Day Number
     */
    constructor(julianDayValue: number) {
        const T = julianCentury(julianDayValue);
        const L0 = meanSolarLongitude(T);
        const Lp = meanLunarLongitude(T);
        const Omega = ascendingLunarNodeLongitude(T);
        const Lambda = degreesToRadians(apparentSolarLongitude(T, L0));
        const Theta0 = meanSiderealTime(T);
        const dPsi = nutationInLongitude(T, L0, Lp, Omega);
        const dEpsilon = nutationInObliquity(T, L0, Lp, Omega);
        const Epsilon0 = meanObliquityOfTheEcliptic(T);
        const EpsilonApparent = degreesToRadians(apparentObliquityOfTheEcliptic(T, Epsilon0));

        this.declination = radiansToDegrees(Math.asin(Math.sin(EpsilonApparent) * Math.sin(Lambda)));
        this.rightAscension = unwindAngle(
            radiansToDegrees(Math.atan2(Math.cos(EpsilonApparent) * Math.sin(Lambda), Math.cos(Lambda))),
        );
        this.apparentSiderealTime = Theta0 + (dPsi * 3600 * Math.cos(degreesToRadians(Epsilon0 + dEpsilon))) / 3600;
    }
}

/**
 * Solar time calculator for a specific date and location
 * Calculates transit, sunrise, sunset, and other solar events
 */
class SolarTime {
    /** Observer's geographic coordinates */
    observer: Coordinates;
    /** Solar coordinates for calculation date */
    solar: SolarCoordinates;
    /** Solar coordinates for previous day */
    prevSolar: SolarCoordinates;
    /** Solar coordinates for next day */
    nextSolar: SolarCoordinates;
    /** Approximate transit as fraction of day */
    approxTransit: number;
    /** Corrected transit in hours */
    transit: number;
    /** Sunrise time in hours */
    sunrise: number;
    /** Sunset time in hours */
    sunset: number;

    /**
     * Calculate solar times for given date and location
     * @param date - Date to calculate for
     * @param coordinates - Observer's geographic coordinates
     */
    constructor(date: Date, coordinates: Coordinates) {
        const julianDayValue = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate(), 0);

        this.observer = coordinates;
        this.solar = new SolarCoordinates(julianDayValue);
        this.prevSolar = new SolarCoordinates(julianDayValue - 1);
        this.nextSolar = new SolarCoordinates(julianDayValue + 1);

        const m0 = approximateTransit(
            coordinates.longitude,
            this.solar.apparentSiderealTime,
            this.solar.rightAscension,
        );
        this.approxTransit = m0;
        this.transit = correctedTransit(
            m0,
            coordinates.longitude,
            this.solar.apparentSiderealTime,
            this.solar.rightAscension,
            this.prevSolar.rightAscension,
            this.nextSolar.rightAscension,
        );
        this.sunrise = correctedHourAngle(
            m0,
            SOLAR_ALTITUDE,
            coordinates,
            false,
            this.solar.apparentSiderealTime,
            this.solar.rightAscension,
            this.prevSolar.rightAscension,
            this.nextSolar.rightAscension,
            this.solar.declination,
            this.prevSolar.declination,
            this.nextSolar.declination,
        );
        this.sunset = correctedHourAngle(
            m0,
            SOLAR_ALTITUDE,
            coordinates,
            true,
            this.solar.apparentSiderealTime,
            this.solar.rightAscension,
            this.prevSolar.rightAscension,
            this.nextSolar.rightAscension,
            this.solar.declination,
            this.prevSolar.declination,
            this.nextSolar.declination,
        );
    }

    /**
     * Calculate hour angle for arbitrary solar altitude
     * @param angle - Solar altitude in degrees (negative for twilight)
     * @param afterTransit - True for afternoon events, false for morning
     * @returns Event time in hours (0-24)
     */
    hourAngle(angle: number, afterTransit: boolean) {
        return correctedHourAngle(
            this.approxTransit,
            angle,
            this.observer,
            afterTransit,
            this.solar.apparentSiderealTime,
            this.solar.rightAscension,
            this.prevSolar.rightAscension,
            this.nextSolar.rightAscension,
            this.solar.declination,
            this.prevSolar.declination,
            this.nextSolar.declination,
        );
    }

    /**
     * Calculate time when shadow length equals specified ratio
     * Used for Asr calculation
     * @param shadowLength - Shadow length ratio (1 for Shafi, 2 for Hanafi)
     * @returns Asr time in hours (0-24)
     */
    afternoon(shadowLength: number) {
        const tangent = Math.abs(this.observer.latitude - this.solar.declination);
        const inverse = shadowLength + Math.tan(degreesToRadians(tangent));
        const angle = radiansToDegrees(Math.atan(1.0 / inverse));
        return this.hourAngle(angle, true);
    }
}

/**
 * Get shadow length ratio based on madhab (juristic school)
 * @param madhab - Juristic school name
 * @returns Shadow length ratio (1 for Shafi, 2 for Hanafi)
 */
const shadowLengthFromMadhab = (madhab: string) => (madhab === 'hanafi' ? 2 : 1);

/**
 * Build complete calculation context with all intermediate values
 * This function performs all astronomical calculations and applies
 * high latitude rules to generate a comprehensive explanation context
 *
 * @param inputs - Calculation inputs (location, date, parameters)
 * @returns Complete calculation context with all intermediate and final values
 */
export const buildCalculationContext = ({
    address,
    coordinates,
    date,
    parameters,
    timeZone,
}: CalculationInputs): CalculationContext => {
    const solarTime = new SolarTime(date, coordinates);
    const prayerTimes = new PrayerTimes(coordinates, date, parameters);
    const tomorrow = dateByAddingDays(date, 1);
    const sunnahTimes = new SunnahTimes(prayerTimes);

    // Julian calendar calculations
    const julianDayValue = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate(), 0);
    const julianCenturyValue = julianCentury(julianDayValue);

    // Orbital mechanics
    const meanLongitude = meanSolarLongitude(julianCenturyValue);
    const meanAnomaly = meanSolarAnomaly(julianCenturyValue);
    const equationOfCenter = solarEquationOfTheCenter(julianCenturyValue, meanAnomaly);
    const apparentLongitude = apparentSolarLongitude(julianCenturyValue, meanLongitude);
    const lunarLongitude = meanLunarLongitude(julianCenturyValue);
    const ascendingNode = ascendingLunarNodeLongitude(julianCenturyValue);

    // Nutation and obliquity
    const nutationLongitude = nutationInLongitude(julianCenturyValue, meanLongitude, lunarLongitude, ascendingNode);
    const nutationObliquity = nutationInObliquity(julianCenturyValue, meanLongitude, lunarLongitude, ascendingNode);
    const meanObliquityValue = meanObliquityOfTheEcliptic(julianCenturyValue);
    const apparentObliquityValue = apparentObliquityOfTheEcliptic(julianCenturyValue, meanObliquityValue);

    // Sidereal time
    const sidereal = solarTime.solar.apparentSiderealTime;
    const siderealHours = sidereal / 15;

    // Transit and rise/set times
    const approxTransitDate = fractionalDayToDate(solarTime.approxTransit, date);
    const sunriseTime = hoursToDate(solarTime.sunrise, date);
    const sunsetTime = hoursToDate(solarTime.sunset, date);
    const tomorrowSunrise = hoursToDate(new SolarTime(tomorrow, coordinates).sunrise, tomorrow);

    // Seasonal adjustment coefficients
    const dayOfYearValue = dayOfYear(date);
    const daysFromSolsticeValue = daysSinceSolstice(dayOfYearValue, date.getFullYear(), coordinates.latitude);
    const absoluteLatitude = Math.abs(coordinates.latitude);

    const morningCoefficients = {
        a: 75 + (28.65 / 55.0) * absoluteLatitude,
        b: 75 + (19.44 / 55.0) * absoluteLatitude,
        c: 75 + (32.74 / 55.0) * absoluteLatitude,
        d: 75 + (48.1 / 55.0) * absoluteLatitude,
    };

    const eveningCoefficients = (() => {
        if (parameters.shafaq === 'ahmer') {
            return {
                a: 62 + (17.4 / 55.0) * absoluteLatitude,
                b: 62 - (7.16 / 55.0) * absoluteLatitude,
                c: 62 + (5.12 / 55.0) * absoluteLatitude,
                d: 62 + (19.44 / 55.0) * absoluteLatitude,
            };
        }
        if (parameters.shafaq === 'abyad') {
            return {
                a: 75 + (25.6 / 55.0) * absoluteLatitude,
                b: 75 + (7.16 / 55.0) * absoluteLatitude,
                c: 75 + (36.84 / 55.0) * absoluteLatitude,
                d: 75 + (81.84 / 55.0) * absoluteLatitude,
            };
        }
        return {
            a: 75 + (25.6 / 55.0) * absoluteLatitude,
            b: 75 + (2.05 / 55.0) * absoluteLatitude,
            c: 75 - (9.21 / 55.0) * absoluteLatitude,
            d: 75 + (6.14 / 55.0) * absoluteLatitude,
        };
    })();

    const morningAdjustmentMinutes = evaluateSeasonalAdjustment(
        daysFromSolsticeValue,
        morningCoefficients.a,
        morningCoefficients.b,
        morningCoefficients.c,
        morningCoefficients.d,
    );

    const eveningAdjustmentMinutes = evaluateSeasonalAdjustment(
        daysFromSolsticeValue,
        eveningCoefficients.a,
        eveningCoefficients.b,
        eveningCoefficients.c,
        eveningCoefficients.d,
    );

    // High latitude safety calculations
    const nightSeconds = (tomorrowSunrise.getTime() - sunsetTime.getTime()) / 1000;
    const nightHours = nightSeconds / SECONDS_PER_HOUR;
    const nightPortions = parameters.nightPortions();
    const fajrNightSeconds = nightPortions.fajr * nightSeconds;
    const ishaNightSeconds = nightPortions.isha * nightSeconds;

    // Raw prayer times
    const rawFajrTime = hoursToDate(solarTime.hourAngle(-1 * parameters.fajrAngle, false), date);
    const rawIshaTime = parameters.ishaInterval
        ? dateByAddingSeconds(sunsetTime, parameters.ishaInterval * 60)
        : hoursToDate(solarTime.hourAngle(-1 * parameters.ishaAngle, true), date);

    const usesMoonsighting = parameters.method === 'MoonsightingCommittee';
    const usesIshaInterval = parameters.ishaInterval > 0;

    // Safe times for high latitudes
    const safeFajr = usesMoonsighting
        ? seasonAdjustedMorningTwilight(coordinates.latitude, dayOfYearValue, date.getFullYear(), sunriseTime)
        : dateByAddingSeconds(sunriseTime, -fajrNightSeconds);

    const safeIsha = usesMoonsighting
        ? seasonAdjustedEveningTwilight(
              coordinates.latitude,
              dayOfYearValue,
              date.getFullYear(),
              sunsetTime,
              parameters.shafaq,
          )
        : dateByAddingSeconds(sunsetTime, ishaNightSeconds);

    // Final times (raw or safe)
    const finalFajr = Number.isNaN(rawFajrTime.getTime()) || safeFajr > rawFajrTime ? safeFajr : rawFajrTime;
    const usedSafeFajr = finalFajr.getTime() === safeFajr.getTime();

    const finalIsha = usesIshaInterval
        ? rawIshaTime
        : Number.isNaN(rawIshaTime.getTime()) || safeIsha < rawIshaTime
          ? safeIsha
          : rawIshaTime;
    const usedSafeIsha = !usesIshaInterval && finalIsha.getTime() === safeIsha.getTime();

    const fajrOffsetMinutes = (sunriseTime.getTime() - finalFajr.getTime()) / (1000 * 60);
    const ishaOffsetMinutes = (finalIsha.getTime() - sunsetTime.getTime()) / (1000 * 60);

    // Transit adjustments
    const approxTransitDiffMinutes = (prayerTimes.dhuhr.getTime() - approxTransitDate.getTime()) / (1000 * 60);
    const approxTransitDirection =
        approxTransitDiffMinutes === 0 ? 'exact' : approxTransitDiffMinutes > 0 ? 'later' : 'earlier';

    // Geometric calculations
    const asrShadow = shadowLengthFromMadhab(parameters.madhab);
    const latitudeDeclinationSeparation = Math.abs(coordinates.latitude - solarTime.solar.declination);

    // Format inputs
    const timezoneLabel = shortTimeZone(date, timeZone) ?? timeZone;
    const highLatitudeRuleValue =
        typeof parameters.highLatitudeRule === 'string' ? parameters.highLatitudeRule : 'middleofthenight';
    const trimmedAddress = address?.trim()?.length ? address.trim() : 'your location';

    return {
        adjustments: { approxTransitDiffMinutes, approxTransitDirection },
        geometry: { asrShadow, latitudeDeclinationSeparation },
        hijri: explainHijriConversion(0, date),
        inputs: {
            address: trimmedAddress,
            coordinates,
            fajrAngle: parameters.fajrAngle,
            highLatitudeRule: highLatitudeRuleValue,
            ishaAngle: parameters.ishaAngle,
            ishaInterval: parameters.ishaInterval,
            madhab: parameters.madhab,
            method: parameters.method ?? 'Other',
            timeZone,
            timezoneLabel,
        },
        julian: { century: julianCenturyValue, day: julianDayValue },
        obliquity: { apparent: apparentObliquityValue, mean: meanObliquityValue, nutationLongitude, nutationObliquity },
        orbital: { apparentLongitude, ascendingNode, equationOfCenter, lunarLongitude, meanAnomaly, meanLongitude },
        prayerTimes,
        safeties: {
            dayOfYearValue,
            daysFromSolstice: daysFromSolsticeValue,
            eveningAdjustmentMinutes,
            eveningCoefficients,
            fajrNightSeconds,
            fajrOffsetMinutes,
            finalFajr,
            finalIsha,
            ishaNightSeconds,
            ishaOffsetMinutes,
            morningAdjustmentMinutes,
            morningCoefficients,
            nightHours,
            nightPortions,
            nightSeconds,
            rawFajr: rawFajrTime,
            rawIsha: rawIshaTime,
            safeFajr,
            safeIsha,
            usedSafeFajr,
            usedSafeIsha,
            usesIshaInterval,
            usesMoonsighting,
        },
        solar: {
            declination: solarTime.solar.declination,
            rightAscension: solarTime.solar.rightAscension,
            sidereal,
            siderealHours,
        },
        sunnahTimes,
        transit: {
            approxDate: approxTransitDate,
            approxFraction: solarTime.approxTransit,
            solarNoon: prayerTimes.dhuhr,
            sunrise: sunriseTime,
            sunriseNext: tomorrowSunrise,
            sunset: sunsetTime,
        },
    };
};
