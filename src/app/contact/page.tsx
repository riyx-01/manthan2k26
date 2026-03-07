'use client';

import { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollWrapper from '@/components/ScrollWrapper';
import { Mail, Phone, MapPin, Send, Sparkles } from 'lucide-react';
import AnimatedButton from '@/components/AnimatedButton';
import { motion, AnimatePresence } from 'framer-motion';

export default function ContactPage() {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
    const [submitted, setSubmitted] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // In production, this would send to an API endpoint
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col relative overflow-hidden">
            <Navbar />

            {/* Background Video (Optimized) */}
            <div className="fixed inset-0 -z-10 w-full h-full">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-20"
                    onLoadedData={(e) => {
                        e.currentTarget.playbackRate = 0.5;
                    }}
                >
                    <source src="https://manthan-cdn.ameyabhagat24.workers.dev/extended.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-black/60" />
            </div>

            <main className="flex-1 pt-32 pb-20 px-6 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <motion.h1
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="font-ancient text-5xl md:text-7xl text-gold-gradient uppercase mb-4"
                        >
                            Council Reach
                        </motion.h1>
                        <motion.p
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            transition={{ delay: 0.1 }}
                            className="font-serif italic text-manthan-gold/60 text-xl"
                        >
                            Send your scrolls to the high council
                        </motion.p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Contact Info */}
                        <motion.div
                            initial={{ x: -30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="space-y-8"
                        >
                            <ScrollWrapper padding="p-8 md:p-10" className="h-full">
                                <h2 className="font-ancient text-3xl text-[#3d2b1f] mb-8 uppercase tracking-widest">The Oracle&apos;s Reach</h2>
                                <div className="space-y-6">
                                    <ContactItem
                                        icon={<Mail size={24} />}
                                        label="Electronic Scroll"
                                        value="principal.bvimit@bharatividyapeeth.edu"
                                        link="mailto:principal.bvimit@bharatividyapeeth.edu"
                                    />
                                    <ContactItem
                                        icon={<Phone size={24} />}
                                        label="Signal Transmission"
                                        value="+91 8657008016"
                                        link="tel:+918657008016"
                                    />
                                    <ContactItem
                                        icon={<MapPin size={24} />}
                                        label="The Great Hall"
                                        value="BVIMIT, Sector-8, Belapur, CBD, Navi Mumbai - 400614"
                                        link="https://maps.google.com"
                                    />
                                </div>
                                <div className="mt-12 p-6 border-2 border-[#3d2b1f]/10 rounded-xl bg-[#3d2b1f]/5">
                                    <p className="font-serif italic text-[#5c4033] text-sm leading-relaxed">
                                        Our messengers are active during the peak of the sun (10:00 AM - 5:00 PM).
                                        Urgent decrees will be handled by the high priority couriers.
                                    </p>
                                </div>
                            </ScrollWrapper>
                        </motion.div>

                        {/* Contact Form */}
                        <motion.div
                            initial={{ x: 30, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.3 }}
                        >
                            <ScrollWrapper padding="p-8 md:p-10">
                                <AnimatePresence mode="wait">
                                    {!submitted ? (
                                        <motion.form
                                            key="form"
                                            onSubmit={handleSubmit}
                                            className="space-y-6"
                                            initial={{ opacity: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                        >
                                            <h2 className="font-ancient text-3xl text-[#3d2b1f] mb-8 uppercase tracking-widest">Scribe Your Message</h2>

                                            <div className="space-y-5">
                                                <ContactField
                                                    label="Your Name"
                                                    focused={focusedField === 'name'}
                                                >
                                                    <input
                                                        type="text"
                                                        required
                                                        value={form.name}
                                                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                                                        onFocus={() => setFocusedField('name')}
                                                        onBlur={() => setFocusedField(null)}
                                                        placeholder="Legendary identity"
                                                        className="w-full bg-transparent px-2 py-3 text-sm text-[#3d2b1f] placeholder-[#3d2b1f]/40 focus:outline-none font-medium"
                                                    />
                                                </ContactField>

                                                <ContactField
                                                    label="Email Realm"
                                                    focused={focusedField === 'email'}
                                                >
                                                    <input
                                                        type="email"
                                                        required
                                                        value={form.email}
                                                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                                                        onFocus={() => setFocusedField('email')}
                                                        onBlur={() => setFocusedField(null)}
                                                        placeholder="your@realm.com"
                                                        className="w-full bg-transparent px-2 py-3 text-sm text-[#3d2b1f] placeholder-[#3d2b1f]/40 focus:outline-none font-medium"
                                                    />
                                                </ContactField>

                                                <ContactField
                                                    label="Subject of Decree"
                                                    focused={focusedField === 'subject'}
                                                >
                                                    <input
                                                        type="text"
                                                        required
                                                        value={form.subject}
                                                        onChange={(e) => setForm({ ...form, subject: e.target.value })}
                                                        onFocus={() => setFocusedField('subject')}
                                                        onBlur={() => setFocusedField(null)}
                                                        placeholder="Matter of importance"
                                                        className="w-full bg-transparent px-2 py-3 text-sm text-[#3d2b1f] placeholder-[#3d2b1f]/40 focus:outline-none font-medium"
                                                    />
                                                </ContactField>

                                                <ContactField
                                                    label="The Scroll Content"
                                                    focused={focusedField === 'message'}
                                                >
                                                    <textarea
                                                        required
                                                        rows={4}
                                                        value={form.message}
                                                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                                                        onFocus={() => setFocusedField('message')}
                                                        onBlur={() => setFocusedField(null)}
                                                        placeholder="Unfold your thoughts here..."
                                                        className="w-full bg-transparent px-2 py-3 text-sm text-[#3d2b1f] placeholder-[#3d2b1f]/40 focus:outline-none font-medium resize-none"
                                                    />
                                                </ContactField>
                                            </div>

                                            <div className="flex justify-end pt-4">
                                                <AnimatedButton type="submit" icon={Send}>
                                                    Dispatch Scroll
                                                </AnimatedButton>
                                            </div>
                                        </motion.form>
                                    ) : (
                                        <motion.div
                                            key="thanks"
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            className="text-center py-20 px-4"
                                        >
                                            <div className="w-20 h-20 bg-manthan-maroon/10 rounded-full flex items-center justify-center mx-auto mb-8 border-2 border-manthan-maroon/20">
                                                <Sparkles className="text-manthan-maroon" size={40} />
                                            </div>
                                            <h3 className="font-ancient text-4xl text-[#3d2b1f] mb-4 uppercase">Scroll Received</h3>
                                            <p className="font-serif italic text-[#5c4033] text-lg max-w-sm mx-auto">
                                                Your message has been safely delivered to our archives. We shall reply as soon as the moon aligns.
                                            </p>
                                            <button
                                                onClick={() => setSubmitted(false)}
                                                className="mt-10 text-manthan-maroon text-xs font-bold uppercase tracking-[0.3em] hover:underline"
                                            >
                                                Send another decree
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </ScrollWrapper>
                        </motion.div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}

function ContactItem({ icon, label, value, link }: { icon: React.ReactNode, label: string, value: string, link: string }) {
    return (
        <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-5 group"
        >
            <div className="mt-1 p-3 rounded-lg bg-manthan-maroon/5 text-manthan-maroon group-hover:bg-manthan-maroon group-hover:text-white transition-all duration-300">
                {icon}
            </div>
            <div>
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#3d2b1f]/40 font-black mb-1">{label}</p>
                <p className="text-[#3d2b1f] font-bold text-sm tracking-tight group-hover:text-manthan-maroon transition-colors">{value}</p>
            </div>
        </a>
    );
}

function ContactField({ label, children, focused }: { label: string, children: React.ReactNode, focused: boolean }) {
    return (
        <div className={`p-4 rounded-xl border transition-all duration-300 ${focused ? 'bg-[#f4e4bc]/40 border-manthan-maroon shadow-[0_0_20px_rgba(139,0,0,0.1)]' : 'bg-[#f4e4bc]/10 border-[#3d2b1f]/10'}`}>
            <label className={`block text-[10px] uppercase tracking-[0.2em] font-black mb-1 transition-colors duration-300 ${focused ? 'text-manthan-maroon' : 'text-[#3d2b1f]/60'}`}>{label}</label>
            {children}
        </div>
    );
}
