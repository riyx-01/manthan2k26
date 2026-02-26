'use client';

import { useContext } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import VideoIntro from '@/components/VideoIntro';
import { Calendar, Users, Trophy, ArrowRight, Zap, Music, Dumbbell } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntroContext } from '@/components/ClientLayout';

export default function HomePage() {
    const { introComplete } = useContext(IntroContext);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: introComplete ? 1 : 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`${introComplete ? "block" : "hidden"} bg-transparent`}
        >
            <Navbar />
            <main className="bg-transparent">
                {/* Hero Section */}
                <section
                    className="relative flex items-center justify-center overflow-hidden bg-transparent"
                    style={{ minHeight: '100svh' }}
                >
                    {/* Radial glow */}
                    <div className="absolute inset-0 bg-gradient-radial from-manthan-maroon/20 via-transparent to-transparent" />

                    {/* Hero content */}
                    <div className="relative z-10 text-center px-4">
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: introComplete ? 0 : 20, opacity: introComplete ? 1 : 0 }}
                            transition={{ delay: 0.5, duration: 0.8 }}
                            className="font-heading text-5xl md:text-7xl font-bold text-gold-gradient mb-6"
                        >
                            MANTHAN 2026
                        </motion.h1>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: introComplete ? 0 : 20, opacity: introComplete ? 1 : 0 }}
                            transition={{ delay: 0.7, duration: 0.8 }}
                            className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto mb-10"
                        >
                            Roots to Realms.
                        </motion.p>
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: introComplete ? 0 : 20, opacity: introComplete ? 1 : 0 }}
                            transition={{ delay: 0.9, duration: 0.8 }}
                        >
                            <Link
                                href="/events"
                                className="inline-flex items-center gap-2 px-8 py-3 bg-manthan-gold text-black font-bold rounded-full hover:bg-manthan-gold-light transition-all duration-300 shadow-lg shadow-manthan-gold/20"
                            >
                                Explore Events
                                <ArrowRight size={20} />
                            </Link>
                        </motion.div>
                    </div>

                    {/* Scroll indicator */}
                    <div className="absolute bottom-8 
                    left-1/2 -translate-x-1/2 animate-bounce">
                        <div className="w-6 h-10 rounded-full border-2 border-manthan-gold/30 flex items-start justify-center p-1">
                            <div className="w-1.5 h-3 bg-manthan-gold/50 rounded-full animate-pulse" />
                        </div>
                    </div>
                </section>


                {/* Event Categories Section */}
                <section className="py-16 px-4">
                    <div className="max-w-6xl mx-auto">
                        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-center text-gold-gradient mb-4">
                            Event Categories
                        </h2>
                        <p className="text-gray-400 text-center mb-12 max-w-2xl mx-auto">
                            Choose from our diverse range of events across technical, cultural, and sports categories.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                {
                                    title: 'Technical',
                                    icon: Zap,
                                    description: 'Coding contests, hackathons, robo wars, and more. Test your technical prowess.',
                                    events: ['CodeStorm', 'HackNova', 'RoboWars', 'WebCraft', 'DebugDash'],
                                    gradient: 'from-blue-600/20 to-manthan-maroon/20',
                                    borderColor: 'border-blue-500/20 hover:border-blue-400/40',
                                },
                                {
                                    title: 'Cultural',
                                    icon: Music,
                                    description: 'Dance, music, drama, and photography. Express your creative side.',
                                    events: ['Rhythmix', 'Sargam', 'Natya', 'Lens & Frame'],
                                    gradient: 'from-purple-600/20 to-manthan-maroon/20',
                                    borderColor: 'border-purple-500/20 hover:border-purple-400/40',
                                },
                                {
                                    title: 'Sports',
                                    icon: Dumbbell,
                                    description: 'Cricket, futsal, badminton. Compete in exciting sports tournaments.',
                                    events: ['Cricket Blitz', 'Futsal Fury', 'Badminton Bash'],
                                    gradient: 'from-green-600/20 to-manthan-maroon/20',
                                    borderColor: 'border-green-500/20 hover:border-green-400/40',
                                },
                            ].map((cat) => (
                                <div
                                    key={cat.title}
                                    className={`glass-card p-8 bg-gradient-to-br ${cat.gradient} ${cat.borderColor} transition-all duration-300`}
                                >
                                    <cat.icon size={36} className="text-manthan-gold mb-4" />
                                    <h3 className="font-heading text-2xl font-bold text-manthan-gold mb-3">{cat.title}</h3>
                                    <p className="text-gray-400 text-sm mb-4">{cat.description}</p>
                                    <ul className="space-y-1.5">
                                        {cat.events.map((evt) => (
                                            <li key={evt} className="text-gray-300 text-sm flex items-center">
                                                <span className="w-1.5 h-1.5 rounded-full bg-manthan-gold/50 mr-2" />
                                                {evt}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-20 px-4">
                    <div className="max-w-4xl mx-auto text-center glass-card p-12 bg-gradient-to-br from-manthan-maroon/20 to-manthan-dark">
                        <h2 className="font-heading text-3xl sm:text-4xl font-bold text-gold-gradient mb-4">
                            Ready to Compete?
                        </h2>
                        <p className="text-gray-400 mb-8 max-w-xl mx-auto">
                            Register now and secure your spot in Manthan 2026. Limited seats available!
                        </p>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-manthan-maroon to-manthan-crimson text-white font-bold rounded-lg text-lg hover:from-manthan-crimson hover:to-manthan-maroon transition-all duration-300 shadow-xl shadow-manthan-maroon/30 group"
                        >
                            Register Now
                            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </section>
            </main>
            <Footer />
        </motion.div>
    );
}

