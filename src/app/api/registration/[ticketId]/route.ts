import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getEventsByIds } from '@/lib/events-catalog';

export async function GET(
    request: Request,
    { params }: { params: { ticketId: string } }
) {
    try {
        void request;
        const { ticketId } = params;
        const { data: registration, error } = await supabaseAdmin
            .from('registrations')
            .select('*')
            .eq('ticket_id', ticketId)
            .eq('payment_status', 'PAID')
            .single();

        if (error || !registration) {
            return NextResponse.json(
                { error: 'Registration not found' },
                { status: 404 }
            );
        }

        // Resolve event details from static catalog
        const events = getEventsByIds(registration.event_ids).map((event) => ({
            id: event.id,
            name: event.name,
            category: event.category,
            event_date: event.event_date,
            venue: event.venue,
        }));

        return NextResponse.json({
            registration,
            events: events || [],
        });
    } catch {
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
