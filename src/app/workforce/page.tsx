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
        image: '/profile/riya2nobg.png',
        isLead: true,
        imageClass: 'object-center scale-150 group-hover:scale-115',
        linkedin: 'https://www.linkedin.com/in/riyathakur01'
    },
    {
        name: 'Ameya Bhagat',
        role: 'Backend & Infrastructure Developer',
        image: '/profile/ameya%20bg%20remove.png',
        imageClass: 'object-center scale-110 group-hover:scale-115',
        linkedin: 'https://www.linkedin.com/in/ameyabhagat24'
    },
    {
        name: 'Aryan Lehgaonkar',
        role: 'Backend Integration',
        image: '/profile/aryan 2.png',
        imageClass: 'object-top scale-[1.2] group-hover:scale-115'
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
                        {teamMembers.map((member, index) => {
                            const CardContent = (
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

                                        {member.linkedin && (
                                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 shadow-lg transform translate-y-2 group-hover:translate-y-0">
                                                <svg className="w-5 h-5 text-[#0077b5]" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.761 0 5-2.239 5-5v-14c0-2.761-2.239-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                                </svg>
                                            </div>
                                        )}
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
                            );

                            return (
                                <div key={index} className="max-w-sm mx-auto md:max-w-none w-full transition-all duration-300 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(212,168,55,0.15)] rounded-xl overflow-hidden">
                                    {member.linkedin ? (
                                        <a href={member.linkedin} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                                            {CardContent}
                                        </a>
                                    ) : (
                                        CardContent
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
