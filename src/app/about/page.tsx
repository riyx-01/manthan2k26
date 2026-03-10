'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollWrapper from '@/components/ScrollWrapper';
import { motion } from 'framer-motion';
import { History, Target, Sparkles, Trophy, Rocket } from 'lucide-react';

export default function AboutPage() {
    return (
        <>
            <Navbar />

            <main className="pt-24 pb-20 px-4 md:pt-32 relative min-h-screen">
                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="text-center mb-20">
                        <motion.span
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-manthan-gold font-tagline text-xl uppercase tracking-[0.4em] mb-4 block"
                        >
                            Roots to Realms
                        </motion.span>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="font-ancient text-4xl md:text-6xl font-bold text-gold-gradient mb-6"
                        >
                            The Story of Manthan
                        </motion.h1>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-24">
                        <ScrollWrapper padding="p-10">
                            <div className="w-12 h-12 rounded-xl bg-manthan-maroon/10 flex items-center justify-center mb-6">
                                <History className="text-manthan-maroon" size={24} />
                            </div>
                            <h2 className="font-ancient text-2xl font-bold text-[#3d2b1f] mb-4 uppercase">Our Legacy</h2>
                            <p className="text-[#5c4033] text-sm leading-relaxed mb-4">
                                Over the years, MANTHAN has evolved into one of Navi Mumbai’s prominent intercollegiate festivals, reflecting the dedication and collaborative spirit of BVIMIT’s faculty and students. The fest has consistently attracted participation from colleges across Thane District and Navi Mumbai, witnessing large-scale engagement, including over 700 participants in 2024. Editions such as MANTHAN 2022, 2024, and 2025 have successfully featured a wide array of events, including IT and gaming competitions, academic contests, sports tournaments, and cultural showcases judged by distinguished guests and industry experts. The seamless organization, active involvement of faculty coordinators, generous support from sponsors, and the presence of eminent chief guests have contributed to its continued success. Each year, MANTHAN leaves a lasting impact by promoting academic excellence, creativity, sportsmanship, and leadership, thereby strengthening its reputation as a flagship fest of the institute.
                            </p>
                        </ScrollWrapper>

                        <ScrollWrapper padding="p-10">
                            <div className="w-12 h-12 rounded-xl bg-manthan-maroon/10 flex items-center justify-center mb-6">
                                <Target className="text-manthan-maroon" size={24} />
                            </div>
                            <h2 className="font-ancient text-2xl font-bold text-[#3d2b1f] mb-4 uppercase">The Vision</h2>
                            <p className="text-[#5c4033] text-sm leading-relaxed mb-4">
                                Bharati Vidyapeeth Institute of Management and Information Technology (BVIMIT), Navi Mumbai, envisions *MANTHAN* as a dynamic intercollegiate platform that nurtures innovation, creativity, leadership, and collaborative learning among students. Inspired by the concept of *Samudra Manthan*, symbolizing the churning of ideas to bring forth excellence, the fest aims to provide an academically and culturally enriching environment. Through a diverse blend of IT competitions, academic challenges, indoor and outdoor sports, and cultural performances, MANTHAN encourages students to explore their talents, exchange knowledge, and develop teamwork and organizational skills. The institute remains committed to fostering originality and individuality by offering equal opportunities to all participants and motivating them to think innovatively and implement their ideas through this vibrant collegiate festival.
                            </p>
                        </ScrollWrapper>
                    </div>

                    <div className="mb-24 relative overflow-hidden py-20 px-4 rounded-[40px] bg-manthan-gold/5 border border-manthan-gold/10">
                        {/* Ambient Churning Background */}
                        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[2px] border-dashed border-manthan-gold/30 rounded-full"
                            />
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border-[1px] border-manthan-gold/20 rounded-full"
                            />
                        </div>

                        <div className="relative z-10">
                            <div className="flex flex-col items-center mb-16 text-center">
                                <Sparkles className="text-manthan-gold mb-4 animate-pulse" size={32} />
                                <h2 className="font-ancient text-3xl md:text-5xl font-bold text-gold-gradient uppercase tracking-[0.2em]">
                                    The Churning of Excellence
                                </h2>
                                <p className="text-manthan-gold/60 font-tagline mt-4 text-sm md:text-lg tracking-widest max-w-2xl">
                                    Witness the evolution of a legend as we churn ideas into reality.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {[
                                    {
                                        year: '2023',
                                        title: 'The Inception',
                                        desc: 'A humble beginning that ignited the fire of innovation and cultural fusion.',
                                        icon: Rocket,
                                        color: 'rgba(212, 168, 55, 0.4)'
                                    },
                                    {
                                        year: '2024',
                                        title: 'Expanding Realms',
                                        desc: 'The bridges were built, the pillars strengthened, and the legend grew beyond horizons.',
                                        icon: Sparkles,
                                        color: 'rgba(139, 0, 0, 0.4)'
                                    },
                                    {
                                        year: '2025',
                                        title: 'Eternal Legend',
                                        desc: 'A new standard of excellence was forged, reaching the pinnacle of collegiate glory.',
                                        icon: Trophy,
                                        color: 'rgba(212, 168, 55, 0.6)'
                                    }
                                ].map((item, idx) => (
                                    <motion.div
                                        key={item.year}
                                        initial={{ opacity: 0, scale: 0.9, y: 30 }}
                                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ delay: idx * 0.2, duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
                                        whileHover={{ y: -10 }}
                                        className="group relative"
                                    >
                                        <div className="absolute inset-0 bg-manthan-black/40 backdrop-blur-xl border border-manthan-gold/20 rounded-[32px] transition-all group-hover:border-manthan-gold/50 group-hover:bg-manthan-black/60 shadow-2xl" />

                                        {/* Golden Light Beam effect on hover */}
                                        <div className="absolute -inset-0.5 bg-gradient-to-t from-manthan-gold/0 via-manthan-gold/10 to-manthan-gold/0 rounded-[32px] opacity-0 group-hover:opacity-100 transition-opacity blur-xl z-0" />

                                        <div className="relative p-8 flex flex-col items-center text-center">
                                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-manthan-gold/20 to-transparent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500">
                                                <item.icon size={32} className="text-manthan-gold" />
                                            </div>

                                            <span className="font-ancient text-4xl font-black text-white/10 group-hover:text-manthan-gold/20 transition-colors absolute top-4 right-8 select-none">
                                                {item.year}
                                            </span>

                                            <h3 className="font-ancient text-2xl font-bold text-manthan-gold mb-4 tracking-wider">
                                                {item.title}
                                            </h3>

                                            <p className="text-gray-400 text-sm leading-relaxed font-pfeffer tracking-[0.05em]">
                                                {item.desc}
                                            </p>

                                            <div className="mt-8 w-12 h-1 bg-manthan-gold/20 rounded-full group-hover:w-24 group-hover:bg-manthan-gold transition-all duration-500" />
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
