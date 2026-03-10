'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Registration, Event } from '@/lib/types';
import { formatFee, formatDate } from '@/lib/constants';
import { CheckCircle, Download, MapPin, ShieldCheck } from 'lucide-react';
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

    const handleDownload = async () => {
        const fetchLogoAsBase64 = async (url: string) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise<string>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result as string);
                    reader.readAsDataURL(blob);
                });
            } catch (err) {
                console.error('Logo load error:', err);
                return url;
            }
        };

        const [logoL, logoR] = await Promise.all([
            fetchLogoAsBase64('/manthan_final_logo2.png'),
            fetchLogoAsBase64('/bbbg-removebg-preview.png')
        ]);

        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Manthan 2026 - Entry Pass - ${registration?.ticket_id}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: 'Georgia', serif; 
            background: #0a0a0a; 
            color: #ffffff; 
            padding: 0; 
            margin: 0; 
            display: flex; 
            justify-content: center; 
            align-items: center; 
            min-height: 100vh; 
            width: 100vw; 
          }
          .pass { 
            width: 100%; 
            max-width: 480px; 
            background: #0a0a0a; 
            border: 3px solid #D4AF37; 
            padding: 30px; 
            position: relative; 
            overflow: hidden; 
            box-shadow: 0 0 50px rgba(0,0,0,1);
          }
          .pass::before, .pass::after { 
            content: ''; 
            position: absolute; 
            left: 0; 
            right: 0; 
            height: 10px; 
            background: #8B0000; 
            z-index: 10;
          }
          .pass::before { top: 0; }
          .pass::after { bottom: 0; }

          .logo-container { 
            display: flex; 
            justify-content: space-between; 
            align-items: center; 
            margin-bottom: 20px; 
          }
          .side-logo { 
            width: 60px; 
            height: 60px; 
            object-fit: contain; 
            filter: drop-shadow(0 0 5px rgba(255,255,255,0.2));
          }
          
          .header { 
            text-align: center; 
            border-bottom: 1px solid rgba(212, 175, 55, 0.3); 
            padding-bottom: 20px; 
            margin-bottom: 20px; 
          }
          .title { 
            font-size: 32px; 
            color: #D4AF37 !important; 
            font-weight: bold; 
            letter-spacing: 5px; 
            text-transform: uppercase; 
          }
          .subtitle { 
            color: #8B0000 !important; 
            font-size: 13px; 
            margin-top: 5px; 
            font-style: italic; 
            font-weight: bold; 
          }
          .ticket-id { 
            font-size: 18px; 
            color: #ffffff !important; 
            font-weight: bold; 
            margin: 15px 0; 
            letter-spacing: 2px; 
            border: 2px dashed rgba(212, 175, 55, 0.5); 
            display: inline-block; 
            padding: 8px 16px; 
            background: rgba(212, 175, 55, 0.1); 
          }
          .status { 
            display: block; 
            margin-top: 8px; 
            color: #4ade80 !important; 
            font-weight: bold; 
            font-size: 11px; 
            letter-spacing: 1px;
          }
          .qr { 
            text-align: center; 
            margin: 25px 0; 
          }
          .qr .qr-bg {
            background: white;
            padding: 12px;
            display: inline-block;
            border-radius: 8px;
          }
          .qr img { 
            width: 180px; 
            height: 180px; 
            display: block;
          }
          .details { margin: 20px 0; }
          .detail-row { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid rgba(212, 175, 55, 0.1); 
            font-size: 14px; 
          }
          .detail-label { 
            color: rgba(212, 175, 55, 0.8) !important; 
            font-size: 11px; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            font-weight: bold; 
          }
          .detail-value { 
            color: #ffffff !important; 
            font-weight: 700; 
          }
          .events-list { margin: 20px 0; text-align: left; }
          .events-title { 
            font-weight: bold; 
            color: #8B0000 !important; 
            font-size: 12px; 
            text-transform: uppercase; 
            letter-spacing: 2px; 
            margin-bottom: 10px; 
            border-left: 3px solid #8B0000;
            padding-left: 8px;
          }
          .event-item { 
            padding: 10px 12px; 
            margin-bottom: 6px; 
            font-size: 14px; 
            background: rgba(255, 255, 255, 0.05); 
            border-radius: 6px; 
          }
          .total { 
            text-align: right; 
            font-size: 22px; 
            color: #D4AF37 !important; 
            font-weight: bold; 
            margin-top: 15px; 
            border-top: 2px solid #8B0000; 
            padding-top: 10px; 
          }
          .footer { 
            text-align: center; 
            margin-top: 25px; 
            padding-top: 20px; 
            border-top: 1px solid rgba(212, 175, 55, 0.2); 
            color: rgba(255,255,255,0.4) !important; 
            font-size: 11px; 
            font-style: italic; 
          }
          @media print { 
            @page { margin: 0; size: auto; }
            html, body { height: 100%; width: 100%; margin: 0; padding: 0; background: #0a0a0a !important; color-adjust: exact; -webkit-print-color-adjust: exact; }
            body { display: flex; justify-content: center; align-items: center; }
            .pass { margin: 0; box-shadow: none; border-color: #D4AF37 !important; background: #0a0a0a !important; }
            * { color-adjust: exact; -webkit-print-color-adjust: exact; }
          }
        </style>
      </head>
      <body>
        <div class="pass">
          <div class="logo-container">
            <img src="${logoL}" class="side-logo" alt="Logo L" />
            <img src="${logoR}" class="side-logo" alt="Logo R" />
          </div>
          <div class="header">
            <div class="title">MANTHAN</div>
            <div class="subtitle">2026 • Festival of Ancient Wisdom</div>
            <div class="ticket-id">${registration?.ticket_id}</div>
            <div class="status">VERIFIED • PAID ENTRY</div>
          </div>
          <div class="qr">
            <div class="qr-bg">
              <img src="${registration?.qr_code}" alt="Pass QR" />
            </div>
            <div style="color:rgba(212,175,55,0.7);font-size:10px;margin-top:10px;text-transform:uppercase;letter-spacing:2px;font-weight:bold;">Entry Pass ID</div>
          </div>
          <div class="details">
            <div class="detail-row"><span class="detail-label">Name</span><span class="detail-value">${registration?.name}</span></div>
            <div class="detail-row"><span class="detail-label">Email</span><span class="detail-value">${registration?.email}</span></div>
            <div class="detail-row"><span class="detail-label">Contact</span><span class="detail-value">${registration?.phone}</span></div>
            <div class="detail-row"><span class="detail-label">College</span><span class="detail-value">${registration?.college}</span></div>
          </div>
          <div class="events-list">
            <div class="events-title">Registered Events</div>
            ${events.map((e) => `
              <div class="event-item">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                  <div style="font-weight:bold; color:#ffffff;">${e.name}</div>
                  <div style="font-size:10px; color:rgba(212,175,55,0.7);">${e.event_date ? formatDate(e.event_date) : '24-25 Mar'}</div>
                </div>
                <div style="font-size:11px; color:rgba(255,255,255,0.5); margin-top:2px;">${e.venue || 'The Great Arena'}</div>
              </div>
            `).join('')}
          </div>
          <div class="total">Total: ${registration ? formatFee(registration.total_amount) : ''}</div>
          <div class="footer">
            <p>24th - 25th of March, 2026</p>
            <p style="margin-top:4px;">Official Entry Permission for Manthan 2026</p>
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

                        <div ref={passRef} className="parchment-body p-6 sm:p-10 shrink-0 relative">
                            {/* Pass Logos */}
                            <div className="flex justify-between items-start mb-6 -mt-2">
                                <Image src="/manthan_final_logo2.png" width={48} height={48} className="w-12 h-auto object-contain" alt="Logo L" />
                                <Image src="/bbbg-removebg-preview.png" width={48} height={48} className="w-12 h-auto object-contain" alt="Logo R" />
                            </div>

                            {/* Pass Header */}
                            <div className="text-center border-b border-manthan-maroon/10 pb-8 mb-8">
                                <h2 className="font-ancient text-4xl font-bold text-[#3d2b1f] tracking-[0.2em] uppercase">
                                    MANTHAN
                                </h2>
                                <p className="text-manthan-maroon text-[10px] mt-2 font-ancient uppercase tracking-[0.3em]">2026 • College Tech Fest</p>

                                <div className="mt-8 flex flex-col items-center">
                                    <div className="border border-dashed border-[#3d2b1f] px-6 py-3 relative">
                                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#f4e4bc] px-2 text-[8px] text-manthan-maroon font-bold font-ancient uppercase tracking-widest whitespace-nowrap">Pass ID</span>
                                        <span className="font-ancient text-[#3d2b1f] text-2xl font-bold tracking-widest">
                                            {registration.ticket_id}
                                        </span>
                                    </div>
                                    <span className="mt-4 px-4 py-1.5 bg-green-500/10 text-green-600 text-[10px] font-bold rounded-full font-ancient uppercase tracking-widest border border-green-500/20">
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
                                    <p className="text-[#5c4033]/60 font-ancient text-[10px] uppercase tracking-widest mt-4">Entry Pass QR Code</p>
                                </div>
                            )}

                            {/* Details */}
                            <div className="grid grid-cols-1 gap-2 mb-6 border-y border-manthan-maroon/10 py-6">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-manthan-maroon/40 text-[9px] font-bold uppercase tracking-widest font-ancient">Name</span>
                                    <span className="text-[#3d2b1f] font-bold font-ancient truncate max-w-[200px]">{registration.name}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-manthan-maroon/40 text-[9px] font-bold uppercase tracking-widest font-ancient">Email</span>
                                    <span className="text-[#3d2b1f] font-bold font-ancient truncate max-w-[200px]">{registration.email}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-manthan-maroon/40 text-[9px] font-bold uppercase tracking-widest font-ancient">Contact</span>
                                    <span className="text-[#3d2b1f] font-bold font-ancient truncate max-w-[200px]">{registration.phone}</span>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-manthan-maroon/40 text-[9px] font-bold uppercase tracking-widest font-ancient">College</span>
                                    <span className="text-[#3d2b1f] font-bold font-ancient truncate max-w-[200px]">{registration.college}</span>
                                </div>

                            </div>

                            {/* Registered Events */}
                            <div className="mb-6">
                                <h3 className="text-manthan-maroon/60 font-bold mb-3 text-[9px] uppercase tracking-[0.2em] font-ancient">Registered Events</h3>
                                <div className="grid grid-cols-1 gap-2">
                                    {events.map((event) => (
                                        <div
                                            key={event.id}
                                            className="p-3 rounded-xl bg-black/5 border-l-4 border-manthan-maroon transition-all"
                                        >
                                            <div className="flex justify-between items-center">
                                                <p className="text-[#3d2b1f] text-xs font-bold font-ancient">{event.name}</p>
                                                {event.event_date && (
                                                    <span className="text-[#5c4033]/60 text-[8px] flex items-center font-ancient uppercase tracking-wider">
                                                        {formatDate(event.event_date)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-4 mt-1">
                                                {event.venue && (
                                                    <span className="text-[#5c4033]/60 text-[8px] flex items-center font-ancient uppercase tracking-wider">
                                                        <MapPin size={8} className="mr-1" />
                                                        {event.venue}
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
                                    <span className="text-[#5c4033]/60 text-[10px] font-bold uppercase tracking-widest font-ancient">Total Amount</span>
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
                                            This passage is strictly for the participant named above. Please present this pass at the entrance for entry into the event.
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
