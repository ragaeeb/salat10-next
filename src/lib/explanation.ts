import { CalculationParameters, Coordinates, PrayerTimes } from 'adhan';

const SECONDS_PER_HOUR = 3600;
const STORAGE_TIME_FORMAT: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    hour12: true,
    minute: '2-digit',
};

const enum Angle {
    SolarAltitude = -50 / 60,
}

const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;
const radiansToDegrees = (radians: number) => (radians * 180) / Math.PI;
const normalizeToScale = (num: number, max: number) => num - max * Math.floor(num / max);
const unwindAngle = (angle: number) => normalizeToScale(angle, 360.0);
const quadrantShiftAngle = (angle: number) =>
    angle >= -180 && angle <= 180 ? angle : angle - 360 * Math.round(angle / 360);

const dateByAddingDays = (date: Date, days: number) => {
    const next = new Date(date.getTime());
    next.setDate(next.getDate() + days);
    return next;
};

const dateByAddingSeconds = (date: Date, seconds: number) => new Date(date.getTime() + seconds * 1000);

const dayOfYear = (date: Date) => {
    const feb = isLeapYear(date.getFullYear()) ? 29 : 28;
    const months = [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return months.slice(0, date.getMonth()).reduce((acc, value) => acc + value, 0) + date.getDate();
};

const isLeapYear = (year: number) => {
    if (year % 4 !== 0) return false;
    if (year % 100 === 0 && year % 400 !== 0) return false;
    return true;
};

const seasonAdjustedMorningTwilight = (latitude: number, dayOfYearValue: number, year: number, sunrise: Date) => {
    const a = 75 + (28.65 / 55.0) * Math.abs(latitude);
    const b = 75 + (19.44 / 55.0) * Math.abs(latitude);
    const c = 75 + (32.74 / 55.0) * Math.abs(latitude);
    const d = 75 + (48.1 / 55.0) * Math.abs(latitude);

    const dyy = daysSinceSolstice(dayOfYearValue, year, latitude);

    const adjustment = evaluateSeasonalAdjustment(dyy, a, b, c, d);

    return dateByAddingSeconds(sunrise, Math.round(adjustment * -60.0));
};

const seasonAdjustedEveningTwilight = (
    latitude: number,
    dayOfYearValue: number,
    year: number,
    sunset: Date,
    shafaq: string,
) => {
    let a: number;
    let b: number;
    let c: number;
    let d: number;

    if (shafaq === 'ahmer') {
        a = 62 + (17.4 / 55.0) * Math.abs(latitude);
        b = 62 - (7.16 / 55.0) * Math.abs(latitude);
        c = 62 + (5.12 / 55.0) * Math.abs(latitude);
        d = 62 + (19.44 / 55.0) * Math.abs(latitude);
    } else if (shafaq === 'abyad') {
        a = 75 + (25.6 / 55.0) * Math.abs(latitude);
        b = 75 + (7.16 / 55.0) * Math.abs(latitude);
        c = 75 + (36.84 / 55.0) * Math.abs(latitude);
        d = 75 + (81.84 / 55.0) * Math.abs(latitude);
    } else {
        a = 75 + (25.6 / 55.0) * Math.abs(latitude);
        b = 75 + (2.05 / 55.0) * Math.abs(latitude);
        c = 75 - (9.21 / 55.0) * Math.abs(latitude);
        d = 75 + (6.14 / 55.0) * Math.abs(latitude);
    }

    const dyy = daysSinceSolstice(dayOfYearValue, year, latitude);

    const adjustment = evaluateSeasonalAdjustment(dyy, a, b, c, d);

    return dateByAddingSeconds(sunset, Math.round(adjustment * 60.0));
};

const daysSinceSolstice = (dayOfYearValue: number, year: number, latitude: number) => {
    const northernOffset = 10;
    const southernOffset = isLeapYear(year) ? 173 : 172;
    const daysInYear = isLeapYear(year) ? 366 : 365;

    if (latitude >= 0) {
        let daysSince = dayOfYearValue + northernOffset;
        if (daysSince >= daysInYear) {
            daysSince -= daysInYear;
        }
        return daysSince;
    }

    let daysSince = dayOfYearValue - southernOffset;
    if (daysSince < 0) {
        daysSince += daysInYear;
    }
    return daysSince;
};

const evaluateSeasonalAdjustment = (dyy: number, a: number, b: number, c: number, d: number) => {
    if (dyy < 91) {
        return a + ((b - a) / 91.0) * dyy;
    }
    if (dyy < 137) {
        return b + ((c - b) / 46.0) * (dyy - 91);
    }
    if (dyy < 183) {
        return c + ((d - c) / 46.0) * (dyy - 137);
    }
    if (dyy < 229) {
        return d + ((c - d) / 46.0) * (dyy - 183);
    }
    if (dyy < 275) {
        return c + ((b - c) / 46.0) * (dyy - 229);
    }
    return b + ((a - b) / 91.0) * (dyy - 275);
};

const julianDay = (year: number, month: number, day: number, hours = 0) => {
    const Y = Math.trunc(month > 2 ? year : year - 1);
    const M = Math.trunc(month > 2 ? month : month + 12);
    const D = day + hours / 24;

    const A = Math.trunc(Y / 100);
    const B = Math.trunc(2 - A + Math.trunc(A / 4));

    const i0 = Math.trunc(365.25 * (Y + 4716));
    const i1 = Math.trunc(30.6001 * (M + 1));

    return i0 + i1 + D + B - 1524.5;
};

const julianCentury = (julianDayValue: number) => (julianDayValue - 2451545.0) / 36525;

const meanSolarLongitude = (julianCenturyValue: number) => {
    const T = julianCenturyValue;
    const L0 = 280.4664567 + 36000.76983 * T + 0.0003032 * T * T;
    return unwindAngle(L0);
};

const meanLunarLongitude = (julianCenturyValue: number) => {
    const T = julianCenturyValue;
    const Lp = 218.3165 + 481267.8813 * T;
    return unwindAngle(Lp);
};

const ascendingLunarNodeLongitude = (julianCenturyValue: number) => {
    const T = julianCenturyValue;
    const Omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + Math.pow(T, 3) / 450000;
    return unwindAngle(Omega);
};

const meanSolarAnomaly = (julianCenturyValue: number) => {
    const T = julianCenturyValue;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    return unwindAngle(M);
};

const solarEquationOfTheCenter = (julianCenturyValue: number, meanAnomaly: number) => {
    const T = julianCenturyValue;
    const Mrad = degreesToRadians(meanAnomaly);
    const term1 = (1.914602 - 0.004817 * T - 0.000014 * Math.pow(T, 2)) * Math.sin(Mrad);
    const term2 = (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad);
    const term3 = 0.000289 * Math.sin(3 * Mrad);
    return term1 + term2 + term3;
};

const apparentSolarLongitude = (julianCenturyValue: number, meanLongitude: number) => {
    const T = julianCenturyValue;
    const longitude = meanLongitude + solarEquationOfTheCenter(T, meanSolarAnomaly(T));
    const Omega = 125.04 - 1934.136 * T;
    const Lambda = longitude - 0.00569 - 0.00478 * Math.sin(degreesToRadians(Omega));
    return unwindAngle(Lambda);
};

const meanObliquityOfTheEcliptic = (julianCenturyValue: number) => {
    const T = julianCenturyValue;
    return 23.439291 - 0.013004167 * T - 0.0000001639 * Math.pow(T, 2) + 0.0000005036 * Math.pow(T, 3);
};

const apparentObliquityOfTheEcliptic = (julianCenturyValue: number, meanObliquity: number) => {
    const T = julianCenturyValue;
    const Epsilon0 = meanObliquity;
    const O = 125.04 - 1934.136 * T;
    return Epsilon0 + 0.00256 * Math.cos(degreesToRadians(O));
};

const meanSiderealTime = (julianCenturyValue: number) => {
    const T = julianCenturyValue;
    const JD = T * 36525 + 2451545.0;
    const Theta = 280.46061837 + 360.98564736629 * (JD - 2451545) + 0.000387933 * T * T - Math.pow(T, 3) / 38710000;
    return unwindAngle(Theta);
};

const nutationInLongitude = (julianCenturyValue: number, solarLongitude: number, lunarLongitude: number, ascendingNode: number) => {
    const L0 = solarLongitude;
    const Lp = lunarLongitude;
    const Omega = ascendingNode;
    const term1 = (-17.2 / 3600) * Math.sin(degreesToRadians(Omega));
    const term2 = (1.32 / 3600) * Math.sin(2 * degreesToRadians(L0));
    const term3 = (0.23 / 3600) * Math.sin(2 * degreesToRadians(Lp));
    const term4 = (0.21 / 3600) * Math.sin(2 * degreesToRadians(Omega));
    return term1 - term2 - term3 + term4;
};

const nutationInObliquity = (
    julianCenturyValue: number,
    solarLongitude: number,
    lunarLongitude: number,
    ascendingNode: number,
) => {
    const L0 = solarLongitude;
    const Lp = lunarLongitude;
    const Omega = ascendingNode;
    const term1 = (9.2 / 3600) * Math.cos(degreesToRadians(Omega));
    const term2 = (0.57 / 3600) * Math.cos(2 * degreesToRadians(L0));
    const term3 = (0.1 / 3600) * Math.cos(2 * degreesToRadians(Lp));
    const term4 = (0.09 / 3600) * Math.cos(2 * degreesToRadians(Omega));
    return term1 + term2 + term3 - term4;
};

const altitudeOfCelestialBody = (observerLatitude: number, declination: number, localHourAngle: number) => {
    const Phi = observerLatitude;
    const delta = declination;
    const H = localHourAngle;
    const term1 = Math.sin(degreesToRadians(Phi)) * Math.sin(degreesToRadians(delta));
    const term2 =
        Math.cos(degreesToRadians(Phi)) * Math.cos(degreesToRadians(delta)) * Math.cos(degreesToRadians(H));
    return radiansToDegrees(Math.asin(term1 + term2));
};

const interpolate = (y2: number, y1: number, y3: number, n: number) => {
    const a = y2 - y1;
    const b = y3 - y2;
    const c = b - a;
    return y2 + (n / 2) * (a + b + n * c);
};

const interpolateAngles = (y2: number, y1: number, y3: number, n: number) => {
    const a = unwindAngle(y2 - y1);
    const b = unwindAngle(y3 - y2);
    const c = b - a;
    return y2 + (n / 2) * (a + b + n * c);
};

const approximateTransit = (longitude: number, siderealTimeValue: number, rightAscension: number) => {
    const L = longitude;
    const Theta0 = siderealTimeValue;
    const a2 = rightAscension;
    const Lw = L * -1;
    return normalizeToScale((a2 + Lw - Theta0) / 360, 1);
};

const correctedTransit = (
    approximateTransitValue: number,
    longitude: number,
    siderealTimeValue: number,
    rightAscension: number,
    previousRightAscension: number,
    nextRightAscension: number,
) => {
    const m0 = approximateTransitValue;
    const L = longitude;
    const Theta0 = siderealTimeValue;
    const a2 = rightAscension;
    const a1 = previousRightAscension;
    const a3 = nextRightAscension;
    const Lw = L * -1;
    const Theta = unwindAngle(Theta0 + 360.985647 * m0);
    const a = unwindAngle(interpolateAngles(a2, a1, a3, m0));
    const H = quadrantShiftAngle(Theta - Lw - a);
    const dm = H / -360;
    return (m0 + dm) * 24;
};

const correctedHourAngle = (
    approximateTransitValue: number,
    angle: number,
    coordinates: Coordinates,
    afterTransit: boolean,
    siderealTimeValue: number,
    rightAscension: number,
    previousRightAscension: number,
    nextRightAscension: number,
    declination: number,
    previousDeclination: number,
    nextDeclination: number,
) => {
    const m0 = approximateTransitValue;
    const h0 = angle;
    const Theta0 = siderealTimeValue;
    const a2 = rightAscension;
    const a1 = previousRightAscension;
    const a3 = nextRightAscension;
    const d2 = declination;
    const d1 = previousDeclination;
    const d3 = nextDeclination;

    const Lw = coordinates.longitude * -1;
    const term1 =
        Math.sin(degreesToRadians(h0)) -
        Math.sin(degreesToRadians(coordinates.latitude)) * Math.sin(degreesToRadians(d2));
    const term2 =
        Math.cos(degreesToRadians(coordinates.latitude)) * Math.cos(degreesToRadians(d2));
    const H0 = radiansToDegrees(Math.acos(term1 / term2));
    const m = afterTransit ? m0 + H0 / 360 : m0 - H0 / 360;
    const Theta = unwindAngle(Theta0 + 360.985647 * m);
    const a = unwindAngle(interpolateAngles(a2, a1, a3, m));
    const delta = interpolate(d2, d1, d3, m);
    const H = Theta - Lw - a;
    const h = altitudeOfCelestialBody(coordinates.latitude, delta, H);
    const term3 = h - h0;
    const term4 =
        360 *
        Math.cos(degreesToRadians(delta)) *
        Math.cos(degreesToRadians(coordinates.latitude)) *
        Math.sin(degreesToRadians(H));
    const dm = term3 / term4;
    return (m + dm) * 24;
};

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
        this.apparentSiderealTime =
            Theta0 +
            (dPsi * 3600 * Math.cos(degreesToRadians(Epsilon0 + dEpsilon))) / 3600;
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
            Angle.SolarAltitude,
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
            Angle.SolarAltitude,
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

const fractionalDayToDate = (fractionOfDay: number, date: Date) => {
    const seconds = fractionOfDay * 24 * SECONDS_PER_HOUR;
    const midnight = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
    return new Date(midnight + seconds * 1000);
};

const hoursToDate = (hours: number, date: Date) => fractionalDayToDate(hours / 24, date);

const formatTimeInZone = (value: Date, timeZone: string) => {
    try {
        return new Intl.DateTimeFormat('en-US', {
            ...STORAGE_TIME_FORMAT,
            timeZone,
        }).format(value);
    } catch (error) {
        return new Intl.DateTimeFormat('en-US', STORAGE_TIME_FORMAT).format(value);
    }
};

const formatNumber = (value: number, digits = 4) => value.toFixed(digits);

const shortTimeZone = (value: Date, timeZone: string) => {
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone,
            timeZoneName: 'shortOffset',
        }).formatToParts(value);
        return parts.find((part) => part.type === 'timeZoneName')?.value ?? timeZone;
    } catch (error) {
        return timeZone;
    }
};

