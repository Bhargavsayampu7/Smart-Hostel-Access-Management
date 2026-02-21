import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { adminAPI, requestAPI } from '../services/api';

// ─── helpers ────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

function fmtTime(iso) {
    if (!iso) return '--:--';
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getRiskMeta(score) {
    if (score == null) return { label: 'N/A', color: '#636E72', barColor: '', filledBars: 0 };
    if (score >= 65) return { label: 'High Risk', color: '#EF5350', barColor: 'bg-[#EF5350]', filledBars: 3 };
    if (score >= 35) return { label: 'Watch', color: '#FF9800', barColor: 'bg-[#FF9800]', filledBars: 2 };
    return { label: 'Safe', color: '#4CAF50', barColor: 'bg-[#4CAF50]', filledBars: 1 };
}

// ML Risk bar widget
function RiskBar({ score, flag }) {
    const { label, color, barColor, filledBars } = getRiskMeta(score);
    return (
        <div className="flex flex-col gap-1.5 w-full max-w-[140px]">
            <div className="flex items-center justify-between text-[10px] uppercase font-bold" style={{ color }}>
                <span>{label}</span>
                <span>{score != null ? `${Math.round(score)}%` : '--'}</span>
            </div>
            <div className="flex gap-1 w-full">
                {[0, 1, 2].map((i) => (
                    <div
                        key={i}
                        className={`h-[6px] flex-1 rounded-sm ${i < filledBars ? barColor : 'bg-[#E0E6E6]'}`}
                    />
                ))}
            </div>
            {flag && <span className="text-[10px] text-[#636E72] truncate">{flag}</span>}
        </div>
    );
}

// Sidebar NavLink
function SideNavLink({ icon, label, active, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`group flex w-full items-center gap-3 rounded px-3 py-2 text-sm font-medium transition-colors ${active
                ? 'text-[#4CAF50] bg-[#4CAF50]/5 border border-[#4CAF50]/20'
                : 'text-[#636E72] hover:bg-[#F7F9F9] hover:text-[#2D3436]'
                }`}
        >
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
        </button>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const ITEMS_PER_PAGE = 5;

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [stats, setStats] = useState(null);
    const [queue, setQueue] = useState([]);
    const [students, setStudents] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [activeNav, setActiveNav] = useState('dashboard');
    const [gateLogs, setGateLogs] = useState([]);
    const [logsLoading, setLogsLoading] = useState(false);
    const [violationsList, setViolationsList] = useState([]);
    const [violsLoading, setViolsLoading] = useState(false);

    const switchTab = (tab) => {
        setActiveNav(tab);
        if (tab === 'logs') {
            setLogsLoading(true);
            adminAPI.getGateLogs().then(d => setGateLogs(d.gateLogs || [])).catch(() => { }).finally(() => setLogsLoading(false));
        }
        if (tab === 'violations') {
            setViolsLoading(true);
            adminAPI.getViolationsList().then(d => setViolationsList(d.violations || [])).catch(() => { }).finally(() => setViolsLoading(false));
        }
    };

    const fetchData = async () => {
        try {
            const [statsData, queueData, studentsData, analyticsData] = await Promise.all([
                adminAPI.getOverview(),
                adminAPI.getQueue(),
                adminAPI.getStudents(),
                adminAPI.getAnalytics(),
            ]);
            setStats(statsData);
            setQueue(queueData.requests || []);
            setStudents(studentsData.students || []);
            setAnalytics(analyticsData);
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Poll every 10s so stat cards (Late Returns, Pending, etc.) update automatically
        const pollId = setInterval(fetchData, 10000);
        return () => clearInterval(pollId);
    }, []);

    const handleApproval = async (id, approved) => {
        try {
            await requestAPI.adminApprove(id, approved);
            fetchData();
        } catch (err) { alert(err.message); }
    };

    const handleApproveAllLowRisk = async () => {
        const lowRisk = queue.filter((r) => (r.mlRiskScore ?? 0) < 35);
        for (const r of lowRisk) {
            try { await requestAPI.adminApprove(r._id, true); } catch { }
        }
        fetchData();
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    // Derived
    const filtered = queue.filter((r) => {
        const q = search.toLowerCase();
        return !q
            || r.studentName?.toLowerCase().includes(q)
            || r.studentId?.toLowerCase().includes(q);
    });
    const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
    const highRiskCount = queue.filter((r) => (r.mlRiskScore ?? 0) >= 65).length;
    const emergencyCount = queue.filter((r) => r.type === 'emergency').length;
    const lateCount = stats?.lateReturns ?? 0;

    // Violation trend bars (mock from analytic data or placeholder)
    const trendHeights = analytics?.violationTrend?.slice(-6).map((v) => v.count) ?? [20, 40, 30, 60, 25, 45];
    const trendMax = Math.max(...trendHeights, 1);

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>

            <div className="flex h-screen w-full overflow-hidden bg-[#F7F9F9]" style={{ fontFamily: "'Public Sans', sans-serif", color: '#2D3436' }}>

                {/* ── Sidebar ── */}
                <aside className="hidden w-64 flex-col border-r border-[#E0E6E6] bg-white md:flex shrink-0">

                    {/* Brand */}
                    <div className="flex h-16 items-center gap-3 border-b border-[#E0E6E6] px-6">
                        <div className="flex h-8 w-8 items-center justify-center rounded bg-[#4CAF50]/10 text-[#4CAF50]">
                            <span className="material-symbols-outlined text-xl">shield_person</span>
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-bold uppercase tracking-wider text-[#2D3436]">Warden Cmd</h1>
                            <span className="text-[10px] font-mono text-[#636E72]">SEC-4-AUTH</span>
                        </div>
                    </div>

                    <div className="flex flex-1 flex-col justify-between overflow-y-auto p-4">
                        {/* Nav */}
                        <nav className="flex flex-col gap-1">
                            <div className="mb-2 px-2 text-[10px] font-bold uppercase tracking-widest text-[#636E72]">Main Menu</div>
                            <SideNavLink icon="dashboard" label="Dashboard" active={activeNav === 'dashboard'} onClick={() => switchTab('dashboard')} />
                            <SideNavLink icon="receipt_long" label="Gate Logs" active={activeNav === 'logs'} onClick={() => switchTab('logs')} />
                            <SideNavLink icon="groups" label="Students" active={activeNav === 'students'} onClick={() => switchTab('students')} />
                            <SideNavLink icon="gavel" label="Violations" active={activeNav === 'violations'} onClick={() => switchTab('violations')} />
                        </nav>

                        <div className="flex flex-col gap-4">
                            {/* System Status */}
                            <div className="rounded border border-[#E0E6E6] bg-[#F7F9F9] p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] uppercase text-[#636E72] font-bold">System Status</span>
                                    <span className="flex h-2 w-2 rounded-full bg-[#4CAF50]" />
                                </div>
                                <div className="font-mono text-xs text-[#636E72]">
                                    <p>GATE: <span className="text-[#4CAF50] font-bold">ONLINE</span></p>
                                    <p>CCTV: <span className="text-[#4CAF50] font-bold">ONLINE</span></p>
                                    <p>AI-SCAN: <span className="text-[#FF9800] font-bold">UPDATING</span></p>
                                </div>
                            </div>

                            {/* Warden profile */}
                            <div className="flex items-center gap-3 border-t border-[#E0E6E6] pt-4">
                                <div className="h-10 w-10 rounded bg-[#4CAF50]/10 border border-[#E0E6E6] flex items-center justify-center text-[#4CAF50] font-bold">
                                    {user?.name?.[0]?.toUpperCase() || 'W'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-[#2D3436]">{user?.name || 'Warden'}</span>
                                    <span className="text-xs text-[#636E72]">Head Warden</span>
                                </div>
                                <button onClick={handleLogout} className="ml-auto text-[#636E72] hover:text-[#2D3436]" title="Logout">
                                    <span className="material-symbols-outlined text-lg">logout</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </aside>

                {/* ── Main ── */}
                <main className="flex flex-1 flex-col overflow-hidden bg-[#F7F9F9]">

                    {/* Top header */}
                    <header className="flex h-16 items-center justify-between border-b border-[#E0E6E6] bg-white px-6 py-4 shrink-0">
                        <div className="flex items-center gap-4">
                            <button className="md:hidden text-[#636E72]">
                                <span className="material-symbols-outlined">menu</span>
                            </button>
                            <div>
                                <h2 className="text-lg font-bold text-[#2D3436] tracking-tight">Live Monitoring Console</h2>
                                <p className="text-xs text-[#636E72] font-mono">
                                    SECTOR 4 // <span className="text-[#4CAF50] font-bold">ACTIVE MONITORING</span>
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="hidden items-center gap-2 rounded bg-[#F7F9F9] border border-[#E0E6E6] px-3 py-1.5 md:flex focus-within:border-[#4CAF50]/50 transition-colors">
                                <span className="material-symbols-outlined text-sm text-[#636E72]">search</span>
                                <input
                                    className="bg-transparent border-none p-0 text-sm text-[#2D3436] placeholder-[#636E72] focus:ring-0 w-48 font-mono outline-none"
                                    placeholder="Search ID or Name..."
                                    value={search}
                                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                                />
                            </div>
                            <button className="relative rounded p-2 text-[#636E72] hover:bg-[#F7F9F9] hover:text-[#2D3436]">
                                <span className="material-symbols-outlined">notifications</span>
                                {emergencyCount > 0 && (
                                    <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#EF5350] border border-white" />
                                )}
                            </button>
                        </div>
                    </header>

                    {/* Scrollable body */}
                    <div className="flex-1 overflow-y-auto p-6">

                        {/* ── GATE LOGS TAB ─────────────────────────────────────────────── */}
                        {activeNav === 'logs' && (
                            <div className="max-w-6xl mx-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-[#2D3436]">Gate Logs</h2>
                                        <p className="text-xs text-[#636E72] mt-0.5">All QR scan events from scan_events table</p>
                                    </div>
                                    <button onClick={() => { setLogsLoading(true); adminAPI.getGateLogs().then(d => setGateLogs(d.gateLogs || [])).catch(() => { }).finally(() => setLogsLoading(false)); }}
                                        className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded border border-[#E0E6E6] hover:bg-[#F7F9F9] text-[#636E72]">
                                        <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                                    </button>
                                </div>
                                <div className="bg-white rounded border border-[#E0E6E6] overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-[#F7F9F9] border-b border-[#E0E6E6]">
                                            <tr>{['Student', 'Gate', 'Scan Type', 'Result', 'Time'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#636E72]">{h}</th>
                                            ))}</tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F0F4F4]">
                                            {logsLoading ? (
                                                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#636E72] text-sm">Loading...</td></tr>
                                            ) : gateLogs.length === 0 ? (
                                                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#636E72] text-sm">No gate scans yet.</td></tr>
                                            ) : gateLogs.map((log, i) => (
                                                <tr key={i} className="hover:bg-[#F7F9F9] transition-colors">
                                                    <td className="px-4 py-3 font-medium text-[#2D3436]">{log.studentName || '—'}</td>
                                                    <td className="px-4 py-3 font-mono text-xs text-[#636E72]">{log.gateId}</td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.reason === 'out' ? 'bg-blue-50 text-blue-600 border border-blue-200' : log.reason === 'in' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>{log.reason || '—'}</span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${log.result === 'allow' ? 'bg-green-50 text-green-600 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>{log.result}</span>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-[#636E72]">{log.scannedAt ? new Date(log.scannedAt).toLocaleString('en-IN', { hour12: false }) : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ── VIOLATIONS TAB ────────────────────────────────────────────── */}
                        {activeNav === 'violations' && (
                            <div className="max-w-6xl mx-auto">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h2 className="text-xl font-bold text-[#2D3436]">Violations</h2>
                                        <p className="text-xs text-[#636E72] mt-0.5">Late return violations from violations table</p>
                                    </div>
                                    <button onClick={() => { setViolsLoading(true); adminAPI.getViolationsList().then(d => setViolationsList(d.violations || [])).catch(() => { }).finally(() => setViolsLoading(false)); }}
                                        className="flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded border border-[#E0E6E6] hover:bg-[#F7F9F9] text-[#636E72]">
                                        <span className="material-symbols-outlined text-sm">refresh</span> Refresh
                                    </button>
                                </div>
                                <div className="bg-white rounded border border-[#E0E6E6] overflow-hidden">
                                    <table className="w-full text-sm">
                                        <thead className="bg-[#F7F9F9] border-b border-[#E0E6E6]">
                                            <tr>{['Student', 'Type', 'Delay', 'Severity', 'Recorded At'].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-widest text-[#636E72]">{h}</th>
                                            ))}</tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#F0F4F4]">
                                            {violsLoading ? (
                                                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#636E72] text-sm">Loading...</td></tr>
                                            ) : violationsList.length === 0 ? (
                                                <tr><td colSpan={5} className="px-4 py-8 text-center text-[#636E72] text-sm">No violations recorded yet.</td></tr>
                                            ) : violationsList.map((v, i) => (
                                                <tr key={i} className="hover:bg-[#F7F9F9] transition-colors">
                                                    <td className="px-4 py-3 font-medium text-[#2D3436]">{v.studentName}</td>
                                                    <td className="px-4 py-3">
                                                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-orange-50 text-orange-600 border border-orange-200">
                                                            {(v.violationType || '').replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-sm font-bold">
                                                        <span className={v.delayMinutes > 60 ? 'text-red-600' : v.delayMinutes > 30 ? 'text-orange-500' : 'text-yellow-600'}>
                                                            {v.delayMinutes != null ? `${Math.round(v.delayMinutes)} min` : '—'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        {[1, 2, 3].map(s => <span key={s} className={`inline-block w-2 h-2 rounded-sm mr-0.5 ${s <= (v.severity || 1) ? 'bg-red-500' : 'bg-slate-200'}`} />)}
                                                    </td>
                                                    <td className="px-4 py-3 font-mono text-xs text-[#636E72]">{v.recordedAt ? new Date(v.recordedAt).toLocaleString('en-IN', { hour12: false }) : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* ── DASHBOARD + STUDENTS (existing content) ──────────────────── */}
                        {(activeNav === 'dashboard' || activeNav === 'students') && <>

                            {/* ── Stat Cards ── */}
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">

                                {/* Pending Requests */}
                                <div className="flex flex-col justify-between rounded bg-white p-4 border border-[#E0E6E6] relative overflow-hidden group hover:border-[#4CAF50]/30 transition-colors">
                                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="material-symbols-outlined text-4xl text-[#4CAF50]">pending_actions</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wider text-[#636E72]">Pending Requests</p>
                                        <h3 className="mt-2 text-3xl font-bold text-[#2D3436]">{loading ? '—' : (stats?.pendingRequests ?? queue.length)}</h3>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="text-xs font-medium text-[#4CAF50] bg-[#4CAF50]/10 px-1.5 py-0.5 rounded border border-[#4CAF50]/20">LIVE</span>
                                        <span className="text-xs text-[#636E72]">approval queue</span>
                                    </div>
                                </div>

                                {/* High Risk Flags */}
                                <div className="flex flex-col justify-between rounded bg-white p-4 border border-[#E0E6E6] relative overflow-hidden group hover:border-[#EF5350]/30 transition-colors">
                                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="material-symbols-outlined text-4xl text-[#EF5350]">warning</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wider text-[#636E72]">High Risk Flags</p>
                                        <h3 className="mt-2 text-3xl font-bold text-[#2D3436]">{loading ? '—' : highRiskCount}</h3>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="text-xs font-medium text-[#EF5350] bg-[#EF5350]/10 px-1.5 py-0.5 rounded border border-[#EF5350]/20">ALERT</span>
                                        <span className="text-xs text-[#636E72]">critical</span>
                                    </div>
                                </div>

                                {/* Late Returns */}
                                <div className="flex flex-col justify-between rounded bg-white p-4 border border-[#E0E6E6] relative overflow-hidden group hover:border-[#FF9800]/30 transition-colors">
                                    <div className="absolute right-0 top-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <span className="material-symbols-outlined text-4xl text-[#FF9800]">history_toggle_off</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-wider text-[#636E72]">Late Returns</p>
                                        <h3 className="mt-2 text-3xl font-bold text-[#2D3436]">{loading ? '—' : lateCount}</h3>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2">
                                        <span className="text-xs font-medium text-[#FF9800] bg-[#FF9800]/10 px-1.5 py-0.5 rounded border border-[#FF9800]/20">WATCH</span>
                                        <span className="text-xs text-[#636E72]">needs review</span>
                                    </div>
                                </div>

                                {/* Violation Trends */}
                                <div className="flex flex-col justify-between rounded bg-white p-4 border border-[#E0E6E6]">
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-xs font-medium uppercase tracking-wider text-[#636E72]">Violation Trends (24h)</p>
                                        <span className="text-xs text-[#4CAF50] font-mono font-bold">LOW ACTIVITY</span>
                                    </div>
                                    <div className="flex-1 flex items-end gap-1 h-16 w-full pt-2">
                                        {trendHeights.map((h, i) => (
                                            <div
                                                key={i}
                                                className={`w-1/6 rounded-t-sm hover:bg-[#4CAF50]/50 transition-colors ${i === trendHeights.length - 1 ? 'bg-[#4CAF50]' : 'bg-[#E0E6E6]'}`}
                                                style={{ height: `${Math.round((h / trendMax) * 100)}%` }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* ── Pending Approvals table header ── */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                                <div className="flex items-center gap-2">
                                    <h3 className="text-lg font-bold text-[#2D3436]">Pending Approvals</h3>
                                    <span className="px-2 py-0.5 bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20 text-xs font-mono rounded">LIVE</span>
                                </div>
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
                                    <button className="flex items-center gap-2 rounded border border-[#E0E6E6] bg-white px-3 py-1.5 text-xs font-medium text-[#2D3436] hover:bg-[#F7F9F9] transition-all whitespace-nowrap">
                                        <span className="material-symbols-outlined text-sm">filter_list</span>
                                        Filter
                                    </button>
                                    {emergencyCount > 0 && (
                                        <button className="flex items-center gap-2 rounded border border-[#EF5350]/30 bg-[#EF5350]/5 px-3 py-1.5 text-xs font-medium text-[#EF5350] hover:bg-[#EF5350]/10 transition-all whitespace-nowrap">
                                            <span className="material-symbols-outlined text-sm">emergency_home</span>
                                            Emergency Flag ({emergencyCount})
                                        </button>
                                    )}
                                    {lateCount > 0 && (
                                        <button className="flex items-center gap-2 rounded border border-[#FF9800]/30 bg-[#FF9800]/5 px-3 py-1.5 text-xs font-medium text-[#FF9800] hover:bg-[#FF9800]/10 transition-all whitespace-nowrap">
                                            <span className="material-symbols-outlined text-sm">schedule</span>
                                            Late Returns ({lateCount})
                                        </button>
                                    )}
                                    <div className="h-6 w-px bg-[#E0E6E6] mx-1" />
                                    <button
                                        onClick={handleApproveAllLowRisk}
                                        className="rounded bg-[#4CAF50] px-4 py-1.5 text-xs font-bold text-white hover:bg-[#388E3C] transition-colors border border-[#4CAF50] shadow-sm whitespace-nowrap"
                                    >
                                        Approve All Low Risk
                                    </button>
                                </div>
                            </div>

                            {/* ── Table ── */}
                            <div className="rounded border border-[#E0E6E6] bg-white overflow-hidden shadow-sm">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-[#F7F9F9] text-xs uppercase text-[#636E72] border-b border-[#E0E6E6]">
                                                <th className="px-4 py-3 font-medium tracking-wider w-12 text-center">
                                                    <input type="checkbox" className="rounded border-gray-300 bg-white text-[#4CAF50]" />
                                                </th>
                                                <th className="px-4 py-3 font-medium tracking-wider">Student Details</th>
                                                <th className="px-4 py-3 font-medium tracking-wider">Route / Purpose</th>
                                                <th className="px-4 py-3 font-medium tracking-wider">Timing</th>
                                                <th className="px-4 py-3 font-medium tracking-wider w-48">ML Risk Analysis</th>
                                                <th className="px-4 py-3 font-medium tracking-wider text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-[#E0E6E6] text-sm">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-[#636E72] font-mono text-xs">
                                                        Loading...
                                                    </td>
                                                </tr>
                                            ) : paginated.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-4 py-8 text-center text-[#636E72] text-sm">
                                                        No pending requests.
                                                    </td>
                                                </tr>
                                            ) : (
                                                paginated.map((req) => {
                                                    const score = req.mlRiskScore ?? null;
                                                    const isEmerg = req.type === 'emergency';
                                                    const isHighRisk = (score ?? 0) >= 65;
                                                    return (
                                                        <tr
                                                            key={req._id}
                                                            className={`group hover:bg-[#F7F9F9]/50 transition-colors ${isEmerg ? 'border-l-2 border-l-[#EF5350] bg-[#EF5350]/5' : ''}`}
                                                        >
                                                            <td className="px-4 py-3 text-center">
                                                                <input type="checkbox" className="rounded border-gray-300 bg-white text-[#4CAF50]" />
                                                            </td>

                                                            {/* Student */}
                                                            <td className="px-4 py-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="h-8 w-8 rounded bg-[#4CAF50]/10 border border-[#E0E6E6] flex items-center justify-center text-[#4CAF50] text-sm font-bold shrink-0">
                                                                        {req.studentName?.[0]?.toUpperCase() || '?'}
                                                                    </div>
                                                                    <div>
                                                                        <div className="font-bold text-[#2D3436] flex items-center gap-1.5">
                                                                            {req.studentName || '—'}
                                                                            {isEmerg && (
                                                                                <span className="material-symbols-outlined text-[#EF5350] text-[16px]" title="Emergency">emergency</span>
                                                                            )}
                                                                        </div>
                                                                        <div className="font-mono text-xs text-[#636E72]">ID: {req.studentId || req._id?.slice(-10)}</div>
                                                                    </div>
                                                                </div>
                                                            </td>

                                                            {/* Route / Purpose */}
                                                            <td className="px-4 py-3">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[#2D3436] font-medium">{req.destination || 'N/A'}</span>
                                                                    <span className={`text-xs ${isEmerg ? 'text-[#EF5350] font-bold' : 'text-[#636E72]'}`}>
                                                                        Reason: {req.reason || '—'}
                                                                    </span>
                                                                </div>
                                                            </td>

                                                            {/* Timing */}
                                                            <td className="px-4 py-3">
                                                                <div className="font-mono text-xs">
                                                                    <div className="text-[#2D3436]">OUT: {fmtTime(req.departureTime)}</div>
                                                                    <div className="text-[#636E72]">IN: {req.returnTime ? fmtTime(req.returnTime) : 'TBD'}</div>
                                                                </div>
                                                            </td>

                                                            {/* ML Risk */}
                                                            <td className="px-4 py-3">
                                                                <RiskBar score={score} flag={isHighRisk ? 'High violation history' : null} />
                                                            </td>

                                                            {/* Actions */}
                                                            <td className="px-4 py-3 text-right">
                                                                <div className="flex items-center justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                                                                    {/* Reject */}
                                                                    <button
                                                                        onClick={() => handleApproval(req._id, false)}
                                                                        className="flex h-8 w-8 items-center justify-center rounded border border-[#EF5350]/30 bg-[#EF5350]/5 text-[#EF5350] hover:bg-[#EF5350] hover:text-white transition-all"
                                                                        title="Reject"
                                                                    >
                                                                        <span className="material-symbols-outlined text-lg">close</span>
                                                                    </button>

                                                                    {/* Approve — larger button for emergency */}
                                                                    {isEmerg ? (
                                                                        <button
                                                                            onClick={() => handleApproval(req._id, true)}
                                                                            className="flex h-8 px-3 items-center justify-center gap-1 rounded border border-[#4CAF50]/30 bg-[#4CAF50]/20 text-[#4CAF50] hover:bg-[#4CAF50] hover:text-white transition-all"
                                                                            title="Approve"
                                                                        >
                                                                            <span className="text-xs font-bold">APPROVE</span>
                                                                            <span className="material-symbols-outlined text-lg">check</span>
                                                                        </button>
                                                                    ) : isHighRisk ? (
                                                                        /* High-risk: info only */
                                                                        <button
                                                                            className="flex h-8 w-8 items-center justify-center rounded border border-[#E0E6E6] bg-[#F7F9F9] text-[#636E72] hover:bg-white hover:text-[#4CAF50] hover:border-[#4CAF50] transition-all"
                                                                            title="Details"
                                                                        >
                                                                            <span className="material-symbols-outlined text-lg">info</span>
                                                                        </button>
                                                                    ) : (
                                                                        <button
                                                                            onClick={() => handleApproval(req._id, true)}
                                                                            className="flex h-8 w-8 items-center justify-center rounded border border-[#4CAF50]/30 bg-[#4CAF50]/10 text-[#4CAF50] hover:bg-[#4CAF50] hover:text-white transition-all"
                                                                            title="Approve"
                                                                        >
                                                                            <span className="material-symbols-outlined text-lg">check</span>
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination footer */}
                                <div className="flex items-center justify-between border-t border-[#E0E6E6] bg-white px-4 py-3">
                                    <div className="text-xs text-[#636E72]">
                                        Showing{' '}
                                        <span className="text-[#2D3436] font-mono">{filtered.length === 0 ? 0 : (page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)}</span>
                                        {' '}of{' '}
                                        <span className="text-[#2D3436] font-mono">{filtered.length}</span> pending
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                                            disabled={page === 1}
                                            className="h-8 w-8 rounded border border-[#E0E6E6] text-[#636E72] hover:bg-[#F7F9F9] disabled:opacity-50 flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-sm">chevron_left</span>
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => (
                                            <button
                                                key={i}
                                                onClick={() => setPage(i + 1)}
                                                className={`h-8 w-8 rounded text-xs font-medium ${page === i + 1 ? 'bg-[#4CAF50] text-white font-bold' : 'border border-[#E0E6E6] text-[#636E72] hover:bg-[#F7F9F9]'}`}
                                            >
                                                {i + 1}
                                            </button>
                                        ))}
                                        <button
                                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                            disabled={page === totalPages}
                                            className="h-8 w-8 rounded border border-[#E0E6E6] text-[#636E72] hover:bg-[#F7F9F9] disabled:opacity-50 flex items-center justify-center"
                                        >
                                            <span className="material-symbols-outlined text-sm">chevron_right</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>}
                    </div>
                </main>
            </div>
        </>
    );

};

export default AdminDashboard;
