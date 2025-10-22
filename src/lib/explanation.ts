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

    const adjustment =
        dyy < 91
            ? a + ((b - a) / 91.0) * dyy
            : dyy < 137
              ? b + ((c - b) / 46.0) * (dyy - 91)
              : dyy < 183
                ? c + ((d - c) / 46.0) * (dyy - 137)
                : dyy < 229
                  ? d + ((c - d) / 46.0) * (dyy - 183)
                  : dyy < 275
                    ? c + ((b - c) / 46.0) * (dyy - 229)
                    : b + ((a - b) / 91.0) * (dyy - 275);

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

    const adjustment =
        dyy < 91
            ? a + ((b - a) / 91.0) * dyy
            : dyy < 137
              ? b + ((c - b) / 46.0) * (dyy - 91)
              : dyy < 183
                ? c + ((d - c) / 46.0) * (dyy - 137)
                : dyy < 229
                  ? d + ((c - d) / 46.0) * (dyy - 183)
                  : dyy < 275
                    ? c + ((b - c) / 46.0) * (dyy - 229)
                    : b + ((a - b) / 91.0) * (dyy - 275);

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

export type ExplanationStep = { text: string };

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

    const sunriseTime = prayerTimes.sunrise;
    const sunsetTime = prayerTimes.sunset;
    const tomorrowSunrise = tomorrowTimes.sunrise;

    const nightSeconds = (tomorrowSunrise.getTime() - sunsetTime.getTime()) / 1000;
    const nightHours = nightSeconds / SECONDS_PER_HOUR;

    const rawFajrTime = hoursToDate(solarTime.hourAngle(-1 * parameters.fajrAngle, false), date);
    const rawIshaTime = parameters.ishaInterval
        ? dateByAddingSeconds(sunsetTime, parameters.ishaInterval * 60)
        : hoursToDate(solarTime.hourAngle(-1 * parameters.ishaAngle, true), date);

    const nightPortions = parameters.nightPortions();
    const fajrNightSeconds = nightPortions.fajr * nightSeconds;
    const ishaNightSeconds = nightPortions.isha * nightSeconds;

    const safeFajr =
        parameters.method === 'MoonsightingCommittee'
            ? seasonAdjustedMorningTwilight(coordinates.latitude, dayOfYear(date), date.getFullYear(), sunriseTime)
            : dateByAddingSeconds(sunriseTime, -fajrNightSeconds);

    const safeIsha =
        parameters.method === 'MoonsightingCommittee'
            ? seasonAdjustedEveningTwilight(
                  coordinates.latitude,
                  dayOfYear(date),
                  date.getFullYear(),
                  sunsetTime,
                  parameters.shafaq,
              )
            : dateByAddingSeconds(sunsetTime, ishaNightSeconds);

    const finalFajr = isNaN(rawFajrTime.getTime()) || safeFajr > rawFajrTime ? safeFajr : rawFajrTime;
    const usedSafeFajr = finalFajr.getTime() === safeFajr.getTime();

    const finalIsha =
        parameters.ishaInterval > 0
            ? rawIshaTime
            : isNaN(rawIshaTime.getTime()) || safeIsha < rawIshaTime
              ? safeIsha
              : rawIshaTime;
    const usedSafeIsha = parameters.ishaInterval === 0 && finalIsha.getTime() === safeIsha.getTime();

    const asrShadow = shadowLengthFromMadhab(parameters.madhab);

    const timezoneLabel = shortTimeZone(date, timeZone);

    const steps: ExplanationStep[] = [
        {
            text: `1. Location setup → We start with ${
                address?.trim()?.length ? address.trim() : 'your location'
            } at latitude ${formatNumber(coordinates.latitude, 4)}° and longitude ${formatNumber(
                coordinates.longitude,
                4,
            )}°. Calculations use the ${parameters.method} method with Fajr angle ${formatNumber(
                parameters.fajrAngle,
            )}° and Isha angle ${
                parameters.ishaInterval > 0
                    ? `${parameters.ishaInterval} minute interval`
                    : `${formatNumber(parameters.ishaAngle)}°`
            } in ${timeZone} (${timezoneLabel}).`,
        },
        {
            text: `2. Astronomical clock → The Gregorian date ${date.toLocaleDateString()} converts to Julian Day ${formatNumber(
                julianDayValue,
                5,
            )} and Julian Century ${formatNumber(julianCenturyValue, 8)}, which let us reference the sun's position with continuous precision.`,
        },
        {
            text: `3. Solar geometry → Mean solar longitude L₀ = ${formatNumber(meanLongitude)}°, mean anomaly M = ${formatNumber(
                meanAnomaly,
            )}°, and equation of the center C = ${formatNumber(
                equationOfCenter,
            )}°. Combining them yields an apparent longitude λ = ${formatNumber(
                apparentLongitude,
            )}°. From this we derive a solar declination δ = ${formatNumber(
                declination,
            )}° and right ascension α = ${formatNumber(rightAscension)}°, while sidereal time θ = ${formatNumber(
                sidereal,
            )}° anchors the sky relative to Earth.`,
        },
        {
            text: `4. Solar noon (Dhuhr) → Starting from an approximate transit at ${formatTimeInZone(
                approxTransitDate,
                timeZone,
            )}, we apply right-ascension corrections to land on true solar noon at ${formatTimeInZone(
                prayerTimes.dhuhr,
                timeZone,
            )}. This moment defines Dhuhr.`,
        },
        {
            text: `5. Sunrise & sunset → Solving when the sun's altitude reaches −0.833° gives sunrise at ${formatTimeInZone(
                sunriseTime,
                timeZone,
            )} and sunset at ${formatTimeInZone(
                sunsetTime,
                timeZone,
            )}. The night between them lasts about ${formatNumber(nightHours, 2)} hours.`,
        },
        {
            text: `6. Fajr twilight → Using the ${
                usedSafeFajr
                    ? 'seasonally adjusted safeguard'
                    : `${formatNumber(parameters.fajrAngle)}° solar depression`
            }, we step back ${formatNumber(
                (sunriseTime.getTime() - finalFajr.getTime()) / (1000 * 60),
                2,
            )} minutes from sunrise to set Fajr at ${formatTimeInZone(finalFajr, timeZone)}.`,
        },
        {
            text: `7. Asr shadow → We wait until an object's shadow is ${asrShadow}× its height (the ${
                parameters.madhab === 'hanafi' ? 'Ḥanafī' : 'Shāfiʿī'
            } madhab rule), producing Asr at ${formatTimeInZone(prayerTimes.asr, timeZone)}.`,
        },
        {
            text: `8. Evening twilight → ${
                parameters.ishaInterval > 0
                    ? `Adding ${parameters.ishaInterval} minutes to sunset`
                    : `Extending the night by ${formatNumber(
                          (finalIsha.getTime() - sunsetTime.getTime()) / (1000 * 60),
                          2,
                      )} minutes using the ${
                          usedSafeIsha
                              ? 'seasonal adjustment'
                              : `${formatNumber(parameters.ishaAngle)}° angle`
                      }`
            } sets Maghrib at ${formatTimeInZone(prayerTimes.maghrib, timeZone)} and Isha at ${formatTimeInZone(
                finalIsha,
                timeZone,
            )}.`,
        },
        {
            text: `9. Final schedule → The computed times are Fajr ${formatTimeInZone(
                prayerTimes.fajr,
                timeZone,
            )}, Sunrise ${formatTimeInZone(prayerTimes.sunrise, timeZone)}, Dhuhr ${formatTimeInZone(
                prayerTimes.dhuhr,
                timeZone,
            )}, Asr ${formatTimeInZone(prayerTimes.asr, timeZone)}, Maghrib ${formatTimeInZone(
                prayerTimes.maghrib,
                timeZone,
            )}, and Isha ${formatTimeInZone(prayerTimes.isha, timeZone)}.`,
        },
    ];

    return { steps };
};

