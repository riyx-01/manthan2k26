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

    const { data, error } = await supabaseAdmin
        .from('manual_cash_entries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) {
        return NextResponse.json({ error: 'Failed to fetch manual cash entries' }, { status: 500 });
    }

    return NextResponse.json({ entries: data || [] });
}

export async function POST(request: NextRequest) {
    const admin = await verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const {
            payer_name,
            payer_phone,
            payer_email,
            amount,
            receipt_number,
            notes,
        } = await request.json();

        if (!payer_name || typeof payer_name !== 'string' || payer_name.trim().length < 2) {
            return NextResponse.json({ error: 'payer_name is required' }, { status: 400 });
        }

        if (!amount || !Number.isFinite(amount) || amount <= 0) {
            return NextResponse.json({ error: 'amount must be a positive number' }, { status: 400 });
        }

        const { data, error } = await supabaseAdmin
            .from('manual_cash_entries')
            .insert({
                payer_name: payer_name.trim(),
                payer_phone: payer_phone?.trim() || null,
                payer_email: payer_email?.trim() || null,
                amount: Math.round(amount),
                receipt_number: receipt_number?.trim() || null,
                notes: notes?.trim() || null,
                collected_by: admin.name || admin.email,
                collected_at: new Date().toISOString(),
            })
            .select('*')
            .single();

        if (error) {
            return NextResponse.json({ error: 'Failed to create manual cash entry' }, { status: 500 });
        }

        return NextResponse.json({ success: true, entry: data });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
