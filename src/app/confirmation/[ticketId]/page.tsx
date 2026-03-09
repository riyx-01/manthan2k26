'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Registration, Event } from '@/lib/types';
import { formatFee, formatDate } from '@/lib/constants';
import { CheckCircle, Download, Calendar, MapPin, ShieldCheck } from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

export default function ConfirmationPage() {
    const params = useParams();
    const ticketId = params.ticketId as string;
    const passRef = useRef<HTMLDivElement>(null);

    const [registration, setRegistration] = useState<Registration | null>(null);
    const [events, setEvents] = useState<Partial<Event>[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');


    useEffect(() => {
        async function fetchData() {
            try {
                const res = await fetch(`/api/registration/${ticketId}`);
                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || 'Registration not found');
                    return;
                }

                setRegistration(data.registration);
                setEvents(data.events);
            } catch {
                setError('Failed to load registration details');
            } finally {
                setLoading(false);
            }
        }

        if (ticketId) fetchData();
    }, [ticketId]);

    const handleDownload = () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow || !passRef.current) return;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Manthan 2026 - Entry Pass - ${registration?.ticket_id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Georgia', serif; background: #fdf5e6; color: #3d2b1f; padding: 40px; }
          .pass { max-width: 500px; margin: 0 auto; background: #fdf5e6; border: 2px solid #3d2b1f; border-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M0 0 L100 0 L100 100 L0 100 Z' fill='none' stroke='%233d2b1f' stroke-width='2'/%3E%3C/svg%3E") 30 stretch; padding: 40px; position: relative; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
          .pass::before, .pass::after { content: ''; position: absolute; left: -10px; right: -10px; height: 15px; background: #3d2b1f; border-radius: 10px; opacity: 0.8; }
          .pass::before { top: -8px; }
          .pass::after { bottom: -8px; }
          .header { text-align: center; border-bottom: 1px solid rgba(61,43,31,0.1); padding-bottom: 25px; margin-bottom: 25px; }
          .title { font-size: 32px; color: #3d2b1f; font-weight: bold; letter-spacing: 6px; text-transform: uppercase; }
          .subtitle { color: #8B0000; font-size: 14px; margin-top: 6px; font-style: italic; }
          .ticket-id { font-size: 20px; color: #3d2b1f; font-weight: bold; margin: 20px 0; letter-spacing: 3px; border: 1px dashed #3d2b1f; display: inline-block; padding: 8px 16px; }
          .status { display: block; margin-top: 10px; color: #2e7d32; font-weight: bold; font-size: 12px; }
          .qr { text-align: center; margin: 30px 0; }
          .qr img { width: 220px; height: 220px; border: 8px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.05); }
          .details { margin: 25px 0; }
          .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid rgba(61,43,31,0.05); font-size: 14px; }
          .detail-label { color: #5c4033; opacity: 0.7; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; }
          .detail-value { color: #3d2b1f; font-weight: 600; }
          .events-list { margin: 25px 0; text-align: left; }
          .events-title { font-weight: bold; color: #8B0000; font-size: 12px; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 12px; }
          .event-item { padding: 10px 15px; border-left: 3px solid #8B0000; margin-bottom: 8px; font-size: 14px; background: rgba(139,0,0,0.03); }
          .total { text-align: right; font-size: 22px; color: #8B0000; font-weight: bold; margin-top: 20px; border-top: 2px solid #3d2b1f; padding-top: 15px; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid rgba(61,43,31,0.1); color: #5c4033; font-size: 12px; font-style: italic; }
          @media print { body { background: white; padding: 0; } .pass { box-shadow: none; border-color: black; } }
        </style>
      </head>
      <body>
        <div class="pass">
          <div class="header">
            <div class="title">MANTHAN</div>
            <div class="subtitle">2026 • Festival of Ancient Wisdom</div>
            <div class="ticket-id">${registration?.ticket_id}</div>
            <div class="status">VERIFIED • PAID</div>
          </div>
          <div class="qr">
            <img src="${registration?.qr_code}" alt="Portal Key" />
            <div style="color:#5c4033;font-size:11px;margin-top:10px;text-transform:uppercase;letter-spacing:1px;">The Key to the Archives</div>
          </div>
          <div class="details">
            <div class="detail-row"><span class="detail-label">Chronicler</span><span class="detail-value">${registration?.name}</span></div>
            <div class="detail-row"><span class="detail-label">Codex</span><span class="detail-value">${registration?.email}</span></div>
            <div class="detail-row"><span class="detail-label">Guild</span><span class="detail-value">${registration?.college}</span></div>
          </div>
          <div class="events-list">
            <div class="events-title">Inscribed Trials</div>
            ${events.map((e) => `
              <div class="event-item">
                <div style="font-weight:bold;">${e.name}</div>
                <div style="font-size:11px;opacity:0.7;margin-top:2px;">${e.venue || 'The Great Arena'}</div>
              </div>
            `).join('')}
          </div>
          <div class="total">Offerings: ${registration ? formatFee(registration.total_amount) : ''}</div>
          <div class="footer">
            <p>24th - 25th of March, 2026</p>
            <p style="margin-top:4px;">Inscribed in the permanent scrolls of the Realm.</p>
          </div>
        </div>
      </body>
      </html>
    `);
        printWindow.document.close();
        printWindow.print();
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center">
                    <LoadingSpinner />
                </main>
                <Footer />
            </div>
        );
    }

    if (error || !registration) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col">
                <Navbar />
                <main className="flex-1 flex items-center justify-center px-4">
                    <div className="parchment-container max-w-md w-full">
                        <div className="scroll-roll h-4" />
                        <div className="parchment-body p-12 text-center">
                            <p className="text-manthan-crimson font-ancient text-lg mb-4">{error || 'Registration not found'}</p>
                            <a href="/" className="text-manthan-maroon hover:underline font-ancient uppercase tracking-widest text-sm">Return to Sanctum</a>
                        </div>
                        <div className="scroll-roll h-4 rotate-180" />
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-transparent flex flex-col relative overflow-hidden">
            <Navbar />

            {/* Background Glows */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-manthan-maroon/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-manthan-gold/5 rounded-full blur-[120px] pointer-events-none" />

            <main className="flex-1 pt-24 pb-16 px-4 relative z-10">
                <div className="max-w-2xl mx-auto">
                    {/* Success Banner */}
                    <div className="text-center mb-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", damping: 12 }}
                        >
                            <CheckCircle size={64} className="mx-auto text-[#2e7d32] mb-4" />
                        </motion.div>
                        <h1 className="font-ancient text-3xl sm:text-4xl font-bold text-[#3d2b1f] mb-2 uppercase tracking-tight">
                            Trial Inscribed!
                        </h1>
                        <p className="text-[#5c4033] font-ancient italic text-sm">
                            Your passage has been verified in the eternal scrolls.
                        </p>
                    </div>

                    {/* Entry Pass Container */}
                    <div className="parchment-container max-w-lg mx-auto shadow-2xl overflow-visible">
                        <div className="scroll-roll" />

                        <div ref={passRef} className="parchment-body p-6 sm:p-10 shrink-0">
                            {/* Pass Header */}
                            <div className="text-center border-b border-manthan-maroon/10 pb-8 mb-8">
                                <h2 className="font-ancient text-4xl font-bold text-[#3d2b1f] tracking-[0.2em] uppercase">
                                    MANTHAN
                                </h2>
                                <p className="text-manthan-maroon text-[10px] mt-2 font-ancient uppercase tracking-[0.3em]">2026 • College Tech Fest</p>

                                <div className="mt-8 flex flex-col items-center">
                                    <div className="border border-dashed border-[#3d2b1f] px-6 py-3 relative">
                                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#f4e4bc] px-2 text-[8px] text-manthan-maroon font-bold font-ancient uppercase tracking-widest whitespace-nowrap">Scroll ID</span>
                                        <span className="font-ancient text-[#3d2b1f] text-2xl font-bold tracking-widest">
                                            {registration.ticket_id}
                                        </span>
                                    </div>
                                    <span className="mt-4 px-4 py-1.5 bg-[#2e7d32]/10 text-[#2e7d32] text-[10px] font-bold rounded-full font-ancient uppercase tracking-widest border border-[#2e7d32]/20">
                                        ✓ VERIFIED passage
                                    </span>
                                </div>
                            </div>

                            {/* QR Code */}
                            {registration.qr_code && (
                                <div className="mb-10 text-center">
                                    <div className="inline-block p-4 bg-white shadow-inner rounded-xl">
                                        <Image
                                            src={registration.qr_code}
                                            alt="Entry QR Code"
                                            width={200}
                                            height={200}
                                            className="mx-auto"
                                            unoptimized
                                        />
                                    </div>
                                    <p className="text-[#5c4033]/60 font-ancient text-[10px] uppercase tracking-widest mt-4">The Key to the Archives</p>
                                </div>
                            )}

                            {/* Details */}
                            <div className="grid grid-cols-1 gap-4 mb-10 border-y border-manthan-maroon/5 py-8">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-manthan-maroon/40 text-[10px] font-bold uppercase tracking-widest font-ancient">Herald</span>
                                    <span className="text-[#3d2b1f] font-bold font-ancient truncate max-w-[200px]">{registration.name}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-manthan-maroon/40 text-[10px] font-bold uppercase tracking-widest font-ancient">Codex</span>
                                    <span className="text-[#3d2b1f] font-bold font-ancient truncate max-w-[200px]">{registration.email}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-manthan-maroon/40 text-[10px] font-bold uppercase tracking-widest font-ancient">College</span>
                                    <span className="text-[#3d2b1f] font-bold font-ancient truncate max-w-[200px]">{registration.college}</span>
                                </div>
                            </div>

                            {/* Registered Events */}
                            <div className="mb-8">
                                <h3 className="text-manthan-maroon/60 font-bold mb-4 text-[10px] uppercase tracking-[0.2em] font-ancient">Inscribed Trials</h3>
                                <div className="grid grid-cols-1 gap-3">
                                    {events.map((event) => (
                                        <div
                                            key={event.id}
                                            className="p-4 rounded-xl bg-black/5 border-l-4 border-manthan-maroon transition-all"
                                        >
                                            <p className="text-[#3d2b1f] text-sm font-bold font-ancient">{event.name}</p>
                                            <div className="flex items-center gap-4 mt-2">
                                                {event.venue && (
                                                    <span className="text-[#5c4033]/60 text-[10px] flex items-center font-ancient uppercase tracking-wider">
                                                        <MapPin size={10} className="mr-1" />
                                                        {event.venue}
                                                    </span>
                                                )}
                                                {event.event_date && (
                                                    <span className="text-[#5c4033]/60 text-[10px] flex items-center font-ancient uppercase tracking-wider">
                                                        <Calendar size={10} className="mr-1" />
                                                        {formatDate(event.event_date)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total and Footer */}
                            <div className="mt-10 pt-8 border-t border-manthan-maroon/10">
                                <div className="flex items-center justify-between mb-8">
                                    <span className="text-[#5c4033]/60 text-[10px] font-bold uppercase tracking-widest font-ancient">Total Offering</span>
                                    <span className="text-manthan-maroon font-bold text-2xl font-ancient">
                                        {formatFee(registration.total_amount)}
                                    </span>
                                </div>

                                <div className="text-center">
                                    <p className="text-[#5c4033]/40 text-[10px] font-ancient uppercase tracking-[0.2em]">
                                        March 24-25, 2026 • College Campus
                                    </p>
                                    <div className="flex items-start gap-4 p-4 rounded-xl bg-manthan-maroon/5 border border-manthan-maroon/10 mt-6">
                                        <ShieldCheck size={18} className="text-manthan-maroon flex-shrink-0 mt-0.5" />
                                        <p className="text-[#5c4033] text-[9px] font-ancient leading-relaxed italic text-left">
                                            This passage is strictly for the chronicler named above. Please present this digital scroll at the gates for entry into the Realm.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="scroll-roll rotate-180" />
                    </div>

                    {/* Download Button */}
                    <div className="mt-12 flex justify-center">
                        <button
                            onClick={handleDownload}
                            className="group relative px-10 py-4 bg-gradient-to-r from-manthan-maroon to-manthan-crimson text-white font-bold rounded-full transition-all shadow-xl shadow-manthan-maroon/20 hover:shadow-manthan-maroon/40 active:scale-95 flex items-center gap-3 overflow-hidden"
                        >
                            <Download size={20} className="relative z-10" />
                            <span className="relative z-10 font-ancient uppercase tracking-widest">Download Pass Scroll</span>
                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
