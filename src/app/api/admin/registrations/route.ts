import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

// Middleware helper to verify admin token
async function verifyAdmin(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }

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

// GET registrations with filters
export async function GET(request: NextRequest) {
    const admin = await verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const eventId = searchParams.get('event_id');
    const search = searchParams.get('search');
    const date = searchParams.get('date');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
        .from('registrations')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

    // Apply filters
    if (status && status !== 'all') {
        query = query.eq('payment_status', status);
    }

    if (eventId && eventId !== 'all') {
        query = query.contains('event_ids', [eventId]);
    }

    if (search) {
        query = query.or(`ticket_id.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    if (date) {
        query = query.gte('created_at', `${date}T00:00:00`).lte('created_at', `${date}T23:59:59`);
    }

    const { data, error, count } = await query;

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch registrations' }, { status: 500 });
    }

    return NextResponse.json({
        registrations: data,
        total: count,
        page,
        limit,
    });
}
