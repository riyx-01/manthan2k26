'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Event, RegistrationFormData, TeamMember, TeamRegistration } from '@/lib/types';
import {
    formatFee,
    categoryIcons,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [processing, setProcessing] = useState(false);
    const [razorpayReady, setRazorpayReady] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        setSelectedIds((prev) => {
            if (prev.includes(id)) {
                return prev.filter((i) => i !== id);
            }
            return [...prev, id];
        });
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
        if (step === 1 && !validateBasicInfo()) return;
        if (step === 2 && !validateEvents()) return;
        setDirection(1);
        setStep((s) => Math.min(s + 1, 3));
    };

    const goBack = () => {
        setDirection(-1);
        setStep((s) => Math.max(s - 1, 1));
    };

    // Handle payment - temporarily disabled
    const handlePayment = async () => {
        alert('Payments are currently disabled. Please try again later.');
        return;
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
                <div className="w-full max-w-2xl overflow-visible">
                    <div className="parchment-container rounded-none parchment-theme">
                        <div className="scroll-roll" />
                        <div className="parchment-body p-6 sm:p-10 shrink-0">
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
                        <div className="scroll-roll rotate-180" />
                    </div>

                    {/* Bottom Navigation */}
                    <div className="px-6 py-8">
                        <div className="max-w-2xl mx-auto flex items-center justify-between">
                            <button
                                onClick={goBack}
                                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-ancient transition-all ${step === 1
                                    ? 'text-gray-700 cursor-not-allowed'
                                    : 'text-manthan-gold hover:text-manthan-gold/80 hover:bg-white/5'
                                    }`}
                                disabled={step === 1}
                            >
                                <ArrowLeft size={16} />
                                Back
                            </button>

                            {step < 3 ? (
                                <button
                                    onClick={goNext}
                                    className="flex items-center gap-2 px-8 py-3 bg-manthan-gold text-manthan-black font-bold rounded-full text-sm hover:bg-manthan-gold-light transition-all shadow-xl shadow-manthan-gold/20 active:scale-95 group font-ancient uppercase tracking-widest"
                                >
                                    Continue
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            ) : (
                                <button
                                    onClick={handlePayment}
                                    disabled={processing}
                                    className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-manthan-maroon to-manthan-crimson text-white font-bold rounded-full text-sm hover:from-manthan-crimson hover:to-manthan-maroon transition-all shadow-xl shadow-manthan-maroon/40 active:scale-95 disabled:opacity-50 group font-ancient uppercase tracking-widest"
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
                (arr[idx + 1] as HTMLElement).focus();
            } else {
                onNext();
            }
        }
    };

    return (
        <div>
            <div className="mb-10 text-center sm:text-left border-b border-manthan-maroon/10 pb-6">
                <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="font-ancient text-3xl sm:text-4xl font-bold text-[#3d2b1f] mb-3"
                >
                    Personal Scroll
                </motion.h2>
                <motion.p
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-[#5c4033] text-sm sm:text-base italic"
                >
                    Record your identity for the archives of Manthan
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
                        className="w-full bg-transparent px-4 py-4 text-sm text-[#2c1e0f] placeholder:text-[#3d2b1f]/40 focus:outline-none font-ancient"
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
                        className="w-full bg-transparent px-4 py-4 text-sm text-[#2c1e0f] placeholder:text-[#3d2b1f]/40 focus:outline-none font-ancient"
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
                        className="w-full bg-transparent px-4 py-4 text-sm text-[#2c1e0f] placeholder:text-[#3d2b1f]/40 focus:outline-none font-ancient"
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
                        className="w-full bg-transparent px-4 py-4 text-sm text-[#2c1e0f] placeholder:text-[#3d2b1f]/40 focus:outline-none font-ancient"
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
                            className="w-full bg-transparent px-4 py-4 text-sm text-[#2c1e0f] placeholder:text-[#3d2b1f]/40 focus:outline-none appearance-none font-ancient"
                        >
                            <option value="" className="bg-[#f4e4bc]">Select Year</option>
                            {yearOptions.map((y) => (
                                <option key={y} value={y} className="bg-[#f4e4bc]">{y}</option>
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
                            className="w-full bg-transparent px-4 py-4 text-sm text-[#2c1e0f] placeholder:text-[#3d2b1f]/40 focus:outline-none font-ancient"
                        />
                    </FormField>
                </div>
            </div>

            <p className="mt-8 text-manthan-maroon/40 text-[10px] text-center font-ancient tracking-widest uppercase">
                Press <kbd className="px-1.5 py-0.5 bg-black/5 rounded text-manthan-maroon/60 font-mono italic">Enter ↵</kbd> to move between fields
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
            <label className="block text-[10px] font-bold text-manthan-maroon/60 mb-1.5 tracking-[0.2em] uppercase font-ancient">
                {label}
            </label>
            <div
                className={`relative flex items-center rounded-xl border transition-all duration-300 ${error
                    ? 'border-manthan-crimson/50 bg-transparent'
                    : focused
                        ? 'border-manthan-maroon/40 bg-transparent'
                        : 'border-manthan-maroon/20 bg-transparent hover:border-manthan-maroon/40'
                    }`}
            >
                <div className={`pl-4 flex items-center justify-center transition-colors duration-300 ${focused ? 'text-manthan-maroon' : 'text-manthan-maroon/40'
                    }`}>
                    {icon}
                    <div className="w-px h-6 bg-manthan-maroon/10 ml-4" />
                </div>
                {children}
            </div>
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-manthan-crimson text-xs mt-1.5 pl-1 font-ancient italic"
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
                className={`w-full text-left parchment-card border transition-all duration-300 ${isSelected
                    ? 'border-manthan-maroon shadow-[0_0_20px_rgba(139,0,0,0.1)]'
                    : 'border-manthan-maroon/10 hover:border-manthan-maroon/30 shadow-sm'
                    }`}
            >
                <div className="scroll-roll h-2 opacity-30" />
                <div className="parchment-body p-4">
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <h4 className={`font-ancient font-bold text-sm mb-1 ${isSelected ? 'text-manthan-maroon' : 'text-[#3d2b1f]'
                                }`}>
                                {event.name}
                            </h4>
                            <p className="text-[#5c4033] text-[10px] line-clamp-1 mb-2 italic">
                                {event.description}
                            </p>
                            <div className="flex items-center gap-3 text-[10px] text-[#5c4033]/60 font-ancient uppercase tracking-wider">
                                <span>{teamLabel}</span>
                                <span>·</span>
                                <span>{event.venue}</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <span className={`text-xs font-bold font-ancient ${isSelected ? 'text-manthan-maroon' : 'text-[#3d2b1f]'
                                }`}>
                                {amountLabel}
                            </span>
                            <div
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isSelected
                                    ? 'bg-manthan-maroon border-manthan-maroon'
                                    : 'border-manthan-maroon/20'
                                    }`}
                            >
                                {isSelected && <Check size={12} className="text-white" />}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="scroll-roll h-2 opacity-30 rotate-180" />
            </motion.button>
        );
    };

    return (
        <div>
            <div className="mb-10 text-center sm:text-left border-b border-manthan-maroon/10 pb-6">
                <h2 className="font-ancient text-3xl sm:text-4xl font-bold text-[#3d2b1f] mb-3">
                    Ancient Challenges
                </h2>
                <p className="text-[#5c4033] text-sm italic">
                    Select the trial(s) you wish to undertake
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 rounded-lg bg-manthan-crimson/5 border border-manthan-crimson/20 text-manthan-crimson text-xs font-ancient italic"
                >
                    {error}
                </motion.div>
            )}

            <div className="space-y-12">
                {categories.map((cat) => {
                    const catEvents = events.filter((e) => e.category === cat);
                    if (catEvents.length === 0) return null;

                    return (
                        <div key={cat} className="space-y-4">
                            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-manthan-maroon/40 border-b border-manthan-maroon/5 pb-2 flex items-center gap-2 font-ancient">
                                {categoryIcons[cat]} {cat}
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 lg:gap-8">
                                {catEvents.map((event) => renderEventCard(event))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedIds.length > 0 && (
                <div className="mt-12 space-y-6">
                    {/* Team Details Section */}
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
                                    className="p-6 rounded-xl border border-manthan-maroon/20 bg-transparent"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
                                        <h4 className="text-manthan-maroon font-ancient font-bold uppercase tracking-wider">{event.name} · Team Scroll</h4>
                                        <span className="text-[10px] text-[#5c4033]/60 italic font-ancient">
                                            {event.fee_calculation === 'per_participant' ? 'Taxed per individual' : 'Fixed scroll fee'}
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-bold text-manthan-maroon/60 uppercase tracking-widest font-ancient">Name of House</label>
                                            <input
                                                type="text"
                                                value={team.team_name || ''}
                                                onChange={(e) =>
                                                    updateTeamRegistration(event.id, (current) => ({
                                                        ...current,
                                                        team_name: e.target.value,
                                                    }))
                                                }
                                                className="w-full rounded-lg border border-manthan-maroon/20 bg-transparent px-4 py-3 text-sm text-[#3d2b1f] placeholder:text-[#5c4033]/50 focus:border-manthan-maroon/50 focus:outline-none font-ancient"
                                                placeholder="Enter team name"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="block text-[10px] font-bold text-manthan-maroon/60 uppercase tracking-widest font-ancient">Size of Fellowship</label>
                                            <div className="flex items-center gap-0 rounded-lg border border-manthan-maroon/20 bg-transparent overflow-hidden">
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        updateTeamRegistration(event.id, (current) => ({
                                                            ...current,
                                                            team_size: current.team_size - 1,
                                                        }))
                                                    }
                                                    disabled={isFixed || team.team_size <= bounds.min}
                                                    className="px-4 py-2 text-lg font-bold text-manthan-maroon hover:bg-black/5 transition-colors disabled:opacity-20 select-none"
                                                >
                                                    −
                                                </button>
                                                <span className="flex-1 text-center text-sm font-bold text-[#3d2b1f] py-2 select-none font-ancient">
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
                                                    disabled={isFixed || team.team_size >= bounds.max}
                                                    className="px-4 py-2 text-lg font-bold text-manthan-maroon hover:bg-black/5 transition-colors disabled:opacity-20 select-none"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {team.members.length > 0 && (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-manthan-maroon/40 font-ancient">Names of the Brave</p>
                                            <div className="grid grid-cols-1 gap-3">
                                                {team.members.map((member, index) => (
                                                    <input
                                                        key={`${event.id}-member-${index}`}
                                                        type="text"
                                                        value={member.name}
                                                        onChange={(e) =>
                                                            updateTeamRegistration(event.id, (current) => {
                                                                const members = [...current.members];
                                                                members[index] = { ...members[index], name: e.target.value };
                                                                return { ...current, members };
                                                            })
                                                        }
                                                        placeholder={`Warrior ${index + 1} name`}
                                                        className="w-full rounded-lg border border-manthan-maroon/20 bg-transparent px-4 py-3 text-sm text-[#3d2b1f] placeholder:text-[#5c4033]/50 focus:border-manthan-maroon/50 focus:outline-none font-ancient"
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                    {/* Preview Summary */}
                    <div className="p-6 rounded-xl border border-manthan-maroon/20 bg-manthan-maroon/5 mt-8">
                        <div className="flex items-center justify-between">
                            <span className="text-[#5c4033] text-sm font-ancient uppercase tracking-widest">
                                {selectedIds.length} challenge{selectedIds.length !== 1 ? 's' : ''} accepted
                            </span>
                            <span className="text-manthan-maroon font-bold text-xl font-ancient">
                                {formatFee(previewTotal)}
                            </span>
                        </div>
                    </div>
                </div>
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
        <div className="space-y-8">
            <div className="text-center sm:text-left border-b border-manthan-maroon/10 pb-6">
                <h2 className="font-ancient text-3xl sm:text-4xl font-bold text-[#3d2b1f] mb-3">
                    Final Inscription
                </h2>
                <p className="text-[#5c4033] text-sm italic">
                    Verify your credentials before sealing the scroll
                </p>
            </div>

            {/* Personal Info */}
            <div className="rounded-xl border border-manthan-maroon/20 bg-transparent p-6">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-manthan-maroon/40 mb-6 font-ancient">Your Credentials</h3>
                <div className="grid grid-cols-2 gap-x-8 gap-y-5 text-sm">
                    <InfoRow label="Herald" value={formData.name} />
                    <InfoRow label="Codex" value={formData.email} />
                    <InfoRow label="Signal" value={formData.phone} />
                    <InfoRow label="Guild" value={formData.college} />
                    <InfoRow label="Era" value={formData.year} />
                    <InfoRow label="Circle" value={formData.department} />
                </div>
            </div>

            {/* Events Breakdown */}
            <div className="rounded-xl border-2 border-manthan-maroon/20 bg-manthan-maroon/5 p-6 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-manthan-maroon/60 mb-6 font-ancient pb-2 border-b border-manthan-maroon/10">Accepted Trials</h3>
                <div className="space-y-4">
                    {selectedEvents.map((event) => (
                        <div key={event.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-[#fdf5e6]/60 border-l-4 border-manthan-maroon shadow-sm gap-3 sm:gap-0">
                            <div>
                                <p className="text-manthan-maroon text-lg font-bold font-ancient">{event.name}</p>
                                <p className="text-[#5c4033] text-[11px] font-bold uppercase font-ancient tracking-wider mt-1">
                                    {event.category} · {event.venue}
                                    {needsTeamDetails(event) && (
                                        <>
                                            {' · fellowship of '}
                                            {teamRegistrations[event.id]?.team_size || getDefaultTeamSize(event)}
                                        </>
                                    )}
                                </p>
                            </div>
                            <span className="text-manthan-maroon font-bold text-xl font-ancient">
                                {formatFee(estimateEventAmount(event, teamRegistrations[event.id]))}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="mt-8 pt-6 border-t-2 border-manthan-maroon/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0">
                    <span className="text-[#3d2b1f] text-lg font-bold uppercase tracking-widest font-ancient">Total Offering</span>
                    <span className="text-manthan-maroon font-bold text-4xl font-ancient">
                        {formatFee(previewTotal)}
                    </span>
                </div>
            </div>

            {/* Security badge */}
            <div className="flex items-start gap-4 p-5 rounded-xl bg-manthan-maroon/5 border border-manthan-maroon/10">
                <ShieldCheck size={20} className="text-manthan-maroon flex-shrink-0 mt-0.5" />
                <p className="text-[#5c4033] text-[11px] font-ancient leading-relaxed italic">
                    Transactions are secured by the Razorpay magic. Your registration shall be inscribed in the permanent archives once the gold has been received.
                </p>
            </div>

            {!razorpayReady && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-manthan-crimson/5 border border-manthan-crimson/20">
                    <AlertTriangle size={18} className="text-manthan-crimson flex-shrink-0" />
                    <p className="text-manthan-crimson text-[11px] font-ancient uppercase tracking-wider">
                        Portal is opening... please wait.
                    </p>
                </div>
            )}

            {paymentMessage && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-xl bg-manthan-maroon/10 border border-manthan-maroon/20 flex items-start gap-3"
                >
                    <Check size={20} className="text-manthan-maroon flex-shrink-0 mt-0.5" />
                    <p className="text-manthan-maroon font-ancient text-sm">{paymentMessage}</p>
                </motion.div>
            )}

            {paymentError && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-xl bg-manthan-crimson/10 border border-manthan-crimson/20 flex items-start gap-3"
                >
                    <AlertTriangle size={20} className="text-manthan-crimson flex-shrink-0 mt-0.5" />
                    <p className="text-manthan-crimson font-ancient text-sm">{paymentError}</p>
                </motion.div>
            )}
        </div>
    );
}

const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div className="space-y-1">
        <span className="text-manthan-maroon/40 text-[10px] font-bold uppercase tracking-widest font-ancient block">{label}</span>
        <span className="text-[#3d2b1f] text-sm font-bold font-ancient truncate block">{value || 'N/A'}</span>
    </div>
);
