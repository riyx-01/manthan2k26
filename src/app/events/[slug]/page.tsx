import { Event } from '@/lib/types';
import { formatFee, formatDateTime, categoryColors, categoryIcons } from '@/lib/constants';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import { Calendar, MapPin, Users, IndianRupee } from 'lucide-react';
import { notFound } from 'next/navigation';

import { getEventBySlug } from '@/lib/events-catalog';
import BackButton from '@/components/BackButton';

async function getEvent(slug: string): Promise<Event | null> {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const res = await fetch(`${baseUrl}/api/events`, { cache: 'no-store' });
        const data = await res.json();
        const events = data.events || [];
        const event = events.find((e: Event) => e.slug === slug);
        return event || getEventBySlug(slug) || null;
    } catch {
        return getEventBySlug(slug) || null;
    }
}

export const dynamic = 'force-dynamic';

export default async function EventDetailPage({
    params,
}: {
    params: { slug: string };
}) {
    const event = await getEvent(params.slug);

    if (!event) {
        notFound();
    }

    const colors = categoryColors[event.category] || categoryColors.technical;

    const teamInfo = (() => {
        if (event.team_size_fixed && event.team_size_fixed > 1) {
            return `Team of ${event.team_size_fixed}`;
        }
        if (event.team_size_min && event.team_size_max && event.team_size_max > 1) {
            return `Team size ${event.team_size_min}-${event.team_size_max}`;
        }
        if (event.team_size > 1) {
            return event.team_size_fixed ? `Team of ${event.team_size}` : `Up to ${event.team_size} members`;
        }
        return 'Individual';
    })();

    return (
        <>
            <Navbar />
            <main className="pt-24 pb-16 px-4 min-h-screen relative overflow-hidden">
                {/* Background Glow */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-manthan-maroon/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-4xl mx-auto relative z-10">
                    {/* Back Link */}
                    <BackButton />

                    {/* Event Card - Parchment Style */}
                    <div className="parchment-container rounded-none">
                        <div className="scroll-roll" />
                        <div className="parchment-body p-8 md:p-12 overflow-hidden">
                            {/* Category Badge */}
                            <span className={`inline-block px-4 py-1.5 text-sm font-medium rounded-full mb-6 ${colors.badge}`}>
                                {categoryIcons[event.category]} {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                            </span>

                            {/* Title */}
                            <h1 className="font-ancient text-4xl sm:text-5xl font-bold text-[#3d2b1f] mb-4">
                                {event.name}
                            </h1>

                            {/* Description */}
                            <p className="text-[#5c4033] text-lg leading-relaxed mb-8 italic">{event.description}</p>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <div className="flex items-center space-x-3 p-4 rounded-lg bg-black/5 border border-manthan-maroon/10">
                                    <Calendar size={20} className="text-manthan-maroon" />
                                    <div>
                                        <p className="text-xs text-manthan-maroon/60">Date & Time</p>
                                        <p className="text-[#3d2b1f] text-sm font-medium">{formatDateTime(event.event_date)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-4 rounded-lg bg-black/5 border border-manthan-maroon/10">
                                    <MapPin size={20} className="text-manthan-maroon" />
                                    <div>
                                        <p className="text-xs text-manthan-maroon/60">Venue</p>
                                        <p className="text-[#3d2b1f] text-sm font-medium">{event.venue}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-4 rounded-lg bg-black/5 border border-manthan-maroon/10">
                                    <Users size={20} className="text-manthan-maroon" />
                                    <div>
                                        <p className="text-xs text-manthan-maroon/60">Team Size</p>
                                        <p className="text-[#3d2b1f] text-sm font-medium">{teamInfo}</p>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-3 p-4 rounded-lg bg-black/5 border border-manthan-maroon/10">
                                    <IndianRupee size={20} className="text-manthan-maroon" />
                                    <div>
                                        <p className="text-xs text-manthan-maroon/60">Registration Fee</p>
                                        <p className="text-manthan-maroon text-sm font-bold">{formatFee(event.fee)}</p>
                                        {event.fee_calculation && (
                                            <p className="text-manthan-maroon/40 text-xs">
                                                {event.fee_calculation === 'per_participant' ? 'Per participant' : 'Per team'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {(event.prize_text || event.prize_winner || event.prize_runner_up || event.prize_second_runner_up || event.registration_deadline) && (
                                <div className="mb-8 rounded-lg border border-manthan-maroon/10 bg-black/5 p-5">
                                    <h2 className="font-heading text-xl font-bold text-manthan-maroon mb-3 border-b border-manthan-maroon/10 pb-2">Prizes & Deadlines</h2>

                                    {event.prize_text && (
                                        <div className="space-y-4 mb-4">
                                            {event.prize_text.split('\n\n').map((categoryBlock, idx) => (
                                                <div key={idx} className="bg-manthan-maroon/5 p-4 rounded-lg border border-manthan-maroon/10">
                                                    {categoryBlock.split('\n').map((line, lIdx) => {
                                                        const isHeader = line.includes('PRIZES:');
                                                        return (
                                                            <p key={lIdx} className={`${isHeader ? 'font-ancient text-lg text-manthan-maroon mb-2 border-b border-manthan-maroon/10 pb-1' : 'text-[#5c4033] text-sm italic mb-1'}`}>
                                                                {line}
                                                            </p>
                                                        );
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
                                        {event.prize_winner && (
                                            <div>
                                                <p className="text-manthan-maroon/60 text-xs">Winner</p>
                                                <p className="text-manthan-maroon font-bold">{formatFee(event.prize_winner)}</p>
                                            </div>
                                        )}
                                        {event.prize_runner_up && (
                                            <div>
                                                <p className="text-manthan-maroon/60 text-xs">Runner-up</p>
                                                <p className="text-manthan-maroon font-bold">{formatFee(event.prize_runner_up)}</p>
                                            </div>
                                        )}
                                        {event.prize_second_runner_up && (
                                            <div>
                                                <p className="text-manthan-maroon/60 text-xs">Second Runner-up</p>
                                                <p className="text-manthan-maroon font-bold">{formatFee(event.prize_second_runner_up)}</p>
                                            </div>
                                        )}
                                    </div>
                                    {event.registration_deadline && (
                                        <p className="text-manthan-maroon/40 text-xs mt-2">
                                            Registration closes: {formatDateTime(event.registration_deadline)}
                                        </p>
                                    )}
                                </div>
                            )}


                            {/* Rules */}
                            {event.rules && event.rules.length > 0 && (
                                <div className="mb-10">
                                    <h2 className="font-heading text-xl font-bold text-manthan-maroon mb-4 border-b border-manthan-maroon/10 pb-2">Rules & Guidelines</h2>
                                    <ul className="space-y-3">
                                        {event.rules.map((rule, index) => (
                                            <li key={index} className="flex items-start text-[#5c4033] text-sm leading-relaxed">
                                                <span className="w-1.5 h-1.5 rounded-full bg-manthan-maroon/30 mr-3 mt-1.5 flex-shrink-0" />
                                                {rule}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {/* Register CTA */}
                            <div className="flex flex-col sm:flex-row gap-4 pt-6">
                                <Link
                                    href={`/register?event=${event.id}`}
                                    className="flex-1 py-4 bg-gradient-to-r from-manthan-maroon to-manthan-crimson text-white font-bold rounded-lg text-center text-lg hover:rotate-1 transition-all duration-300 shadow-xl shadow-manthan-maroon/20 uppercase tracking-widest font-ancient"
                                >
                                    Register Now
                                </Link>
                                <Link
                                    href="/events"
                                    className="px-8 py-4 border border-manthan-maroon/30 text-manthan-maroon font-semibold rounded-lg text-center hover:bg-manthan-maroon/5 transition-all duration-300 font-ancient uppercase tracking-widest text-sm"
                                >
                                    Browse Lists
                                </Link>
                            </div>
                        </div>
                        <div className="scroll-roll" />
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
