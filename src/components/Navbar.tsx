'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ChevronRight, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedButton from './AnimatedButton';

const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/events', label: 'Events' },
    { href: '/sponsorship', label: 'Sponsorship' },
    { href: '/about', label: 'About Us' },
    { href: '/contact', label: 'Contact' },
];

const dropdownLinks: { href: string; label: string }[] = [
    { href: '/workforce', label: 'Workforce' },
];

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [visible, setVisible] = useState(true);
    const [lastScrollY, setLastScrollY] = useState(0);
    const activeLink = usePathname();

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Background change
            setScrolled(currentScrollY > 50);

            // Visibility toggle (hide on scroll down, show on scroll up)
            if (currentScrollY > lastScrollY && currentScrollY > 150) {
                setVisible(false);
            } else {
                setVisible(true);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    return (
        <motion.nav
            initial={{ y: 0 }}
            animate={{
                y: visible ? 0 : -100,
                opacity: visible ? 1 : 0
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 ${scrolled
                ? 'bg-black/95 backdrop-blur-sm md:backdrop-blur-md py-4 shadow-2xl'
                : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-[1800px] mx-auto px-6 md:px-12 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-4 group relative z-[110]">
                    <div className="relative w-14 h-14 md:w-16 md:h-16 transition-transform duration-500">
                        <Image
                            src="/bbbg-removebg-preview.png"
                            alt="Manthan Logo"
                            fill
                            className="object-contain drop-shadow-[0_0_15px_rgba(212,168,55,0.4)]"
                        />
                    </div>

                    <div className="flex flex-col relative">
                        <span className={`font-pfeffer font-black tracking-[0.2em] leading-none transition-all duration-500 ${scrolled ? 'text-2xl md:text-3xl' : 'text-3xl md:text-5xl'
                            } text-gold-gradient drop-shadow-[0_4px_12px_rgba(212,168,55,0.5)]`}>
                            manthan
                        </span>
                    </div>
                </Link>

                {/* Desktop Links - Slimmer & Elegant */}
                <div className="hidden lg:flex items-center space-x-10">
                    {navLinks.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="relative py-2 group/link flex flex-col items-center"
                        >
                            <motion.span
                                whileTap={{ scale: 0.9 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                className={`font-pfeffer text-xl tracking-[0.15em] transition-all duration-300 ${activeLink === link.href ? 'text-manthan-gold' : 'text-gray-300 group-hover/link:text-white'
                                    }`}
                            >
                                {link.label}
                            </motion.span>
                            {activeLink === link.href ? (
                                <motion.span
                                    layoutId="nav-underline"
                                    className="absolute -bottom-1 left-0 right-0 h-[1.5px] bg-manthan-gold"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                />
                            ) : (
                                <span className="absolute -bottom-1 left-0 w-0 h-[1.5px] bg-manthan-gold transition-all duration-500 group-hover:w-full"></span>
                            )}
                        </Link>
                    ))}

                    {/* More Dropdown */}
                    <div className="relative group/more">
                        <button className={`flex items-center gap-1 font-pfeffer text-2xl tracking-[0.15em] font-bold text-gray-300 group-hover/more:text-white transition-all duration-300 py-1`}>
                            More <ChevronRight size={14} className="rotate-90 group-hover/more:rotate-[270deg] transition-transform duration-300" />
                        </button>
                        <div className="absolute top-full right-0 mt-2 w-48 bg-manthan-black/95 backdrop-blur-xl border border-manthan-gold/20 rounded-lg overflow-hidden opacity-0 invisible translate-y-2 group-hover/more:opacity-100 group-hover/more:visible group-hover/more:translate-y-0 transition-all duration-300 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                            {dropdownLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="block px-6 py-4 text-lg font-pfeffer tracking-[0.15em] text-gray-300 hover:text-white hover:bg-manthan-gold/5 transition-colors border-b border-manthan-gold/5 last:border-0"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    </div>

                    <div className="pl-4">
                        <Link
                            href="/register"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block transition-transform hover:scale-105 active:scale-95"
                        >
                            <AnimatedButton icon={Sparkles}>
                                Register
                            </AnimatedButton>
                        </Link>
                    </div>
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="lg:hidden relative z-[110] p-4 text-manthan-gold bg-manthan-gold/5 hover:bg-manthan-gold/20 rounded-xl border border-manthan-gold/20 transition-all duration-300"
                    aria-label="Toggle menu"
                >
                    {isOpen ? <X size={36} /> : <Menu size={36} />}
                </button>
            </div>

            {/* Full Screen Menu Overlay - Enhanced Styling */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="fixed inset-0 z-[105] bg-manthan-black flex flex-col items-center justify-start pt-32 pb-12 px-8 lg:hidden overflow-y-auto"
                    >
                        <div className="absolute inset-0 overflow-hidden pointer-events-none">
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(139,0,0,0.2)_0%,transparent_70%)]"></div>
                            {/* Funky Background Artifacts */}
                            <motion.div
                                animate={{ rotate: -360 }}
                                transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                                className="absolute -top-20 -left-20 w-[600px] h-[600px] border border-manthan-gold/5 rounded-full"
                            />
                        </div>

                        <div className="flex flex-col items-center space-y-10 relative z-10 w-full max-w-lg">
                            {[...navLinks, ...dropdownLinks].map((link, index) => (
                                <motion.div
                                    key={link.href}
                                    initial={{ opacity: 0, x: -50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1, duration: 0.5 }}
                                    className="w-full"
                                >
                                    <Link
                                        href={link.href}
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center justify-between group w-full py-6 border-b border-manthan-gold/10"
                                    >
                                        <div className="flex flex-col">
                                            <span className={`font-pfeffer text-3xl sm:text-4xl md:text-5xl tracking-[0.15em] transition-all duration-500 ${activeLink === link.href ? 'text-manthan-gold' : 'text-gray-500 group-hover:text-manthan-gold'
                                                }`}>
                                                {link.label}
                                            </span>
                                            <span className="text-[10px] text-manthan-gold/30 uppercase tracking-[0.4em] mt-1 opacity-0 group-hover:opacity-100 transition-opacity">Explore Realm</span>
                                        </div>
                                        <ChevronRight size={40} className="text-manthan-gold opacity-0 group-hover:opacity-100 transition-all duration-500 -translate-x-10 group-hover:translate-x-0" />
                                    </Link>
                                </motion.div>
                            ))}

                            <motion.div
                                initial={{ opacity: 0, y: 50 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.6 }}
                                className="pt-12 w-full"
                            >
                                <Link
                                    href="/register"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full flex justify-center"
                                >
                                    <AnimatedButton
                                        icon={Sparkles}
                                        className="w-full py-4 sm:py-6 text-xl sm:text-2xl"
                                    >
                                        JOIN THE LEGEND
                                    </AnimatedButton>
                                </Link>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.nav>
    );
}
