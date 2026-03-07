'use client';

import { useContext } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { IntroContext } from '@/components/ClientLayout';
import ScrollWrapper from '@/components/ScrollWrapper';
import AnimatedButton from '@/components/AnimatedButton';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/effect-coverflow';

export default function HomePage() {
    const { introComplete } = useContext(IntroContext);
    const { scrollYProgress } = useScroll();

    const heroContentOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0]);
    const events = [
        { title: "Prompt2Website", category: "Technical", description: "The Vibe Coding Challenge" },
        { title: "NrityaVerse", category: "Cultural", description: "Where tradition meets expression" },
        { title: "Box Cricket", category: "Sports", description: "The urban cricket league" },
        { title: "TypeSprint", category: "Technical", description: "The Ultimate Typing Showdown" },
        { title: "SurTarang", category: "Cultural", description: "Ride the waves of melody" },
        { title: "Badminton", category: "Sports", description: "Outdoor sports challenge" },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: introComplete ? 1 : 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className={`${introComplete ? "block" : "hidden"} bg-transparent overflow-x-hidden`}
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
                                delay: 2500,
                                disableOnInteraction: false,
                            }}
                            speed={1000}
                            pagination={{ clickable: true }}
                            modules={[Autoplay, Pagination, EffectCoverflow]}
                            className="event-swiper !pb-20"
                        >
                            {events.map((event, idx) => (
                                <SwiperSlide key={idx} className="!w-[300px] md:!w-[420px]">
                                    <Link href={`/events?category=${event.category.toLowerCase()}`} className="block h-full transform transition-transform duration-500 hover:scale-105 active:scale-95">
                                        <ScrollWrapper padding="p-10" className="min-h-[480px]">
                                            <span className="font-ancient text-sm tracking-[0.3em] uppercase text-manthan-maroon mb-4 block underline decoration-manthan-maroon/20 underline-offset-8">{event.category}</span>
                                            <h4 className="font-ancient text-4xl text-[#3d2b1f] mb-6 leading-tight">{event.title}</h4>
                                            <div className="h-[2px] w-16 bg-manthan-maroon mb-8" />
                                            <p className="font-serif italic text-[#5c4033] text-xl leading-relaxed">
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

                {/* CALL TO ACTION */}
                <section className="py-16 md:py-24 bg-transparent">
                    <div className="max-w-4xl mx-auto text-center px-4">
                        <ScrollWrapper padding="p-8 md:p-12">
                            <h2 className="font-ancient text-3xl md:text-4xl text-[#3d2b1f] mb-4">Ascend to Legend</h2>
                            <p className="text-[#5c4033] mb-8 max-w-lg mx-auto italic">
                                Unleash the spirit of the ancients. The realms of Manthan 2026 await your legend. Scribe your name in the chronicles of history.
                            </p>
                            <div className="flex justify-center">
                                <Link href="/register" className="scale-110">
                                    <AnimatedButton icon={Sparkles}>
                                        Register Inscriptions
                                    </AnimatedButton>
                                </Link>
                            </div>
                        </ScrollWrapper>
                    </div>
                </section>
            </main>

            <Footer />
        </motion.div>
    );
}
