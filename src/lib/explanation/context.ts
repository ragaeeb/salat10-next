import { type CalculationParameters, type Coordinates, PrayerTimes, SunnahTimes } from 'adhan';
import { explainHijriConversion, type HijriExplanation } from '../hijri';
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

export interface CalculationInputs {
    address: string;
    coordinates: Coordinates;
    date: Date;
    parameters: CalculationParameters;
    timeZone: string;
}

export interface CalculationContext {
    inputs: {
        address: string;
        coordinates: Coordinates;
        timeZone: string;
        timezoneLabel: string;
        method: string;
        madhab: string;
        highLatitudeRule: string;
        fajrAngle: number;
        ishaAngle: number;
        ishaInterval: number;
    };
    julian: { day: number; century: number };
    orbital: {
        meanLongitude: number;
        meanAnomaly: number;
        equationOfCenter: number;
        apparentLongitude: number;
        lunarLongitude: number;
        ascendingNode: number;
    };
    obliquity: { mean: number; apparent: number; nutationLongitude: number; nutationObliquity: number };
    solar: { declination: number; rightAscension: number; sidereal: number; siderealHours: number };
    transit: {
        approxFraction: number;
        approxDate: Date;
        solarNoon: Date;
        sunrise: Date;
        sunset: Date;
        sunriseNext: Date;
    };
    safeties: {
        nightSeconds: number;
        nightHours: number;
        nightPortions: { fajr: number; isha: number };
        fajrNightSeconds: number;
        ishaNightSeconds: number;
        rawFajr: Date;
        rawIsha: Date;
        safeFajr: Date;
        safeIsha: Date;
        finalFajr: Date;
        finalIsha: Date;
        usedSafeFajr: boolean;
        usedSafeIsha: boolean;
        usesMoonsighting: boolean;
        usesIshaInterval: boolean;
        morningCoefficients: { a: number; b: number; c: number; d: number };
        eveningCoefficients: { a: number; b: number; c: number; d: number };
        morningAdjustmentMinutes: number;
        eveningAdjustmentMinutes: number;
        dayOfYearValue: number;
        daysFromSolstice: number;
        fajrOffsetMinutes: number;
        ishaOffsetMinutes: number;
    };
    geometry: { asrShadow: number; latitudeDeclinationSeparation: number };
    adjustments: { approxTransitDiffMinutes: number; approxTransitDirection: 'earlier' | 'later' | 'exact' };
    prayerTimes: PrayerTimes;
    sunnahTimes: SunnahTimes;
    hijri: HijriExplanation;
}

class SolarCoordinates {
    declination: number;
    rightAscension: number;
    apparentSiderealTime: number;

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

class SolarTime {
    observer: Coordinates;
    solar: SolarCoordinates;
    prevSolar: SolarCoordinates;
    nextSolar: SolarCoordinates;
    approxTransit: number;
    transit: number;
    sunrise: number;
    sunset: number;

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

    afternoon(shadowLength: number) {
        const tangent = Math.abs(this.observer.latitude - this.solar.declination);
        const inverse = shadowLength + Math.tan(degreesToRadians(tangent));
        const angle = radiansToDegrees(Math.atan(1.0 / inverse));
        return this.hourAngle(angle, true);
    }
}

const shadowLengthFromMadhab = (madhab: string) => (madhab === 'hanafi' ? 2 : 1);

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

    const julianDayValue = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate(), 0);
    const julianCenturyValue = julianCentury(julianDayValue);
    const meanLongitude = meanSolarLongitude(julianCenturyValue);
    const meanAnomaly = meanSolarAnomaly(julianCenturyValue);
    const equationOfCenter = solarEquationOfTheCenter(julianCenturyValue, meanAnomaly);
    const apparentLongitude = apparentSolarLongitude(julianCenturyValue, meanLongitude);
    const lunarLongitude = meanLunarLongitude(julianCenturyValue);
    const ascendingNode = ascendingLunarNodeLongitude(julianCenturyValue);
    const nutationLongitude = nutationInLongitude(julianCenturyValue, meanLongitude, lunarLongitude, ascendingNode);
    const nutationObliquity = nutationInObliquity(julianCenturyValue, meanLongitude, lunarLongitude, ascendingNode);
    const meanObliquityValue = meanObliquityOfTheEcliptic(julianCenturyValue);
    const apparentObliquityValue = apparentObliquityOfTheEcliptic(julianCenturyValue, meanObliquityValue);
    const sidereal = solarTime.solar.apparentSiderealTime;
    const siderealHours = sidereal / 15;

    const approxTransitDate = fractionalDayToDate(solarTime.approxTransit, date);
    const sunriseTime = hoursToDate(solarTime.sunrise, date);
    const sunsetTime = hoursToDate(solarTime.sunset, date);
    const tomorrowSunrise = hoursToDate(new SolarTime(tomorrow, coordinates).sunrise, tomorrow);

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

    const nightSeconds = (tomorrowSunrise.getTime() - sunsetTime.getTime()) / 1000;
    const nightHours = nightSeconds / SECONDS_PER_HOUR;
    const nightPortions = parameters.nightPortions();
    const fajrNightSeconds = nightPortions.fajr * nightSeconds;
    const ishaNightSeconds = nightPortions.isha * nightSeconds;

    const rawFajrTime = hoursToDate(solarTime.hourAngle(-1 * parameters.fajrAngle, false), date);
    const rawIshaTime = parameters.ishaInterval
        ? dateByAddingSeconds(sunsetTime, parameters.ishaInterval * 60)
        : hoursToDate(solarTime.hourAngle(-1 * parameters.ishaAngle, true), date);

    const usesMoonsighting = parameters.method === 'MoonsightingCommittee';
    const usesIshaInterval = parameters.ishaInterval > 0;

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

    const approxTransitDiffMinutes = (prayerTimes.dhuhr.getTime() - approxTransitDate.getTime()) / (1000 * 60);
    const approxTransitDirection =
        approxTransitDiffMinutes === 0 ? 'exact' : approxTransitDiffMinutes > 0 ? 'later' : 'earlier';

    const asrShadow = shadowLengthFromMadhab(parameters.madhab);
    const latitudeDeclinationSeparation = Math.abs(coordinates.latitude - solarTime.solar.declination);

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