const shadowLengthFromMadhab = (madhab: string) => (madhab === 'hanafi' ? 2 : 1);

export type ExplanationReference = {
    label: string;
    url: string;
};

export type ExplanationStep = {
    title: string;
    summary: string;
    details?: string[];
    references?: ExplanationReference[];
};

export type PrayerCalculationExplanation = {
    steps: ExplanationStep[];
};

export type ExplanationInput = {
    address?: string;
    coordinates: Coordinates;
    date: Date;
    parameters: CalculationParameters;
    timeZone: string;
};

export const buildPrayerTimeExplanation = ({
    address,
    coordinates,
    date,
    parameters,
    timeZone,
}: ExplanationInput): PrayerCalculationExplanation => {
    const prayerTimes = new PrayerTimes(coordinates, date, parameters);
    const tomorrowTimes = new PrayerTimes(coordinates, dateByAddingDays(date, 1), parameters);
    const solarTime = new SolarTime(date, coordinates);

    const julianDayValue = julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate(), 0);
    const julianCenturyValue = julianCentury(julianDayValue);
    const approxTransitDate = fractionalDayToDate(solarTime.approxTransit, date);
    const meanLongitude = meanSolarLongitude(julianCenturyValue);
    const meanAnomaly = meanSolarAnomaly(julianCenturyValue);
    const equationOfCenter = solarEquationOfTheCenter(julianCenturyValue, meanAnomaly);
    const apparentLongitude = apparentSolarLongitude(julianCenturyValue, meanLongitude);
    const declination = solarTime.solar.declination;
    const rightAscension = solarTime.solar.rightAscension;
    const sidereal = solarTime.solar.apparentSiderealTime;
    const lunarLongitude = meanLunarLongitude(julianCenturyValue);
    const ascendingNode = ascendingLunarNodeLongitude(julianCenturyValue);
    const nutationLongitude = nutationInLongitude(julianCenturyValue, meanLongitude, lunarLongitude, ascendingNode);
    const nutationObliquity = nutationInObliquity(julianCenturyValue, meanLongitude, lunarLongitude, ascendingNode);
    const meanObliquityValue = meanObliquityOfTheEcliptic(julianCenturyValue);
    const apparentObliquityValue = apparentObliquityOfTheEcliptic(julianCenturyValue, meanObliquityValue);
    const siderealHours = sidereal / 15;
    const nutationLongitudeArcsec = nutationLongitude * 3600;
    const nutationObliquityArcsec = nutationObliquity * 3600;

    const sunriseTime = prayerTimes.sunrise;
    const sunsetTime = prayerTimes.sunset;
    const tomorrowSunrise = tomorrowTimes.sunrise;
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
    const shafaqLabel = (() => {
        switch (parameters.shafaq) {
            case 'ahmer':
                return 'Ahmer (red) twilight definition';
            case 'abyad':
                return 'Abyad (white) twilight definition';
            default:
                return 'general twilight average';
        }
    })();

    const nightSeconds = (tomorrowSunrise.getTime() - sunsetTime.getTime()) / 1000;
    const nightHours = nightSeconds / SECONDS_PER_HOUR;

    const rawFajrTime = hoursToDate(solarTime.hourAngle(-1 * parameters.fajrAngle, false), date);
    const rawIshaTime = parameters.ishaInterval
        ? dateByAddingSeconds(sunsetTime, parameters.ishaInterval * 60)
        : hoursToDate(solarTime.hourAngle(-1 * parameters.ishaAngle, true), date);

    const nightPortions = parameters.nightPortions();
    const fajrNightSeconds = nightPortions.fajr * nightSeconds;
    const ishaNightSeconds = nightPortions.isha * nightSeconds;

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

    const finalFajr = isNaN(rawFajrTime.getTime()) || safeFajr > rawFajrTime ? safeFajr : rawFajrTime;
    const usedSafeFajr = finalFajr.getTime() === safeFajr.getTime();

    const finalIsha =
        usesIshaInterval
            ? rawIshaTime
            : isNaN(rawIshaTime.getTime()) || safeIsha < rawIshaTime
              ? safeIsha
              : rawIshaTime;
    const usedSafeIsha = !usesIshaInterval && finalIsha.getTime() === safeIsha.getTime();

    const fajrOffsetMinutes = (sunriseTime.getTime() - finalFajr.getTime()) / (1000 * 60);
    const ishaOffsetMinutes = (finalIsha.getTime() - sunsetTime.getTime()) / (1000 * 60);
    const fajrNightMinutes = fajrNightSeconds / 60;
    const ishaNightMinutes = ishaNightSeconds / 60;
    const approxTransitDiffMinutes = (prayerTimes.dhuhr.getTime() - approxTransitDate.getTime()) / (1000 * 60);
    const asrShadow = shadowLengthFromMadhab(parameters.madhab);
    const timezoneLabel = shortTimeZone(date, timeZone);
    const displayAddress = address?.trim()?.length ? address.trim() : 'your location';
    const fajrAngleLabel = formatNumber(parameters.fajrAngle);
    const ishaAngleLabel = formatNumber(parameters.ishaAngle);
    const madhabLabel = parameters.madhab === 'hanafi' ? 'Ḥanafī' : 'Shāfiʿī';
    const highLatitudeRuleLabel = (() => {
        switch (parameters.highLatitudeRule) {
            case 'twilightangle':
                return 'twilight angle rule';
            case 'seventhofthenight':
                return 'seventh of the night rule';
            default:
                return 'middle of the night rule';
        }
    })();
    const approxTransitLocal = formatTimeInZone(approxTransitDate, timeZone);
    const sunriseLocal = formatTimeInZone(sunriseTime, timeZone);
    const sunsetLocal = formatTimeInZone(sunsetTime, timeZone);
    const finalFajrLocal = formatTimeInZone(finalFajr, timeZone);
    const dhuhrLocal = formatTimeInZone(prayerTimes.dhuhr, timeZone);
    const asrLocal = formatTimeInZone(prayerTimes.asr, timeZone);
    const maghribLocal = formatTimeInZone(prayerTimes.maghrib, timeZone);
    const finalIshaLocal = formatTimeInZone(finalIsha, timeZone);
    const fajrComputedLocal = formatTimeInZone(prayerTimes.fajr, timeZone);
    const sunriseComputedLocal = formatTimeInZone(prayerTimes.sunrise, timeZone);
    const ishaComputedLocal = formatTimeInZone(prayerTimes.isha, timeZone);
    const rawFajrDisplay = isNaN(rawFajrTime.getTime())
        ? 'not defined because the sun does not reach that depression tonight'
        : formatTimeInZone(rawFajrTime, timeZone);
    const rawIshaDisplay = usesIshaInterval
        ? formatTimeInZone(rawIshaTime, timeZone)
        : isNaN(rawIshaTime.getTime())
          ? 'not defined because the sun never reaches that depression tonight'
          : formatTimeInZone(rawIshaTime, timeZone);
    const approxTransitDifference = formatNumber(Math.abs(approxTransitDiffMinutes), 2);
    const approxTransitDirection = approxTransitDiffMinutes >= 0 ? 'later' : 'earlier';
    const solarAltitudeAbs = formatNumber(Math.abs(Angle.SolarAltitude), 3);
    const siderealDegreesLabel = formatNumber(sidereal, 4);
    const siderealHoursLabel = formatNumber(siderealHours, 4);
    const nutationLongitudeLabel = formatNumber(nutationLongitude, 6);
    const nutationObliquityLabel = formatNumber(nutationObliquity, 6);
    const nutationLongitudeArcsecLabel = formatNumber(nutationLongitudeArcsec, 2);
    const nutationObliquityArcsecLabel = formatNumber(nutationObliquityArcsec, 2);
    const meanObliquityLabel = formatNumber(meanObliquityValue, 6);
    const apparentObliquityLabel = formatNumber(apparentObliquityValue, 6);
    const declinationLabel = formatNumber(declination, 4);
    const rightAscensionLabel = formatNumber(rightAscension, 4);
    const apparentLongitudeLabel = formatNumber(apparentLongitude, 4);
    const meanLongitudeLabel = formatNumber(meanLongitude, 4);
    const meanAnomalyLabel = formatNumber(meanAnomaly, 4);
    const equationOfCenterLabel = formatNumber(equationOfCenter, 4);
    const ascendingNodeLabel = formatNumber(ascendingNode, 4);
    const lunarLongitudeLabel = formatNumber(lunarLongitude, 4);
    const fajrOffsetLabel = formatNumber(fajrOffsetMinutes, 2);
    const ishaOffsetLabel = formatNumber(ishaOffsetMinutes, 2);
    const nightHoursLabel = formatNumber(nightHours, 2);
    const fajrNightMinutesLabel = formatNumber(fajrNightMinutes, 2);
    const ishaNightMinutesLabel = formatNumber(ishaNightMinutes, 2);
    const morningAdjustmentLabel = formatNumber(morningAdjustmentMinutes, 2);
    const eveningAdjustmentLabel = formatNumber(eveningAdjustmentMinutes, 2);
    const latitudeDeclinationSeparation = formatNumber(Math.abs(coordinates.latitude - declination), 4);

    const steps: ExplanationStep[] = [
        {
            title: 'Locate yourself on Earth',
            summary: `We start with ${displayAddress} at latitude ${formatNumber(coordinates.latitude, 4)}° and longitude ${formatNumber(
                coordinates.longitude,
                4,
            )}°, using the ${parameters.method} method.`,
            details: [
                "Coordinates in decimal degrees orient Adhan's astronomy routines; positive latitude means north of the equator while negative longitude places you west of Greenwich.",
                `The ${parameters.method} profile applies Fajr angle ${fajrAngleLabel}° and ${
                    usesIshaInterval ? `${parameters.ishaInterval}-minute` : `Isha angle ${ishaAngleLabel}°`
                } settings with the ${madhabLabel} madhab for Asr.`,
                `All results are displayed in ${timeZone} (${timezoneLabel}), converting the UTC calculations to your civil clock.`,
            ],
        },
        {
            title: 'Translate the date into astronomical time',
            summary: `The Gregorian date ${date.toLocaleDateString()} maps to Julian Day ${formatNumber(
                julianDayValue,
                5,
            )} and Julian Century ${formatNumber(julianCenturyValue, 8)}.`,
            details: [
                'Julian Day counts days continuously from noon on 1 January 4713 BCE, avoiding the leap-year quirks of the civil calendar.',
                `Dividing by 36525 yields ${formatNumber(
                    julianCenturyValue,
                    8,
                )} centuries since the J2000 epoch, the unit used in Astronomical Algorithms for orbital polynomials.`,
            ],
            references: [
                { label: 'Julian Day (Wikipedia)', url: 'https://en.wikipedia.org/wiki/Julian_day' },
            ],
        },
        {
            title: 'Mean orbital elements of the sun',
            summary: `Mean longitude L₀ = ${meanLongitudeLabel}°, mean anomaly M = ${meanAnomalyLabel}°, equation of the center C = ${equationOfCenterLabel}°, and apparent longitude λ = ${apparentLongitudeLabel}°.`,
            details: [
                'L₀ tracks the sun’s average ecliptic longitude assuming a circular orbit; we wrap it into 0–360° with unwindAngle.',
                'The mean anomaly M measures Earth’s progress along its elliptical orbit. The equation of the center adds sinusoidal corrections so the result approximates Kepler’s equation.',
                `Subtracting 0.00569° − 0.00478°·sin(Ω) with Ω = ${ascendingNodeLabel}° (the Moon’s ascending node) produces the apparent longitude tied to the true equinox. The lunar longitude L′ = ${lunarLongitudeLabel}° appears in the nutation terms.`,
            ],
            references: [
                { label: 'Equation of the center', url: 'https://en.wikipedia.org/wiki/Equation_of_the_center' },
            ],
        },
        {
            title: 'Account for Earth’s tilt and nutation',
            summary: `Mean obliquity ε₀ = ${meanObliquityLabel}° adjusts to apparent obliquity ε = ${apparentObliquityLabel}°, with nutation Δψ = ${nutationLongitudeLabel}° (${nutationLongitudeArcsecLabel}″) and Δε = ${nutationObliquityLabel}° (${nutationObliquityArcsecLabel}″).`,
            details: [
                'Earth’s ~23.4° axial tilt slowly decreases about 0.013° per century, so we evaluate ε₀ for the current epoch.',
                'The Moon’s gravity introduces nutation: Δψ nudges the ecliptic longitude and Δε slightly tips the Earth’s axis by just a few arcseconds.',
                'Applying these tiny adjustments yields the apparent obliquity, ensuring the equatorial coordinates align with the true equinox of date.',
            ],
            references: [
                { label: 'Axial tilt overview', url: 'https://en.wikipedia.org/wiki/Axial_tilt' },
                { label: 'Nutation explanation', url: 'https://en.wikipedia.org/wiki/Nutation' },
            ],
        },
        {
            title: 'Convert to equatorial coordinates',
            summary: `Declination δ = ${declinationLabel}°, right ascension α = ${rightAscensionLabel}°, and apparent sidereal time θ = ${siderealDegreesLabel}° (${siderealHoursLabel} sidereal hours).`,
            details: [
                `Declination is the sun’s celestial latitude; today’s value of ${declinationLabel}° places it ${declination >= 0 ? 'north' : 'south'} of the celestial equator.`,
                'Right ascension measures eastward rotation from the vernal equinox. We use atan2 and unwindAngle to keep α within 0–360°.',
                'Apparent sidereal time tells where our meridian points relative to the stars once we include longitude and nutation.',
            ],
            references: [
                { label: 'Equatorial coordinate system', url: 'https://en.wikipedia.org/wiki/Equatorial_coordinate_system' },
            ],
        },
        {
            title: 'Estimate when the sun crosses the meridian',
            summary: `Approximate transit m₀ corresponds to ${approxTransitLocal}, aligning longitude ${formatNumber(
                coordinates.longitude,
                4,
            )}° with the sidereal clock.`,
            details: [
                `Astronomical.approximateTransit normalizes (α + Lw − θ₀)/360, where Lw = −longitude = ${formatNumber(-coordinates.longitude, 4)}°.`,
                'Multiplying the resulting fraction of a day by 24 hours predicts when the sun would culminate if the orbit were perfectly circular.',
                'This gives us a first guess before we correct for the equation of time.',
            ],
        },
        {
            title: 'Refine to true solar noon (Dhuhr)',
            summary: `Corrected transit lands at ${dhuhrLocal}, ${approxTransitDifference} minutes ${approxTransitDirection} than the first guess.`,
            details: [
                'Astronomical.correctedTransit interpolates the sun’s right ascension using the previous and next days to capture the changing orbital speed.',
                'We compute the hour angle H = θ − Lw − α, wrap it into ±180°, and apply dm = H/−360 to nudge the transit fraction.',
                'That UTC instant defines local solar noon, which anchors the Dhuhr prayer.',
            ],
            references: [
                { label: 'NOAA solar equations', url: 'https://gml.noaa.gov/grad/solcalc/solareqns.PDF' },
            ],
        },
        {
            title: 'Solve sunrise and sunset from solar altitude',
            summary: `Setting the solar altitude to −${solarAltitudeAbs}° gives sunrise at ${sunriseLocal} and sunset at ${sunsetLocal}.`,
            details: [
                'The −0.833° threshold combines approximately 34′ of atmospheric refraction with the sun’s 16′ apparent radius so the upper limb just touches the horizon.',
                'Astronomical.correctedHourAngle finds the pre- and post-noon hour angles where the sun reaches that altitude, then converts them to UTC times.',
                `The interval between sunset and the next sunrise defines a night lasting ${nightHoursLabel} hours.`,
            ],
            references: [
                { label: 'NOAA solar equations', url: 'https://gml.noaa.gov/grad/solcalc/solareqns.PDF' },
            ],
        },
        {
            title: 'Segment the night for safeguards',
            summary: `The ${highLatitudeRuleLabel} splits the ${nightHoursLabel}-hour night with fractions for Fajr ${formatNumber(
                nightPortions.fajr,
                4,
            )} and Isha ${formatNumber(nightPortions.isha, 4)}.`,
            details: [
                `Multiplying those fractions by the night length yields safeguards of ${fajrNightMinutesLabel} minutes before sunrise and ${ishaNightMinutesLabel} minutes after sunset.`,
                `Moonsighting Committee tables use coefficients a=${formatNumber(morningCoefficients.a, 2)}, b=${formatNumber(morningCoefficients.b, 2)}, c=${formatNumber(morningCoefficients.c, 2)}, d=${formatNumber(morningCoefficients.d, 2)}. With ${daysFromSolsticeValue} days since the latest solstice they produce ${morningAdjustmentLabel} minutes for the morning twilight.`,
                `Evening coefficients a=${formatNumber(eveningCoefficients.a, 2)}, b=${formatNumber(eveningCoefficients.b, 2)}, c=${formatNumber(eveningCoefficients.c, 2)}, d=${formatNumber(eveningCoefficients.d, 2)} and the ${shafaqLabel} give ${eveningAdjustmentLabel} minutes after sunset to stabilize Isha at high latitudes.`,
            ],
            references: [
                { label: 'Moonsighting Committee method', url: 'https://www.moonsighting.com/how-we.html' },
            ],
        },
        {
            title: 'Determine the Fajr prayer time',
            summary: `Fajr is placed at ${finalFajrLocal}, ${fajrOffsetLabel} minutes before sunrise.`,
            details: [
                `The geometric solution for the sun at −${fajrAngleLabel}° gives ${rawFajrDisplay}.`,
                usedSafeFajr
                    ? `Because that solution was ${
                          isNaN(rawFajrTime.getTime()) ? 'undefined' : 'later than the safeguard'
                      }, we used the protection from step 9 (${usesMoonsighting ? `${morningAdjustmentLabel}-minute seasonal adjustment` : `${fajrNightMinutesLabel}-minute night fraction`} before sunrise).`
                    : 'The requested angle was reachable tonight, so no safeguard override was needed.',
                `After rounding to the nearest minute, Adhan reports ${fajrComputedLocal} in ${timeZone}.`,
            ],
            references: [
                { label: 'Fajr prayer explanation', url: 'https://en.wikipedia.org/wiki/Fajr' },
            ],
        },
        {
            title: 'When the afternoon shadow reaches the madhab ratio',
            summary: `Asr occurs at ${asrLocal}, when an object’s shadow is ${asrShadow}× its height.`,
            details: [
                `SolarTime.afternoon solves for an altitude where tan(angle) = 1 / (${asrShadow} + tan(|latitude − declination|)); here |latitude − declination| = ${latitudeDeclinationSeparation}°.`,
                `Switching between the ${madhabLabel} madhab and its alternative changes the shadow factor (1 vs. 2), shifting Asr by tens of minutes.`,
                `Feeding that altitude into correctedHourAngle after transit yields the clock time ${asrLocal}.`,
            ],
            references: [
                { label: 'Asr prayer overview', url: 'https://en.wikipedia.org/wiki/Asr' },
            ],
        },
        {
            title: 'Set Maghrib and Isha from evening twilight',
            summary: `Maghrib remains at sunset (${maghribLocal}), and Isha lands ${
                usesIshaInterval ? `${parameters.ishaInterval} minutes` : `${ishaOffsetLabel} minutes`
            } later at ${finalIshaLocal}.`,
            details: [
                usesIshaInterval
                    ? `The chosen method specifies a fixed ${parameters.ishaInterval}-minute interval after sunset, so the raw and final times coincide at ${rawIshaDisplay}.`
                    : `Solving for the sun at −${ishaAngleLabel}° gives ${rawIshaDisplay}.`,
                usedSafeIsha
                    ? `Because that solution was ${
                          isNaN(rawIshaTime.getTime()) ? 'undefined' : 'later than the safeguard'
                      }, we used ${
                          usesMoonsighting
                              ? `${eveningAdjustmentLabel}-minute seasonal adjustment based on the ${shafaqLabel}`
                              : `${ishaNightMinutesLabel}-minute night fraction`
                      } to protect high-latitude nights.`
                    : 'No safeguard was needed, so the geometric solution stands.',
                `The final rounded time appears as ${ishaComputedLocal} in ${timeZone}.`,
            ],
            references: [
                { label: 'Isha prayer explanation', url: 'https://en.wikipedia.org/wiki/Isha_(prayer)' },
            ],
        },
        {
            title: 'Review the complete prayer schedule',
            summary: `Today’s prayers in ${timeZone} are Fajr ${fajrComputedLocal}, Sunrise ${sunriseComputedLocal}, Dhuhr ${dhuhrLocal}, Asr ${asrLocal}, Maghrib ${maghribLocal}, and Isha ${ishaComputedLocal}.`,
            details: [
                `Fajr – ${fajrComputedLocal}`,
                `Sunrise – ${sunriseComputedLocal}`,
                `Dhuhr – ${dhuhrLocal}`,
                `Asr – ${asrLocal}`,
                `Maghrib – ${maghribLocal}`,
                `Isha – ${ishaComputedLocal}`,
            ],
        },
    ];

    return { steps };
};

