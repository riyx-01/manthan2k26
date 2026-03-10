'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Event } from '@/lib/types';
import { categoryColors, categoryIcons, formatFee, formatDate } from '@/lib/constants';
import { Calendar, MapPin, Users } from 'lucide-react';

interface EventCardProps {
    event: Event;
    selected?: boolean;
    onToggle?: (id: string) => void;
    selectable?: boolean;
}

export default function EventCard({ event, selected, onToggle, selectable }: EventCardProps) {
    const colors = categoryColors[event.category] || categoryColors.technical;

    const teamLabel = (() => {
        if (event.team_size_fixed && event.team_size_fixed > 1) {
            return `Team of ${event.team_size_fixed}`;
        }
        if (event.team_size_min && event.team_size_max && event.team_size_max > 1) {
            return `Team ${event.team_size_min}-${event.team_size_max}`;
        }
        if (event.team_size > 1) {
            return `Team of ${event.team_size}`;
        }
        return 'Individual';
    })();

    const cardContent = (
        <motion.div
            initial="closed"
            whileInView="open"
            whileTap={{ scale: 0.98 }}
            viewport={{ once: true, margin: "-50px" }}
            className={`parchment-card transition-all duration-300 cursor-pointer group ${selected
                ? 'scale-[1.02] z-20'
                : 'hover:rotate-1'
                }`}
            onClick={() => selectable && onToggle?.(event.id)}
        >
            {/* Top Roll */}
            <motion.div
                variants={{
                    closed: { y: 10 },
                    open: { y: 0 }
                }}
                className="scroll-roll"
            />

            {/* Scroll Body (Expanding) */}
            <motion.div
                variants={{
                    closed: { height: 0, opacity: 0 },
                    open: { height: 'auto', opacity: 1 }
                }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="parchment-body p-6"
            >
                {/* Category Badge */}
                <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 text-xs font-medium rounded-full ${colors.badge}`}>
                        {categoryIcons[event.category]} {event.category.charAt(0).toUpperCase() + event.category.slice(1)}
                    </span>
                    {selectable && (
                        <div
                            className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${selected
                                ? 'bg-manthan-gold border-manthan-gold'
                                : 'border-gray-600 group-hover:border-manthan-gold/50'
                                }`}
                        >
                            {selected && (
                                <svg className="w-4 h-4 text-manthan-black" fill="currentColor" viewBox="0 0 20 20">
                                    <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            )}
                        </div>
                    )}
                </div>

                {/* Title */}
                <h3 className="font-ancient text-2xl font-bold text-[#3d2b1f] mb-2 group-hover:text-manthan-maroon transition-colors">
                    {event.name}
                </h3>

                {/* Description */}
                <p className="text-[#5c4033] text-base mb-4 line-clamp-2">{event.description}</p>

                {/* Meta */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center text-[#5c4033] text-sm">
                        <Calendar size={16} className="mr-2 text-manthan-maroon/50" />
                        {formatDate(event.event_date)}
                    </div>
                    <div className="flex items-center text-[#5c4033] text-sm">
                        <MapPin size={16} className="mr-2 text-manthan-maroon/50" />
                        {event.venue}
                    </div>
                    <div className="flex items-center text-[#5c4033] text-sm">
                        <Users size={16} className="mr-2 text-manthan-maroon/50" />
                        {teamLabel}
                    </div>
                </div>

                {event.prize_text && (
                    <p className="text-xs text-manthan-maroon/80 mb-4 line-clamp-1">Prize: {event.prize_text}</p>
                )}

                {/* Fee */}
                <div className="flex items-center justify-between pt-4 border-t border-manthan-maroon/10">
                    <span className="text-manthan-maroon font-bold text-lg">{formatFee(event.fee)}</span>
                    {!selectable && (
                        <span className="text-xs text-manthan-maroon/60 group-hover:text-manthan-maroon transition-colors">
                            View Details →
                        </span>
                    )}
                </div>
            </motion.div>

            {/* Bottom Roll */}
            <motion.div
                variants={{
                    closed: { y: -10 },
                    open: { y: 0 }
                }}
                className="scroll-roll"
            />
        </motion.div>
    );

    if (selectable) {
        return cardContent;
    }

    return <Link href={`/events/${event.slug}`}>{cardContent}</Link>;
}
