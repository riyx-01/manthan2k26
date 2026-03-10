'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface ScrollWrapperProps {
    children: ReactNode;
    className?: string;
    padding?: string;
    speed?: number;
}

export default function ScrollWrapper({ children, className = '', padding = 'p-8 md:p-12', speed = 1 }: ScrollWrapperProps) {
    return (
        <motion.div
            initial="closed"
            whileInView="open"
            viewport={{ once: true }}
            className={`parchment-container ${className}`}
        >
            <motion.div
                variants={{
                    closed: { y: 10 },
                    open: { y: 0 }
                }}
                className="scroll-roll"
            />

            <motion.div
                variants={{
                    closed: { height: 0, opacity: 0 },
                    open: { height: 'auto', opacity: 1 }
                }}
                transition={{ duration: speed, ease: "easeOut" }}
                className={`parchment-body ${padding}`}
            >
                {children}
            </motion.div>

            <motion.div
                variants={{
                    closed: { y: -10 },
                    open: { y: 0 }
                }}
                className="scroll-roll"
            />
        </motion.div>
    );
}
