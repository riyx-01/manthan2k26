'use client';

import { motion } from 'framer-motion';

export default function FlashlightPreloader() {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
            className="fixed inset-0 z-[10002] bg-black flex items-center justify-center overflow-hidden"
        >
            {/* The "Flashlight" Beam */}
            <motion.div
                initial={{ x: '-100%', skewX: -20 }}
                animate={{ x: '200%' }}
                transition={{
                    duration: 1.2,
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 0.5
                }}
                className="absolute inset-y-0 w-32 bg-gradient-to-r from-transparent via-manthan-gold/40 to-transparent blur-3xl z-10"
            />

            <div className="relative z-20 flex flex-col items-center">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="w-24 h-24 border-[1px] border-manthan-gold/30 rounded-full flex items-center justify-center p-4 bg-manthan-black/40 backdrop-blur-xl mb-6 shadow-[0_0_50px_rgba(212,168,55,0.2)]"
                >
                    <motion.div
                        animate={{
                            rotate: 360,
                            boxShadow: ["0 0 20px rgba(212,168,55,0.2)", "0 0 40px rgba(212,168,55,0.4)", "0 0 20px rgba(212,168,55,0.2)"]
                        }}
                        transition={{ rotate: { duration: 4, repeat: Infinity, ease: "linear" }, boxShadow: { duration: 2, repeat: Infinity } }}
                        className="w-full h-full border-t-2 border-manthan-gold rounded-full"
                    />
                </motion.div>

                <motion.span
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="font-ancient text-manthan-gold tracking-[0.4em] uppercase text-xs"
                >
                    Illuminating...
                </motion.span>
            </div>

            {/* Atmospheric Dust/Particles for texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] animate-float" />
            </div>
        </motion.div>
    );
}
