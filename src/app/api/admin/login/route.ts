import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 });
        }

        // Use a separate anon client for auth; keep service-role client for admin table lookup.
        const authClient = createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // Authenticate with Supabase Auth (supports both v1 and v2 clients)
        const authApi = authClient.auth as unknown as {
            signInWithPassword?: (credentials: { email: string; password: string }) => Promise<{
                data?: { user?: { id: string; email?: string | null } | null; session?: { access_token?: string | null } | null };
                error?: unknown;
            }>;
            signIn?: (credentials: { email: string; password: string }) => Promise<{
                user?: { id: string; email?: string | null } | null;
                session?: { access_token?: string | null } | null;
                error?: unknown;
            }>;
        };

        let authData: { user: { id: string; email?: string | null } | null; session: { access_token?: string | null } | null } = {
            user: null,
            session: null,
        };
        let authError: unknown = null;

        if (authApi.signInWithPassword) {
            const result = await authApi.signInWithPassword({ email, password });
            authError = result.error;
            authData = {
                user: result.data?.user || null,
                session: result.data?.session || null,
            };
        } else if (authApi.signIn) {
            const result = await authApi.signIn({ email, password });
            authError = result.error;
            authData = {
                user: result.user || null,
                session: result.session || null,
            };
        } else {
            return NextResponse.json({ error: 'Supabase auth method not available' }, { status: 500 });
        }

        if (authError || !authData.user) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const normalizedEmail = (authData.user.email || email).trim().toLowerCase();

        // Primary check: map by auth user id
        const { data: adminByIdRows, error: adminByIdError } = await supabaseAdmin
            .from('admin_users')
            .select('*')
            .eq('id', authData.user.id)
            .limit(1);

        let adminUser = adminByIdRows?.[0] || null;
        let debugReason = 'matched_by_id';

        // Fallback check: if id mapping is missing, try by email and self-heal id mapping
        if (!adminUser) {
            const { data: adminByEmailRows, error: adminByEmailError } = await supabaseAdmin
                .from('admin_users')
                .select('*')
                .ilike('email', normalizedEmail)
                .limit(1);

            if (adminByEmailError) {
                debugReason = `email_lookup_error:${adminByEmailError.message}`;
            }

            const adminByEmail = adminByEmailRows?.[0] || null;

            if (adminByEmail) {
                debugReason = 'matched_by_email';
                if (adminByEmail.id !== authData.user.id) {
                    const { data: updatedRows, error: updateError } = await supabaseAdmin
                        .from('admin_users')
                        .update({
                            id: authData.user.id,
                            email: normalizedEmail,
                        })
                        .eq('email', adminByEmail.email)
                        .select('*')
                        .limit(1);

                    if (updateError) {
                        debugReason = `email_match_but_update_failed:${updateError.message}`;
                    }

                    adminUser = updatedRows?.[0] || adminByEmail;
                } else {
                    adminUser = adminByEmail;
                }
            } else {
                debugReason = 'no_admin_row_by_id_or_email';
            }
        }

        if (adminByIdError || !adminUser) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('[admin-login] authorization failed', {
                    reason: adminByIdError ? `id_lookup_error:${adminByIdError.message}` : debugReason,
                    auth_user_id: authData.user.id,
                    auth_email: normalizedEmail,
                });
            }
            return NextResponse.json(
                {
                    error: 'Not authorized as admin',
                    ...(process.env.NODE_ENV !== 'production'
                        ? {
                            debug: {
                                reason: adminByIdError ? `id_lookup_error:${adminByIdError.message}` : debugReason,
                                auth_user_id: authData.user.id,
                                auth_email: normalizedEmail,
                            },
                        }
                        : {}),
                },
                { status: 403 }
            );
        }

        return NextResponse.json({
            access_token: authData.session?.access_token,
            user: {
                id: adminUser.id,
                email: adminUser.email,
                role: adminUser.role,
                name: adminUser.name,
            },
        });
    } catch {
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
