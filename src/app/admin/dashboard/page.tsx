'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Registration, Event, ManualCashEntry } from '@/lib/types';
import { formatFee } from '@/lib/constants';
import LoadingSpinner from '@/components/LoadingSpinner';
import {
    LogOut, Search, Users, IndianRupee, CheckCircle,
    Clock, RefreshCw, UserCheck, AlertCircle, ChevronDown, Download
} from 'lucide-react';

interface Stats {
    totalRegistrations: number;
    totalRevenue: number;
    checkedIn: number;
    pendingPayments: number;
}

type AdminTab = 'registrations' | 'pending' | 'cash';

interface CashDraft {
    cash_amount: number;
    cash_receipt_number: string;
    cash_notes: string;
}

interface ManualCashForm {
    payer_name: string;
    payer_phone: string;
    payer_email: string;
    amount: string;
    receipt_number: string;
    notes: string;
}

export default function AdminDashboard() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<Stats | null>(null);
    const [events, setEvents] = useState<Partial<Event>[]>([]);
    const [registrations, setRegistrations] = useState<Registration[]>([]);
    const [total, setTotal] = useState(0);

    // Filters
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [eventFilter, setEventFilter] = useState('all');
    const [dateFilter, setDateFilter] = useState('');
    const [page, setPage] = useState(1);

    // Check-in state
    const [checkingIn, setCheckingIn] = useState<string | null>(null);
    const [expandedRow, setExpandedRow] = useState<string | null>(null);

    // Tabs
    const [activeTab, setActiveTab] = useState<AdminTab>('registrations');

    // Pending payments state
    const [pendingRows, setPendingRows] = useState<Registration[]>([]);
    const [pendingSearch, setPendingSearch] = useState('');
    const [pendingLoading, setPendingLoading] = useState(false);
    const [savingCashId, setSavingCashId] = useState<string | null>(null);
    const [cashDrafts, setCashDrafts] = useState<Record<string, CashDraft>>({});

    // Cash payments state
    const [cashRows, setCashRows] = useState<Registration[]>([]);
    const [cashSearch, setCashSearch] = useState('');
    const [cashLoading, setCashLoading] = useState(false);
    const [manualEntries, setManualEntries] = useState<ManualCashEntry[]>([]);
    const [manualLoading, setManualLoading] = useState(false);
    const [savingManual, setSavingManual] = useState(false);
    const [manualForm, setManualForm] = useState<ManualCashForm>({
        payer_name: '',
        payer_phone: '',
        payer_email: '',
        amount: '',
        receipt_number: '',
        notes: '',
    });

    const getToken = () => localStorage.getItem('admin_token');

    const fetchStats = useCallback(async () => {
        const token = getToken();
        if (!token) { router.push('/admin'); return; }

        try {
            const res = await fetch('/api/admin/stats', {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) { router.push('/admin'); return; }
            const data = await res.json();
            setStats(data.stats);
            setEvents(data.events);
        } catch {
            console.error('Failed to fetch stats');
        }
    }, [router]);

    const fetchRegistrations = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        try {
            const params = new URLSearchParams({ page: page.toString(), limit: '50' });
            if (statusFilter !== 'all') params.set('status', statusFilter);
            if (eventFilter !== 'all') params.set('event_id', eventFilter);
            if (search) params.set('search', search);
            if (dateFilter) params.set('date', dateFilter);

            const res = await fetch(`/api/admin/registrations?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.status === 401) { router.push('/admin'); return; }
            const data = await res.json();
            setRegistrations(data.registrations || []);
            setTotal(data.total || 0);
        } catch {
            console.error('Failed to fetch registrations');
        }
    }, [search, statusFilter, eventFilter, dateFilter, page, router]);

    const fetchPendingRows = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        setPendingLoading(true);
        try {
            const params = new URLSearchParams({ scope: 'pending' });
            if (pendingSearch.trim()) {
                params.set('search', pendingSearch.trim());
            }

            const res = await fetch(`/api/admin/cash-payment?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) {
                router.push('/admin');
                return;
            }

            const data = await res.json();
            const rows: Registration[] = data.registrations || [];
            setPendingRows(rows);

            const nextDrafts: Record<string, CashDraft> = {};
            rows.forEach((row) => {
                nextDrafts[row.id] = {
                    cash_amount: Math.round((row.cash_amount ?? row.total_amount) / 100),
                    cash_receipt_number: row.cash_receipt_number ?? '',
                    cash_notes: row.cash_notes ?? '',
                };
            });
            setCashDrafts(nextDrafts);
        } catch {
            console.error('Failed to fetch pending rows');
        } finally {
            setPendingLoading(false);
        }
    }, [pendingSearch, router]);

    const fetchCashRows = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        setCashLoading(true);
        try {
            const params = new URLSearchParams({ scope: 'cash' });
            if (cashSearch.trim()) {
                params.set('search', cashSearch.trim());
            }

            const res = await fetch(`/api/admin/cash-payment?${params}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) {
                router.push('/admin');
                return;
            }

            const data = await res.json();
            setCashRows(data.registrations || []);
        } catch {
            console.error('Failed to fetch cash rows');
        } finally {
            setCashLoading(false);
        }
    }, [cashSearch, router]);

    const fetchManualEntries = useCallback(async () => {
        const token = getToken();
        if (!token) return;

        setManualLoading(true);
        try {
            const res = await fetch('/api/admin/cash-payment/manual', {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (res.status === 401) {
                router.push('/admin');
                return;
            }

            const data = await res.json();
            setManualEntries(data.entries || []);
        } catch {
            console.error('Failed to fetch manual entries');
        } finally {
            setManualLoading(false);
        }
    }, [router]);

    useEffect(() => {
        const token = getToken();
        if (!token) { router.push('/admin'); return; }

        Promise.all([fetchStats(), fetchRegistrations()]).finally(() => setLoading(false));
    }, [fetchStats, fetchRegistrations, router]);

    useEffect(() => {
        fetchRegistrations();
    }, [fetchRegistrations]);

    useEffect(() => {
        if (activeTab === 'pending') {
            fetchPendingRows();
        }
        if (activeTab === 'cash') {
            Promise.all([fetchCashRows(), fetchManualEntries()]);
        }
    }, [activeTab, fetchPendingRows, fetchCashRows, fetchManualEntries]);

    // Auto-refresh every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStats();
            if (activeTab === 'registrations') {
                fetchRegistrations();
            }
            if (activeTab === 'pending') {
                fetchPendingRows();
            }
            if (activeTab === 'cash') {
                fetchCashRows();
                fetchManualEntries();
            }
        }, 30000);
        return () => clearInterval(interval);
    }, [fetchStats, fetchRegistrations, fetchPendingRows, fetchCashRows, fetchManualEntries, activeTab]);

    const handleCheckIn = async (regId: string) => {
        const token = getToken();
        if (!token) return;

        setCheckingIn(regId);
        try {
            const res = await fetch(`/api/admin/check-in/${regId}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();

            if (!res.ok) {
                alert(data.error || 'Check-in failed');
                return;
            }

            // Update local state
            setRegistrations((prev) =>
                prev.map((r) =>
                    r.id === regId
                        ? { ...r, checked_in: true, checked_in_at: new Date().toISOString() }
                        : r
                )
            );
            fetchStats();
        } catch {
            alert('Check-in failed. Please try again.');
        } finally {
            setCheckingIn(null);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_user');
        router.push('/admin');
    };

    const handleRefresh = () => {
        fetchStats();
        if (activeTab === 'registrations') {
            fetchRegistrations();
        }
        if (activeTab === 'pending') {
            fetchPendingRows();
        }
        if (activeTab === 'cash') {
            fetchCashRows();
            fetchManualEntries();
        }
    };

    const updateCashDraft = (id: string, key: keyof CashDraft, value: string | number) => {
        setCashDrafts((prev) => {
            const current = prev[id] || {
                cash_amount: 0,
                cash_receipt_number: '',
                cash_notes: '',
            };
            return {
                ...prev,
                [id]: {
                    ...current,
                    [key]: value,
                },
            };
        });
    };

    const handleSaveCash = async (registrationId: string) => {
        const token = getToken();
        if (!token) return;

        const draft = cashDrafts[registrationId];
        if (!draft || !Number.isFinite(draft.cash_amount) || draft.cash_amount <= 0) {
            alert('Enter a valid cash amount.');
            return;
        }

        setSavingCashId(registrationId);
        try {
            const res = await fetch('/api/admin/cash-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    registration_id: registrationId,
                    cash_amount: Math.round(draft.cash_amount * 100),
                    cash_receipt_number: draft.cash_receipt_number || null,
                    cash_notes: draft.cash_notes || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Failed to save cash payment');
                return;
            }

            await Promise.all([fetchStats(), fetchRegistrations(), fetchPendingRows()]);
        } catch {
            alert('Failed to save cash payment');
        } finally {
            setSavingCashId(null);
        }
    };

    const handleManualFormChange = (key: keyof ManualCashForm, value: string) => {
        setManualForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleAddManualEntry = async () => {
        const token = getToken();
        if (!token) return;

        const amount = Number(manualForm.amount);
        if (!manualForm.payer_name.trim()) {
            alert('Payer name is required.');
            return;
        }
        if (!Number.isFinite(amount) || amount <= 0) {
            alert('Amount must be a valid positive number.');
            return;
        }

        setSavingManual(true);
        try {
            const res = await fetch('/api/admin/cash-payment/manual', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    payer_name: manualForm.payer_name,
                    payer_phone: manualForm.payer_phone || null,
                    payer_email: manualForm.payer_email || null,
                    amount: Math.round(amount * 100),
                    receipt_number: manualForm.receipt_number || null,
                    notes: manualForm.notes || null,
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                alert(data.error || 'Failed to add manual entry');
                return;
            }

            setManualForm({
                payer_name: '',
                payer_phone: '',
                payer_email: '',
                amount: '',
                receipt_number: '',
                notes: '',
            });

            await Promise.all([fetchStats(), fetchManualEntries()]);
        } catch {
            alert('Failed to add manual entry');
        } finally {
            setSavingManual(false);
        }
    };

    const getEventName = (eventId: string) => {
        return events.find((e) => e.id === eventId)?.name || eventId;
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-manthan-black">
                <LoadingSpinner size="lg" />
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-manthan-black">
            {/* Top Bar */}
            <header className="sticky top-0 z-50 bg-manthan-black/90 backdrop-blur-md border-b border-manthan-gold/20 px-4 py-3">
                <div className="max-w-[1600px] mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <h1 className="font-heading text-xl font-bold text-gold-gradient">MANTHAN</h1>
                        <span className="text-xs text-manthan-gold/50 border border-manthan-gold/20 px-2 py-0.5 rounded">
                            Admin Dashboard
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleRefresh}
                            className="p-2 text-gray-400 hover:text-manthan-gold transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={18} />
                        </button>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400 hover:text-manthan-crimson transition-colors"
                        >
                            <LogOut size={16} />
                            Logout
                        </button>
                    </div>
                </div>
            </header>

            <div className="max-w-[1600px] mx-auto px-4 py-6">
                {/* Stats Cards */}
                {stats && (
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                                    <Users size={20} className="text-blue-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-100">{stats.totalRegistrations}</p>
                                    <p className="text-xs text-gray-500">Total Registrations</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                                    <IndianRupee size={20} className="text-green-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-100">{formatFee(stats.totalRevenue)}</p>
                                    <p className="text-xs text-gray-500">Total Revenue</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-manthan-gold/10 flex items-center justify-center">
                                    <CheckCircle size={20} className="text-manthan-gold" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-100">{stats.checkedIn}</p>
                                    <p className="text-xs text-gray-500">Checked In</p>
                                </div>
                            </div>
                        </div>
                        <div className="glass-card p-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                                    <Clock size={20} className="text-yellow-400" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-gray-100">{stats.pendingPayments}</p>
                                    <p className="text-xs text-gray-500">Pending Payments</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="glass-card p-2 mb-6 inline-flex gap-2">
                    <button
                        onClick={() => setActiveTab('registrations')}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'registrations'
                            ? 'bg-manthan-gold/20 text-manthan-gold border border-manthan-gold/30'
                            : 'text-gray-400 hover:text-manthan-gold'
                            }`}
                    >
                        Registrations
                    </button>
                    <button
                        onClick={() => setActiveTab('pending')}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'pending'
                            ? 'bg-manthan-gold/20 text-manthan-gold border border-manthan-gold/30'
                            : 'text-gray-400 hover:text-manthan-gold'
                            }`}
                    >
                        Pending Payments
                    </button>
                    <button
                        onClick={() => setActiveTab('cash')}
                        className={`px-4 py-2 rounded-lg text-sm transition-colors ${activeTab === 'cash'
                            ? 'bg-manthan-gold/20 text-manthan-gold border border-manthan-gold/30'
                            : 'text-gray-400 hover:text-manthan-gold'
                            }`}
                    >
                        Cash Payments
                    </button>
                </div>

                {activeTab === 'registrations' && (
                    <>
                        {/* Filters */}
                        <div className="glass-card p-4 mb-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-[200px] relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={search}
                                        onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                        placeholder="Search by ticket ID, name, email, phone..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-sm focus:border-manthan-gold/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                                    className="px-4 py-2.5 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-sm focus:outline-none"
                                >
                                    <option value="all">All Status</option>
                                    <option value="PAID">Paid</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                                <select
                                    value={eventFilter}
                                    onChange={(e) => { setEventFilter(e.target.value); setPage(1); }}
                                    className="px-4 py-2.5 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-sm focus:outline-none"
                                >
                                    <option value="all">All Events</option>
                                    {events.map((e) => (
                                        <option key={e.id} value={e.id}>{e.name}</option>
                                    ))}
                                </select>
                                <input
                                    type="date"
                                    value={dateFilter}
                                    onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                                    className="px-4 py-2.5 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-sm focus:outline-none"
                                />
                                {(search || statusFilter !== 'all' || eventFilter !== 'all' || dateFilter) && (
                                    <button
                                        onClick={() => { setSearch(''); setStatusFilter('all'); setEventFilter('all'); setDateFilter(''); setPage(1); }}
                                        className="px-4 py-2.5 text-sm text-manthan-crimson hover:underline"
                                    >
                                        Clear Filters
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Results count + Export */}
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-gray-500 text-sm">
                                Showing {registrations.length} of {total} registrations
                            </p>
                            <button
                                onClick={async () => {
                                    const token = getToken();
                                    if (!token) return;
                                    try {
                                        const res = await fetch('/api/admin/export', {
                                            headers: { Authorization: `Bearer ${token}` },
                                        });
                                        if (!res.ok) {
                                            alert('Export failed');
                                            return;
                                        }
                                        const blob = await res.blob();
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `manthan_registrations_${new Date().toISOString().slice(0, 10)}.csv`;
                                        a.click();
                                        URL.revokeObjectURL(url);
                                    } catch {
                                        alert('Export failed. Please try again.');
                                    }
                                }}
                                className="flex items-center gap-2 px-4 py-2 text-sm bg-manthan-gold/10 text-manthan-gold rounded-lg hover:bg-manthan-gold/20 transition-colors border border-manthan-gold/20"
                            >
                                <Download size={16} />
                                Export CSV
                            </button>
                        </div>

                        {/* Registrations Table */}
                        <div className="glass-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-manthan-gold/10 text-left">
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Ticket ID</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Name</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs hidden md:table-cell">Email</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs hidden lg:table-cell">Phone</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Amount</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Status</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Check-in</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {registrations.map((reg) => (
                                            <>
                                                <tr
                                                    key={reg.id}
                                                    className="border-b border-manthan-gold/5 hover:bg-manthan-gold/5 transition-colors"
                                                >
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-manthan-gold text-xs">{reg.ticket_id}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-200">{reg.name}</td>
                                                    <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{reg.email}</td>
                                                    <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{reg.phone}</td>
                                                    <td className="px-4 py-3 text-gray-200 font-medium">{formatFee(reg.total_amount)}</td>
                                                    <td className="px-4 py-3">
                                                        <span
                                                            className={`px-2 py-1 rounded-full text-xs font-medium ${reg.payment_status === 'PAID'
                                                                ? 'bg-green-500/20 text-green-400'
                                                                : reg.payment_status === 'PENDING'
                                                                    ? 'bg-yellow-500/20 text-yellow-400'
                                                                    : 'bg-red-500/20 text-red-400'
                                                                }`}
                                                        >
                                                            {reg.payment_status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {reg.payment_status === 'PAID' ? (
                                                            reg.checked_in ? (
                                                                <span className="flex items-center gap-1 text-green-400 text-xs">
                                                                    <UserCheck size={14} />
                                                                    Done
                                                                </span>
                                                            ) : (
                                                                <button
                                                                    onClick={() => handleCheckIn(reg.id)}
                                                                    disabled={checkingIn === reg.id}
                                                                    className="px-3 py-1.5 bg-manthan-gold/10 text-manthan-gold text-xs rounded-lg hover:bg-manthan-gold/20 transition-colors disabled:opacity-50 flex items-center gap-1"
                                                                >
                                                                    {checkingIn === reg.id ? (
                                                                        <LoadingSpinner size="sm" />
                                                                    ) : (
                                                                        <>
                                                                            <UserCheck size={12} />
                                                                            Check In
                                                                        </>
                                                                    )}
                                                                </button>
                                                            )
                                                        ) : (
                                                            <span className="text-gray-600 text-xs">—</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => setExpandedRow(expandedRow === reg.id ? null : reg.id)}
                                                            className="p-1.5 text-gray-500 hover:text-manthan-gold transition-colors"
                                                        >
                                                            <ChevronDown
                                                                size={16}
                                                                className={`transition-transform ${expandedRow === reg.id ? 'rotate-180' : ''}`}
                                                            />
                                                        </button>
                                                    </td>
                                                </tr>
                                                {expandedRow === reg.id && (
                                                    <tr key={`${reg.id}-details`} className="bg-manthan-dark/30">
                                                        <td colSpan={8} className="px-4 py-4">
                                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                                                                <div>
                                                                    <p className="text-gray-500 mb-1">College</p>
                                                                    <p className="text-gray-300">{reg.college}</p>
                                                                    <p className="text-gray-500 mt-2 mb-1">Year / Dept</p>
                                                                    <p className="text-gray-300">{reg.year} - {reg.department}</p>
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500 mb-1">Events</p>
                                                                    <div className="space-y-1">
                                                                        {reg.event_ids.map((eid) => (
                                                                            <span
                                                                                key={eid}
                                                                                className="inline-block px-2 py-0.5 bg-manthan-gold/10 text-manthan-gold rounded mr-1 mb-1"
                                                                            >
                                                                                {getEventName(eid)}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                    {reg.team_registrations?.length > 0 && (
                                                                        <div className="mt-3">
                                                                            <p className="text-gray-500 mb-1">Team Details</p>
                                                                            <div className="space-y-1.5">
                                                                                {reg.team_registrations.map((team) => (
                                                                                    <p key={team.event_id} className="text-gray-300">
                                                                                        {getEventName(team.event_id)}: {team.team_size} members
                                                                                        {team.team_name ? ` (${team.team_name})` : ''}
                                                                                    </p>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className="text-gray-500 mb-1">Payment Details</p>
                                                                    <p className="text-gray-300">Order: {reg.razorpay_order_id || '—'}</p>
                                                                    <p className="text-gray-300">Payment: {reg.razorpay_payment_id || '—'}</p>
                                                                    <p className="text-gray-500 mt-2 mb-1">Registered At</p>
                                                                    <p className="text-gray-300">{new Date(reg.created_at).toLocaleString('en-IN')}</p>
                                                                    {reg.checked_in_at && (
                                                                        <>
                                                                            <p className="text-gray-500 mt-2 mb-1">Checked In At</p>
                                                                            <p className="text-green-400">{new Date(reg.checked_in_at).toLocaleString('en-IN')}</p>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {registrations.length === 0 && (
                                <div className="py-16 text-center">
                                    <AlertCircle size={32} className="mx-auto text-gray-600 mb-3" />
                                    <p className="text-gray-500">No registrations found matching your filters.</p>
                                </div>
                            )}

                            {/* Pagination */}
                            {total > 50 && (
                                <div className="flex items-center justify-between px-4 py-3 border-t border-manthan-gold/10">
                                    <button
                                        onClick={() => setPage(Math.max(1, page - 1))}
                                        disabled={page === 1}
                                        className="px-4 py-2 text-sm text-manthan-gold disabled:text-gray-600 hover:bg-manthan-gold/10 rounded transition-colors"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-gray-500 text-sm">Page {page} of {Math.ceil(total / 50)}</span>
                                    <button
                                        onClick={() => setPage(page + 1)}
                                        disabled={page * 50 >= total}
                                        className="px-4 py-2 text-sm text-manthan-gold disabled:text-gray-600 hover:bg-manthan-gold/10 rounded transition-colors"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'pending' && (
                    <>
                        {/* Search */}
                        <div className="glass-card p-4 mb-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-[240px] relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={pendingSearch}
                                        onChange={(e) => setPendingSearch(e.target.value)}
                                        placeholder="Search by ticket ID, name, email, phone..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-sm focus:border-manthan-gold/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={fetchPendingRows}
                                    className="px-4 py-2.5 text-sm bg-manthan-gold/10 text-manthan-gold rounded-lg hover:bg-manthan-gold/20 transition-colors"
                                >
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Pending registrations table */}
                        <div className="glass-card overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[980px]">
                                    <thead>
                                        <tr className="border-b border-manthan-gold/10 text-left">
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Ticket ID</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Name</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Phone</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Status</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Cash Amount (₹)</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Receipt #</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Notes</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingRows.map((row) => {
                                            const draft = cashDrafts[row.id] || {
                                                cash_amount: Math.round((row.cash_amount ?? row.total_amount) / 100),
                                                cash_receipt_number: row.cash_receipt_number ?? '',
                                                cash_notes: row.cash_notes ?? '',
                                            };
                                            return (
                                                <tr key={row.id} className="border-b border-manthan-gold/5 hover:bg-manthan-gold/5 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <span className="font-mono text-manthan-gold text-xs">{row.ticket_id}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-gray-200">{row.name}</td>
                                                    <td className="px-4 py-3 text-gray-400">{row.phone}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400">
                                                            PENDING
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="number"
                                                            min={1}
                                                            value={draft.cash_amount}
                                                            onChange={(e) => updateCashDraft(row.id, 'cash_amount', Number(e.target.value))}
                                                            className="w-28 px-3 py-2 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-xs focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={draft.cash_receipt_number}
                                                            onChange={(e) => updateCashDraft(row.id, 'cash_receipt_number', e.target.value)}
                                                            className="w-36 px-3 py-2 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-xs focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={draft.cash_notes}
                                                            onChange={(e) => updateCashDraft(row.id, 'cash_notes', e.target.value)}
                                                            className="w-48 px-3 py-2 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-xs focus:outline-none"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <button
                                                            onClick={() => handleSaveCash(row.id)}
                                                            disabled={savingCashId === row.id}
                                                            className="px-3 py-2 bg-manthan-gold/10 text-manthan-gold text-xs rounded-lg hover:bg-manthan-gold/20 transition-colors disabled:opacity-50"
                                                        >
                                                            {savingCashId === row.id ? 'Saving...' : 'Save'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {!pendingLoading && pendingRows.length === 0 && (
                                <div className="py-16 text-center">
                                    <AlertCircle size={32} className="mx-auto text-gray-600 mb-3" />
                                    <p className="text-gray-500">No pending payments found.</p>
                                </div>
                            )}

                            {pendingLoading && (
                                <div className="py-16 text-center">
                                    <LoadingSpinner />
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'cash' && (
                    <>
                        {/* Add Manual Cash Entry */}
                        <div className="glass-card p-4 mb-6">
                            <h3 className="text-sm font-semibold text-manthan-gold mb-4">Add Manual Cash Entry</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                <input
                                    type="text"
                                    value={manualForm.payer_name}
                                    onChange={(e) => handleManualFormChange('payer_name', e.target.value)}
                                    placeholder="Payer Name *"
                                    className="px-4 py-2.5 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-sm focus:outline-none"
                                />
                                <input
                                    type="text"
                                    value={manualForm.payer_phone}
                                    onChange={(e) => handleManualFormChange('payer_phone', e.target.value)}
                                    placeholder="Phone"
                                    className="px-4 py-2.5 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-sm focus:outline-none"
                                />
                                <input
                                    type="email"
                                    value={manualForm.payer_email}
                                    onChange={(e) => handleManualFormChange('payer_email', e.target.value)}
                                    placeholder="Email"
                                    className="px-4 py-2.5 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-sm focus:outline-none"
                                />
                                <input
                                    type="number"
                                    min={1}
                                    value={manualForm.amount}
                                    onChange={(e) => handleManualFormChange('amount', e.target.value)}
                                    placeholder="Amount (₹) *"
                                    className="px-4 py-2.5 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-sm focus:outline-none"
                                />
                                <input
                                    type="text"
                                    value={manualForm.receipt_number}
                                    onChange={(e) => handleManualFormChange('receipt_number', e.target.value)}
                                    placeholder="Receipt Number"
                                    className="px-4 py-2.5 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-sm focus:outline-none"
                                />
                                <input
                                    type="text"
                                    value={manualForm.notes}
                                    onChange={(e) => handleManualFormChange('notes', e.target.value)}
                                    placeholder="Notes"
                                    className="px-4 py-2.5 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-sm focus:outline-none"
                                />
                            </div>
                            <div className="mt-4">
                                <button
                                    onClick={handleAddManualEntry}
                                    disabled={savingManual}
                                    className="px-4 py-2.5 text-sm bg-manthan-gold/10 text-manthan-gold rounded-lg hover:bg-manthan-gold/20 transition-colors disabled:opacity-50"
                                >
                                    {savingManual ? 'Adding...' : 'Add Manual Entry'}
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="glass-card p-4 mb-6">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex-1 min-w-[240px] relative">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                    <input
                                        type="text"
                                        value={cashSearch}
                                        onChange={(e) => setCashSearch(e.target.value)}
                                        placeholder="Search by ticket ID, name, email, phone..."
                                        className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-manthan-black/50 border border-manthan-gold/20 text-gray-200 text-sm focus:border-manthan-gold/50 focus:outline-none transition-colors"
                                    />
                                </div>
                                <button
                                    onClick={fetchCashRows}
                                    className="px-4 py-2.5 text-sm bg-manthan-gold/10 text-manthan-gold rounded-lg hover:bg-manthan-gold/20 transition-colors"
                                >
                                    Search
                                </button>
                            </div>
                        </div>

                        {/* Cash paid registrations table */}
                        <div className="glass-card overflow-hidden mb-6">
                            <div className="px-4 py-3 border-b border-manthan-gold/10">
                                <h3 className="text-sm font-semibold text-manthan-gold">Cash Paid Registrations</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[780px]">
                                    <thead>
                                        <tr className="border-b border-manthan-gold/10 text-left">
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Ticket ID</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Name</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Phone</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Amount (₹)</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Receipt #</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Received By</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cashRows.map((row) => (
                                            <tr key={row.id} className="border-b border-manthan-gold/5 hover:bg-manthan-gold/5 transition-colors">
                                                <td className="px-4 py-3">
                                                    <span className="font-mono text-manthan-gold text-xs">{row.ticket_id}</span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-200">{row.name}</td>
                                                <td className="px-4 py-3 text-gray-400">{row.phone}</td>
                                                <td className="px-4 py-3 text-gray-200">{formatFee(row.cash_amount ?? row.total_amount)}</td>
                                                <td className="px-4 py-3 text-gray-300">{row.cash_receipt_number || '—'}</td>
                                                <td className="px-4 py-3 text-gray-300">{row.cash_received_by || '—'}</td>
                                                <td className="px-4 py-3 text-gray-400">{row.cash_received_at ? new Date(row.cash_received_at).toLocaleString('en-IN') : '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {!cashLoading && cashRows.length === 0 && (
                                <div className="py-16 text-center">
                                    <AlertCircle size={32} className="mx-auto text-gray-600 mb-3" />
                                    <p className="text-gray-500">No cash payments recorded yet.</p>
                                </div>
                            )}

                            {cashLoading && (
                                <div className="py-16 text-center">
                                    <LoadingSpinner />
                                </div>
                            )}
                        </div>

                        {/* Manual Cash Entries */}
                        <div className="glass-card overflow-hidden mb-6">
                            <div className="px-4 py-3 border-b border-manthan-gold/10">
                                <h3 className="text-sm font-semibold text-manthan-gold">Manual Cash Entries</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm min-w-[860px]">
                                    <thead>
                                        <tr className="border-b border-manthan-gold/10 text-left">
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Payer</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Phone</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Email</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Amount</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Receipt #</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Collected By</th>
                                            <th className="px-4 py-3 text-manthan-gold/70 font-medium text-xs">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {manualEntries.map((entry) => (
                                            <tr key={entry.id} className="border-b border-manthan-gold/5 hover:bg-manthan-gold/5 transition-colors">
                                                <td className="px-4 py-3 text-gray-200">{entry.payer_name}</td>
                                                <td className="px-4 py-3 text-gray-400">{entry.payer_phone || '—'}</td>
                                                <td className="px-4 py-3 text-gray-400">{entry.payer_email || '—'}</td>
                                                <td className="px-4 py-3 text-gray-200">{formatFee(entry.amount)}</td>
                                                <td className="px-4 py-3 text-gray-300">{entry.receipt_number || '—'}</td>
                                                <td className="px-4 py-3 text-gray-300">{entry.collected_by || '—'}</td>
                                                <td className="px-4 py-3 text-gray-400">{new Date(entry.collected_at).toLocaleString('en-IN')}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {!manualLoading && manualEntries.length === 0 && (
                                <div className="py-12 text-center">
                                    <p className="text-gray-500">No manual cash entries yet.</p>
                                </div>
                            )}

                            {manualLoading && (
                                <div className="py-12 text-center">
                                    <LoadingSpinner />
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </main>
    );
}
