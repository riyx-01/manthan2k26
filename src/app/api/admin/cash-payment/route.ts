import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';

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

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope') || 'pending';
    const search = searchParams.get('search');

    let query = supabaseAdmin
        .from('registrations')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(300);

    if (scope === 'pending') {
        query = query.eq('payment_status', 'PENDING');
    }

    if (scope === 'cash') {
        query = query.eq('payment_method', 'cash');
    }

    if (search) {
        query = query.or(`ticket_id.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch cash payment rows' }, { status: 500 });
    }

    return NextResponse.json({ registrations: data || [] });
}

export async function POST(request: NextRequest) {
    const admin = await verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const registrationId = body?.registration_id as string | undefined;
        const cashAmount = body?.cash_amount as number | undefined;
        const cashReceiptNumber = body?.cash_receipt_number as string | null | undefined;
        const cashNotes = body?.cash_notes as string | null | undefined;

        if (!registrationId) {
            return NextResponse.json({ error: 'registration_id is required' }, { status: 400 });
        }

        if (!cashAmount || !Number.isFinite(cashAmount) || cashAmount <= 0) {
            return NextResponse.json({ error: 'cash_amount must be a positive number' }, { status: 400 });
        }

        const { data: registration, error: fetchError } = await supabaseAdmin
            .from('registrations')
            .select('id,payment_status,payment_method,total_amount')
            .eq('id', registrationId)
            .single();

        if (fetchError || !registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        if (registration.payment_status === 'PAID' && registration.payment_method && registration.payment_method !== 'cash') {
            return NextResponse.json(
                { error: 'This registration is already marked paid via online payment and cannot be changed to cash.' },
                { status: 409 }
            );
        }

        const { error: updateError } = await supabaseAdmin
            .from('registrations')
            .update({
                payment_status: 'PAID',
                payment_method: 'cash',
                cash_amount: Math.round(cashAmount),
                cash_received_by: admin.name || admin.email,
                cash_received_at: new Date().toISOString(),
                cash_receipt_number: cashReceiptNumber?.trim() || null,
                cash_notes: cashNotes?.trim() || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', registrationId);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to save cash payment' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
