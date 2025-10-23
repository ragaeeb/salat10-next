import type { Coordinates } from 'adhan';

export const SECONDS_PER_HOUR = 3600;
export const SOLAR_ALTITUDE = -50 / 60;

export const degreesToRadians = (degrees: number) => (degrees * Math.PI) / 180;
export const radiansToDegrees = (radians: number) => (radians * 180) / Math.PI;

export const normalizeToScale = (num: number, max: number) => num - max * Math.floor(num / max);

export const unwindAngle = (angle: number) => normalizeToScale(angle, 360.0);

export const quadrantShiftAngle = (angle: number) =>
    angle >= -180 && angle <= 180 ? angle : angle - 360 * Math.round(angle / 360);

export const dateByAddingDays = (date: Date, days: number) => {
    const next = new Date(date.getTime());
    next.setDate(next.getDate() + days);
    return next;
};

export const dateByAddingSeconds = (date: Date, seconds: number) => new Date(date.getTime() + seconds * 1000);

export const isLeapYear = (year: number) => {
    if (year % 4 !== 0) {
        return false;
    }
    if (year % 100 === 0 && year % 400 !== 0) {
        return false;
    }
    return true;
};

export const dayOfYear = (date: Date) => {
    const feb = isLeapYear(date.getFullYear()) ? 29 : 28;
    const months = [31, feb, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return months.slice(0, date.getMonth()).reduce((acc, value) => acc + value, 0) + date.getDate();
};

export const daysSinceSolstice = (dayOfYearValue: number, year: number, latitude: number) => {
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

export const evaluateSeasonalAdjustment = (dyy: number, a: number, b: number, c: number, d: number) => {
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

export const seasonAdjustedMorningTwilight = (
    latitude: number,
    dayOfYearValue: number,
    year: number,
    sunrise: Date,
) => {
    const a = 75 + (28.65 / 55.0) * Math.abs(latitude);
    const b = 75 + (19.44 / 55.0) * Math.abs(latitude);
    const c = 75 + (32.74 / 55.0) * Math.abs(latitude);
    const d = 75 + (48.1 / 55.0) * Math.abs(latitude);

    const dyy = daysSinceSolstice(dayOfYearValue, year, latitude);
    const adjustment = evaluateSeasonalAdjustment(dyy, a, b, c, d);

    return dateByAddingSeconds(sunrise, Math.round(adjustment * -60.0));
};

export const seasonAdjustedEveningTwilight = (
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

export const julianDay = (year: number, month: number, day: number, hours = 0) => {
    const Y = Math.trunc(month > 2 ? year : year - 1);
    const M = Math.trunc(month > 2 ? month : month + 12);
    const D = day + hours / 24;

    const A = Math.trunc(Y / 100);
    const B = Math.trunc(2 - A + Math.trunc(A / 4));

    const i0 = Math.trunc(365.25 * (Y + 4716));
    const i1 = Math.trunc(30.6001 * (M + 1));

    return i0 + i1 + D + B - 1524.5;
};

export const julianCentury = (julianDayValue: number) => (julianDayValue - 2451545.0) / 36525;

export const meanSolarLongitude = (julianCenturyValue: number) => {
    const T = julianCenturyValue;
    const L0 = 280.4664567 + 36000.76983 * T + 0.0003032 * T * T;
    return unwindAngle(L0);
};

export const meanLunarLongitude = (julianCenturyValue: number) => {
    const T = julianCenturyValue;
    const Lp = 218.3165 + 481267.8813 * T;
    return unwindAngle(Lp);
};

export const ascendingLunarNodeLongitude = (julianCenturyValue: number) => {
    const T = julianCenturyValue;
    const Omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + T ** 3 / 450000;
    return unwindAngle(Omega);
};

export const meanSolarAnomaly = (julianCenturyValue: number) => {
    const T = julianCenturyValue;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    return unwindAngle(M);
};

export const solarEquationOfTheCenter = (julianCenturyValue: number, meanAnomaly: number) => {
    const T = julianCenturyValue;
    const Mrad = degreesToRadians(meanAnomaly);
    const term1 = (1.914602 - 0.004817 * T - 0.000014 * T ** 2) * Math.sin(Mrad);
    const term2 = (0.019993 - 0.000101 * T) * Math.sin(2 * Mrad);
    const term3 = 0.000289 * Math.sin(3 * Mrad);
    return term1 + term2 + term3;
};

export const apparentSolarLongitude = (julianCenturyValue: number, meanLongitude: number) => {
    const T = julianCenturyValue;
    const longitude = meanLongitude + solarEquationOfTheCenter(T, meanSolarAnomaly(T));
    const Omega = 125.04 - 1934.136 * T;
    const Lambda = longitude - 0.00569 - 0.00478 * Math.sin(degreesToRadians(Omega));
    return unwindAngle(Lambda);
};

export const meanObliquityOfTheEcliptic = (julianCenturyValue: number) => {
    const T = julianCenturyValue;
    return 23.439291 - 0.013004167 * T - 0.0000001639 * T ** 2 + 0.0000005036 * T ** 3;
};

export const apparentObliquityOfTheEcliptic = (julianCenturyValue: number, meanObliquity: number) => {
    const T = julianCenturyValue;
    const Epsilon0 = meanObliquity;
    const O = 125.04 - 1934.136 * T;
    return Epsilon0 + 0.00256 * Math.cos(degreesToRadians(O));
};

export const meanSiderealTime = (julianCenturyValue: number) => {
    const T = julianCenturyValue;
    const JD = T * 36525 + 2451545.0;
    const Theta = 280.46061837 + 360.98564736629 * (JD - 2451545) + 0.000387933 * T * T - T ** 3 / 38710000;
    return unwindAngle(Theta);
};

export const nutationInLongitude = (
    _julianCenturyValue: number,
    solarLongitude: number,
    lunarLongitude: number,
    ascendingNode: number,
) => {
    const L0 = solarLongitude;
    const Lp = lunarLongitude;
    const Omega = ascendingNode;
    const term1 = (-17.2 / 3600) * Math.sin(degreesToRadians(Omega));
    const term2 = (1.32 / 3600) * Math.sin(2 * degreesToRadians(L0));
    const term3 = (0.23 / 3600) * Math.sin(2 * degreesToRadians(Lp));
    const term4 = (0.21 / 3600) * Math.sin(2 * degreesToRadians(Omega));
    return term1 - term2 - term3 + term4;
};

export const nutationInObliquity = (
    _julianCenturyValue: number,
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

export const altitudeOfCelestialBody = (observerLatitude: number, declination: number, localHourAngle: number) => {
    const Phi = observerLatitude;
    const delta = declination;
    const H = localHourAngle;
    const term1 = Math.sin(degreesToRadians(Phi)) * Math.sin(degreesToRadians(delta));
    const term2 = Math.cos(degreesToRadians(Phi)) * Math.cos(degreesToRadians(delta)) * Math.cos(degreesToRadians(H));
    return radiansToDegrees(Math.asin(term1 + term2));
};

export const interpolate = (y2: number, y1: number, y3: number, n: number) => {
    const a = y2 - y1;
    const b = y3 - y2;
    const c = b - a;
    return y2 + (n / 2) * (a + b + n * c);
};

export const interpolateAngles = (y2: number, y1: number, y3: number, n: number) => {
    const a = unwindAngle(y2 - y1);
    const b = unwindAngle(y3 - y2);
    const c = b - a;
    return y2 + (n / 2) * (a + b + n * c);
};

export const approximateTransit = (longitude: number, siderealTimeValue: number, rightAscension: number) => {
    const L = longitude;
    const Theta0 = siderealTimeValue;
    const a2 = rightAscension;
    const Lw = L * -1;
    return normalizeToScale((a2 + Lw - Theta0) / 360, 1);
};

export const correctedTransit = (
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

export const correctedHourAngle = (
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
    const term2 = Math.cos(degreesToRadians(coordinates.latitude)) * Math.cos(degreesToRadians(d2));
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

export const fractionalDayToDate = (dayPortion: number, date: Date) => {
    const hours = dayPortion * 24;
    return hoursToDate(hours, date);
};

export const hoursToDate = (hours: number, date: Date) => {
    const hour = Math.floor(hours);
    const minute = Math.floor((hours - hour) * 60);
    const second = Math.floor((hours - hour - minute / 60) * 3600);
    return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), hour, minute, second));
};

export const shortTimeZone = (date: Date, timeZone: string) => {
    try {
        return new Intl.DateTimeFormat('en-US', { timeZone, timeZoneName: 'short' })
            .formatToParts(date)
            .find((part) => part.type === 'timeZoneName')?.value;
    } catch (error) {
        console.warn('Failed to format timezone', error);
        return timeZone;
    }
};
