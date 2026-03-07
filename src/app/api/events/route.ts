import { NextResponse } from 'next/server';
import { getActiveEvents } from '@/lib/events-catalog';

export const revalidate = 3600; // Cache for 1 hour

export async function GET() {
    try {
        return NextResponse.json({ events: getActiveEvents() }, { status: 200 });
    } catch (err) {
        console.error('Events API internal error:', err);
        return NextResponse.json(
            {
                error: 'Internal server error',
            },
            { status: 500 }
        );
    }
}
