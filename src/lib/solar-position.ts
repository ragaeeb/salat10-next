import type { Coordinates } from 'adhan';
import {
    apparentObliquityOfTheEcliptic,
    apparentSolarLongitude,
    ascendingLunarNodeLongitude,
    altitudeOfCelestialBody,
    degreesToRadians,
    julianCentury,
    julianDay,
    meanLunarLongitude,
    meanObliquityOfTheEcliptic,
    meanSiderealTime,
    meanSolarLongitude,
    nutationInLongitude,
    nutationInObliquity,
    quadrantShiftAngle,
    radiansToDegrees,
    unwindAngle,
} from '@/lib/explanation/math';

/**
 * Cartesian solar position for a specific observer and instant.
 */
export type SolarPosition = {
    /** Solar altitude above the horizon in degrees (negative after sunset) */
    altitude: number;
    /** Solar azimuth measured clockwise from geographic north in degrees */
    azimuth: number;
    /** Solar declination in degrees */
    declination: number;
    /** Solar right ascension in degrees */
    rightAscension: number;
    /** Local hour angle in degrees */
    localHourAngle: number;
    /** Apparent sidereal time in degrees */
    apparentSiderealTime: number;
};

/**
 * Inputs for {@link getSolarPosition}.
 */
export type SolarPositionInput = {
    /** Observation date/time (UTC instant) */
    date: Date;
    /** Observer geographic coordinates */
    coordinates: Pick<Coordinates, 'latitude' | 'longitude'>;
};

/**
 * Calculate the apparent position of the sun for a given observer and instant.
 *
 * Uses the same low-level solar equations employed in the explanations engine
 * to produce altitude, azimuth, and declination. Results are suitable for 3D
 * visualisations and shadow calculations where accurate geometry matters.
 *
 * @param input - Observation date and coordinates
 * @returns Solar position parameters for the provided instant
 */
export const getSolarPosition = ({ date, coordinates }: SolarPositionInput): SolarPosition => {
    const { latitude, longitude } = coordinates;

    const hours =
        date.getUTCHours() +
        date.getUTCMinutes() / 60 +
        date.getUTCSeconds() / 3600 +
        date.getUTCMilliseconds() / 3600000;

    const jd = julianDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), hours);
    const jc = julianCentury(jd);

    const meanLongitude = meanSolarLongitude(jc);
    const lunarLongitude = meanLunarLongitude(jc);
    const ascendingNode = ascendingLunarNodeLongitude(jc);
    const apparentLongitude = apparentSolarLongitude(jc, meanLongitude);
    const obliquity0 = meanObliquityOfTheEcliptic(jc);
    const obliquity = apparentObliquityOfTheEcliptic(jc, obliquity0);
    const dPsi = nutationInLongitude(jc, meanLongitude, lunarLongitude, ascendingNode);
    const dEpsilon = nutationInObliquity(jc, meanLongitude, lunarLongitude, ascendingNode);

    const lambda = degreesToRadians(apparentLongitude);
    const epsilonRad = degreesToRadians(obliquity);

    const declination = radiansToDegrees(Math.asin(Math.sin(epsilonRad) * Math.sin(lambda)));
    const rightAscension = unwindAngle(
        radiansToDegrees(Math.atan2(Math.cos(epsilonRad) * Math.sin(lambda), Math.cos(lambda))),
    );

    const theta0 = meanSiderealTime(jc);
    const apparentSiderealTime = theta0 +
        (dPsi * 3600 * Math.cos(degreesToRadians(obliquity0 + dEpsilon))) / 3600;
    const localSiderealTime = unwindAngle(apparentSiderealTime + longitude);
    const localHourAngle = quadrantShiftAngle(localSiderealTime - rightAscension);

    const altitude = altitudeOfCelestialBody(latitude, declination, localHourAngle);

    const azimuth = unwindAngle(
        radiansToDegrees(
            Math.atan2(
                Math.sin(degreesToRadians(localHourAngle)),
                Math.cos(degreesToRadians(localHourAngle)) * Math.sin(degreesToRadians(latitude)) -
                    Math.tan(degreesToRadians(declination)) * Math.cos(degreesToRadians(latitude)),
            ),
        ) + 180,
    );

    return { altitude, apparentSiderealTime, azimuth, declination, localHourAngle, rightAscension };
};
