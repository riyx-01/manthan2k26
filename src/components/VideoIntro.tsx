'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LogoLoading from './LogoLoading';

interface VideoIntroProps {
    onComplete: () => void;
}

/**
 * Determine video source synchronously to avoid hydration/source-switch issues.
 */
function getVideoSrc(): string {
    // Using Cloudflare Workers CDN for the intro video
    return 'https://manthan-cdn.ameyabhagat24.workers.dev/p2.mp4';
}

export default function VideoIntro({ onComplete }: VideoIntroProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isBuffering, setIsBuffering] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);

    // Resolve source once on mount (not via state to avoid extra render)
    const videoSrc = useRef(getVideoSrc()).current;

    const handleVideoEnd = useCallback(() => {
        setIsVisible(false);
        setTimeout(onComplete, 1000);
    }, [onComplete]);

    // Called when video actually starts playing — hides spinner
    const handleTimeUpdate = useCallback(() => {
        if (isBuffering) {
            setIsBuffering(false);
        }
    }, [isBuffering]);

    // Safety fallback - skip intro if video never loads within 15s
    useEffect(() => {
        const timer = setTimeout(() => {
            if (isVisible) {
                setIsVisible(false);
                setTimeout(onComplete, 1000);
            }
        }, 15000);
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
                    <AnimatePresence>
                        {isBuffering && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1, ease: "easeInOut" }}
                                className="absolute inset-0 z-[10001] flex items-center justify-center bg-black"
                            >
                                <LogoLoading />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        autoPlay
                        preload="auto"
                        src={videoSrc}
                        onTimeUpdate={handleTimeUpdate}
                        onEnded={handleVideoEnd}
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    <button
                        onClick={handleVideoEnd}
                        className="absolute bottom-6 right-6 md:bottom-10 md:right-10 z-[10000] px-5 py-2 md:px-6 md:py-2 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white text-[10px] md:text-xs uppercase tracking-[0.2em] rounded-full transition-all duration-300 active:scale-95"
                    >
                        Skip
                    </button>

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60 pointer-events-none" />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
