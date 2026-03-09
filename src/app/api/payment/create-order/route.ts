import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { supabaseAdmin } from '@/lib/supabase/server';
import { registrationSchema } from '@/lib/validations';
import { generateTicketId, sanitizeInput } from '@/lib/constants';
import { checkRateLimit } from '@/lib/rate-limit';
import { getEventsByIds } from '@/lib/events-catalog';

type TeamRegistrationPayload = {
    event_id: string;
    team_name?: string | null;
    team_size: number;
    members: Array<{ name: string }>;
};

type DbErrorLike = {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
};

function getTeamBounds(event: {
    team_size: number;
    team_size_fixed: number | null;
    team_size_min: number | null;
    team_size_max: number | null;
}) {
    if (event.team_size_fixed && event.team_size_fixed > 0) {
        return { min: event.team_size_fixed, max: event.team_size_fixed };
    }

    if (event.team_size_min && event.team_size_max) {
        return { min: event.team_size_min, max: event.team_size_max };
    }

    if (event.team_size > 1) {
        return { min: event.team_size, max: event.team_size };
    }

    return { min: 1, max: 1 };
}

function sanitizeTeamRegistrations(payload: TeamRegistrationPayload[]) {
    return payload.map((team) => ({
        event_id: team.event_id,
        team_name: team.team_name?.trim() ? sanitizeInput(team.team_name) : null,
        team_size: team.team_size,
        members: team.members.map((member) => ({
            name: sanitizeInput(member.name),
        })),
    }));
}

function getRazorpay() {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay keys are not configured');
    }
    return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
}

function getClientIp(request: NextRequest): string {
    const forwardedFor = request.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }

    return request.headers.get('x-real-ip') || 'unknown';
}

function toDbErrorLike(error: unknown): DbErrorLike {
    if (!error || typeof error !== 'object') {
        return {};
    }

    const candidate = error as Record<string, unknown>;
    return {
        code: typeof candidate.code === 'string' ? candidate.code : undefined,
        message: typeof candidate.message === 'string' ? candidate.message : undefined,
        details: typeof candidate.details === 'string' ? candidate.details : undefined,
        hint: typeof candidate.hint === 'string' ? candidate.hint : undefined,
    };
}

