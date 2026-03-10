'use client';

import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';
import VideoIntro from './VideoIntro';

const Chatbot = dynamic(() => import('./Chatbot'), { ssr: false });
import { usePathname } from 'next/navigation';


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
    const restartTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const bgVideoSrc = 'https://manthan-cdn.ameyabhagat24.workers.dev/extended.mp4';
    const targetOpacity = 0.46;
    const loopFadeOpacity = 0.28;

    // Fade near the natural end of the clip so final frames are always visible.
    const handleTimeUpdate = () => {
        const video = videoRef.current;
        if (video) {
            const duration = video.duration;
            const fadeDuration = 0.25;
            if (!Number.isFinite(duration) || duration <= 0) return;

            if (video.currentTime >= duration - fadeDuration && video.currentTime < duration) {
                if (!isLoopFading) {
                    setIsLoopFading(true);
                }
            } else if (isLoopFading && video.currentTime < duration - fadeDuration) {
                setIsLoopFading(false);
            }
        }
    };

    const handleVideoLoop = () => {
        const video = videoRef.current;
        if (!video) return;

        setIsLoopFading(true);

        if (restartTimeoutRef.current) {
            clearTimeout(restartTimeoutRef.current);
        }

        restartTimeoutRef.current = setTimeout(() => {
            video.currentTime = 0;
            video.play().catch(() => { });
            setIsLoopFading(false);
        }, 280);
    };

    useEffect(() => {
        return () => {
            if (restartTimeoutRef.current) {
                clearTimeout(restartTimeoutRef.current);
            }
        };
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
                // Add delay to ensure intro fade is completely finished
                setTimeout(() => {
                    video.currentTime = 0; // Ensure it starts from beginning
                    video.play().catch(() => { });
                }, 900); // Delay keeps transition smooth after intro exits
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
                className="fixed top-1/2 left-1/2 min-w-[110%] min-h-[110%] w-auto h-auto object-cover transition-opacity duration-200 ease-out pointer-events-none bg-black"
                style={{
                    opacity: (introComplete || !isLandingPage) && bgVideoReady
                        ? (isLoopFading ? loopFadeOpacity : targetOpacity)
                        : 0,
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
                {/* Home Page Specific Background Override */}
                <style jsx global>{`
                    body::before {
                        display: none !important;
                    }
                `}</style>
                {children}

                {/* Chatbot - Lazy loaded and only shown after intro or on subpages */}
                {(introComplete || !isLandingPage) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5, delay: 2 }} // Added slight delay to prioritize content
                    >
                        <Chatbot />
                    </motion.div>
                )}
            </motion.div>
        </IntroContext.Provider>
    );
}
