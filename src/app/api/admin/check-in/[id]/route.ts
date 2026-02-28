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

    const { data: adminUser } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();

    return adminUser;
}

// POST - Check in a registration
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const admin = await verifyAdmin(request);
    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Get the registration
        const { data: registration, error: findError } = await supabaseAdmin
            .from('registrations')
            .select('*')
            .eq('id', params.id)
            .single();

        if (findError || !registration) {
            return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
        }

        if (registration.payment_status !== 'PAID') {
            return NextResponse.json({ error: 'Payment not verified for this registration' }, { status: 400 });
        }

        if (registration.checked_in) {
            return NextResponse.json(
                {
                    error: 'Already checked in',
                    checked_in_at: registration.checked_in_at,
                },
                { status: 409 }
            );
        }

        // Mark as checked in
        const { error: updateError } = await supabaseAdmin
            .from('registrations')
            .update({
                checked_in: true,
                checked_in_at: new Date().toISOString(),
                checked_in_by: admin.id,
            })
            .eq('id', params.id);

        if (updateError) {
            return NextResponse.json({ error: 'Failed to check in' }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Checked in successfully' });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
