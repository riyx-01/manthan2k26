import { Event } from './types';

// Category styling maps
export const categoryColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
    technical: {
        bg: 'bg-manthan-maroon/5',
        text: 'text-manthan-maroon',
        border: 'border-manthan-maroon/20',
        badge: 'bg-manthan-maroon/10 text-manthan-maroon',
    },
    cultural: {
        bg: 'bg-manthan-maroon/5',
        text: 'text-manthan-maroon',
        border: 'border-manthan-maroon/20',
        badge: 'bg-manthan-maroon/10 text-manthan-maroon',
    },
    sports: {
        bg: 'bg-manthan-maroon/5',
        text: 'text-manthan-maroon',
        border: 'border-manthan-maroon/20',
        badge: 'bg-manthan-maroon/10 text-manthan-maroon',
    },
};

export const categoryIcons: Record<string, string> = {
    technical: '💻',
    cultural: '🎭',
    sports: '⚽',
};

export const sportsCommitteeStructure = {
    outdoor: ['Badminton', 'Box Cricket', 'Volleyball', 'Tug of war'],
    indoor: ['Chess', 'Carrom', 'Ludo', 'BGMI', 'Deadlift', 'Bench Press'],
} as const;

const sportsTrackByName: Record<string, 'indoor' | 'outdoor'> = {
    badminton: 'outdoor',
    'box cricket': 'outdoor',
    volleyball: 'outdoor',
    'tug of war': 'outdoor',
    'tug-of-war': 'outdoor',
    chess: 'indoor',
    carrom: 'indoor',
    ludo: 'indoor',
    bgmi: 'indoor',
    deadlift: 'indoor',
    'bench press': 'indoor',
    'bench-press': 'indoor',
    'e-sports': 'indoor',
    'e sports': 'indoor',
    esports: 'indoor',
};

export function getSportsTrackByName(eventName: string): 'indoor' | 'outdoor' | null {
    const normalized = eventName.trim().toLowerCase();
    return sportsTrackByName[normalized] || null;
}

// Format fee from paise to INR display
export function formatFee(paise: number): string {
    return `₹${(paise / 100).toLocaleString('en-IN')}`;
}

// Generate ticket ID
export function generateTicketId(category?: string): string {
    const prefix = 'MNT';
    const catCode = category ? category.substring(0, 4).toUpperCase() : 'GEN';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `${prefix}-${catCode}-${timestamp}${random}`;
}

// Sanitize string input
export function sanitizeInput(input: string): string {
    return input
        .trim()
        .replace(/[<>]/g, '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

// Format date
export function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

export function formatTime(dateStr: string): string {
    return new Date(dateStr).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    });
}

export function formatDateTime(dateStr: string): string {
    const time = formatTime(dateStr);
    const date = formatDate(dateStr);
    if (time === '09:00 am') {
        return `${date} (09:00 AM - 05:00 PM)`;
    }
    return `${date} at ${time}`;
}

// Calculate total fee server-side (this is the source of truth)
export function calculateTotalFee(events: Event[], selectedIds: string[]): number {
    return events
        .filter((e) => selectedIds.includes(e.id))
        .reduce((sum, e) => sum + e.fee, 0);
}

// Event schedule data
export const scheduleData = [
    {
        date: 'March 24, 2026 - Day 1',
        slots: [
            { time: '09:00 AM - 05:00 PM', event: 'Prompt2Website: The Vibe Coding Challenge', venue: 'Computer Lab 1', category: 'technical' },
            { time: '09:00 AM - 05:00 PM', event: 'TypeSprint: The Ultimate Typing Showdown', venue: 'Computer Lab 2', category: 'technical' },
            { time: '09:00 AM - 05:00 PM', event: 'QuizStorm: Battle of Brains', venue: 'Computer Lab 2', category: 'technical' },
            { time: '09:00 AM - 05:00 PM', event: 'CanvaCraft: The Poster Design Challenge', venue: 'Computer Lab 1', category: 'technical' },
            { time: '09:00 AM - 05:00 PM', event: 'Badminton', venue: 'Sports Court', category: 'sports' },
            { time: '09:00 AM - 05:00 PM', event: 'Box Cricket', venue: 'Cricket Ground', category: 'sports' },
            { time: '09:00 AM - 05:00 PM', event: 'Volleyball', venue: 'Volleyball Court', category: 'sports' },
            { time: '09:00 AM - 05:00 PM', event: 'Tug of war', venue: 'Main Ground', category: 'sports' },
            { time: '09:00 AM - 05:00 PM', event: 'Chess', venue: 'Indoor Hall', category: 'sports' },
            { time: '09:00 AM - 05:00 PM', event: 'Carrom', venue: 'Indoor Hall', category: 'sports' },
            { time: '09:00 AM - 05:00 PM', event: 'Ludo', venue: 'Indoor Hall', category: 'sports' },
            { time: '09:00 AM - 05:00 PM', event: 'BGMI', venue: 'E-Sports Arena', category: 'sports' },
            { time: '09:00 AM - 05:00 PM', event: 'Deadlift', venue: 'Fitness Arena', category: 'sports' },
            { time: '09:00 AM - 05:00 PM', event: 'Bench Press', venue: 'Fitness Arena', category: 'sports' },
        ],
    },
    {
        date: 'March 25, 2026 - Day 2',
        slots: [
            { time: '09:00 AM - 05:00 PM', event: 'NrityaVerse', venue: 'Main Stage', category: 'cultural' },
            { time: '09:00 AM - 05:00 PM', event: 'SurTarang', venue: 'Seminar Hall', category: 'cultural' },
            { time: '05:00 PM onwards', event: 'Closing Ceremony & Prize Distribution', venue: 'Main Stage', category: 'cultural' },
        ],
    },
];
