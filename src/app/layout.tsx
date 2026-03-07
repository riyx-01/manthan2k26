import type { Metadata } from 'next';
import './globals.css';
import ClientLayout from '@/components/ClientLayout';
import ScrollFilters from '@/components/ScrollFilters';

export const metadata: Metadata = {
    title: 'Manthan 2026 | Tech Fest',
    description:
        'Manthan 2026 - The ultimate college tech fest at Bharati Vidyapeeth Belapur, featuring technical, cultural, and sports events. Register now!',
    keywords: ['manthan', 'tech fest', 'college fest', 'hackathon', 'cultural fest', 'BVIMIT', 'Belapur', 'Navi Mumbai'],
    icons: {
        icon: '/manthan_final_logo.png',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className="min-h-screen text-gray-200 antialiased overflow-x-hidden">
                <ScrollFilters />
                <ClientLayout>
                    {children}
                </ClientLayout>
            </body>
        </html>
    );
}
