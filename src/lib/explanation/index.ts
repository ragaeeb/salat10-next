import { describeNightFraction, formatAngle, formatDateInZone, formatMinutes, formatNumber, formatTimeInZone } from "./format";
import { buildCalculationContext, type CalculationInputs } from "./context";
import type { PrayerTimeExplanation, ExplanationStep, MathSummaryLine } from "./types";
import { methodLabelMap } from "../settings";

class ExplanationBuilder {
  steps: ExplanationStep[] = [];
  lines: MathSummaryLine[] = [];

  constructor(private readonly context: ReturnType<typeof buildCalculationContext>) {}

  addStep(step: ExplanationStep) {
    this.steps.push(step);
  }

  addMath(line: MathSummaryLine) {
    this.lines.push(line);
  }

  build(intro: string[], outro: string[]): PrayerTimeExplanation {
    return {
      steps: this.steps,
      summary: {
        intro,
        lines: this.lines,
        outro,
      },
    };
  }
}

export const buildPrayerTimeExplanation = (inputs: CalculationInputs): PrayerTimeExplanation => {
  const context = buildCalculationContext(inputs);
  const builder = new ExplanationBuilder(context);
  const { inputs: details, julian, orbital, obliquity, solar, transit, safeties, geometry, adjustments, prayerTimes, sunnahTimes } =
    context;

  const timeZone = details.timeZone;
  const methodLabel = methodLabelMap[details.method] ?? details.method;

  const locationFinal = `Latitude ${formatNumber(details.coordinates.latitude, 4)}°, Longitude ${formatNumber(details.coordinates.longitude, 4)}°`;

  builder.addStep({
    id: "world-map",
    title: "Spot your home on the world map",
    summary: "We pin your location on Earth so the sun math knows where to aim.",
    details: [
      "Latitude tells how far you are from the equator: positive values mean north, negative mean south.",
      "Longitude measures how far east or west you are from Greenwich in London, the zero line for time zones.",
      "Once we know these two numbers we can draw a tiny dot for you on a big globe and watch the sun move around it.",
    ],
    finalValue: locationFinal,
    visual: {
      type: "world-map",
      latitude: details.coordinates.latitude,
      longitude: details.coordinates.longitude,
      caption: `${details.address} in ${details.timeZone}`,
    },
  });

  builder.addStep({
    id: "inputs",
    title: "Collect today's ingredients",
    summary: `We use the ${methodLabel} method with angles ${formatAngle(details.fajrAngle)} for Fajr and ${
      details.ishaInterval > 0 ? `${details.ishaInterval} minute gap` : formatAngle(details.ishaAngle)
    } for ʿIshāʾ.`,
    details: [
      "Astronomers calculate everything in Coordinated Universal Time (UTC). Imagine one big scoreboard in the sky that everyone reads together so nobody argues about what time it is.",
      `UTC stands for "Universal Time Coordinated". Your daily clock in ${details.timeZone} (${details.timezoneLabel}) is just UTC with a gentle shift so lunchtime still feels like when the sun is high over your head.`,
      "We also pack your madhab for ʿAṣr, your high-latitude safety rule, and any extra waiting minutes. These are the spices we keep stirring into every later step.",
    ],
    finalValue: `Method ${methodLabel}, timezone ${details.timeZone} (${details.timezoneLabel})`,
  });

  builder.addStep({
    id: "angles",
    title: "Learn our twilight angles",
    summary: "Angles say how far below the horizon the sun hides when each prayer begins.",
    details: [
      "Think of the sun diving under a blanket. At 6° (civil twilight) the blanket is thin and the street lights just wake up. At 12° (nautical twilight) sailors used to see the horizon to steer their boats. At 18° (astronomical twilight) the blanket is thick and the stars shine brightly.",
      "15° sits in the middle; it is like waiting a little longer than sailors but not as long as astronomers. Communities choose the angle that matches their tradition and what the sky looks like to them.",
      "Many masājid in North America use 15° so dawn is not too early in summer or too late in winter, while places near the equator may feel comfortable with 18° because the sky darkens quickly there.",
      `Your settings choose Fajr at ${formatAngle(details.fajrAngle)} and ʿIshāʾ at ${
        details.ishaInterval > 0 ? `${details.ishaInterval} fixed minutes after Maghrib` : formatAngle(details.ishaAngle)
      }. We will carry these angles into the geometry solver that actually points at the sun.`,
    ],
    finalValue:
      details.ishaInterval > 0
        ? `Fajr ${formatAngle(details.fajrAngle)}, ʿIshāʾ ${details.ishaInterval} min after Maghrib`
        : `Fajr ${formatAngle(details.fajrAngle)}, ʿIshāʾ ${formatAngle(details.ishaAngle)}`,
  });

  builder.addStep({
    id: "hadith",
    title: "Prophetic timing anchors",
    summary: "We follow the Messenger ﷺ who told us when each prayer lives in the day.",
    details: [
      "Fajr starts when true dawn spreads across the horizon and ends when the sun rises. The Prophet ﷺ described this in Sahih Muslim 612 so we know the first light window.",
      "Dhuhr begins when the sun slips past the highest point and ʿAṣr arrives when a shadow grows to match its object (Sahih al-Bukhari 541). That shadow rule is what our madhab angle controls later.",
      "Maghrib opens instantly after sunset, and ʿIshāʾ lasts until the middle of the night (Sahih Muslim 612). These narrations give meaning to the numbers we compute.",
    ],
    references: [
      { label: "Sahih Muslim 612", url: "https://sunnah.com/muslim:612" },
      { label: "Sahih al-Bukhari 541", url: "https://sunnah.com/bukhari:541" },
    ],
    finalValue: "Primary sources: Muslim 612, Bukhari 541",
  });

  builder.addStep({
    id: "julian",
    title: "Turn the calendar into a space number",
    summary: `The date ${formatDateInZone(inputs.date, timeZone)} becomes Julian Day ${formatNumber(julian.day, 5)} and Julian Century ${formatNumber(julian.century, 8)}.`,
    details: [
      "Astronomers count days from noon on 1 January 4713 BCE so the numbers never go negative. BCE means \"Before Common Era\"—it is like saying \"long ago\" before year 1.",
      "A scholar named Joseph Scaliger picked 4713 BCE because three different old calendars lined up there on the same day. That way, everyone using different calendars could still agree on one giant counter.",
      "This nonstop counter is called astronomical time. It feels like walking along a huge number line where we never have to pause for leap years or months with 30 days.",
      "We then divide by 36,525 because that is 100 years of 365.25 days. The Adhan formulas use \"centuries since the year 2000 noon UTC\" as their ruler, so we stretch our day number into that unit.",
    ],
    finalValue: `JD ${formatNumber(julian.day, 5)}, JC ${formatNumber(julian.century, 8)}`,
    references: [
      { label: "Julian day", url: "https://en.wikipedia.org/wiki/Julian_day" },
    ],
  });

  builder.addStep({
    id: "orbital",
    title: "Follow the sun along its oval track",
    summary: `Mean longitude L₀ = ${formatNumber(orbital.meanLongitude, 4)}°, mean anomaly M = ${formatNumber(orbital.meanAnomaly, 4)}°, equation of the center C = ${formatNumber(orbital.equationOfCenter, 4)}°, apparent longitude λ = ${formatNumber(orbital.apparentLongitude, 4)}°.`,
    details: [
      "Picture Earth as a runner on an oval track. The mean anomaly M is the lap counter that assumes the runner keeps a steady speed.",
      "Because the track is squished, the runner sometimes speeds up and sometimes slows down. The equation of the center C is the friendly coach whispering, \"Speed up a bit now, slow down there.\"",
      `When we add that coaching to the smooth mean longitude L₀, we land on λ, the sun's real angle in the sky that we will pass to the tilt step. We also peek at the moon's lane (${formatNumber(orbital.ascendingNode, 4)}° node and ${formatNumber(orbital.lunarLongitude, 4)}° longitude) because its gravity makes tiny wiggles.`,
    ],
    finalValue: `λ = ${formatNumber(orbital.apparentLongitude, 4)}°`,
  });

  builder.addStep({
    id: "tilt",
    title: "Earth leans and wiggles",
    summary: `Mean tilt ε₀ = ${formatNumber(obliquity.mean, 4)}°, apparent tilt ε = ${formatNumber(obliquity.apparent, 4)}°, wobble Δψ = ${formatNumber(obliquity.nutationLongitude, 6)}°.`,
    details: [
      "Earth is tilted like a spinning top leaning about 23.4°. The mean tilt ε₀ is our best guess, and the apparent tilt ε is the tiny adjustment after we notice today's wiggle.",
      `The moon and sun tug on Earth, making the pole wobble. That wiggle is called nutation, counted by Δψ and Δε (${formatNumber(obliquity.nutationObliquity, 6)}°).`,
      "We need this lean to turn λ into declination, the number that tells us how high the sun climbs for your home.",
    ],
    finalValue: `Declination δ = ${formatNumber(solar.declination, 4)}°`,
  });

  builder.addStep({
    id: "star-clock",
    title: "Set the sun on the star clock",
    summary: `Right ascension α = ${formatNumber(solar.rightAscension, 4)}° and sidereal time θ = ${formatNumber(solar.sidereal, 4)}° (${formatNumber(solar.siderealHours, 4)} hours).`,
    details: [
      "Right ascension α is the sun's longitude among the stars. Slice the sky like an orange; α says which slice the sun sits in right now.",
      "Sidereal time θ is the star clock. It ticks about four minutes faster each day because Earth is orbiting while it spins.",
      "Comparing θ and α tells us how long until the sun lines up with your south-north line. That difference slides into the transit math next.",
    ],
    finalValue: `α = ${formatNumber(solar.rightAscension, 4)}°, θ = ${formatNumber(solar.sidereal, 4)}°`,
  });

  builder.addStep({
    id: "transit",
    title: "Find noon, sunrise, and sunset",
    summary: `Corrected solar noon happens at ${formatTimeInZone(transit.solarNoon, timeZone)}. Sunrise is ${formatTimeInZone(transit.sunrise, timeZone)}, sunset is ${formatTimeInZone(transit.sunset, timeZone)}.`,
    details: [
      "We first guess when the sun crosses your south line, then we nudge the answer using the changing right ascension from the star clock.",
      "For sunrise and sunset we set the sun's altitude to −0.833°. The −0.833° is not random—it is half a degree for the sun's round face plus extra for the air bending light, so the time matches what eyes see.",
      "These moments give us the exact length of day and night. The night length slides straight into the safety cushions next.",
    ],
    finalValue: `Solar noon ${formatTimeInZone(transit.solarNoon, timeZone)}`,
  });

  builder.addStep({
    id: "season",
    title: "Season helpers for twilight",
    summary: `Today's latitude makes the morning helper ${formatMinutes(safeties.morningAdjustmentMinutes, 1)} and the evening helper ${formatMinutes(safeties.eveningAdjustmentMinutes, 1)}.`,
    details: [
      "Those numbers like 75 and 28.65 are minutes collected by observers from the Moon Sighting Committee. They stood outside in many cities and wrote down how long twilight felt in each season.",
      `We count how many days (${safeties.daysFromSolstice}) since the last solstice, then blend the a=${formatNumber(safeties.morningCoefficients.a, 2)}, b=${formatNumber(safeties.morningCoefficients.b, 2)}, c=${formatNumber(safeties.morningCoefficients.c, 2)}, d=${formatNumber(safeties.morningCoefficients.d, 2)} cards to get a gentle curve instead of a jumpy chart.`,
      `The evening helpers depend on the shafaq colour you chose. They make sure ʿIshāʾ does not run deep into the night when summer sunsets happen very late.`,
      "These helper minutes slide straight into the safeguard formulas in the next step so the night prayers stay practical.",
    ],
    finalValue: `Morning helper ${formatMinutes(safeties.morningAdjustmentMinutes)}, evening helper ${formatMinutes(safeties.eveningAdjustmentMinutes)}`,
  });

  builder.addStep({
    id: "night-fractions",
    title: "Share the night into gentle slices",
    summary: `Night lasts about ${formatNumber(safeties.nightHours, 2)} hours. Safeguards give Fajr ${formatMinutes(safeties.fajrNightSeconds / 60)} before sunrise and ʿIshāʾ ${formatMinutes(safeties.ishaNightSeconds / 60)} after sunset.`,
    details: [
      `The ${details.highLatitudeRule} rule slices the night like a pie: ${describeNightFraction(safeties.nightPortions.fajr)} goes to Fajr and ${describeNightFraction(safeties.nightPortions.isha)} goes to ʿIshāʾ.`,
      "If the pure geometry ever breaks—like near the poles where the sun barely sets—these slices make sure prayers stay inside darkness.",
      "We keep both answers (geometry and safety) on the table and choose the one that matches the prophetic window best—those winners become the Fajr and ʿIshāʾ achievements coming up.",
    ],
    finalValue: `${formatNumber(safeties.nightHours, 2)} night hours`,
  });

  const fajrTimeLocal = formatTimeInZone(prayerTimes.fajr, timeZone);
  const sunriseLocal = formatTimeInZone(prayerTimes.sunrise, timeZone);
  const dhuhrLocal = formatTimeInZone(prayerTimes.dhuhr, timeZone);
  const asrLocal = formatTimeInZone(prayerTimes.asr, timeZone);
  const maghribLocal = formatTimeInZone(prayerTimes.maghrib, timeZone);
  const ishaLocal = formatTimeInZone(prayerTimes.isha, timeZone);

  builder.addStep({
    id: "fajr",
    title: "Achievement unlocked: Fajr",
    summary: `Fajr rings at ${fajrTimeLocal}, about ${formatMinutes(Math.abs(safeties.fajrOffsetMinutes))} before sunrise.`,
    details: [
      `We ask the hour-angle solver to find when the sun sits ${formatAngle(details.fajrAngle)} under the horizon. ${
        safeties.usedSafeFajr
          ? "The safety cushion won because the geometric answer would have started too late."
          : "The geometric answer already fit inside the night slice, so we happily used it."
      }`,
      "The chosen moment turns into your Fajr alarm after we round to the nearest minute so it matches printed timetables.",
    ],
    finalValue: fajrTimeLocal,
    visual: { type: "achievement", accent: "fajr" },
  });

  builder.addStep({
    id: "sunrise",
    title: "Achievement unlocked: Sunrise",
    summary: `Sunrise is ${sunriseLocal}. No prayer is scheduled, but it ends the Fajr window.`,
    details: [
      "This is when the top of the sun peeks over the horizon after the −0.833° correction.",
      "We will reuse this sunrise in two ways: to mark the end of Fajr and to measure how long tonight will be for the Sunnah step.",
    ],
    finalValue: sunriseLocal,
    visual: { type: "achievement", accent: "sunrise" },
  });

  builder.addStep({
    id: "dhuhr",
    title: "Achievement unlocked: Dhuhr",
    summary: `Dhuhr arrives at ${dhuhrLocal}, ${formatMinutes(Math.abs(adjustments.approxTransitDiffMinutes))} ${
      adjustments.approxTransitDirection
    } than the first guess at solar noon.`,
    details: [
      "We compare the guessed noon with the refined value after interpolation and gently shift by a few seconds or minutes.",
      "Right after this instant the sun begins to slide down, so shadows start growing again—the prophetic sign of Dhuhr.",
    ],
    finalValue: dhuhrLocal,
    visual: { type: "achievement", accent: "dhuhr" },
  });

  builder.addStep({
    id: "asr",
    title: "Achievement unlocked: ʿAṣr",
    summary: `ʿAṣr is ${asrLocal}, when shadows reach ${geometry.asrShadow}× their objects.`,
    details: [
      `Your madhab (${details.madhab === "hanafi" ? "Ḥanafī" : "Shāfiʿī"}) sets the shadow ratio. Today the sun’s declination differs from your latitude by ${formatNumber(geometry.latitudeDeclinationSeparation, 2)}°, so we know how steep its rays are.`,
      "We solve for the needed altitude that makes the shadow long enough, then feed that into the hour-angle solver after noon to get the time.",
    ],
    finalValue: asrLocal,
    visual: { type: "achievement", accent: "asr" },
  });

  builder.addStep({
    id: "maghrib",
    title: "Achievement unlocked: Maghrib",
    summary: `Maghrib begins at ${maghribLocal} exactly when the sun sets.`,
    details: [
      "Because the sun crosses the horizon cleanly today, Maghrib equals sunset.",
      "This is the moment mentioned in the hadith when fasting ends and Maghrib prayer starts right away—no waiting.",
    ],
    finalValue: maghribLocal,
    visual: { type: "achievement", accent: "maghrib" },
  });

  builder.addStep({
    id: "isha",
    title: "Achievement unlocked: ʿIshāʾ",
    summary: `ʿIshāʾ is ${ishaLocal}, about ${formatMinutes(Math.abs(safeties.ishaOffsetMinutes))} after sunset.`,
    details: [
      `The sun sits ${formatAngle(details.ishaAngle)} below the horizon ${
        safeties.usesIshaInterval ? "(fixed interval method)" : "if the night is long enough"
      }. ${safeties.usedSafeIsha ? "We used the seasonal safeguard because the geometric answer was too late." : "The geometric answer stayed within the night, so we kept it."}`,
      "With this final time, the daily cycle of obligatory prayers is complete and the Sunnah markers can now be measured.",
    ],
    finalValue: ishaLocal,
    visual: { type: "achievement", accent: "isha" },
  });

  builder.addStep({
    id: "sunnah",
    title: "Explore the peaceful night",
    summary: `Half the night begins at ${formatTimeInZone(sunnahTimes.middleOfTheNight, timeZone)}, and the last third begins at ${formatTimeInZone(sunnahTimes.lastThirdOfTheNight, timeZone)}.`,
    details: [
      "Many people pray extra rakaʿāt during these times, following the Prophet ﷺ who stood in night prayer while others slept.",
      "We use tonight’s Maghrib and tomorrow’s Fajr—numbers we already computed—to slice the night in half and thirds for easy planning.",
    ],
    finalValue: `1/2 night ${formatTimeInZone(sunnahTimes.middleOfTheNight, timeZone)}, last third ${formatTimeInZone(sunnahTimes.lastThirdOfTheNight, timeZone)}`,
  });

  builder.addStep({
    id: "summary",
    title: "See the full schedule",
    summary: `Fajr ${fajrTimeLocal}, Sunrise ${sunriseLocal}, Dhuhr ${dhuhrLocal}, ʿAṣr ${asrLocal}, Maghrib ${maghribLocal}, ʿIshāʾ ${ishaLocal}.`,
    details: [
      `All times shown above are in ${details.timeZone} (${details.timezoneLabel}).`,
      "Every step passes its final value to the next one, so changing the method or angles in settings reshapes the whole story from the first world-map dot onward.",
    ],
    finalValue: `Daily outline ready`,
    visual: { type: "achievement", accent: "summary" },
  });

  builder.addMath({
    id: "math-jd",
    label: "Julian Day",
    expression: `JD = julianDay(${inputs.date.getFullYear()}, ${inputs.date.getMonth() + 1}, ${inputs.date.getDate()})`,
    result: `${formatNumber(julian.day, 5)}`,
  });
  builder.addMath({
    id: "math-century",
    label: "Julian Century",
    expression: `(JD − 2451545.0) / 36525`,
    result: `${formatNumber(julian.century, 8)}`,
  });
  builder.addMath({
    id: "math-longitude",
    label: "Mean solar longitude",
    expression: `L₀ = 280.4664567 + 36000.76983·T`,
    result: `${formatNumber(orbital.meanLongitude, 4)}°`,
  });
  builder.addMath({
    id: "math-anomaly",
    label: "Mean anomaly",
    expression: `M = 357.52911 + 35999.05029·T`,
    result: `${formatNumber(orbital.meanAnomaly, 4)}°`,
  });
  builder.addMath({
    id: "math-center",
    label: "Equation of the center",
    expression: `C = 1.914602·sin(M) + 0.019993·sin(2M) + 0.000289·sin(3M)`,
    result: `${formatNumber(orbital.equationOfCenter, 4)}°`,
  });
  builder.addMath({
    id: "math-lambda",
    label: "Apparent longitude",
    expression: `λ = L₀ + C − 0.00569 − 0.00478·sin(Ω)`,
    result: `${formatNumber(orbital.apparentLongitude, 4)}°`,
  });
  builder.addMath({
    id: "math-declination",
    label: "Solar declination",
    expression: `δ = arcsin(sin(ε)·sin(λ))`,
    result: `${formatNumber(solar.declination, 4)}°`,
  });
  builder.addMath({
    id: "math-sidereal",
    label: "Sidereal time",
    expression: `θ = 280.46061837 + 360.98564736629·(JD − 2451545) + …`,
    result: `${formatNumber(solar.sidereal, 4)}°`,
  });
  builder.addMath({
    id: "math-transit",
    label: "Solar noon",
    expression: `transit = correctedTransit(m₀, λ, θ, α)`,
    result: `${formatTimeInZone(transit.solarNoon, timeZone)}`,
  });
  builder.addMath({
    id: "math-sunrise",
    label: "Sunrise",
    expression: `sunrise = correctedHourAngle(−0.833°)`,
    result: `${sunriseLocal}`,
  });
  builder.addMath({
    id: "math-night-length",
    label: "Night length",
    expression: "nightHours = (sunriseNext − sunset) / 3600",
    result: `${formatNumber(safeties.nightHours, 2)} hours`,
  });
  builder.addMath({
    id: "math-morning-helper",
    label: "Morning helper",
    expression: `helperMorning = tableBlend(${formatNumber(safeties.morningCoefficients.a, 2)}, …)`,
    result: `${formatMinutes(safeties.morningAdjustmentMinutes)}`,
  });
  builder.addMath({
    id: "math-evening-helper",
    label: "Evening helper",
    expression: `helperEvening = tableBlend(${formatNumber(safeties.eveningCoefficients.a, 2)}, …)`,
    result: `${formatMinutes(safeties.eveningAdjustmentMinutes)}`,
  });
  builder.addMath({
    id: "math-fajr-raw",
    label: "Fajr geometry",
    expression: `rawFajr = hourAngle(−${formatNumber(details.fajrAngle, 2)}°)`,
    result: `${formatTimeInZone(safeties.rawFajr, timeZone)}`,
  });
  builder.addMath({
    id: "math-fajr-safe",
    label: "Fajr safeguard",
    expression: safeties.usesMoonsighting
      ? `safeFajr = sunrise − ${formatMinutes(Math.abs(safeties.morningAdjustmentMinutes))}`
      : `safeFajr = sunrise − ${formatMinutes(safeties.fajrNightSeconds / 60)}`,
    result: `${formatTimeInZone(safeties.safeFajr, timeZone)}`,
  });
  builder.addMath({
    id: "math-fajr-final",
    label: "Fajr final",
    expression: safeties.usedSafeFajr ? "finalFajr = safeFajr" : "finalFajr = rawFajr",
    result: `${fajrTimeLocal}`,
  });
  builder.addMath({
    id: "math-asr",
    label: "ʿAṣr",
    expression: `hourAngle(shadow ${geometry.asrShadow})`,
    result: `${asrLocal}`,
  });
  builder.addMath({
    id: "math-maghrib",
    label: "Maghrib",
    expression: `sunset = correctedHourAngle(−0.833°)`,
    result: `${maghribLocal}`,
  });
  builder.addMath({
    id: "math-isha-raw",
    label: "ʿIshāʾ geometry",
    expression: safeties.usesIshaInterval
      ? `rawIsha = sunset + ${details.ishaInterval} minutes`
      : `rawIsha = hourAngle(−${formatNumber(details.ishaAngle, 2)}°)`,
    result: `${formatTimeInZone(safeties.rawIsha, timeZone)}`,
  });
  if (!safeties.usesIshaInterval) {
    builder.addMath({
      id: "math-isha-safe",
      label: "ʿIshāʾ safeguard",
      expression: safeties.usesMoonsighting
        ? `safeIsha = sunset + ${formatMinutes(safeties.eveningAdjustmentMinutes)}`
        : `safeIsha = sunset + ${formatMinutes(safeties.ishaNightSeconds / 60)}`,
      result: `${formatTimeInZone(safeties.safeIsha, timeZone)}`,
    });
  }
  builder.addMath({
    id: "math-isha-final",
    label: "ʿIshāʾ final",
    expression: safeties.usesIshaInterval
      ? "finalIsha = rawIsha (interval method)"
      : safeties.usedSafeIsha
      ? "finalIsha = safeIsha"
      : "finalIsha = rawIsha",
    result: `${ishaLocal}`,
  });

  const intro = [
    `Location: ${details.address} (${locationFinal}).`,
    `Method: ${methodLabel}. Time zone: ${details.timeZone} (${details.timezoneLabel}).`,
  ];

  const outro = [
    `Daily prayers — Fajr ${fajrTimeLocal}, Sunrise ${sunriseLocal}, Dhuhr ${dhuhrLocal}, ʿAṣr ${asrLocal}, Maghrib ${maghribLocal}, ʿIshāʾ ${ishaLocal}.`,
    `Extra night markers — middle of the night ${formatTimeInZone(sunnahTimes.middleOfTheNight, timeZone)}, last third ${formatTimeInZone(sunnahTimes.lastThirdOfTheNight, timeZone)}.`,
  ];

  return builder.build(intro, outro);
};

export type { CalculationInputs } from "./context";
