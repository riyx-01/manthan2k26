'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface VideoIntroProps {
    onComplete: () => void;
}

/**
 * Determine video source synchronously to avoid hydration/source-switch issues.
 */
function getVideoSrc(): string {
    if (typeof window === 'undefined') return '/p2-desktop.mp4';
    const isMobile =
        window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(navigator.userAgent);
    return isMobile ? '/p2-mobile.mp4' : '/p2-desktop.mp4';
}

export default function VideoIntro({ onComplete }: VideoIntroProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isBuffering, setIsBuffering] = useState(true);
    const videoRef = useRef<HTMLVideoElement>(null);
    const hasStartedRef = useRef(false);

    const handleVideoEnd = useCallback(() => {
        setIsVisible(false);
        setTimeout(onComplete, 1000);
    }, [onComplete]);

    // Fetch video via chunked streaming (MediaSource) or fallback to direct src
    useEffect(() => {
        const video = videoRef.current;
        if (!video || hasStartedRef.current) return;
        hasStartedRef.current = true;

        const src = getVideoSrc();

        // Try MediaSource API for chunked progressive loading
        if ('MediaSource' in window && MediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E"')) {
            const mediaSource = new MediaSource();
            video.src = URL.createObjectURL(mediaSource);

            mediaSource.addEventListener('sourceopen', async () => {
                const sourceBuffer = mediaSource.addSourceBuffer('video/mp4; codecs="avc1.42E01E"');

                try {
                    const response = await fetch(src);
                    if (!response.ok || !response.body) throw new Error('Fetch failed');

                    const reader = response.body.getReader();
                    let firstChunkLoaded = false;

                    const pump = async (): Promise<void> => {
                        const { done, value } = await reader.read();
                        if (done) {
                            if (!sourceBuffer.updating) {
                                mediaSource.endOfStream();
                            } else {
                                sourceBuffer.addEventListener('updateend', () => {
                                    if (mediaSource.readyState === 'open') mediaSource.endOfStream();
                                }, { once: true });
                            }
                            return;
                        }

                        if (sourceBuffer.updating) {
                            await new Promise<void>(resolve => {
                                sourceBuffer.addEventListener('updateend', () => resolve(), { once: true });
                            });
                        }

                        sourceBuffer.appendBuffer(value);

                        if (!firstChunkLoaded) {
                            firstChunkLoaded = true;
                            await new Promise<void>(resolve => {
                                sourceBuffer.addEventListener('updateend', () => resolve(), { once: true });
                            });
                            setIsBuffering(false);
                            video.play().catch(() => { });
                        }

                        return pump();
                    };

                    await pump();
                } catch {
                    // Fallback: direct src
                    video.src = src;
                    video.load();
                    setIsBuffering(false);
                    video.play().catch(() => { });
                }
            });
        } else {
            // Fallback for browsers without MediaSource (e.g. iOS Safari)
            video.src = src;
            video.load();

            const onReady = () => {
                setIsBuffering(false);
                video.play().catch(() => { });
            };

            // Handle race condition: video may already be cached & ready
            if (video.readyState >= 3) {
                onReady();
            } else {
                video.addEventListener('canplay', onReady, { once: true });
            }
        }
    }, []);

    // Safety fallback - skip intro if video never loads
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
                    {isBuffering && (
                        <div className="absolute inset-0 z-[10001] flex items-center justify-center bg-black">
                            <div className="w-10 h-10 border-2 border-white/20 border-t-white/80 rounded-full animate-spin" />
                        </div>
                    )}

                    <video
                        ref={videoRef}
                        muted
                        playsInline
                        preload="auto"
                        poster="/bg-zodiac.jpg"
                        onEnded={handleVideoEnd}
                        className="absolute top-1/2 left-1/2 min-w-[110%] min-h-[110%] w-auto h-auto object-cover"
                        style={{
                            height: '110svh',
                            width: '110vw',
                            objectFit: 'cover',
                            transform: 'translate(-50%, -50%) scale(1.4)'
                        }}
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
