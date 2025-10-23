import { methodLabelMap } from '../settings';
import { buildCalculationContext, type CalculationInputs } from './context';
import {
    describeNightFraction,
    formatAngle,
    formatDateInZone,
    formatMinutes,
    formatNumber,
    formatTimeInZone,
} from './format';
import type { ExplanationStep, MathSummaryLine, PrayerTimeExplanation } from './types';

class ExplanationBuilder {
    steps: ExplanationStep[] = [];
    lines: MathSummaryLine[] = [];

    addStep(step: ExplanationStep) {
        this.steps.push(step);
    }

    addMath(line: MathSummaryLine) {
        this.lines.push(line);
    }

    build(intro: string[], outro: string[]): PrayerTimeExplanation {
        return { steps: this.steps, summary: { intro, lines: this.lines, outro } };
    }
}

export const buildPrayerTimeExplanation = (inputs: CalculationInputs): PrayerTimeExplanation => {
    const context = buildCalculationContext(inputs);
    const builder = new ExplanationBuilder();
    const {
        inputs: details,
        julian,
        orbital,
        obliquity,
        solar,
        transit,
        safeties,
        geometry,
        adjustments,
        prayerTimes,
        sunnahTimes,
        hijri,
    } = context;

    const timeZone = details.timeZone;
    const methodLabel = methodLabelMap[details.method] ?? details.method;

    const locationFinal = `Latitude ${formatNumber(details.coordinates.latitude, 4)}°, Longitude ${formatNumber(details.coordinates.longitude, 4)}°`;

    builder.addStep({
        details: [
            'Latitude tells how far you are from the equator: positive values mean north, negative mean south.',
            'Longitude measures how far east or west you are from Greenwich in London, the zero line for time zones.',
            'Once we know these two numbers we can draw a tiny dot for you on a big globe and watch the sun move around it.',
        ],
        finalValue: locationFinal,
        id: 'world-map',
        summary: 'We pin your location on Earth so the sun math knows where to aim.',
        title: 'Spot your home on the world map',
        visual: {
            caption: `${details.address} in ${details.timeZone}`,
            latitude: details.coordinates.latitude,
            longitude: details.coordinates.longitude,
            type: 'world-map',
        },
    });

    builder.addStep({
        details: [
            'Astronomers calculate everything in Coordinated Universal Time (UTC). Imagine one big scoreboard in the sky that everyone reads together so nobody argues about what time it is.',
            `UTC stands for "Universal Time Coordinated". Your daily clock in ${details.timeZone} (${details.timezoneLabel}) is just UTC with a gentle shift so lunchtime still feels like when the sun is high over your head.`,
            'We also pack your madhab for ʿAṣr, your high-latitude safety rule, and any extra waiting minutes. These are the spices we keep stirring into every later step.',
        ],
        finalValue: `Method ${methodLabel}, timezone ${details.timeZone} (${details.timezoneLabel})`,
        id: 'inputs',
        summary: `We use the ${methodLabel} method with angles ${formatAngle(details.fajrAngle)} for Fajr and ${
            details.ishaInterval > 0 ? `${details.ishaInterval} minute gap` : formatAngle(details.ishaAngle)
        } for ʿIshāʾ.`,
        title: "Collect today's ingredients",
    });

    builder.addStep({
        details: [
            'Think of the sun diving under a blanket. At 6° (civil twilight) the blanket is thin and the street lights just wake up. At 12° (nautical twilight) sailors used to see the horizon to steer their boats. At 18° (astronomical twilight) the blanket is thick and the stars shine brightly.',
            '15° sits in the middle; it is like waiting a little longer than sailors but not as long as astronomers. Communities choose the angle that matches their tradition and what the sky looks like to them.',
            'Many masājid in North America use 15° so dawn is not too early in summer or too late in winter, while places near the equator may feel comfortable with 18° because the sky darkens quickly there.',
            `Your settings choose Fajr at ${formatAngle(details.fajrAngle)} and ʿIshāʾ at ${
                details.ishaInterval > 0
                    ? `${details.ishaInterval} fixed minutes after Maghrib`
                    : formatAngle(details.ishaAngle)
            }. We will carry these angles into the geometry solver that actually points at the sun.`,
        ],
        finalValue:
            details.ishaInterval > 0
                ? `Fajr ${formatAngle(details.fajrAngle)}, ʿIshāʾ ${details.ishaInterval} min after Maghrib`
                : `Fajr ${formatAngle(details.fajrAngle)}, ʿIshāʾ ${formatAngle(details.ishaAngle)}`,
        id: 'angles',
        summary: 'Angles say how far below the horizon the sun hides when each prayer begins.',
        title: 'Learn our twilight angles',
        visual: {
            alt: 'A sailboat silhouette during nautical twilight when the horizon is still visible.',
            caption:
                'At nautical twilight the sun is about 12° below the horizon—sailors could still spot the sea line to navigate.',
            src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Nautical_twilight_example.jpg/640px-Nautical_twilight_example.jpg',
            type: 'image',
        },
    });

    builder.addStep({
        details: [
            'Fajr starts when true dawn spreads across the horizon and ends when the sun rises. The Prophet ﷺ described this in Sahih Muslim 612 so we know the first light window.',
            'Dhuhr begins when the sun slips past the highest point and ʿAṣr arrives when a shadow grows to match its object (Sahih al-Bukhari 541). That shadow rule is what our madhab angle controls later.',
            'Maghrib opens instantly after sunset, and ʿIshāʾ lasts until the middle of the night (Sahih Muslim 612). These narrations give meaning to the numbers we compute.',
        ],
        finalValue: 'Primary sources: Muslim 612, Bukhari 541',
        id: 'hadith',
        references: [
            { label: 'Sahih Muslim 612', url: 'https://sunnah.com/muslim:612' },
            { label: 'Sahih al-Bukhari 541', url: 'https://sunnah.com/bukhari:541' },
        ],
        summary: 'We follow the Messenger ﷺ who told us when each prayer lives in the day.',
        title: 'Prophetic timing anchors',
    });

    builder.addStep({
        details: [
            'Astronomers count days from noon on 1 January 4713 BCE so the numbers never go negative. BCE means "Before Common Era"—it is like saying "long ago" before year 1.',
            'A scholar named Joseph Scaliger picked 4713 BCE because three different old calendars lined up there on the same day. That way, everyone using different calendars could still agree on one giant counter.',
            'This nonstop counter is called astronomical time. It feels like walking along a huge number line where we never have to pause for leap years or months with 30 days.',
            'We then divide by 36,525 because that is 100 years of 365.25 days. The Adhan formulas use "centuries since the year 2000 noon UTC" as their ruler, so we stretch our day number into that unit.',
        ],
        finalValue: `JD ${formatNumber(julian.day, 5)}, JC ${formatNumber(julian.century, 8)}`,
        id: 'julian',
        references: [{ label: 'Julian day', url: 'https://en.wikipedia.org/wiki/Julian_day' }],
        summary: `The date ${formatDateInZone(inputs.date, timeZone)} becomes Julian Day ${formatNumber(julian.day, 5)} and Julian Century ${formatNumber(julian.century, 8)}.`,
        title: 'Turn the calendar into a space number',
    });

    builder.addStep({
        details: [
            `The Hijri calendar starts with the Prophet ﷺ migrating to Madīnah in 622 CE. Historians mark that moment as Julian Day ${formatNumber(hijri.constants.epoch, 0)}.`,
            `Subtracting that starting point from today gives ${formatNumber(hijri.offsetFromEpoch, 0)} days since the Hijrah. We stack those days into ${formatNumber(hijri.constants.cycleDays, 0)}-day bundles—each bundle covers 30 lunar years—so ${hijri.cycle.index} full bundles have passed with ${formatNumber(hijri.cycle.remainderDays, 0)} days spilling into the current bundle.`,
            `A lunar year averages ${formatNumber(hijri.constants.averageYear, 3)} days. The remaining days equal ${hijri.cycle.yearsIntoCycle} years and ${formatNumber(hijri.cycle.remainderAfterYears, 0)} days, and dividing by 29.5-day months lands on month #${hijri.monthCalculation.rawMonth}, called ${hijri.islamic.monthName}. That places us on ${hijri.weekdayName}, day ${hijri.islamic.day} of ${hijri.islamic.year} AH—"Anno Hegirae," meaning "in the year of the Hijrah."`,
        ],
        finalValue: `${hijri.weekdayName}, ${hijri.islamic.day} ${hijri.islamic.monthName} ${hijri.islamic.year} AH`,
        id: 'hijri',
        references: [
            { label: 'Tabular Islamic calendar', url: 'https://en.wikipedia.org/wiki/Tabular_Islamic_calendar' },
            { label: 'Hijri calendar overview', url: 'https://www.timeanddate.com/calendar/islamic-calendar.html' },
        ],
        summary: `The same date is ${hijri.islamic.day} ${hijri.islamic.monthName} ${hijri.islamic.year} AH (${hijri.weekdayName}).`,
        title: 'Follow the days into the Hijri calendar',
    });

    builder.addStep({
        details: [
            'Picture Earth as a runner on an oval track. The mean anomaly M is the lap counter that assumes the runner keeps a steady speed.',
            'Because the track is squished, the runner sometimes speeds up and sometimes slows down. The equation of the center C is the friendly coach whispering, "Speed up a bit now, slow down there."',
            `When we add that coaching to the smooth mean longitude L₀, we land on λ, the sun's real angle in the sky that we will pass to the tilt step. We also peek at the moon's lane (${formatNumber(orbital.ascendingNode, 4)}° node and ${formatNumber(orbital.lunarLongitude, 4)}° longitude) because its gravity makes tiny wiggles.`,
        ],
        finalValue: `λ = ${formatNumber(orbital.apparentLongitude, 4)}°`,
        id: 'orbital',
        summary: `Mean longitude L₀ = ${formatNumber(orbital.meanLongitude, 4)}°, mean anomaly M = ${formatNumber(orbital.meanAnomaly, 4)}°, equation of the center C = ${formatNumber(orbital.equationOfCenter, 4)}°, apparent longitude λ = ${formatNumber(orbital.apparentLongitude, 4)}°.`,
        title: 'Follow the sun along its oval track',
    });

    builder.addStep({
        details: [
            "Earth is tilted like a spinning top leaning about 23.4°. The mean tilt ε₀ is our best guess, and the apparent tilt ε is the tiny adjustment after we notice today's wiggle.",
            `The moon and sun tug on Earth, making the pole wobble. That wiggle is called nutation, counted by Δψ and Δε (${formatNumber(obliquity.nutationObliquity, 6)}°).`,
            'We need this lean to turn λ into declination, the number that tells us how high the sun climbs for your home.',
        ],
        finalValue: `Declination δ = ${formatNumber(solar.declination, 4)}°`,
        id: 'tilt',
        summary: `Mean tilt ε₀ = ${formatNumber(obliquity.mean, 4)}°, apparent tilt ε = ${formatNumber(obliquity.apparent, 4)}°, wobble Δψ = ${formatNumber(obliquity.nutationLongitude, 6)}°.`,
        title: 'Earth leans and wiggles',
        visual: {
            alt: 'Diagram showing Earth’s axial tilt compared to its orbit around the sun.',
            caption:
                'Earth leans about 23.4°, so different parts of the planet tilt toward or away from the sun throughout the year.',
            src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/23/AxialTiltObliquity.png/640px-AxialTiltObliquity.png',
            type: 'image',
        },
    });

    builder.addStep({
        details: [
            "Right ascension α is the sun's longitude among the stars. Slice the sky like an orange; α says which slice the sun sits in right now.",
            'Sidereal time θ is the star clock. It ticks about four minutes faster each day because Earth is orbiting while it spins.',
            'Comparing θ and α tells us how long until the sun lines up with your south-north line. That difference slides into the transit math next.',
        ],
        finalValue: `α = ${formatNumber(solar.rightAscension, 4)}°, θ = ${formatNumber(solar.sidereal, 4)}°`,
        id: 'star-clock',
        summary: `Right ascension α = ${formatNumber(solar.rightAscension, 4)}° and sidereal time θ = ${formatNumber(solar.sidereal, 4)}° (${formatNumber(solar.siderealHours, 4)} hours).`,
        title: 'Set the sun on the star clock',
    });

    builder.addStep({
        details: [
            'We first guess when the sun crosses your south line, then we nudge the answer using the changing right ascension from the star clock.',
            "For sunrise and sunset we set the sun's altitude to −0.833°. The −0.833° is not random—it is half a degree for the sun's round face plus extra for the air bending light, so the time matches what eyes see.",
            'These moments give us the exact length of day and night. The night length slides straight into the safety cushions next.',
        ],
        finalValue: `Solar noon ${formatTimeInZone(transit.solarNoon, timeZone)}`,
        id: 'transit',
        summary: `Corrected solar noon happens at ${formatTimeInZone(transit.solarNoon, timeZone)}. Sunrise is ${formatTimeInZone(transit.sunrise, timeZone)}, sunset is ${formatTimeInZone(transit.sunset, timeZone)}.`,
        title: 'Find noon, sunrise, and sunset',
    });

    builder.addStep({
        details: [
            'Those numbers like 75 and 28.65 are minutes collected by observers from the Moon Sighting Committee. They stood outside in many cities and wrote down how long twilight felt in each season.',
            `We count how many days (${safeties.daysFromSolstice}) since the last solstice, then blend the a=${formatNumber(safeties.morningCoefficients.a, 2)}, b=${formatNumber(safeties.morningCoefficients.b, 2)}, c=${formatNumber(safeties.morningCoefficients.c, 2)}, d=${formatNumber(safeties.morningCoefficients.d, 2)} cards to get a gentle curve instead of a jumpy chart.`,
            `The evening helpers depend on the shafaq colour you chose. They make sure ʿIshāʾ does not run deep into the night when summer sunsets happen very late.`,
            'These helper minutes slide straight into the safeguard formulas in the next step so the night prayers stay practical.',
        ],
        finalValue: `Morning helper ${formatMinutes(safeties.morningAdjustmentMinutes)}, evening helper ${formatMinutes(safeties.eveningAdjustmentMinutes)}`,
        id: 'season',
        summary: `Today's latitude makes the morning helper ${formatMinutes(safeties.morningAdjustmentMinutes, 1)} and the evening helper ${formatMinutes(safeties.eveningAdjustmentMinutes, 1)}.`,
        title: 'Season helpers for twilight',
    });

    builder.addStep({
        details: [
            `The ${details.highLatitudeRule} rule slices the night like a pie: ${describeNightFraction(safeties.nightPortions.fajr)} goes to Fajr and ${describeNightFraction(safeties.nightPortions.isha)} goes to ʿIshāʾ.`,
            'If the pure geometry ever breaks—like near the poles where the sun barely sets—these slices make sure prayers stay inside darkness.',
            'We keep both answers (geometry and safety) on the table and choose the one that matches the prophetic window best—those winners become the Fajr and ʿIshāʾ achievements coming up.',
        ],
        finalValue: `${formatNumber(safeties.nightHours, 2)} night hours`,
        id: 'night-fractions',
        summary: `Night lasts about ${formatNumber(safeties.nightHours, 2)} hours. Safeguards give Fajr ${formatMinutes(safeties.fajrNightSeconds / 60)} before sunrise and ʿIshāʾ ${formatMinutes(safeties.ishaNightSeconds / 60)} after sunset.`,
        title: 'Share the night into gentle slices',
    });

    const fajrTimeLocal = formatTimeInZone(prayerTimes.fajr, timeZone);
    const sunriseLocal = formatTimeInZone(prayerTimes.sunrise, timeZone);
    const dhuhrLocal = formatTimeInZone(prayerTimes.dhuhr, timeZone);
    const asrLocal = formatTimeInZone(prayerTimes.asr, timeZone);
    const maghribLocal = formatTimeInZone(prayerTimes.maghrib, timeZone);
    const ishaLocal = formatTimeInZone(prayerTimes.isha, timeZone);

    builder.addStep({
        details: [
            `We ask the hour-angle solver to find when the sun sits ${formatAngle(details.fajrAngle)} under the horizon. ${
                safeties.usedSafeFajr
                    ? 'The safety cushion won because the geometric answer would have started too late.'
                    : 'The geometric answer already fit inside the night slice, so we happily used it.'
            }`,
            'The chosen moment turns into your Fajr alarm after we round to the nearest minute so it matches printed timetables.',
        ],
        finalValue: fajrTimeLocal,
        id: 'fajr',
        summary: `Fajr rings at ${fajrTimeLocal}, about ${formatMinutes(Math.abs(safeties.fajrOffsetMinutes))} before sunrise.`,
        title: 'Achievement unlocked: Fajr',
        visual: { accent: 'fajr', type: 'achievement' },
    });

    builder.addStep({
        details: [
            'This is when the top of the sun peeks over the horizon after the −0.833° correction.',
            'We will reuse this sunrise in two ways: to mark the end of Fajr and to measure how long tonight will be for the Sunnah step.',
        ],
        finalValue: sunriseLocal,
        id: 'sunrise',
        summary: `Sunrise is ${sunriseLocal}. No prayer is scheduled, but it ends the Fajr window.`,
        title: 'Achievement unlocked: Sunrise',
        visual: { accent: 'sunrise', type: 'achievement' },
    });

    builder.addStep({
        details: [
            'We compare the guessed noon with the refined value after interpolation and gently shift by a few seconds or minutes.',
            'Right after this instant the sun begins to slide down, so shadows start growing again—the prophetic sign of Dhuhr.',
        ],
        finalValue: dhuhrLocal,
        id: 'dhuhr',
        summary: `Dhuhr arrives at ${dhuhrLocal}, ${formatMinutes(Math.abs(adjustments.approxTransitDiffMinutes))} ${
            adjustments.approxTransitDirection
        } than the first guess at solar noon.`,
        title: 'Achievement unlocked: Dhuhr',
        visual: { accent: 'dhuhr', type: 'achievement' },
    });

    builder.addStep({
        details: [
            `Your madhab (${details.madhab === 'hanafi' ? 'Ḥanafī' : 'Shāfiʿī'}) sets the shadow ratio. Today the sun’s declination differs from your latitude by ${formatNumber(geometry.latitudeDeclinationSeparation, 2)}°, so we know how steep its rays are.`,
            'We solve for the needed altitude that makes the shadow long enough, then feed that into the hour-angle solver after noon to get the time.',
        ],
        finalValue: asrLocal,
        id: 'asr',
        summary: `ʿAṣr is ${asrLocal}, when shadows reach ${geometry.asrShadow}× their objects.`,
        title: 'Achievement unlocked: ʿAṣr',
        visual: { accent: 'asr', type: 'achievement' },
    });

    builder.addStep({
        details: [
            'Because the sun crosses the horizon cleanly today, Maghrib equals sunset.',
            'This is the moment mentioned in the hadith when fasting ends and Maghrib prayer starts right away—no waiting.',
        ],
        finalValue: maghribLocal,
        id: 'maghrib',
        summary: `Maghrib begins at ${maghribLocal} exactly when the sun sets.`,
        title: 'Achievement unlocked: Maghrib',
        visual: { accent: 'maghrib', type: 'achievement' },
    });

    builder.addStep({
        details: [
            `The sun sits ${formatAngle(details.ishaAngle)} below the horizon ${
                safeties.usesIshaInterval ? '(fixed interval method)' : 'if the night is long enough'
            }. ${safeties.usedSafeIsha ? 'We used the seasonal safeguard because the geometric answer was too late.' : 'The geometric answer stayed within the night, so we kept it.'}`,
            'With this final time, the daily cycle of obligatory prayers is complete and the Sunnah markers can now be measured.',
        ],
        finalValue: ishaLocal,
        id: 'isha',
        summary: `ʿIshāʾ is ${ishaLocal}, about ${formatMinutes(Math.abs(safeties.ishaOffsetMinutes))} after sunset.`,
        title: 'Achievement unlocked: ʿIshāʾ',
        visual: { accent: 'isha', type: 'achievement' },
    });

    builder.addStep({
        details: [
            'Many people pray extra rakaʿāt during these times, following the Prophet ﷺ who stood in night prayer while others slept.',
            'We use tonight’s Maghrib and tomorrow’s Fajr—numbers we already computed—to slice the night in half and thirds for easy planning.',
        ],
        finalValue: `1/2 night ${formatTimeInZone(sunnahTimes.middleOfTheNight, timeZone)}, last third ${formatTimeInZone(sunnahTimes.lastThirdOfTheNight, timeZone)}`,
        id: 'sunnah',
        summary: `Half the night begins at ${formatTimeInZone(sunnahTimes.middleOfTheNight, timeZone)}, and the last third begins at ${formatTimeInZone(sunnahTimes.lastThirdOfTheNight, timeZone)}.`,
        title: 'Explore the peaceful night',
    });

    builder.addStep({
        details: [
            `All times shown above are in ${details.timeZone} (${details.timezoneLabel}).`,
            'Every step passes its final value to the next one, so changing the method or angles in settings reshapes the whole story from the first world-map dot onward.',
        ],
        finalValue: `Daily outline ready`,
        id: 'summary',
        summary: `Fajr ${fajrTimeLocal}, Sunrise ${sunriseLocal}, Dhuhr ${dhuhrLocal}, ʿAṣr ${asrLocal}, Maghrib ${maghribLocal}, ʿIshāʾ ${ishaLocal}.`,
        title: 'See the full schedule',
        visual: { accent: 'summary', type: 'achievement' },
    });

    builder.addMath({
        expression: `JD = julianDay(${inputs.date.getFullYear()}, ${inputs.date.getMonth() + 1}, ${inputs.date.getDate()})`,
        id: 'math-jd',
        label: 'Julian Day',
        result: `${formatNumber(julian.day, 5)}`,
    });
    builder.addMath({
        expression: `(JD − 2451545.0) / 36525`,
        id: 'math-century',
        label: 'Julian Century',
        result: `${formatNumber(julian.century, 8)}`,
    });
    builder.addMath({
        expression: `z = JD − ${formatNumber(hijri.constants.epoch, 0)}`,
        id: 'math-hijri-offset',
        label: 'Days since Hijrah',
        result: `${formatNumber(hijri.offsetFromEpoch, 0)}`,
    });
    builder.addMath({
        expression: `cycle = floor(z / ${formatNumber(hijri.constants.cycleDays, 0)})`,
        id: 'math-hijri-cycle',
        label: '30-year lunar cycles',
        result: `${hijri.cycle.index} cycles`,
    });
    builder.addMath({
        expression: `year = cycle·30 + floor((remainder − ${formatNumber(hijri.constants.shift, 3)}) / ${formatNumber(
            hijri.constants.averageYear,
            3,
        )})`,
        id: 'math-hijri-year',
        label: 'Hijri year',
        result: `${hijri.islamic.year} AH`,
    });
    builder.addMath({
        expression: `month = floor((remainder + 28.5001) / 29.5)`,
        id: 'math-hijri-month',
        label: 'Hijri month & day',
        result: `${hijri.islamic.monthName} ${hijri.islamic.day}`,
    });
    builder.addMath({
        expression: `L₀ = 280.4664567 + 36000.76983·T`,
        id: 'math-longitude',
        label: 'Mean solar longitude',
        result: `${formatNumber(orbital.meanLongitude, 4)}°`,
    });
    builder.addMath({
        expression: `M = 357.52911 + 35999.05029·T`,
        id: 'math-anomaly',
        label: 'Mean anomaly',
        result: `${formatNumber(orbital.meanAnomaly, 4)}°`,
    });
    builder.addMath({
        expression: `C = 1.914602·sin(M) + 0.019993·sin(2M) + 0.000289·sin(3M)`,
        id: 'math-center',
        label: 'Equation of the center',
        result: `${formatNumber(orbital.equationOfCenter, 4)}°`,
    });
    builder.addMath({
        expression: `λ = L₀ + C − 0.00569 − 0.00478·sin(Ω)`,
        id: 'math-lambda',
        label: 'Apparent longitude',
        result: `${formatNumber(orbital.apparentLongitude, 4)}°`,
    });
    builder.addMath({
        expression: `δ = arcsin(sin(ε)·sin(λ))`,
        id: 'math-declination',
        label: 'Solar declination',
        result: `${formatNumber(solar.declination, 4)}°`,
    });
    builder.addMath({
        expression: `θ = 280.46061837 + 360.98564736629·(JD − 2451545) + …`,
        id: 'math-sidereal',
        label: 'Sidereal time',
        result: `${formatNumber(solar.sidereal, 4)}°`,
    });
    builder.addMath({
        expression: `transit = correctedTransit(m₀, λ, θ, α)`,
        id: 'math-transit',
        label: 'Solar noon',
        result: `${formatTimeInZone(transit.solarNoon, timeZone)}`,
    });
    builder.addMath({
        expression: `sunrise = correctedHourAngle(−0.833°)`,
        id: 'math-sunrise',
        label: 'Sunrise',
        result: `${sunriseLocal}`,
    });
    builder.addMath({
        expression: 'nightHours = (sunriseNext − sunset) / 3600',
        id: 'math-night-length',
        label: 'Night length',
        result: `${formatNumber(safeties.nightHours, 2)} hours`,
    });
    builder.addMath({
        expression: `helperMorning = tableBlend(${formatNumber(safeties.morningCoefficients.a, 2)}, …)`,
        id: 'math-morning-helper',
        label: 'Morning helper',
        result: `${formatMinutes(safeties.morningAdjustmentMinutes)}`,
    });
    builder.addMath({
        expression: `helperEvening = tableBlend(${formatNumber(safeties.eveningCoefficients.a, 2)}, …)`,
        id: 'math-evening-helper',
        label: 'Evening helper',
        result: `${formatMinutes(safeties.eveningAdjustmentMinutes)}`,
    });
    builder.addMath({
        expression: `rawFajr = hourAngle(−${formatNumber(details.fajrAngle, 2)}°)`,
        id: 'math-fajr-raw',
        label: 'Fajr geometry',
        result: `${formatTimeInZone(safeties.rawFajr, timeZone)}`,
    });
    builder.addMath({
        expression: safeties.usesMoonsighting
            ? `safeFajr = sunrise − ${formatMinutes(Math.abs(safeties.morningAdjustmentMinutes))}`
            : `safeFajr = sunrise − ${formatMinutes(safeties.fajrNightSeconds / 60)}`,
        id: 'math-fajr-safe',
        label: 'Fajr safeguard',
        result: `${formatTimeInZone(safeties.safeFajr, timeZone)}`,
    });
    builder.addMath({
        expression: safeties.usedSafeFajr ? 'finalFajr = safeFajr' : 'finalFajr = rawFajr',
        id: 'math-fajr-final',
        label: 'Fajr final',
        result: `${fajrTimeLocal}`,
    });
    builder.addMath({
        expression: `hourAngle(shadow ${geometry.asrShadow})`,
        id: 'math-asr',
        label: 'ʿAṣr',
        result: `${asrLocal}`,
    });
    builder.addMath({
        expression: `sunset = correctedHourAngle(−0.833°)`,
        id: 'math-maghrib',
        label: 'Maghrib',
        result: `${maghribLocal}`,
    });
    builder.addMath({
        expression: safeties.usesIshaInterval
            ? `rawIsha = sunset + ${details.ishaInterval} minutes`
            : `rawIsha = hourAngle(−${formatNumber(details.ishaAngle, 2)}°)`,
        id: 'math-isha-raw',
        label: 'ʿIshāʾ geometry',
        result: `${formatTimeInZone(safeties.rawIsha, timeZone)}`,
    });
    if (!safeties.usesIshaInterval) {
        builder.addMath({
            expression: safeties.usesMoonsighting
                ? `safeIsha = sunset + ${formatMinutes(safeties.eveningAdjustmentMinutes)}`
                : `safeIsha = sunset + ${formatMinutes(safeties.ishaNightSeconds / 60)}`,
            id: 'math-isha-safe',
            label: 'ʿIshāʾ safeguard',
            result: `${formatTimeInZone(safeties.safeIsha, timeZone)}`,
        });
    }
    builder.addMath({
        expression: safeties.usesIshaInterval
            ? 'finalIsha = rawIsha (interval method)'
            : safeties.usedSafeIsha
              ? 'finalIsha = safeIsha'
              : 'finalIsha = rawIsha',
        id: 'math-isha-final',
        label: 'ʿIshāʾ final',
        result: `${ishaLocal}`,
    });

    const intro = [
        `Location: ${details.address} (${locationFinal}).`,
        `Method: ${methodLabel}. Time zone: ${details.timeZone} (${details.timezoneLabel}).`,
        `Hijri date: ${hijri.islamic.day} ${hijri.islamic.monthName} ${hijri.islamic.year} AH (${hijri.weekdayName}).`,
    ];

    const outro = [
        `Daily prayers — Fajr ${fajrTimeLocal}, Sunrise ${sunriseLocal}, Dhuhr ${dhuhrLocal}, ʿAṣr ${asrLocal}, Maghrib ${maghribLocal}, ʿIshāʾ ${ishaLocal}.`,
        `Extra night markers — middle of the night ${formatTimeInZone(sunnahTimes.middleOfTheNight, timeZone)}, last third ${formatTimeInZone(sunnahTimes.lastThirdOfTheNight, timeZone)}.`,
    ];

    return builder.build(intro, outro);
};

export type { CalculationInputs } from './context';
