import { NextResponse } from 'next/server';

const QUOTES = [
    { citation: '[al-Bukhārī, al-Musnad al-Ṣaḥīḥ #1]', text: '“Indeed, all actions are judged by their intentions.”' },
    { citation: '[Muslim, Ṣaḥīḥ Muslim #2699]', text: '“Allah is kind and loves kindness in all matters.”' },
    {
        citation: '[al-Tirmidhī, Sunan al-Tirmidhī #2516]',
        text: '“The best among you are those who learn the Qur’an and teach it.”',
    },
    { citation: '[Ibn Mājah, Sunan Ibn Mājah #3973]', text: '“Prayer is the pillar of religion.”' },
];

export async function GET() {
    const choice = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    return NextResponse.json(choice);
}
