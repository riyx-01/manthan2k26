'use client';

import Navbar from '@/components/Navbar';
import Image from 'next/image';
import Footer from '@/components/Footer';
import ScrollWrapper from '@/components/ScrollWrapper';
import { motion } from 'framer-motion';
import { Trophy, Star, ShieldCheck, Heart } from 'lucide-react';

const sponsors = [
    {
        tier: 'Title Sponsor',
        icon: Trophy,
        items: [
            { id: 1, name: 'Google Cloud', logo: 'https://upload.wikimedia.org/wikipedia/commons/5/51/Google_Cloud_logo.svg' }
        ]
    },
    {
        tier: 'Co-Sponsors',
        icon: Star,
        items: [
            { id: 1, name: 'Razorpay', logo: 'https://upload.wikimedia.org/wikipedia/commons/8/89/Razorpay_logo.svg' },
            { id: 2, name: 'AWS', logo: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg' }
        ]
    },
    {
        tier: 'Associate Partners',
        icon: ShieldCheck,
        items: [
            { id: 1, name: 'Red Bull', logo: 'https://upload.wikimedia.org/wikipedia/en/f/f5/Red_Bull_Logo.svg' },
            { id: 2, name: 'Starbucks', logo: 'https://upload.wikimedia.org/wikipedia/en/d/d3/Starbucks_Corporation_Logo_2011.svg' },
            { id: 3, name: 'Intel', logo: 'https://upload.wikimedia.org/wikipedia/commons/7/7d/Intel_logo_%282006-2020%29.svg' }
        ]
    }
];

export default function SponsorshipPage() {
    return (
        <>
            <Navbar />

            <main className="pt-24 pb-20 px-4 md:pt-32 relative min-h-screen overflow-hidden">
                {/* Background Glows */}
                <div className="absolute top-0 right-1/4 w-96 h-96 bg-manthan-maroon/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-manthan-gold/5 rounded-full blur-[120px] pointer-events-none" />

                <div className="max-w-6xl mx-auto relative z-10">
                    {/* Hero Section */}
                    <div className="text-center mb-20">
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="font-heading text-4xl md:text-6xl font-bold text-gold-gradient mb-6"
                        >
                            Our Proud Sponsors
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-400 text-lg max-w-2xl mx-auto mb-10"
                        >
                            The backbone of Manthan 2026. We are honored to partner with global leaders
                            who share our passion for technology and students&apos; success.
                        </motion.p>
                    </div>

                    {/* Sponsorship Tiers */}
                    <div className="space-y-16">
                        {sponsors.map((tier) => (
                            <ScrollWrapper key={tier.tier} padding="p-8 md:p-12">
                                <div className="flex items-center gap-4 mb-10 pb-4 border-b border-[#3d2b1f]/10">
                                    <div className="w-12 h-12 rounded-full bg-manthan-maroon/10 flex items-center justify-center text-manthan-maroon">
                                        <tier.icon size={24} />
                                    </div>
                                    <h2 className="font-ancient text-2xl md:text-3xl font-bold text-[#3d2b1f] tracking-tight uppercase">
                                        {tier.tier}
                                    </h2>
                                </div>

                                <div className={`grid gap-6 ${tier.tier === 'Title Sponsor' ? 'grid-cols-1 max-w-md mx-auto' :
                                    tier.tier === 'Co-Sponsors' ? 'grid-cols-1 md:grid-cols-2' :
                                        'grid-cols-2 md:grid-cols-3'
                                    }`}>
                                    {tier.items.map((sponsor) => (
                                        <div
                                            key={sponsor.id}
                                            className="group relative h-40 bg-[#3d2b1f]/5 border border-[#3d2b1f]/10 rounded-2xl flex items-center justify-center p-8 hover:border-manthan-maroon/30 transition-all duration-500 overflow-hidden shadow-sm"
                                        >
                                            <Image
                                                src={sponsor.logo}
                                                alt={sponsor.name}
                                                width={160}
                                                height={64}
                                                className="max-h-16 w-auto object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500 scale-100 group-hover:scale-110"
                                            />

                                            <div className="absolute bottom-4 left-0 right-0 text-center translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                                <span className="font-ancient text-[10px] font-bold text-manthan-maroon uppercase tracking-[0.2em]">
                                                    {sponsor.name}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollWrapper>
                        ))}
                    </div>

                    {/* CTA Section */}
                    <div className="mt-32">
                        <ScrollWrapper padding="p-12">
                            <Heart className="text-manthan-maroon mx-auto mb-6" size={48} />
                            <h2 className="font-ancient text-3xl font-bold text-[#3d2b1f] mb-4 uppercase">Want to partner with us?</h2>
                            <p className="text-[#5c4033] max-w-xl mx-auto mb-8 italic">
                                Join us in making Manthan 2026 the biggest celebration of talent.
                                Partner with us and gain visibility among thousands of enthusiastic students.
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a
                                    href="mailto:manthan@bvimit.co.in"
                                    className="px-12 py-4 bg-gradient-to-r from-manthan-maroon to-manthan-crimson text-white font-ancient font-bold uppercase tracking-[0.2em] shadow-xl shadow-manthan-maroon/20 hover:scale-105 transition-transform text-center"
                                >
                                    Contact for Sponsorship
                                </a>
                            </div>
                        </ScrollWrapper>
                    </div>
                </div>
            </main>

            <Footer />
        </>
    );
}
