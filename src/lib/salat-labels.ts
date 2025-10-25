export const salatLabels = {
    asr: '\u02BF\u1E62r',
    dhuhr: 'Dhuhr',
    fajr: 'Fajr',
    isha: '\u02BFIsh\u0101\u02BE',
    lastThirdOfTheNight: 'Last 1/3 Night Begins',
    maghrib: 'Ma\u0123rib',
    middleOfTheNight: '1/2 Night Begins',
    sunrise: 'Sunrise',
    tarawih: 'Taraw\u012B\u1E25',
} as const;

export type SalatEvent = keyof typeof salatLabels;