function extractMissingColumnFromError(error: unknown): string | null {
    const parsedError = toDbErrorLike(error);
    const haystacks = [parsedError.message, parsedError.details, parsedError.hint]
        .filter(Boolean)
        .map((value) => String(value));

    for (const text of haystacks) {
        const relationMatch = text.match(/column\s+["']?([a-zA-Z_][a-zA-Z0-9_]*)["']?\s+of\s+relation\s+["']?registrations["']?\s+does\s+not\s+exist/i);
        if (relationMatch?.[1]) {
            return relationMatch[1];
        }

        const schemaCacheMatch = text.match(/Could not find the ['"]([a-zA-Z_][a-zA-Z0-9_]*)['"] column of ['"]registrations['"] in the schema cache/i);
        if (schemaCacheMatch?.[1]) {
            return schemaCacheMatch[1];
        }
    }

    return null;
}

function isTicketIdUniqueViolation(error: unknown): boolean {
    const parsedError = toDbErrorLike(error);
    const code = String(parsedError.code || '');
    const message = String(parsedError.message || '');
    const details = String(parsedError.details || '');

    if (code === '23505' && /ticket_id/i.test(`${message} ${details}`)) {
        return true;
    }

    return /duplicate key value violates unique constraint/i.test(message) && /ticket_id/i.test(`${message} ${details}`);
}

export async function POST(request: NextRequest) {
    try {
        // Rate limiting
        const ip = getClientIp(request);
        let allowed = true;
        try {
            const limitResult = await checkRateLimit(ip, 'create-order');
            allowed = limitResult.allowed;
        } catch (rlError) {
            console.error('Rate limit service error:', rlError);
            // We continue even if rate limiting fails to avoid blocking users
        }

        if (!allowed) {
            return NextResponse.json(
                { error: 'Too many requests. Please try again later.' },
                { status: 429 }
            );
        }

        // Parse and validate input
        const body = await request.json();
        console.log('Payment API Request Body:', JSON.stringify(body, null, 2));
        const validation = registrationSchema.safeParse(body);

        if (!validation.success) {
            console.error('Validation failure details:', JSON.stringify(validation.error.flatten().fieldErrors, null, 2));
            const firstError = Object.values(validation.error.flatten().fieldErrors)[0]?.[0];
            return NextResponse.json(
                {
                    error: firstError ? `Validation error: ${firstError}` : 'Invalid input',
                    details: validation.error.flatten().fieldErrors
                },
                { status: 400 }
            );
        }

        const {
            name,
            email,
            phone,
            college,
            year,
            department,
            event_ids,
            team_registrations = [],
        } = validation.data;

        const teamRegistrationMap = new Map(
            team_registrations.map((item) => [item.event_id, item as TeamRegistrationPayload])
        );

        // Fetch events from static catalog to calculate amount SERVER-SIDE
        console.log('Validating event IDs:', event_ids);
        const events = getEventsByIds(event_ids);

        if (!events || events.length === 0) {
            console.warn('No events found for IDs:', event_ids);
            return NextResponse.json(
                { error: 'Selected events not found or are no longer active' },
                { status: 400 }
            );
        }

        // Verify all selected events exist and are active
        if (events.length !== event_ids.length) {
            console.warn('Mismatched event count. Requested:', event_ids.length, 'Found:', events.length);
            return NextResponse.json(
                { error: 'Some selected events are invalid or inactive' },
                { status: 400 }
            );
        }

        // Validate team payload + calculate total amount SERVER-SIDE (source of truth)
        let totalAmountPaise = 0;

        for (const event of events) {
            const teamPayload = teamRegistrationMap.get(event.id);
            const bounds = getTeamBounds(event);

            let teamSize = 1;

            if (bounds.max > 1) {
                if (!teamPayload) {
                    return NextResponse.json(
                        { error: `Team details are required for "${event.name}".` },
                        { status: 400 }
                    );
                }

                teamSize = teamPayload.team_size;
                if (teamSize < bounds.min || teamSize > bounds.max) {
                    return NextResponse.json(
                        {
                            error:
                                bounds.min === bounds.max
                                    ? `"${event.name}" requires exactly ${bounds.min} participants.`
                                    : `"${event.name}" requires team size between ${bounds.min} and ${bounds.max}.`,
                        },
                        { status: 400 }
                    );
                }

                const expectedMembers = Math.max(0, teamSize);
                if ((teamPayload.members || []).length !== expectedMembers) {
                    return NextResponse.json(
                        {
                            error: `"${event.name}" requires ${expectedMembers} team member name(s).`,
                        },
                        { status: 400 }
                    );
                }
            } else if (teamPayload && teamPayload.team_size !== 1) {
                return NextResponse.json(
                    { error: `"${event.name}" is an individual event and does not accept team entries.` },
                    { status: 400 }
                );
            }

            let eventAmount = event.fee_calculation === 'per_participant' ? event.fee * teamSize : event.fee;

            // Special case for Cultural events: Solo 200, Group 400
            if (event.category === 'cultural' && (event.name === 'NrityaVerse' || event.name === 'SurTarang')) {
                eventAmount = teamSize > 1 ? 40000 : 20000;
            }

            totalAmountPaise += eventAmount;
        }

        if (totalAmountPaise <= 0) {
            return NextResponse.json({ error: 'Invalid total amount' }, { status: 400 });
        }

        // Generate ticket ID
        const primaryCategory = events[0]?.category || 'gen';
        let ticketId = generateTicketId(primaryCategory);

        // Create Razorpay order
        const razorpay = getRazorpay();
        console.log('Creating Razorpay order for amount (paise):', totalAmountPaise);
        const order = await razorpay.orders.create({
            amount: totalAmountPaise,
            currency: 'INR',
            receipt: ticketId,
            notes: {
                ticket_id: ticketId,
                name: sanitizeInput(name),
                email: email,
                phone: phone,
                event_count: event_ids.length.toString(),
            },
        });

        // Store PENDING registration (not confirmed until payment verified)
        const baseInsertPayload: Record<string, unknown> = {
            ticket_id: ticketId,
            name: sanitizeInput(name),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            college: sanitizeInput(college),
            year,
            department: sanitizeInput(department),
            event_ids,
            team_registrations: sanitizeTeamRegistrations(team_registrations as TeamRegistrationPayload[]),
            total_amount: totalAmountPaise,
            payment_status: 'PENDING',
            razorpay_order_id: order.id,
        };

        let insertError: DbErrorLike | null = null;
        let insertPayload: Record<string, unknown> = { ...baseInsertPayload };

        for (let attempt = 1; attempt <= 4; attempt++) {
            const { error } = await supabaseAdmin.from('registrations').insert(insertPayload);

            if (!error) {
                insertError = null;
                break;
            }

            insertError = toDbErrorLike(error);

            if (isTicketIdUniqueViolation(error)) {
                ticketId = generateTicketId(primaryCategory);
                insertPayload = {
                    ...insertPayload,
                    ticket_id: ticketId,
                };
                continue;
            }

            const missingColumn = extractMissingColumnFromError(error);
            if (missingColumn && Object.prototype.hasOwnProperty.call(insertPayload, missingColumn)) {
                const rest = { ...insertPayload };
                delete rest[missingColumn];
                insertPayload = rest;
                console.warn(`registrations insert retrying without missing column: ${missingColumn}`);
                continue;
            }

            break;
        }

        if (insertError) {
            console.error('Failed to create registration (Supabase Error):', insertError);
            return NextResponse.json(
                {
                    error: `Failed to create registration in database. ${insertError.message || ''}`.trim(),
                    details: insertError.message,
                },
                { status: 500 }
            );
        }

        return NextResponse.json({
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency,
            },
            ticket_id: ticketId,
        });
    } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        const responseData =
            typeof err === 'object' && err !== null && 'response' in err
                ? (err as { response?: { data?: unknown } }).response?.data
                : undefined;
        console.error('Create order error details:', {
            message: error.message,
            stack: error.stack,
            cause: error.cause,
            response: responseData,
        });
        return NextResponse.json(
            { error: 'Internal server error. Please try again.', details: error.message },
            { status: 500 }
        );
    }
}
