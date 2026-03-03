import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { EVENT_CATALOG } from '@/lib/events-catalog';

// Build a quick lookup map: event_id -> { name, category }
const eventMap = new Map(
    EVENT_CATALOG.map((e) => [e.id, { name: e.name, category: e.category }])
);

// Security check
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

    if (adminById) return adminById;

    if (!user.email) return null;

    const { data: adminByEmail } = await supabaseAdmin
        .from('admin_users')
        .select('*')
        .ilike('email', user.email)
        .maybeSingle();

    return adminByEmail;
}

function escapeCsv(field: string | number | boolean | null | undefined): string {
    if (field === null || field === undefined) return '';
    const stringField = String(field);
    if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n')) {
        return `"${stringField.replace(/"/g, '""')}"`;
    }
    return stringField;
}

interface TeamRegistrationData {
    event_id: string;
    team_name?: string | null;
    team_size?: number;
    members?: Array<{ name: string }>;
}

interface RegistrationRow {
    ticket_id: string;
    name: string;
    email: string;
    phone: string;
    college: string;
    department: string | null;
    year: string | null;
    event_ids: string[];
    team_registrations: TeamRegistrationData[] | null;
    total_amount: number;
    payment_status: string;
    created_at: string;
}

interface ExportRow {
    event_category: string;
    event_name: string;
    ticket_id: string;
    lead_participant_name: string;
    lead_email: string;
    lead_phone: string;
    college: string;
    department: string;
    year: string;
    payment_status: string;
    total_amount: number;
    registration_date: string;
    team_name: string;
    team_size: string;
    other_team_members: string;
}

export async function GET(request: NextRequest) {
    const admin = await verifyAdmin(request);

    if (!admin) {
        return NextResponse.json({ error: 'Unauthorized. Please login with Admin panel headers first.' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventName = searchParams.get('event_name');

    // Query registrations directly from the table
    const { data: registrations, error } = await supabaseAdmin
        .from('registrations')
        .select('ticket_id,name,email,phone,college,department,year,event_ids,team_registrations,total_amount,payment_status,created_at')
        .order('created_at', { ascending: false });

    if (error) {
        return NextResponse.json({ error: 'Failed to generate export data' }, { status: 500 });
    }

    if (!registrations || registrations.length === 0) {
        return new NextResponse("No data available to export.", { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // "Unravel" each registration into one row per event (matching SQL view logic)
    const rows: ExportRow[] = [];

    for (const reg of registrations as RegistrationRow[]) {
        const teamRegs = Array.isArray(reg.team_registrations) ? reg.team_registrations : [];

        for (const eventId of reg.event_ids) {
            const eventInfo = eventMap.get(eventId);
            const eventNameStr = eventInfo?.name || eventId;
            const eventCategory = eventInfo?.category || 'unknown';

            // Optional event_name filter
            if (eventName && eventName !== 'all' && !eventNameStr.toLowerCase().includes(eventName.toLowerCase())) {
                continue;
            }

            // Find matching team registration for this event
            const teamReg = teamRegs.find((t) => t.event_id === eventId);

            const memberNames = teamReg?.members
                ?.map((m) => m.name)
                .join(', ') || '';

            rows.push({
                event_category: eventCategory,
                event_name: eventNameStr,
                ticket_id: reg.ticket_id,
                lead_participant_name: reg.name,
                lead_email: reg.email,
                lead_phone: reg.phone,
                college: reg.college,
                department: reg.department || '',
                year: reg.year || '',
                payment_status: reg.payment_status,
                total_amount: reg.total_amount,
                registration_date: reg.created_at,
                team_name: teamReg?.team_name || '',
                team_size: teamReg?.team_size?.toString() || '',
                other_team_members: memberNames,
            });
        }
    }

    if (rows.length === 0) {
        return new NextResponse("No data available to export.", { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }

    // Generate CSV
    const headers = Object.keys(rows[0]) as (keyof ExportRow)[];
    const csvRows: string[] = [];

    // Header row
    csvRows.push(headers.map(escapeCsv).join(','));

    // Data rows
    rows.forEach((row) => {
        const rowValues = headers.map((header) => escapeCsv(row[header]));
        csvRows.push(rowValues.join(','));
    });

    const csvContent = csvRows.join('\n');

    const headersList = new Headers();
    headersList.set('Content-Type', 'text/csv; charset=utf-8');
    headersList.set('Content-Disposition', `attachment; filename="manthan_registrations_${new Date().toISOString().slice(0, 10)}.csv"`);

    return new NextResponse(csvContent, { status: 200, headers: headersList });
}
