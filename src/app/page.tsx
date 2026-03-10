'use client';

import { useContext, useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, Sparkles, MapPin } from 'lucide-react';
import { scheduleData } from '@/lib/constants';
import { getActiveEvents } from '@/lib/events-catalog';
import { motion, useScroll, useTransform } from 'framer-motion';
import { IntroContext } from '@/components/ClientLayout';
import ScrollWrapper from '@/components/ScrollWrapper';
import AnimatedButton from '@/components/AnimatedButton';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectCoverflow } from 'swiper/modules';

// Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

export default function HomePage() {
    const { introComplete } = useContext(IntroContext);
    const { scrollYProgress } = useScroll();
    const [activeDay, setActiveDay] = useState(0);

    const heroContentOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const events = useMemo(() => getActiveEvents(), []);

    return (
        <motion.div
            initial={{ opacity: 0, visibility: "hidden" }}
            animate={{
                opacity: introComplete ? 1 : 0,
                visibility: introComplete ? "visible" : "hidden"
            }}
            transition={{ duration: 0.3, ease: "linear" }} // Ultra-fast transition
            className="bg-transparent overflow-x-hidden min-h-screen"
        >
            <Navbar />

            <main className="bg-transparent">

                {/* HERO SECTION */}
                <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden pt-24">

                    {/* HUGE CENTER LOGO */}
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                            scale: 1,
                            opacity: 1,
                            y: [0, -20, 0]
                        }}
                        transition={{
                            scale: { duration: 1, ease: "easeOut" },
                            opacity: { duration: 1, ease: "easeOut" },
                            y: { duration: 6, repeat: Infinity, ease: "easeInOut" }
                        }}
                        className="
                                relative
                                w-[85vw]
                                h-[40vh]
                                md:w-[75vw]
                                md:h-[55vh]
                                flex
                                items-center
                                justify-center
                                mb-8
                                md:mb-10
                                "
                    >
                        <Image
                            src="/profile/bg_26_manthan.png"
                            alt="Manthan '26 Logo"
                            fill
                            priority
                            className="
            object-contain
            scale-[1.35]
            drop-shadow-[0_0_180px_rgba(212,175,55,0.65)]
            "
                        />
                    </motion.div>

                    {/* TEXT CONTENT */}
                    <motion.div
                        style={{ opacity: heroContentOpacity }}
                        className="relative z-10 text-center px-6"
                    >

                        {/* GOLD DIVIDER */}
                        <div className="w-64 h-[2px] bg-gradient-to-r 
            from-transparent 
            via-[#d4af37] 
            to-transparent 
            mx-auto opacity-70"
                        />

                        {/* TAGLINE */}
                        <motion.p
                            initial={{ y: 10, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1.2, duration: 1 }}
                            className="mt-6 font-ancient text-xl md:text-3xl tracking-[0.25em] md:tracking-[0.35em] uppercase px-4 md:px-0"
                            style={{
                                color: "#d4af37",
                                textShadow: `
                0px 2px 4px rgba(0,0,0,0.6),
                0px -1px 1px rgba(255,255,255,0.7),
                0px 0px 15px rgba(212,175,55,0.6)
            `
                            }}
                        >
                            Roots to Realm
                        </motion.p>

                        {/* BUTTON */}
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 1.5, duration: 1 }}
                            className="flex justify-center mt-10"
                        >
                            <Link href="/events" className="scale-110">
                                <AnimatedButton icon={ArrowRight}>
                                    Explore The Realms
                                </AnimatedButton>
                            </Link>
                        </motion.div>

                    </motion.div>

                </section>

                {/* EVENT CAROUSEL */}
                <section className="relative py-16 md:py-24 pb-32 md:pb-40 px-4 md:px-6 overflow-hidden bg-transparent">
                    <div className="max-w-[1400px] mx-auto relative z-10">
                        <div className="text-center mb-12 md:mb-16">
                            <h3 className="font-ancient text-4xl sm:text-5xl md:text-7xl text-gold-gradient uppercase mb-3 md:mb-4">The Arena</h3>
                            <p className="font-serif italic text-manthan-gold/60 text-xl">Chronicles of Competition & Grace</p>
                        </div>

                        <Swiper
                            effect={'coverflow'}
                            grabCursor={true}
                            centeredSlides={true}
                            slidesPerView={'auto'}
                            loop={true}
                            observer={true}
                            observeParents={true}
                            coverflowEffect={{
                                rotate: 30,
                                stretch: 0,
                                depth: 100,
                                modifier: 1,
                                slideShadows: false,
                            }}
                            autoplay={{
                                delay: 3000,
                                disableOnInteraction: false,
                            }}
                            speed={400} // Snappier slide transitions
                            pagination={{ clickable: true }}
                            modules={[Autoplay, Pagination, EffectCoverflow]}
                            className="event-swiper !pb-20"
                        >
                            {events.map((event, idx) => (
                                <SwiperSlide key={idx} className="!w-[300px] md:!w-[420px]">
                                    <Link href={`/events/${event.slug}`} className="block h-full transform transition-transform duration-500 hover:scale-105 active:scale-95">
                                        <ScrollWrapper padding="p-10" className="min-h-[480px]" speed={0.4}>
                                            <span className="font-ancient text-sm tracking-[0.3em] uppercase text-manthan-maroon mb-4 block underline decoration-manthan-maroon/20 underline-offset-8">
                                                {event.category}
                                            </span>
                                            <h4 className="font-ancient text-3xl md:text-4xl text-[#3d2b1f] mb-6 leading-tight uppercase font-bold">
                                                {event.name.split(':')[0]}
                                            </h4>
                                            <div className="h-[2px] w-16 bg-manthan-maroon mb-8" />
                                            <p className="font-serif italic text-[#5c4033] text-lg md:text-xl leading-relaxed">
                                                {event.description}
                                            </p>
                                            <div className="mt-10 flex items-center gap-3 font-ancient font-bold text-manthan-maroon uppercase tracking-widest text-base">
                                                Unfold <Sparkles size={18} className="animate-pulse" />
                                            </div>
                                        </ScrollWrapper>
                                    </Link>
                                </SwiperSlide>
                            ))}
                        </Swiper>
                    </div>
                </section>

                {/* EVENT SCHEDULE SECTION */}
                <section id="schedule" className="relative py-20 px-4 md:px-6 overflow-hidden bg-transparent">
                    <div className="max-w-5xl mx-auto relative z-10">
                        <div className="text-center mb-16">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                            >
                                <h3 className="font-ancient text-4xl sm:text-5xl md:text-7xl text-gold-gradient uppercase mb-4">Chronicles of Time</h3>
                                <p className="font-serif italic text-manthan-gold/60 text-xl">The Sacred Schedule of Manthan</p>
                            </motion.div>
                        </div>

                        {/* Day Selector */}
                        <div className="flex justify-center mb-12">
                            <div className="flex bg-manthan-gold/5 border border-manthan-gold/20 p-1.5 rounded-full backdrop-blur-sm">
                                {scheduleData.map((day, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveDay(idx)}
                                        className={`px-8 py-3 rounded-full font-ancient font-bold text-sm tracking-widest transition-all duration-500 uppercase ${activeDay === idx
                                            ? 'bg-manthan-gold text-[#1a0a0a] shadow-[0_0_20px_rgba(212,168,55,0.4)]'
                                            : 'text-manthan-gold/60 hover:text-manthan-gold hover:bg-manthan-gold/10'
                                            }`}
                                    >
                                        Day {idx + 1}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Schedule Content */}
                        <motion.div
                            key={activeDay}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.6 }}
                            className="space-y-6"
                        >
                            <div className="mb-10 relative">
                                {(() => {
                                    const dateParts = scheduleData[activeDay].date.split(' ');
                                    const month = dateParts[0];
                                    const dateNum = dateParts[1].replace(',', '');
                                    const dayLabel = dateParts[dateParts.length - 2] + ' ' + dateParts[dateParts.length - 1];

                                    return (
                                        <div className="flex flex-col items-center">
                                            {/* Compact Elegant Date Group */}
                                            <div className="relative py-6 px-10 md:px-14 border border-manthan-gold/20 rounded-2xl bg-manthan-black/20 backdrop-blur-md flex flex-col items-center group overflow-hidden">
                                                {/* Ambient Glow */}
                                                <div className="absolute -inset-10 bg-manthan-gold/5 blur-2xl rounded-full opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

                                                <div className="relative flex flex-col items-center">
                                                    <span className="font-ancient text-manthan-gold/60 tracking-[0.4em] uppercase text-[10px] mb-2 font-bold">
                                                        {dayLabel}
                                                    </span>

                                                    <div className="flex items-center gap-4">
                                                        <span className="font-ancient text-4xl md:text-6xl font-black text-gold-gradient select-none">
                                                            {dateNum}
                                                        </span>
                                                        <div className="w-px h-8 bg-manthan-gold/30" />
                                                        <div className="flex flex-col items-start">
                                                            <span className="font-ancient text-xl md:text-2xl font-bold text-manthan-gold uppercase tracking-widest leading-none">
                                                                {month}
                                                            </span>
                                                            <span className="font-pfeffer text-[8px] md:text-[10px] tracking-[0.1em] text-manthan-gold/40 mt-1 uppercase">
                                                                March MMXXVI
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 flex items-center gap-3 px-4 py-1.5 bg-manthan-gold/10 rounded-full border border-manthan-gold/10">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-manthan-gold animate-pulse" />
                                                        <span className="font-ancient text-sm md:text-base font-bold text-manthan-gold uppercase tracking-[0.3em]">
                                                            09:00 AM <span className="text-manthan-gold/40 font-pfeffer text-[10px] lowercase tracking-normal italic">onwards</span>
                                                        </span>
                                                        <div className="w-1.5 h-1.5 rounded-full bg-manthan-gold animate-pulse" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>

                            <ScrollWrapper padding="p-2 sm:p-4 md:p-8">
                                <div className="overflow-x-auto custom-scrollbar-thin">
                                    <table className="w-full text-left border-collapse font-serif text-[#3d2b1f]">
                                        <thead>
                                            <tr className="border-b-2 border-manthan-maroon/20">
                                                <th className="py-2 px-2 md:py-4 md:px-4 font-ancient text-manthan-maroon uppercase tracking-widest text-xs md:text-base">Chronicle (Event)</th>
                                                <th className="py-2 px-2 md:py-4 md:px-4 font-ancient text-manthan-maroon uppercase tracking-widest text-xs md:text-base">Realm (Venue)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-manthan-maroon/10">
                                            {scheduleData[activeDay].slots.map((slot, index) => (
                                                <tr key={index} className="hover:bg-manthan-maroon/5 transition-colors group">
                                                    <td className="py-2 px-2 md:py-4 md:px-4">
                                                        <div className="flex flex-col">
                                                            <span className="text-[#1a0a0a] font-ancient font-bold text-xs md:text-lg tracking-wider group-hover:text-manthan-maroon transition-colors line-clamp-2 md:line-clamp-none">
                                                                {slot.event}
                                                            </span>
                                                            <span className="text-manthan-maroon/60 text-[8px] md:text-[10px] uppercase font-ancient tracking-[0.1em] mt-0.5 md:mt-1">
                                                                {slot.category}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="py-2 px-2 md:py-4 md:px-4 text-[#5c4033] italic text-[10px] md:text-sm whitespace-normal md:whitespace-nowrap">
                                                        <div className="flex items-center gap-1.5 md:gap-2">
                                                            <MapPin size={14} className="text-manthan-maroon/60" />
                                                            {slot.venue}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </ScrollWrapper>
                        </motion.div>
                    </div>
                </section>
            </main>

            <Footer />
        </motion.div>
    );
}
