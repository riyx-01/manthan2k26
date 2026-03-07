'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ScrollWrapper from '@/components/ScrollWrapper';

const teamMembers = [
    {
        name: 'Riya Thakur',
        role: 'UI/UX Designer & Frontend Developer',
        image: '/profile/riya-thakur.png',
        isLead: true,
        imageClass: 'object-top'
    },
    {
        name: 'Ameya Bhagat',
        role: 'Backend & Infrastructure Developer',
        image: '/profile/ameya%20bg%20remove.png',
        imageClass: 'object-center scale-110 group-hover:scale-115'
    },
    {
        name: 'Aryan Lehgaonkar',
        role: 'Payments Integration Developer',
        image: '/profile/aryan.PNG',
        imageClass: 'object-top scale-[1.25] -translate-y-5 group-hover:scale-[1.3] group-hover:-translate-y-6'
    },
    {
        name: 'Uday Bhoi',
        role: 'Frontend Developer',
        image: '/profile/uday-bhoi.png',
        imageClass: 'object-top'
    }
];

export default function WorkforcePage() {
    return (
        <div className="min-h-screen bg-transparent">
            <Navbar />

            <main className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        className="text-center mb-20"
                    >
                        <h1 className="font-heading text-5xl md:text-7xl font-bold text-gold-gradient mb-4 uppercase tracking-tighter">
                            Workforce
                        </h1>
                        <div className="w-24 h-1 bg-gradient-to-r from-transparent via-manthan-gold to-transparent mx-auto mb-6"></div>
                        <p className="font-body text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto italic">
                            Web Development Team Manthan
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {teamMembers.map((member, index) => (
                            <div key={index} className="max-w-sm mx-auto md:max-w-none w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,168,55,0.15)] rounded-xl overflow-hidden">
                                <ScrollWrapper
                                    padding="p-0"
                                    className="group transition-all duration-500 w-full h-full"
                                >
                                    <div className="aspect-square overflow-hidden relative">
                                        <Image
                                            src={member.image}
                                            alt={member.name}
                                            fill
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                                            className={`object-cover transition-transform duration-700 grayscale group-hover:grayscale-0 ${member.imageClass ? member.imageClass : 'object-top group-hover:scale-110'}`}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-[#3d2b1f] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                                    </div>

                                    <div className="p-6 relative z-10 -mt-12 h-full">
                                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-lg border-t border-manthan-gold/20 transform group-hover:-translate-y-2 transition-transform duration-500 shadow-lg min-h-[140px] flex flex-col items-center justify-center text-center">
                                            <h3 className="font-ancient text-xl font-bold text-[#3d2b1f] mb-2 uppercase tracking-wider">
                                                {member.name}
                                                {member.isLead && (
                                                    <span className="block text-sm mt-1 text-manthan-maroon tracking-normal">(Lead)</span>
                                                )}
                                            </h3>
                                            <p className="text-manthan-maroon text-xs font-bold tracking-widest uppercase">
                                                {member.role}
                                            </p>
                                        </div>
                                    </div>
                                </ScrollWrapper>
                            </div>
                        ))}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
