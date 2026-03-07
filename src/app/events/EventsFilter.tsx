'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Event } from '@/lib/types';
import EventCard from '@/components/EventCard';
import { getSportsTrackByName } from '@/lib/constants';

const categories = ['all', 'technical', 'cultural', 'sports'];

export default function EventsFilter({ events }: { events: Event[] }) {
    const [activeCategory, setActiveCategory] = useState('all');

    const { filtered, outdoorSports, indoorSports, otherSports } = useMemo(() => {
        const _filtered = activeCategory === 'all'
            ? events
            : events.filter((e) => e.category === activeCategory);

        const _sportsEvents = _filtered.filter((e) => e.category === 'sports');
        const _outdoorSports = _sportsEvents.filter((event) => getSportsTrackByName(event.name) === 'outdoor');
        const _indoorSports = _sportsEvents.filter((event) => getSportsTrackByName(event.name) === 'indoor');
        const _otherSports = _sportsEvents.filter((event) => !getSportsTrackByName(event.name));

        return {
            filtered: _filtered,
            sportsEvents: _sportsEvents,
            outdoorSports: _outdoorSports,
            indoorSports: _indoorSports,
            otherSports: _otherSports
        };
    }, [activeCategory, events]);

    return (
        <>
            {/* Filter Tabs */}
            <div className="flex flex-wrap justify-center gap-4 mb-12 parchment-container !p-6 rounded-none border-none shadow-none bg-transparent">
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`font-ancient px-8 py-3 transition-all duration-300 uppercase tracking-widest text-sm ${activeCategory === cat
                            ? 'bg-manthan-maroon text-white shadow-[0_0_20px_rgba(92,10,10,0.3)] scale-105'
                            : 'parchment-input hover:border-manthan-maroon/60'
                            }`}
                    >
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </button>
                ))}
            </div>

            {/* Events Grid */}
            {activeCategory === 'sports' ? (
                <div className="space-y-10">
                    {outdoorSports.length > 0 && (
                        <motion.div
                            initial="closed"
                            whileInView="open"
                            viewport={{ once: true }}
                            className="parchment-container rounded-none mb-12"
                        >
                            <motion.div variants={{ closed: { y: 10 }, open: { y: 0 } }} className="scroll-roll" />
                            <motion.div
                                variants={{ closed: { height: 0, opacity: 0 }, open: { height: 'auto', opacity: 1 } }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="parchment-body p-8 overflow-hidden"
                            >
                                <h2 className="font-ancient text-2xl uppercase tracking-[0.2em] text-[#3d2b1f] mb-8 border-b border-[#3d2b1f]/20 pb-4">
                                    Outdoor Sports
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 event-sub-container p-8">
                                    {outdoorSports.map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            </motion.div>
                            <motion.div variants={{ closed: { y: -10 }, open: { y: 0 } }} className="scroll-roll" />
                        </motion.div>
                    )}

                    {indoorSports.length > 0 && (
                        <motion.div
                            initial="closed"
                            whileInView="open"
                            viewport={{ once: true }}
                            className="parchment-container rounded-none mb-12"
                        >
                            <motion.div variants={{ closed: { y: 10 }, open: { y: 0 } }} className="scroll-roll" />
                            <motion.div
                                variants={{ closed: { height: 0, opacity: 0 }, open: { height: 'auto', opacity: 1 } }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="parchment-body p-8 overflow-hidden"
                            >
                                <h2 className="font-ancient text-2xl uppercase tracking-[0.2em] text-[#3d2b1f] mb-8 border-b border-[#3d2b1f]/20 pb-4">
                                    Indoor Sports
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 event-sub-container p-8">
                                    {indoorSports.map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            </motion.div>
                            <motion.div variants={{ closed: { y: -10 }, open: { y: 0 } }} className="scroll-roll" />
                        </motion.div>
                    )}

                    {otherSports.length > 0 && (
                        <motion.div
                            initial="closed"
                            whileInView="open"
                            viewport={{ once: true }}
                            className="parchment-container rounded-none mb-12"
                        >
                            <motion.div variants={{ closed: { y: 10 }, open: { y: 0 } }} className="scroll-roll" />
                            <motion.div
                                variants={{ closed: { height: 0, opacity: 0 }, open: { height: 'auto', opacity: 1 } }}
                                transition={{ duration: 1, ease: "easeOut" }}
                                className="parchment-body p-8 overflow-hidden"
                            >
                                <h2 className="font-ancient text-2xl uppercase tracking-[0.2em] text-[#3d2b1f] mb-8 border-b border-[#3d2b1f]/20 pb-4">
                                    More Sports Events
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 event-sub-container p-8">
                                    {otherSports.map((event) => (
                                        <EventCard key={event.id} event={event} />
                                    ))}
                                </div>
                            </motion.div>
                            <motion.div variants={{ closed: { y: -10 }, open: { y: 0 } }} className="scroll-roll" />
                        </motion.div>
                    )}
                </div>
            ) : (
                <motion.div
                    key={activeCategory}
                    initial="closed"
                    animate="open"
                    className="parchment-container rounded-none"
                >
                    <motion.div variants={{ closed: { y: 10 }, open: { y: 0 } }} className="scroll-roll" />
                    <motion.div
                        variants={{ closed: { height: 0, opacity: 0 }, open: { height: 'auto', opacity: 1 } }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="parchment-body p-8"
                    >
                        {activeCategory !== 'all' && (
                            <h2 className="font-ancient text-2xl uppercase tracking-[0.2em] text-[#3d2b1f] mb-8 border-b border-[#3d2b1f]/20 pb-4">
                                {activeCategory} Events
                            </h2>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 event-sub-container p-6 rounded-2xl">
                            {filtered.map((event) => (
                                <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                    </motion.div>
                    <motion.div variants={{ closed: { y: -10 }, open: { y: 0 } }} className="scroll-roll" />
                </motion.div>
            )}

            {filtered.length === 0 && (
                <div className="text-center py-16">
                    <p className="text-gray-500 text-lg">No events found in this category.</p>
                </div>
            )}
        </>
    );
}
