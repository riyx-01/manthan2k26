'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoIntro from './VideoIntro';
import Chatbot from './Chatbot';
import { usePathname } from 'next/navigation';
import { useIsMobile } from '@/lib/useIsMobile';

export const IntroContext = createContext({
    introComplete: false,
    setIntroComplete: (() => { }) as (val: boolean) => void,
});

export const useIntro = () => useContext(IntroContext);

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const isLandingPage = pathname === '/';

    const [introComplete, setIntroComplete] = useState(false);
    const [isLoopFading, setIsLoopFading] = useState(false);
    const [bgVideoReady, setBgVideoReady] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);
    const backgroundPlayedRef = useRef(false);
    const startTimeRef = useRef<number | null>(null);
    const isMobile = useIsMobile();

    const bgVideoSrc = 'https://k6iphva0ugo1rocg.public.blob.vercel-storage.com/manthan/videos/theme3_hq.mp4';

    // Sync timing and handle manual loop fading
    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (video && video.duration) {
            const fadeDuration = 4.5;
            // Fade out starts 4.5s before end
            if (video.currentTime > video.duration - fadeDuration) {
                if (!isLoopFading) setIsLoopFading(true);
            }
            // Fade in starts immediately after reset
            else if (video.currentTime < 4.5 && isLoopFading) {
                // Wait for a tiny buffer to ensure the reset happened, then start fade-in
                if (video.currentTime > 0.1) setIsLoopFading(false);
            } else {
                if (isLoopFading && video.currentTime > 4.5) setIsLoopFading(false);
            }
        }
    };

    const handleVideoLoop = () => {
        if (videoRef.current) {
            const video = videoRef.current;
            video.currentTime = 0;
            video.play().catch(() => { });
        }
    };

    useEffect(() => {
        // Sync video timing with wall-clock to ensure it "progresses" in the background
        const syncVideo = () => {
            if (document.visibilityState === 'visible' && startTimeRef.current && videoRef.current) {
                const video = videoRef.current;
                if (video.duration) {
                    const totalElapsed = (Date.now() - startTimeRef.current) / 1000;
                    // For looping, we use the remainder (modulo) of the duration
                    const seekTime = totalElapsed % video.duration;

                    if (Math.abs(video.currentTime - seekTime) > 0.5) {
                        video.currentTime = seekTime;
                        video.play().catch(() => { });
                    }
                }
            }
        };

        document.addEventListener('visibilitychange', syncVideo);
        return () => document.removeEventListener('visibilitychange', syncVideo);
    }, []);

    useEffect(() => {
        if ((introComplete || !isLandingPage) && videoRef.current && !backgroundPlayedRef.current) {
            const video = videoRef.current;
            // Lazy-load: set source only when needed
            if (!video.src || video.src === '') {
                video.src = bgVideoSrc;
                video.load();
            }
            const onCanPlay = () => {
                setBgVideoReady(true);
                video.play().then(() => {
                    if (!startTimeRef.current) startTimeRef.current = Date.now();
                }).catch(() => { });
                video.removeEventListener('canplay', onCanPlay);
            };
            video.addEventListener('canplay', onCanPlay);
            backgroundPlayedRef.current = true;
        }
    }, [introComplete, isLandingPage, bgVideoSrc]);

    return (
        <IntroContext.Provider value={{ introComplete, setIntroComplete }}>
            {/* Global Solid Background - Prevents white flash */}
            <div className="fixed inset-0 bg-manthan-black -z-20" />

            {/* Global Intro - Handles both first load and refresh */}
            <AnimatePresence mode="wait">
                {isLandingPage && !introComplete && (
                    <VideoIntro key="intro" onComplete={() => setIntroComplete(true)} />
                )}
            </AnimatePresence>

            {/* Global Background Video - Lazy loaded, Manual Looping with Fades */}
            <video
                ref={videoRef}
                muted
                playsInline
                webkit-playsinline="true"
                preload="none"
                loop={false}
                disablePictureInPicture
                disableRemotePlayback
                tabIndex={-1}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleVideoLoop}
                className={`fixed top-1/2 left-1/2 min-w-[110%] min-h-[110%] w-auto h-auto object-cover transition-all duration-[4500ms] ease-in-out ${(introComplete || !isLandingPage) && !isLoopFading && bgVideoReady ? 'opacity-45' : 'opacity-0'
                    } pointer-events-none bg-black`}
                style={{
                    height: '110svh',
                    width: '110vw',
                    objectFit: 'cover',
                    zIndex: -1,
                    transform: 'translate(-50%, -50%) scale(1.4)'
                }}
            />
            {/* Source is set dynamically via JS for lazy loading */}

            <motion.div
                initial={false}
                animate={{ opacity: (isLandingPage && !introComplete) ? 0 : 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className={(isLandingPage && !introComplete) ? "fixed inset-0 pointer-events-none overflow-hidden bg-transparent" : "relative min-h-screen bg-transparent"}
            >
                {children}

                {/* Chatbot - Only show after intro or on subpages */}
                {(introComplete || !isLandingPage) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 1 }}
                    >
                        <Chatbot />
                    </motion.div>
                )}
            </motion.div>
        </IntroContext.Provider>
    );
}
