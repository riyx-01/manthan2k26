'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Event, RegistrationFormData, TeamMember, TeamRegistration } from '@/lib/types';
import {
    formatFee,
    categoryColors,
    categoryIcons,
    sportsCommitteeStructure,
    getSportsTrackByName,
} from '@/lib/constants';
import {
    ArrowLeft, ArrowRight, Check, CreditCard, AlertTriangle,
    User, Mail, Phone, Building, GraduationCap, BookOpen,
    ShieldCheck
} from 'lucide-react';

declare global {
    interface Window {
        Razorpay?: new (options: Record<string, unknown>) => {
            on: (event: string, handler: (response: { error?: { description?: string } }) => void) => void;
            open: () => void;
        };
    }
}

function getErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    return fallback;
}

const yearOptions = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'PG 1st Year', 'PG 2nd Year'];
const steps = [
    { id: 1, label: 'Basic Info' },
    { id: 2, label: 'Events' },
    { id: 3, label: 'Payment' },
];

function getTeamBounds(event: Event): { min: number; max: number } {
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

function needsTeamDetails(event: Event): boolean {
    return getTeamBounds(event).max > 1;
}

function getDefaultTeamSize(event: Event): number {
    return getTeamBounds(event).min;
}

function normalizeMembers(members: TeamMember[], expectedCount: number): TeamMember[] {
    const normalized = members.slice(0, expectedCount);
    while (normalized.length < expectedCount) {
        normalized.push({ name: '' });
    }
    return normalized;
}

function estimateEventAmount(event: Event, teamRegistration?: TeamRegistration): number {
    const teamSize = needsTeamDetails(event)
        ? Math.max(1, teamRegistration?.team_size ?? getDefaultTeamSize(event))
        : 1;

    return event.fee_calculation === 'per_participant' ? event.fee * teamSize : event.fee;
}

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-manthan-black">
                <LoadingSpinner />
            </div>
        }>
            <RegisterForm />
        </Suspense>
    );
}

function RegisterForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const preselectedEvent = searchParams.get('event');

    const [step, setStep] = useState(1);
    const [direction, setDirection] = useState(1);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState<string[]>(preselectedEvent ? [preselectedEvent] : []);
    const [formData, setFormData] = useState<RegistrationFormData>({
        name: '',
        email: '',
        phone: '',
        college: '',
        year: '',
        department: '',
        event_ids: [],
        team_registrations: [],
    });
    const [teamRegistrations, setTeamRegistrations] = useState<Record<string, TeamRegistration>>({});
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [processing, setProcessing] = useState(false);
    const [razorpayReady, setRazorpayReady] = useState(false);
    const [paymentMessage, setPaymentMessage] = useState('');
    const [paymentError, setPaymentError] = useState('');
    const [focusedField, setFocusedField] = useState<string | null>(null);

    // Fetch events and handle pre-selection resolution
    useEffect(() => {
        async function fetchEvents() {
            try {
                const res = await fetch('/api/events');
                const data = await res.json();
                const fetchedEvents = data.events || [];
                setEvents(fetchedEvents);

                // Resolve pre-selection (slug or ID) to a valid UUID ID
                if (preselectedEvent) {
                    const event = fetchedEvents.find((e: Event) =>
                        e.slug === preselectedEvent || e.id === preselectedEvent
                    );
                    if (event) {
                        setSelectedIds([event.id]);
                        console.log('Resolved preselected event:', event.name, event.id);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch events:', err);
            } finally {
                setLoading(false);
            }
        }
        fetchEvents();
    }, [preselectedEvent]);

    // Load Razorpay script
    useEffect(() => {
        if (typeof window !== 'undefined' && window.Razorpay) {
            setRazorpayReady(true);
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        script.onload = () => setRazorpayReady(true);
        script.onerror = () => {
            setRazorpayReady(false);
            setPaymentError('Failed to load payment gateway. Please refresh and try again.');
        };
        document.body.appendChild(script);
        return () => {
            document.body.removeChild(script);
        };
    }, []);

    // Toggle event selection
    const toggleEvent = useCallback((id: string) => {
        console.log('Toggling event ID:', id);
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((i) => i !== id);
            }
            // Optional: Limit total events or check for conflicts
            return [...prev, id];
        });
        // Clear global event error if selecting something
        setErrors(errs => ({ ...errs, events: '' }));
    }, []);

    useEffect(() => {
        setTeamRegistrations((prev) => {
            const next: Record<string, TeamRegistration> = {};

            for (const event of events) {
                if (!selectedIds.includes(event.id) || !needsTeamDetails(event)) {
                    continue;
                }

                const existing = prev[event.id];
                const bounds = getTeamBounds(event);
                const safeSize = existing
                    ? Math.min(bounds.max, Math.max(bounds.min, existing.team_size))
                    : getDefaultTeamSize(event);

                next[event.id] = {
                    event_id: event.id,
                    team_name: existing?.team_name || '',
                    team_size: safeSize,
                    members: normalizeMembers(existing?.members || [], Math.max(0, safeSize)),
                };
            }

            return next;
        });
    }, [events, selectedIds]);

    const updateTeamRegistration = useCallback(
        (eventId: string, updater: (current: TeamRegistration) => TeamRegistration) => {
            setTeamRegistrations((prev) => {
                const event = events.find((entry) => entry.id === eventId);
                if (!event || !needsTeamDetails(event)) {
                    return prev;
                }

                const existing = prev[eventId] || {
                    event_id: eventId,
                    team_name: '',
                    team_size: getDefaultTeamSize(event),
                    members: normalizeMembers([], Math.max(0, getDefaultTeamSize(event))),
                };

                const updated = updater(existing);
                const bounds = getTeamBounds(event);
                const clampedSize = Math.min(bounds.max, Math.max(bounds.min, updated.team_size));

                return {
                    ...prev,
                    [eventId]: {
                        ...updated,
                        team_size: clampedSize,
                        members: normalizeMembers(updated.members || [], Math.max(0, clampedSize)),
                    },
                };
            });
        },
        [events]
    );

    // Calculate total
    const previewTotal = events
        .filter((e) => selectedIds.includes(e.id))
        .reduce((sum, e) => sum + estimateEventAmount(e, teamRegistrations[e.id]), 0);

    const selectedEvents = events.filter((e) => selectedIds.includes(e.id));

    // Validate basic info
    const validateBasicInfo = (): boolean => {
        const newErrors: Record<string, string> = {};
        if (!formData.name || formData.name.trim().length < 2)
            newErrors.name = 'Name must be at least 2 characters';
        if (!formData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
            newErrors.email = 'Enter a valid email address';
        if (!formData.phone || !/^[6-9]\d{9}$/.test(formData.phone))
            newErrors.phone = 'Enter a valid 10-digit mobile number';
        if (!formData.college || formData.college.trim().length < 2)
            newErrors.college = 'College name is required';
        if (!formData.year)
            newErrors.year = 'Select your year';
        if (!formData.department || formData.department.trim().length < 1)
            newErrors.department = 'Department is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Validate events
    const validateEvents = (): boolean => {
        if (selectedIds.length === 0) {
            setErrors({ events: 'Please select at least one event' });
            return false;
        }

        for (const event of selectedEvents) {
            if (!needsTeamDetails(event)) {
                continue;
            }

            const team = teamRegistrations[event.id];
            if (!team) {
                setErrors({ events: `Team details are required for ${event.name}` });
                return false;
            }

            const bounds = getTeamBounds(event);
            if (team.team_size < bounds.min || team.team_size > bounds.max) {
                setErrors({
                    events:
                        bounds.min === bounds.max
                            ? `${event.name} requires exactly ${bounds.min} participants`
                            : `${event.name} team size must be between ${bounds.min} and ${bounds.max}`,
                });
                return false;
            }

            if (team.members.length !== Math.max(0, team.team_size)) {
                setErrors({ events: `${event.name} teammate details are incomplete` });
                return false;
            }

            for (let index = 0; index < team.members.length; index++) {
                const member = team.members[index];
                if (!member.name || member.name.trim().length < 2) {
                    setErrors({ events: `${event.name}: teammate ${index + 1} name is required` });
                    return false;
                }
            }
        }

        setErrors({});
        return true;
    };

    // Navigate steps
    const goNext = () => {
        console.log('Attempting to go to next step from:', step);
        if (step === 1 && !validateBasicInfo()) {
            console.log('Basic info validation failed');
            return;
        }
        if (step === 2 && !validateEvents()) {
            console.log('Events validation failed');
            return;
        }
        setDirection(1);
        setStep((s) => {
            const next = Math.min(s + 1, 3);
            console.log('Moving to step:', next);
            return next;
        });
    };

    const goBack = () => {
        console.log('Going back from step:', step);
        setDirection(-1);
        setStep((s) => Math.max(s - 1, 1));
    };

    // Handle payment
    const handlePayment = async () => {
        if (processing) {
            return;
        }

        setProcessing(true);
        setPaymentMessage('');
        setPaymentError('');

        try {
            if (!validateBasicInfo() || !validateEvents()) {
                setProcessing(false);
                return;
            }

            if (!razorpayReady || !window.Razorpay) {
                throw new Error('Payment gateway is still loading. Please try again in a moment.');
            }

            if (!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
                throw new Error('Payment key is not configured. Please contact support.');
            }

            const teamPayload = selectedEvents
                .filter((event) => needsTeamDetails(event))
                .map((event) => {
                    const team = teamRegistrations[event.id];
                    return {
                        event_id: event.id,
                        team_name: team.team_name?.trim() || null,
                        team_size: team.team_size,
                        members: team.members.map((member) => ({
                            name: member.name,
                        })),
                    };
                });

            const payload = {
                ...formData,
                event_ids: selectedIds,
                team_registrations: teamPayload,
            };

            const orderResponse = await fetch('/api/payment/create-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const orderData = await orderResponse.json();
            if (!orderResponse.ok) {
                throw new Error(orderData.error || 'Failed to create payment order.');
            }

            const checkout = new window.Razorpay({
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.order.amount,
                currency: orderData.order.currency,
                name: 'Manthan 2026',
                description: `${selectedIds.length} event registration${selectedIds.length > 1 ? 's' : ''}`,
                order_id: orderData.order.id,
                prefill: {
                    name: formData.name,
                    email: formData.email,
                    contact: formData.phone,
                },
                notes: {
                    college: formData.college,
                },
                theme: {
                    color: '#8B0000',
                },
                handler: async (response: {
                    razorpay_order_id: string;
                    razorpay_payment_id: string;
                    razorpay_signature: string;
                }) => {
                    setProcessing(true);
                    setPaymentError('');

                    try {
                        const verifyResponse = await fetch('/api/payment/verify', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify(response),
                        });

                        const verifyData = await verifyResponse.json();
                        if (!verifyResponse.ok) {
                            throw new Error(verifyData.error || 'Payment verification failed.');
                        }

                        setPaymentMessage('Payment verified successfully. Redirecting to your confirmation pass...');
                        router.push(`/confirmation/${verifyData.ticket_id || orderData.ticket_id}`);
                    } catch (error: unknown) {
                        setPaymentError(getErrorMessage(error, 'Payment verification failed.'));
                    } finally {
                        setProcessing(false);
                    }
                },
                modal: {
                    ondismiss: () => {
                        setPaymentError('Payment was cancelled. You can try again.');
                        setProcessing(false);
                    },
                },
            });

            checkout.on('payment.failed', (response: { error?: { description?: string } }) => {
                setPaymentError(response.error?.description || 'Payment failed. Please try again.');
                setProcessing(false);
            });

            checkout.open();
            setProcessing(false);
        } catch (error: unknown) {
            setPaymentError(getErrorMessage(error, 'Unable to start payment. Please try again.'));
            setProcessing(false);
        }
    };

    // Animation variants
    const slideVariants = {
        enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
        center: { x: 0, opacity: 1 },
        exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-manthan-black">
                <div className="text-center">
                    <LoadingSpinner />
                    <p className="text-gray-500 mt-4 text-sm">Loading events...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent flex flex-col relative overflow-hidden">
            <Navbar />

            {/* Background Glows */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-manthan-maroon/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-manthan-gold/5 rounded-full blur-[120px] pointer-events-none" />

            {/* Progress Bar Container */}
            <div className="pt-24 px-6 md:pt-32">
                <div className="max-w-2xl mx-auto">
                    {/* Step indicators */}
                    <div className="flex items-center justify-between mb-2">
                        {steps.map((s, i) => (
                            <div key={s.id} className="flex items-center">
                                <button
                                    onClick={() => {
                                        if (s.id < step) {
                                            setDirection(-1);
                                            setStep(s.id);
                                        }
                                    }}
                                    className={`flex items-center gap-2 text-xs font-medium transition-all ${step === s.id
                                        ? 'text-manthan-gold'
                                        : step > s.id
                                            ? 'text-manthan-gold/60 cursor-pointer hover:text-manthan-gold'
                                            : 'text-gray-600 cursor-default'
                                        }`}
                                >
                                    <span
                                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border transition-all ${step > s.id
                                            ? 'bg-manthan-gold/20 border-manthan-gold/40 text-manthan-gold'
                                            : step === s.id
                                                ? 'bg-manthan-gold border-manthan-gold text-manthan-black'
                                                : 'bg-transparent border-gray-700 text-gray-600'
                                            }`}
                                    >
                                        {step > s.id ? <Check size={12} /> : s.id}
                                    </span>
                                    <span className="hidden sm:inline">{s.label}</span>
                                </button>
                                {i < steps.length - 1 && (
                                    <div className={`w-12 sm:w-24 h-px mx-2 sm:mx-4 transition-colors ${step > s.id ? 'bg-manthan-gold/40' : 'bg-gray-800'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Thin progress bar */}
                    <div className="h-0.5 bg-gray-800/50 rounded-full overflow-hidden mt-4">
                        <motion.div
                            className="h-full bg-gradient-to-r from-manthan-gold to-manthan-gold-light"
                            initial={false}
                            animate={{ width: `${((step - 1) / (steps.length - 1)) * 100}%` }}
                            transition={{ duration: 0.4, ease: 'easeOut' }}
                        />
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 flex flex-col items-center justify-start px-6 py-8 sm:py-12 overflow-y-auto">
                <div className="w-full max-w-2xl">
                    <AnimatePresence mode="wait" custom={direction}>
                        {step === 1 && (
                            <motion.div
                                key="basic-info"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                <BasicInfoStep
                                    formData={formData}
                                    setFormData={setFormData}
                                    errors={errors}
                                    focusedField={focusedField}
                                    setFocusedField={setFocusedField}
                                    onNext={goNext}
                                />
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div
                                key="events"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                <EventSelectionStep
                                    events={events}
                                    selectedIds={selectedIds}
                                    toggleEvent={toggleEvent}
                                    error={errors.events}
                                    previewTotal={previewTotal}
                                    teamRegistrations={teamRegistrations}
                                    updateTeamRegistration={updateTeamRegistration}
                                />
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div
                                key="payment"
                                custom={direction}
                                variants={slideVariants}
                                initial="enter"
                                animate="center"
                                exit="exit"
                                transition={{ duration: 0.3, ease: 'easeOut' }}
                            >
                                <PaymentStep
                                    formData={formData}
                                    selectedEvents={selectedEvents}
                                    previewTotal={previewTotal}
                                    teamRegistrations={teamRegistrations}
                                    razorpayReady={razorpayReady}
                                    paymentMessage={paymentMessage}
                                    paymentError={paymentError}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Navigation */}
            <div className="border-t border-white/5 px-6 py-4">
                <div className="max-w-2xl mx-auto flex items-center justify-between">
                    <button
                        onClick={goBack}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${step === 1
                            ? 'text-gray-700 cursor-not-allowed'
                            : 'text-gray-400 hover:text-manthan-gold hover:bg-white/5'
                            }`}
                        disabled={step === 1}
                    >
                        <ArrowLeft size={16} />
                        Back
                    </button>

                    {step < 3 ? (
                        <button
                            onClick={goNext}
                            className="flex items-center gap-2 px-8 py-3 bg-manthan-gold text-manthan-black font-bold rounded-full text-sm hover:bg-manthan-gold-light transition-all shadow-xl shadow-manthan-gold/20 active:scale-95 group"
                        >
                            Continue
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    ) : (
                        <button
                            onClick={handlePayment}
                            disabled={processing}
                            className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-manthan-maroon to-manthan-crimson text-white font-bold rounded-full text-sm hover:from-manthan-crimson hover:to-manthan-maroon transition-all shadow-xl shadow-manthan-maroon/40 active:scale-95 disabled:opacity-50 group"
                        >
                            {processing ? (
                                <>
                                    <LoadingSpinner />
                                    Processing...
                                </>
                            ) : (
                                <>
                                    <CreditCard size={18} />
                                    Pay {formatFee(previewTotal)}
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform ml-1" />
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="mt-auto">
                <Footer />
            </div>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Step 1 — Basic Info (Youform style)
   ────────────────────────────────────────────── */
function BasicInfoStep({
    formData,
    setFormData,
    errors,
    focusedField,
    setFocusedField,
    onNext,
}: {
    formData: RegistrationFormData;
    setFormData: (data: RegistrationFormData) => void;
    errors: Record<string, string>;
    focusedField: string | null;
    setFocusedField: (field: string | null) => void;
    onNext: () => void;
}) {
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const inputs = document.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
                '[data-form-field]'
            );
            const current = document.activeElement;
            const arr = Array.from(inputs);
            const idx = arr.indexOf(current as HTMLInputElement | HTMLSelectElement);
            if (idx >= 0 && idx < arr.length - 1) {
                arr[idx + 1].focus();
            } else {
                onNext();
            }
        }
    };

    return (
        <div>
            <div className="mb-10 text-center sm:text-left">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-heading text-3xl sm:text-4xl font-bold text-gold-gradient mb-3"
                >
                    Tell us about yourself
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-gray-400 text-sm sm:text-base"
                >
                    Fill in your details to register for Manthan 2026
                </motion.p>
            </div>

            <div className="space-y-5">
                <FormField
                    icon={<User size={18} />}
                    label="Full Name"
                    error={errors.name}
                    focused={focusedField === 'name'}
                >
                    <input
                        data-form-field
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        onFocus={() => setFocusedField('name')}
                        onBlur={() => setFocusedField(null)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your full name"
                        className="w-full bg-transparent px-4 py-4 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none"
                        autoFocus
                    />
                </FormField>

                <FormField
                    icon={<Mail size={18} />}
                    label="Email Address"
                    error={errors.email}
                    focused={focusedField === 'email'}
                >
                    <input
                        data-form-field
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => setFocusedField(null)}
                        onKeyDown={handleKeyDown}
                        placeholder="your@email.com"
                        className="w-full bg-transparent px-4 py-4 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none"
                    />
                </FormField>

                <FormField
                    icon={<Phone size={18} />}
                    label="Phone Number"
                    error={errors.phone}
                    focused={focusedField === 'phone'}
                >
                    <input
                        data-form-field
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        onFocus={() => setFocusedField('phone')}
                        onBlur={() => setFocusedField(null)}
                        onKeyDown={handleKeyDown}
                        placeholder="10-digit mobile number"
                        maxLength={10}
                        className="w-full bg-transparent px-4 py-4 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none"
                    />
                </FormField>

                <FormField
                    icon={<Building size={18} />}
                    label="College Name"
                    error={errors.college}
                    focused={focusedField === 'college'}
                >
                    <input
                        data-form-field
                        type="text"
                        value={formData.college}
                        onChange={(e) => setFormData({ ...formData, college: e.target.value })}
                        onFocus={() => setFocusedField('college')}
                        onBlur={() => setFocusedField(null)}
                        onKeyDown={handleKeyDown}
                        placeholder="Enter your college name"
                        className="w-full bg-transparent px-4 py-4 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none"
                    />
                </FormField>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <FormField
                        icon={<GraduationCap size={18} />}
                        label="Year"
                        error={errors.year}
                        focused={focusedField === 'year'}
                    >
                        <select
                            data-form-field
                            value={formData.year}
                            onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                            onFocus={() => setFocusedField('year')}
                            onBlur={() => setFocusedField(null)}
                            className="w-full bg-transparent px-4 py-4 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none appearance-none"
                        >
                            <option value="" className="bg-manthan-black">Select Year</option>
                            {yearOptions.map((y) => (
                                <option key={y} value={y} className="bg-manthan-black">{y}</option>
                            ))}
                        </select>
                    </FormField>

                    <FormField
                        icon={<BookOpen size={18} />}
                        label="Department"
                        error={errors.department}
                        focused={focusedField === 'department'}
                    >
                        <input
                            data-form-field
                            type="text"
                            value={formData.department}
                            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                            onFocus={() => setFocusedField('department')}
                            onBlur={() => setFocusedField(null)}
                            onKeyDown={handleKeyDown}
                            placeholder="e.g., Computer Science"
                            className="w-full bg-transparent px-4 py-4 text-sm text-gray-100 placeholder:text-gray-600 focus:outline-none"
                        />
                    </FormField>
                </div>
            </div>

            <p className="mt-6 text-gray-600 text-xs text-center">
                Press <kbd className="px-1.5 py-0.5 bg-white/5 rounded text-gray-500 text-[10px] font-mono">Enter ↵</kbd> to move between fields
            </p>
        </div>
    );
}

/* ──────────────────────────────────────────────
   Youform-style field wrapper
   ────────────────────────────────────────────── */
function FormField({
    icon,
    label,
    error,
    focused,
    children,
}: {
    icon: React.ReactNode;
    label: string;
    error?: string;
    focused: boolean;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5 tracking-wide uppercase">
                {label}
            </label>
            <div
                className={`relative flex items-center rounded-xl border transition-all duration-300 ${error
                    ? 'border-manthan-crimson/50 bg-manthan-crimson/10 shadow-[0_0_15px_rgba(220,20,60,0.1)]'
                    : focused
                        ? 'border-manthan-gold/60 bg-manthan-gold/10 shadow-[0_0_20px_rgba(212,168,55,0.15)]'
                        : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
            >
                <div className={`pl-4 flex items-center justify-center transition-colors duration-300 ${focused ? 'text-manthan-gold' : 'text-gray-500'
                    }`}>
                    {icon}
                    <div className="w-px h-6 bg-white/10 ml-4" />
                </div>
                {children}
            </div>
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-manthan-crimson text-xs mt-1.5 pl-1"
                >
                    {error}
                </motion.p>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────
   Step 2 — Event Selection
   ────────────────────────────────────────────── */
function EventSelectionStep({
    events,
    selectedIds,
    toggleEvent,
    error,
    previewTotal,
    teamRegistrations,
    updateTeamRegistration,
}: {
    events: Event[];
    selectedIds: string[];
    toggleEvent: (id: string) => void;
    error?: string;
    previewTotal: number;
    teamRegistrations: Record<string, TeamRegistration>;
    updateTeamRegistration: (eventId: string, updater: (current: TeamRegistration) => TeamRegistration) => void;
}) {
    const categories = ['technical', 'cultural', 'sports'] as const;
    const sportsTrackTitles: Record<'indoor' | 'outdoor', string> = {
        outdoor: 'Outdoor Sports',
        indoor: 'Indoor Sports',
    };

    const renderEventCard = (event: Event) => {
        const isSelected = selectedIds.includes(event.id);
        const bounds = getTeamBounds(event);
        const teamLabel = bounds.min === bounds.max
            ? (bounds.max === 1 ? 'Solo' : `Team of ${bounds.max}`)
            : `Team ${bounds.min}-${bounds.max}`;

        const amountLabel = event.fee_calculation === 'per_participant'
            ? `${formatFee(event.fee)} / participant`
            : formatFee(event.fee);

        return (
            <motion.button
                key={event.id}
                onClick={() => toggleEvent(event.id)}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-5 rounded-2xl border transition-all duration-300 ${isSelected
                    ? 'border-manthan-gold/60 bg-manthan-gold/10 shadow-[0_0_20px_rgba(212,168,55,0.1)]'
                    : 'border-white/10 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]'
                    }`}
            >
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                        <h4 className={`font-semibold text-sm mb-1 ${isSelected ? 'text-manthan-gold' : 'text-gray-200'
                            }`}>
                            {event.name}
                        </h4>
                        <p className="text-gray-500 text-xs line-clamp-1 mb-2">
                            {event.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-600">
                            <span>{teamLabel}</span>
                            <span>·</span>
                            <span>{event.venue}</span>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <span className={`text-sm font-bold ${isSelected ? 'text-manthan-gold' : 'text-gray-400'
                            }`}>
                            {amountLabel}
                        </span>
                        <div
                            className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${isSelected
                                ? 'bg-manthan-gold border-manthan-gold'
                                : 'border-gray-600'
                                }`}
                        >
                            {isSelected && <Check size={12} className="text-manthan-black" />}
                        </div>
                    </div>
                </div>
            </motion.button>
        );
    };

    return (
        <div>
            <div className="mb-8">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-gold-gradient mb-2">
                    Choose your events
                </h2>
                <p className="text-gray-500 text-sm">
                    Select the events you&apos;d like to participate in
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-3 rounded-lg bg-manthan-crimson/10 border border-manthan-crimson/20 text-manthan-crimson text-sm"
                >
                    {error}
                </motion.div>
            )}

            {events.length === 0 && (
                <div className="mb-8 rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
                    <h3 className="text-sm font-semibold text-manthan-gold mb-4">Sports Committee Structure</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                        <div>
                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Outdoor Sports</p>
                            <ul className="space-y-1.5">
                                {sportsCommitteeStructure.outdoor.map((sport) => (
                                    <li key={sport} className="text-sm text-gray-300">• {sport}</li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">Indoor Sports</p>
                            <ul className="space-y-1.5">
                                {sportsCommitteeStructure.indoor.map((sport) => (
                                    <li key={sport} className="text-sm text-gray-300">• {sport}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-4">
                        No active events are published yet. We can now add these sports one by one.
                    </p>
                </div>
            )}

            <div className="space-y-8">
                {categories.map((cat) => {
                    const catEvents = events.filter((e) => e.category === cat);
                    if (catEvents.length === 0) return null;
                    const colors = categoryColors[cat];

                    if (cat === 'sports') {
                        const outdoorEvents = catEvents.filter((event) => getSportsTrackByName(event.name) === 'outdoor');
                        const indoorEvents = catEvents.filter((event) => getSportsTrackByName(event.name) === 'indoor');
                        const otherSportsEvents = catEvents.filter((event) => !getSportsTrackByName(event.name));

                        const groupedSports: Array<{ track: 'outdoor' | 'indoor'; list: Event[] }> = [
                            { track: 'outdoor', list: outdoorEvents },
                            { track: 'indoor', list: indoorEvents },
                        ];

                        return (
                            <div key={cat}>
                                <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${colors.text}`}>
                                    {categoryIcons[cat]} {cat}
                                </h3>

                                <div className="space-y-5">
                                    {groupedSports.map(({ track, list }) => {
                                        if (list.length === 0) return null;
                                        return (
                                            <div key={track}>
                                                <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                                                    {sportsTrackTitles[track]}
                                                </p>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {list.map((event) => renderEventCard(event))}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {otherSportsEvents.length > 0 && (
                                        <div>
                                            <p className="text-xs uppercase tracking-wider text-gray-500 mb-2">
                                                More Sports Events
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                {otherSportsEvents.map((event) => renderEventCard(event))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={cat}>
                            <h3 className={`text-sm font-semibold uppercase tracking-wider mb-3 ${colors.text}`}>
                                {categoryIcons[cat]} {cat}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {catEvents.map((event) => renderEventCard(event))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedIds.length > 0 && (
                <div className="mt-8 space-y-4">
                    {events
                        .filter((event) => selectedIds.includes(event.id) && needsTeamDetails(event))
                        .map((event) => {
                            const team = teamRegistrations[event.id];
                            if (!team) return null;

                            const bounds = getTeamBounds(event);
                            const isFixed = bounds.min === bounds.max;

                            return (
                                <div
                                    key={`${event.id}-team-config`}
                                    className="p-4 rounded-xl border border-manthan-gold/20 bg-manthan-gold/5"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                                        <h4 className="text-manthan-gold font-semibold text-sm">{event.name} · Team Details</h4>
                                        <span className="text-xs text-gray-500">
                                            {event.fee_calculation === 'per_participant' ? 'Fee per participant' : 'Fee per team'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Team Name (optional)</label>
                                            <input
                                                type="text"
                                                value={team.team_name || ''}
                                                onChange={(e) =>
                                                    updateTeamRegistration(event.id, (current) => ({
                                                        ...current,
                                                        team_name: e.target.value,
                                                    }))
                                                }
                                                className="w-full rounded-lg border border-white/20 bg-white/[0.04] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-manthan-gold/40 focus:outline-none"
                                                placeholder="Enter team name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs text-gray-500 mb-1">Team Size</label>
                                            {isFixed ? (
                                                <div className="w-full rounded-lg border border-white/20 bg-white/[0.04] px-3 py-2 text-sm text-gray-100 opacity-60">
                                                    {team.team_size}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-0 rounded-lg border border-white/20 bg-white/[0.04] overflow-hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateTeamRegistration(event.id, (current) => ({
                                                                ...current,
                                                                team_size: current.team_size - 1,
                                                            }))
                                                        }
                                                        disabled={team.team_size <= bounds.min}
                                                        className="px-4 py-2 text-lg font-bold text-manthan-gold hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none"
                                                    >
                                                        −
                                                    </button>
                                                    <span className="flex-1 text-center text-sm font-semibold text-gray-100 py-2 select-none">
                                                        {team.team_size}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            updateTeamRegistration(event.id, (current) => ({
                                                                ...current,
                                                                team_size: current.team_size + 1,
                                                            }))
                                                        }
                                                        disabled={team.team_size >= bounds.max}
                                                        className="px-4 py-2 text-lg font-bold text-manthan-gold hover:bg-white/10 transition-colors disabled:opacity-30 disabled:cursor-not-allowed select-none"
                                                    >
                                                        +
                                                    </button>
                                                </div>
                                            )}
                                            <p className="text-[11px] text-gray-600 mt-1">
                                                {isFixed
                                                    ? `Fixed team size: ${bounds.min}`
                                                    : `${bounds.min} to ${bounds.max} participants`}
                                            </p>
                                        </div>
                                    </div>

                                    {team.members.length > 0 && (
                                        <div className="space-y-2">
                                            <p className="text-xs uppercase tracking-wide text-gray-400">
                                                Team member names
                                            </p>
                                            {team.members.map((member, index) => (
                                                <div key={`${event.id}-member-${index}`} className="grid grid-cols-1 gap-2">
                                                    <input
                                                        type="text"
                                                        value={member.name}
                                                        onChange={(e) =>
                                                            updateTeamRegistration(event.id, (current) => {
                                                                const members = [...current.members];
                                                                members[index] = {
                                                                    ...members[index],
                                                                    name: e.target.value,
                                                                };
                                                                return { ...current, members };
                                                            })
                                                        }
                                                        placeholder={`Teammate ${index + 1} name`}
                                                        className="w-full rounded-lg border border-white/20 bg-white/[0.04] px-3 py-2 text-sm text-gray-100 placeholder:text-gray-500 focus:border-manthan-gold/40 focus:outline-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                </div>
            )}

            {selectedIds.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-8 p-4 rounded-xl border border-manthan-gold/20 bg-manthan-gold/5"
                >
                    <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">
                            {selectedIds.length} event{selectedIds.length !== 1 ? 's' : ''} selected
                        </span>
                        <span className="text-manthan-gold font-bold text-lg">
                            {formatFee(previewTotal)}
                        </span>
                    </div>
                </motion.div>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────
   Step 3 — Payment Review
   ────────────────────────────────────────────── */
function PaymentStep({
    formData,
    selectedEvents,
    previewTotal,
    teamRegistrations,
    razorpayReady,
    paymentMessage,
    paymentError,
}: {
    formData: RegistrationFormData;
    selectedEvents: Event[];
    previewTotal: number;
    teamRegistrations: Record<string, TeamRegistration>;
    razorpayReady: boolean;
    paymentMessage: string;
    paymentError: string;
}) {
    return (
        <div>
            <div className="mb-8">
                <h2 className="font-heading text-2xl sm:text-3xl font-bold text-gold-gradient mb-2">
                    Review &amp; Pay
                </h2>
                <p className="text-gray-500 text-sm">
                    Verify your details and proceed to payment
                </p>
            </div>

            {/* Personal Info */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
                    Your Details
                </h3>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                    <InfoRow label="Name" value={formData.name} />
                    <InfoRow label="Email" value={formData.email} />
                    <InfoRow label="Phone" value={formData.phone} />
                    <InfoRow label="College" value={formData.college} />
                    <InfoRow label="Year" value={formData.year} />
                    <InfoRow label="Department" value={formData.department} />
                </div>
            </div>

            {/* Events Breakdown */}
            <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 mb-5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-4">
                    Selected Events
                </h3>
                <div className="space-y-3">
                    {selectedEvents.map((event) => (
                        <div key={event.id} className="flex items-center justify-between py-2">
                            <div>
                                <p className="text-gray-200 text-sm font-medium">{event.name}</p>
                                <p className="text-gray-600 text-xs">
                                    {categoryIcons[event.category]} {event.category} · {event.venue}
                                    {needsTeamDetails(event) && (
                                        <>
                                            {' · '}
                                            Team size {teamRegistrations[event.id]?.team_size || getDefaultTeamSize(event)}
                                        </>
                                    )}
                                </p>
                            </div>
                            <span className="text-manthan-gold font-semibold text-sm">
                                {formatFee(estimateEventAmount(event, teamRegistrations[event.id]))}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.08] flex items-center justify-between">
                    <span className="text-gray-300 font-semibold">Total Amount</span>
                    <span className="text-manthan-gold font-bold text-2xl">
                        {formatFee(previewTotal)}
                    </span>
                </div>
            </div>

            {/* Security badge */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-manthan-gold/5 border border-manthan-gold/10 mb-5">
                <ShieldCheck size={18} className="text-manthan-gold flex-shrink-0" />
                <p className="text-gray-500 text-xs">
                    Secure payment via Razorpay. Your registration is confirmed only after successful payment verification.
                </p>
            </div>

            {!razorpayReady && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-manthan-crimson/10 border border-manthan-crimson/20 mb-5">
                    <AlertTriangle size={18} className="text-manthan-crimson flex-shrink-0" />
                    <p className="text-manthan-crimson text-xs">
                        Payment gateway is loading. Please wait a moment before clicking Pay.
                    </p>
                </div>
            )}

            {paymentMessage && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-manthan-gold/10 border border-manthan-gold/20 flex items-start gap-3 mb-5"
                >
                    <ShieldCheck size={18} className="text-manthan-gold flex-shrink-0 mt-0.5" />
                    <p className="text-manthan-gold-light text-sm">{paymentMessage}</p>
                </motion.div>
            )}

            {paymentError && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-xl bg-red-900/20 border border-red-500/20 flex items-start gap-3 mb-5"
                >
                    <AlertTriangle size={18} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-red-300 text-sm">{paymentError}</p>
                </motion.div>
            )}
        </div>
    );
}

/* ──────────────────────────────────────────────
   Shared helpers
   ────────────────────────────────────────────── */
const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div>
        <span className="text-gray-600 text-xs block mb-0.5">{label}</span>
        <span className="text-gray-200 text-sm font-medium">{value || 'N/A'}</span>
    </div>
);
