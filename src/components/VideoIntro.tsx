'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoIntroProps {
    onComplete: () => void;
}

export default function VideoIntro({ onComplete }: VideoIntroProps) {
    const [isVisible, setIsVisible] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    const handleVideoEnd = () => {
        setIsVisible(false);
        // Delay onComplete to allow fade-out animation to finish
        setTimeout(onComplete, 1000);
    };

    // Fallback timer in case video fails to load or play
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isVisible) {
                setIsVisible(false);
                setTimeout(onComplete, 1000);
            }
        }, 15000); // 15 seconds max fallback

        return () => clearTimeout(timer);
    }, [isVisible, onComplete]);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1, ease: "easeInOut" }}
                    className="fixed inset-0 z-[9999] bg-black flex items-center justify-center overflow-hidden"
                    style={{ height: '100svh' }}
                >
                    <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        // poster="/bg-zodiac.jpg"
                        onEnded={handleVideoEnd}
                        className="absolute top-1/2 left-1/2 min-w-[110%] min-h-[110%] w-auto h-auto object-cover"
                        style={{
                            height: '110svh',
                            width: '110vw',
                            objectFit: 'cover',
                            transform: 'translate(-50%, -50%) scale(1.4)'
                        }}
                    >
                        <source src="/p2.mp4" type="video/mp4" />
                    </video>

                    {/* Skip Button - Adjusted for mobile */}
                    <button
                        onClick={handleVideoEnd}
                        className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-[10000] px-5 py-2 md:px-6 md:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] md:text-xs uppercase tracking-[0.2em] rounded-full transition-all duration-300 active:scale-95"
                    >
                        Skip
                    </button>

                    {/* Subtle Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 pointer-events-none" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
