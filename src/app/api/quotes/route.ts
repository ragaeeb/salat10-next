import { NextResponse } from 'next/server';
import quotesData from '@/../public/quotes.json';

export async function GET() {
    return NextResponse.json(quotesData);
}
