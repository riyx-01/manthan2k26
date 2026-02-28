import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getActiveEvents } from '@/lib/events-catalog';

async function verifyAdmin(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

    const token = authHeader.split(' ')[1];
    const authClient = supabaseAdmin.auth as unknown as {
        getUser?: (jwt: string) => Promise<{ data?: { user?: { id: string; email?: string | null } | null }; error?: unknown }>;
        api?: {
            getUser?: (jwt: string) => Promise<{ user?: { id: string; email?: string | null } | null; error?: unknown }>;
        };
    };

    let user: { id: string; email?: string | null } | null | undefined;

    if (authClient.getUser) {
        const { data, error } = await authClient.getUser(token);
        if (error) return null;
        user = data?.user;
    } else if (authClient.api?.getUser) {
        const { user: apiUser, error } = await authClient.api.getUser(token);
        if (error) return null;
        user = apiUser;
    }

    if (!user) return null;

    const { data: adminById } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

    if (adminById) {
        return adminById;
    }

    if (!user.email) {
        return null;
    }

    const { data: adminByEmail } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .ilike('email', user.email)
        .maybeSingle();

    return adminByEmail;
}

export async function GET(request: NextRequest) {
    const admin = await verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Total registrations
        const { count: totalRegistrations } = await supabaseAdmin
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('payment_status', 'PAID');

        // Total revenue
        const { data: revenueData } = await supabaseAdmin
            .from('registrations')
            .select('total_amount')
            .eq('payment_status', 'PAID');

        const totalRevenue = revenueData?.reduce((sum, r) => sum + r.total_amount, 0) || 0;

        // Checked in count
        const { count: checkedIn } = await supabaseAdmin
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('payment_status', 'PAID')
            .eq('checked_in', true);

        // Pending payments
        const { count: pendingPayments } = await supabaseAdmin
            .from('registrations')
            .select('*', { count: 'exact', head: true })
            .eq('payment_status', 'PENDING');

        const events = getActiveEvents().map((event) => ({
            id: event.id,
            name: event.name,
            category: event.category,
            current_participants: event.current_participants,
            max_participants: event.max_participants,
        }));

        return NextResponse.json({
            stats: {
                totalRegistrations: totalRegistrations || 0,
                totalRevenue,
                checkedIn: checkedIn || 0,
                pendingPayments: pendingPayments || 0,
            },
            events,
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
