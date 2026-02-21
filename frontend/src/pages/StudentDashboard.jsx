import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { requestAPI, studentAPI, riskAPI, locationAPI } from '../services/api';
import QRCode from 'qrcode';

// ─── tiny helpers ────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

function LiveClock() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    const h = now.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    const dateStr = `${pad(now.getDate())} ${months[now.getMonth()]} ${now.getFullYear()}`;
    return (
        <>
            <div className="text-4xl font-mono text-[#2D3436] font-light tracking-tighter">
                {pad(h12)}:{pad(now.getMinutes())}
                <span className="text-lg text-[#64748b] ml-1">{ampm}</span>
            </div>
            <div className="text-xs text-[#64748b] font-mono mt-1">{dateStr}</div>
        </>
    );
}

function RiskBar({ score }) {
    const pct = Math.max(0, Math.min(100, score));
    const filled = Math.round(pct / 20); // 5 bars
    return (
        <div className="flex gap-1 h-3 w-full">
            {[0, 1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className={`flex-1 rounded-sm ${i < filled ? 'bg-[#4CAF50]' : 'bg-slate-200'}`}
                />
            ))}
        </div>
    );
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
    const map = {
        pending_parent: { bg: 'bg-yellow-50 border-yellow-200 text-yellow-700', label: 'PENDING PARENT' },
        parent_approved: { bg: 'bg-blue-50 border-blue-200 text-blue-700', label: 'PARENT APPROVED' },
        approved: { bg: 'bg-green-100 border-green-200 text-green-700', label: 'APPROVED' },
        out: { bg: 'bg-[#4CAF50]/10 border-[#4CAF50]/30 text-[#4CAF50]', label: '🚶 OUT' },
        returned: { bg: 'bg-slate-100 border-slate-300 text-slate-600', label: 'RETURNED' },
        rejected: { bg: 'bg-red-100 border-red-200 text-red-600', label: 'REJECTED' },
        // legacy
        pending: { bg: 'bg-yellow-50 border-yellow-200 text-yellow-700', label: 'PENDING' },
        completed: { bg: 'bg-slate-100 border-slate-300 text-slate-600', label: 'COMPLETED' },
    };
    const s = map[status] || { bg: 'bg-slate-100 border-slate-200 text-slate-500', label: (status || 'UNKNOWN').toUpperCase() };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold border uppercase tracking-wide ${s.bg}`}>
            {s.label}
        </span>
    );
}

// ─── Nav link ─────────────────────────────────────────────────────────────────

function NavLink({ to, icon, label, active, onClick }) {
    const base = 'flex items-center gap-3 px-4 py-3 transition-colors border-l-4 text-sm font-bold tracking-wide';
    const cls = active
        ? `${base} bg-[#4CAF50]/5 border-[#4CAF50] text-[#4CAF50]`
        : `${base} text-[#64748b] hover:text-[#2D3436] hover:bg-slate-50 border-transparent font-medium`;

    if (onClick) {
        return (
            <button onClick={onClick} className={`${cls} w-full text-left`}>
                <span className="material-symbols-outlined">{icon}</span>
                <span>{label}</span>
            </button>
        );
    }
    return (
        <Link to={to} className={cls}>
            <span className="material-symbols-outlined">{icon}</span>
            <span>{label}</span>
        </Link>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [risk, setRisk] = useState(null);
    const [riskLoading, setRiskLoading] = useState(false);
    const [riskError, setRiskError] = useState('');
    const [showNewRequest, setShowNewRequest] = useState(false);
    const [qrCode, setQrCode] = useState(null);
    const [activeQRPass, setActiveQRPass] = useState(null); // pass object for gate-pass panel

    // Live location state
    const [activePassId, setActivePassId] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle');
    const [locationSharing, setLocationSharing] = useState(false);

    // New Request Form State
    const [formData, setFormData] = useState({
        type: 'outpass',
        reason: '',
        departureTime: '',
        returnTime: '',
        destination: '',
        emergencyContact: ''
    });

    // Active pass = any pass that hasn't been fully returned yet
    const ACTIVE_STATUSES = new Set(['approved', 'out']);

    const fetchData = async () => {
        try {
            const [reqData, statsData] = await Promise.all([
                requestAPI.getAll(),
                studentAPI.getStats()
            ]);
            const allRequests = reqData.requests || [];
            setRequests(allRequests);
            setStats(statsData);

            // Active pass: approved OR out (not returned/rejected)
            const active = allRequests.find((r) => ACTIVE_STATUSES.has(r.status));
            setActivePassId(active?._id || null);
            if (active) setLocationSharing(true);

            // Gate-pass QR panel: approved or out passes
            setActiveQRPass(active || null);

            // Risk score: read from the pass's stored risk_score (computed at creation by ML)
            // Risk is a property of a specific pass — computed at creation using behavioral history.
            // After a violation, the NEXT pass will have a higher risk_score.
            if (allRequests.length === 0) {
                // No pass history at all (fresh/reset DB) — show 0, not a model baseline
                setRisk({ risk_score: 0, risk_category: 'low' });
                setRiskLoading(false);
            } else {
                const latestWithRisk = allRequests.find((r) => r.riskScore != null && r.riskScore > 0);
                if (latestWithRisk) {
                    setRisk({ risk_score: latestWithRisk.riskScore, risk_category: latestWithRisk.riskCategory || 'low' });
                    setRiskLoading(false);
                } else {
                    setRisk({ risk_score: 0, risk_category: 'low' });
                    setRiskLoading(false);
                }
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };


    // Initial fetch
    useEffect(() => { fetchData(); }, []);

    // ── Polling: auto-refresh every 8s when a pass is active ─────────────────
    useEffect(() => {
        // Only poll while pass is approved or out (waiting for scan events)
        const hasActivePass = requests.some((r) => ACTIVE_STATUSES.has(r.status));
        if (!hasActivePass) return;
        const id = setInterval(fetchData, 8000);
        return () => clearInterval(id);
    }, [requests]);

    // Geolocation heartbeat — runs when there's an active pass AND sharing is enabled
    useEffect(() => {
        if (!activePassId || !locationSharing) { setLocationStatus('idle'); return; }
        if (!('geolocation' in navigator)) { setLocationStatus('unsupported'); return; }

        let intervalId;
        let cancelled = false;

        const sendHeartbeat = () => {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    if (cancelled) return;
                    const { latitude, longitude, accuracy } = pos.coords;
                    const payload = { pass_id: activePassId, lat: latitude, lon: longitude, accuracy, recorded_at: new Date().toISOString() };
                    setLocationStatus('active');
                    try { await locationAPI.send(payload); }
                    catch (err) { console.error('Location heartbeat error', err); setLocationStatus('error'); }
                },
                (err) => {
                    console.error('Geolocation error', err);
                    // PERMISSION_DENIED = 1, POSITION_UNAVAILABLE = 2, TIMEOUT = 3
                    if (err.code === 1) setLocationStatus('denied');
                    else setLocationStatus('error');
                },
                { enableHighAccuracy: false, maximumAge: 30_000, timeout: 15_000 }
            );
        };

        sendHeartbeat();
        intervalId = window.setInterval(sendHeartbeat, 30_000);
        return () => { cancelled = true; if (intervalId) window.clearInterval(intervalId); };
    }, [activePassId, locationSharing]);


    const [formError, setFormError] = useState('');

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        setFormError('');
        // Validation
        if (!formData.destination?.trim()) { setFormError('Destination is required.'); return; }
        const ec = (formData.emergencyContact || '').trim();
        if (ec && !/^\d{10}$/.test(ec)) { setFormError('Emergency contact must be exactly 10 digits.'); return; }
        if ((formData.reason || '').trim().length < 5) { setFormError('Reason must be at least 5 characters.'); return; }
        try {
            await requestAPI.create(formData);
            setShowNewRequest(false);
            setFormData({ type: 'outpass', reason: '', departureTime: '', returnTime: '', destination: '', emergencyContact: '' });
            fetchData();
        } catch (error) { setFormError(error.message); }
    };

    const handleViewQR = async (id) => {
        try {
            const data = await requestAPI.getQR(id);
            const qrDataUrl = await QRCode.toDataURL(data.qrCode);
            setQrCode(qrDataUrl);
        } catch { alert('Could not load QR code'); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    // ── Derived data ──────────────────────────────────────────────────────────

    const latestRequest = requests[0] || null;
    const currentStatus = latestRequest?.status || 'none';
    const latestReqId = latestRequest?._id?.slice(-6)?.toUpperCase() || '------';
    const riskScore = risk?.risk_score != null ? Math.round(risk.risk_score) : null;
    const riskCategory = risk?.risk_category || 'UNKNOWN';

    const formatTime = (iso) => {
        if (!iso) return '--:--:--';
        try {
            const d = new Date(iso);
            return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
        } catch { return '--:--:--'; }
    };

    const formatDate = (iso) => {
        if (!iso) return '--';
        try {
            const d = new Date(iso);
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
        } catch { return '--'; }
    };

    // ── QR Gate-Pass Panel ───────────────────────────────────────────────────
    // Determine QR label from pass status
    const qrPhaseLabel = activeQRPass?.status === 'out' ? 'SCAN TO CHECK IN' :
        activeQRPass?.status === 'approved' ? 'SCAN TO CHECK OUT' : '';

    const GatePassContent = () => {
        if (activeQRPass && activeQRPass.status !== 'returned') {
            return (
                <div className="flex flex-col items-center gap-2">
                    <button
                        onClick={() => handleViewQR(activeQRPass._id)}
                        className="bg-white p-4 shadow-sm border border-[#E0E6E6] mb-2 w-full max-w-[200px] aspect-square flex items-center justify-center hover:shadow-md transition-shadow"
                        title="Click to view full QR"
                    >
                        <span className="material-symbols-outlined text-6xl text-[#64748b]">qr_code_2</span>
                    </button>
                    {qrPhaseLabel && (
                        <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1 rounded ${activeQRPass.status === 'out'
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-[#4CAF50]/10 text-[#4CAF50] border border-[#4CAF50]/20'
                            }`}>{qrPhaseLabel}</span>
                    )}
                </div>
            );
        }
        return (
            <div className="bg-white p-4 shadow-sm border border-[#E0E6E6] mb-4 w-full max-w-[200px] aspect-square flex items-center justify-center">
                <span className="material-symbols-outlined text-6xl text-slate-300">qr_code_2</span>
            </div>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Google Material Symbols */}
            {/* IBM Plex Mono */}
            <div className="flex h-screen w-full overflow-hidden bg-[#F7F9F9] font-sans" style={{ fontFamily: "'Public Sans', sans-serif" }}>

                {/* ── Sidebar ── */}
                <aside className="hidden md:flex flex-col w-72 bg-white border-r border-[#E0E6E6] h-full shrink-0">
                    {/* Brand */}
                    <div className="p-6 border-b border-[#E0E6E6] flex items-center gap-3">
                        <div className="size-10 rounded-full bg-[#4CAF50]/10 flex items-center justify-center text-[#4CAF50] border border-[#4CAF50]/20">
                            <span className="material-symbols-outlined">shield_lock</span>
                        </div>
                        <div>
                            <h1 className="text-[#2D3436] font-bold tracking-[0.1em] text-sm">SECUREPASS</h1>
                            <p className="text-[#64748b] text-xs">Hostel Management</p>
                        </div>
                    </div>

                    {/* User */}
                    <div className="p-6 pb-2">
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative">
                                <div className="size-12 rounded-full bg-slate-200 border border-[#E0E6E6] flex items-center justify-center text-[#64748b] overflow-hidden">
                                    <span className="material-symbols-outlined text-3xl">person</span>
                                </div>
                                <div className="absolute bottom-0 right-0 size-3 bg-[#4CAF50] rounded-full border-2 border-white"></div>
                            </div>
                            <div>
                                <h2 className="text-[#2D3436] font-semibold text-sm">{user?.name || 'Student'}</h2>
                                <p className="text-[#64748b] text-xs font-mono">ID: {user?.studentId || user?._id?.slice(-8)?.toUpperCase() || '----'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Nav */}
                    <nav className="flex-1 px-4 flex flex-col gap-2">
                        <NavLink to="/dashboard" icon="dashboard" label="DASHBOARD" active={true} />
                        <NavLink to="#" icon="add_circle" label="NEW REQUEST" onClick={() => setShowNewRequest(true)} />
                        <NavLink to="/profile" icon="person" label="PROFILE" />
                        <NavLink to="/emergency" icon="sos" label="EMERGENCY" />
                    </nav>

                    {/* Logout */}
                    <div className="p-4 border-t border-[#E0E6E6]">
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 text-[#64748b] hover:text-[#2D3436] hover:bg-slate-50 transition-colors rounded"
                        >
                            <span className="material-symbols-outlined text-xl">logout</span>
                            <span className="text-sm font-medium">Logout</span>
                        </button>
                    </div>
                </aside>

                {/* ── Main ── */}
                <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#F7F9F9]">

                    {/* Mobile header */}
                    <header className="md:hidden flex items-center justify-between p-4 bg-white border-b border-[#E0E6E6]">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-[#4CAF50]">shield_lock</span>
                            <span className="font-bold tracking-[0.1em] text-sm text-[#2D3436]">SECUREPASS</span>
                        </div>
                        <button className="text-[#2D3436]">
                            <span className="material-symbols-outlined">menu</span>
                        </button>
                    </header>

                    {/* Scrollable content */}
                    <div className="flex-1 overflow-y-auto p-6 lg:p-10">
                        <div className="max-w-7xl mx-auto flex flex-col gap-8">

                            {/* Page header */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h1 className="text-3xl font-bold text-[#2D3436] tracking-tight">DASHBOARD</h1>
                                    <p className="text-[#64748b] mt-1">
                                        {stats?.room ? `Room ${stats.room}` : 'Room 304-B'} • {stats?.block ? `Hostel Block ${stats.block}` : 'Hostel Block A'}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setShowNewRequest(true)}
                                    className="bg-[#4CAF50] hover:bg-[#43a047] text-white font-bold px-6 py-3 rounded flex items-center gap-2 transition-colors shadow-sm"
                                >
                                    <span className="material-symbols-outlined">add</span>
                                    REQUEST PASS
                                </button>
                            </div>

                            {/* ── Stat cards ── */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

                                {/* Current Status */}
                                <div className="bg-white border border-[#E0E6E6] rounded p-6 flex flex-col justify-between h-40 relative overflow-hidden group">
                                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <span className="material-symbols-outlined text-[#4CAF50]" style={{ fontSize: 60 }}>verified</span>
                                    </div>
                                    <h3 className="text-[#64748b] text-xs font-bold tracking-[0.1em] uppercase mb-2">Current Status</h3>
                                    <div className="flex-1 flex items-center">
                                        {currentStatus === 'none' ? (
                                            <div className="inline-flex items-center justify-center px-4 py-1 border border-slate-300 text-[#64748b] font-bold tracking-widest text-lg rounded bg-slate-50">
                                                NONE
                                            </div>
                                        ) : (
                                            <div className={`inline-flex items-center justify-center px-4 py-1 border font-bold tracking-widest text-lg rounded ${currentStatus === 'pending' ? 'border-[#4CAF50] text-[#4CAF50] bg-[#4CAF50]/5' :
                                                currentStatus === 'approved' ? 'border-green-500 text-green-600 bg-green-50' :
                                                    currentStatus === 'rejected' ? 'border-red-400 text-red-500 bg-red-50' :
                                                        'border-slate-400 text-[#64748b] bg-slate-50'
                                                }`}>
                                                {currentStatus.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-[#64748b] font-mono mt-2">REQ #{latestReqId}</div>
                                </div>

                                {/* Risk Score */}
                                <div className="bg-white border border-[#E0E6E6] rounded p-6 flex flex-col justify-between h-40">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-[#64748b] text-xs font-bold tracking-[0.1em] uppercase">Risk Score</h3>
                                        <span className="text-[#4CAF50] font-bold text-lg">
                                            {riskLoading ? '...' : riskScore != null ? `${riskScore}/100` : '--/100'}
                                        </span>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-center gap-2">
                                        <RiskBar score={riskScore ?? 0} />
                                        <p className="text-[#4CAF50] text-xs font-bold uppercase tracking-wide">
                                            {riskLoading ? 'CALCULATING...' : riskError ? 'UNAVAILABLE' : `${riskCategory.toUpperCase()} • ${riskScore != null && riskScore >= 70 ? 'SAFE' : riskScore != null ? 'CAUTION' : '--'}`}
                                        </p>
                                    </div>
                                </div>

                                {/* Location Sharing */}
                                <div className="bg-white border border-[#E0E6E6] rounded p-6 flex flex-col justify-between h-40">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-[#64748b] text-xs font-bold tracking-[0.1em] uppercase">Location Sharing</h3>
                                        {/* Toggle */}
                                        <div className="relative inline-block w-12 h-6 align-middle select-none">
                                            <input
                                                type="checkbox"
                                                id="location-toggle"
                                                checked={locationSharing}
                                                onChange={() => setLocationSharing((v) => !v)}
                                                className="absolute block w-4 h-4 rounded-full bg-white border border-gray-300 appearance-none cursor-pointer top-1 transition-all duration-200"
                                                style={{ right: locationSharing ? '4px' : '28px', borderColor: locationSharing ? '#4CAF50' : undefined }}
                                            />
                                            <label
                                                htmlFor="location-toggle"
                                                className="block overflow-hidden h-6 rounded-full cursor-pointer border border-[#E0E6E6] transition-colors duration-200"
                                                style={{ backgroundColor: locationSharing ? 'rgba(76,175,80,0.1)' : '#e2e8f0', borderColor: locationSharing ? '#4CAF50' : undefined }}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 flex items-end">
                                        {locationStatus === 'active' || (locationSharing && activePassId) ? (
                                            <div className="flex items-center gap-2 text-[#4CAF50]">
                                                <span className="relative flex h-3 w-3">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4CAF50] opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-[#4CAF50]"></span>
                                                </span>
                                                <span className="text-sm font-bold tracking-wide">ACTIVE</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 text-[#64748b]">
                                                <span className="relative flex h-3 w-3">
                                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-300"></span>
                                                </span>
                                                <span className="text-sm font-medium tracking-wide">INACTIVE</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Local Time */}
                                <div className="bg-white border border-[#E0E6E6] rounded p-6 flex flex-col justify-between h-40 relative">
                                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: "url('https://www.transparenttextures.com/patterns/carbon-fibre.png')" }}></div>
                                    <h3 className="text-[#64748b] text-xs font-bold tracking-[0.1em] uppercase relative z-10">Local Time</h3>
                                    <div className="relative z-10"><LiveClock /></div>
                                </div>
                            </div>

                            {/* ── Bottom row: Gate Pass + History ── */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Digital Gate Pass */}
                                <div className="lg:col-span-1">
                                    <div className="bg-white border border-[#E0E6E6] rounded p-6 h-full flex flex-col gap-6">
                                        <div>
                                            <h2 className="text-[#2D3436] text-lg font-bold tracking-wide mb-1">DIGITAL GATE PASS</h2>
                                            <p className="text-[#64748b] text-sm">Scan at security checkpoint</p>
                                        </div>
                                        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50 rounded border border-dashed border-slate-300">
                                            <GatePassContent />
                                            <p className="text-[#64748b] text-xs font-mono text-center">
                                                {activeQRPass
                                                    ? `VALID UNTIL: ${formatDate(activeQRPass.returnTime)}`
                                                    : 'NO ACTIVE PASS'}
                                            </p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => activeQRPass && handleViewQR(activeQRPass._id)}
                                                className="flex-1 bg-white hover:bg-slate-50 text-[#2D3436] text-xs font-bold py-2 px-3 rounded border border-[#E0E6E6] transition-colors uppercase tracking-wider"
                                            >
                                                Download
                                            </button>
                                            <button className="flex-1 bg-white hover:bg-slate-50 text-[#2D3436] text-xs font-bold py-2 px-3 rounded border border-[#E0E6E6] transition-colors uppercase tracking-wider">
                                                Share
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Pass History */}
                                <div className="lg:col-span-2">
                                    <div className="bg-white border border-[#E0E6E6] rounded flex flex-col h-full overflow-hidden">
                                        <div className="p-6 border-b border-[#E0E6E6] flex justify-between items-center">
                                            <h2 className="text-[#2D3436] text-lg font-bold tracking-wide">PASS HISTORY</h2>
                                            <button className="text-[#4CAF50] text-xs font-bold hover:underline uppercase tracking-wide">View All</button>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left border-collapse">
                                                <thead className="bg-slate-50 text-xs uppercase text-[#64748b] font-bold tracking-wider">
                                                    <tr>
                                                        <th className="px-6 py-4 font-bold border-b border-[#E0E6E6]">Date</th>
                                                        <th className="px-6 py-4 font-bold border-b border-[#E0E6E6]">Time Out</th>
                                                        <th className="px-6 py-4 font-bold border-b border-[#E0E6E6]">Time In</th>
                                                        <th className="px-6 py-4 font-bold border-b border-[#E0E6E6]">Reason</th>
                                                        <th className="px-6 py-4 font-bold border-b border-[#E0E6E6] text-right">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="text-sm divide-y divide-[#E0E6E6]">
                                                    {loading ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-8 text-center text-[#64748b] text-sm">
                                                                Loading...
                                                            </td>
                                                        </tr>
                                                    ) : requests.length === 0 ? (
                                                        <tr>
                                                            <td colSpan={5} className="px-6 py-8 text-center text-[#64748b] text-sm">
                                                                No requests found. Create one to get started!
                                                            </td>
                                                        </tr>
                                                    ) : (
                                                        requests.slice(0, 8).map((req) => (
                                                            <tr key={req._id} className="hover:bg-slate-50 transition-colors">
                                                                <td className="px-6 py-4 text-[#2D3436] font-medium">{formatDate(req.outAt || req.departureTime)}</td>
                                                                <td className="px-6 py-4 text-[#64748b] font-mono text-xs">
                                                                    {req.outAt ? formatTime(req.outAt) : (req.status === 'approved' || req.status === 'out' || req.status === 'returned' ? formatTime(req.departureTime) : '--:--:--')}
                                                                </td>
                                                                <td className="px-6 py-4 text-[#64748b] font-mono text-xs">
                                                                    {req.inAt
                                                                        ? <span className="flex items-center gap-1">
                                                                            {formatTime(req.inAt)}
                                                                            {new Date(req.inAt) > new Date(req.returnTime) && (
                                                                                <span className="text-red-500 text-[10px] font-bold ml-1">LATE</span>
                                                                            )}
                                                                        </span>
                                                                        : '--:--:--'}
                                                                </td>
                                                                <td className="px-6 py-4 text-[#2D3436]">{req.reason}</td>
                                                                <td className="px-6 py-4 text-right">
                                                                    <StatusBadge status={req.status} />
                                                                </td>
                                                            </tr>
                                                        ))
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="max-w-7xl mx-auto mt-8 border-t border-[#E0E6E6] pt-6 flex flex-col md:flex-row justify-between items-center text-[#64748b] text-xs gap-2">
                            <p>© 2024 Campus Security Systems. All rights reserved.</p>
                            <div className="flex gap-4">
                                <a href="#" className="hover:text-[#4CAF50] transition-colors">Privacy Policy</a>
                                <a href="#" className="hover:text-[#4CAF50] transition-colors">Security Guidelines</a>
                                <a href="#" className="hover:text-[#4CAF50] transition-colors">Support</a>
                            </div>
                        </div>
                    </div>
                </main>
            </div>

            {/* ── New Request Modal ── */}
            {showNewRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded border border-[#E0E6E6] w-full max-w-lg shadow-xl">
                        <div className="p-6 border-b border-[#E0E6E6] flex justify-between items-center">
                            <h2 className="text-[#2D3436] font-bold tracking-wide text-lg">NEW OUTPASS REQUEST</h2>
                            <button onClick={() => setShowNewRequest(false)} className="text-[#64748b] hover:text-[#2D3436]">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                        <form onSubmit={handleCreateRequest} className="p-6 flex flex-col gap-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#64748b] tracking-wider uppercase mb-1">Type</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-[#E0E6E6] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#4CAF50] bg-white"
                                    >
                                        <option value="outpass">Outpass</option>
                                        <option value="homepass">Home Pass</option>
                                        <option value="emergency">Emergency</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#64748b] tracking-wider uppercase mb-1">Emergency Contact</label>
                                    <input
                                        type="text"
                                        value={formData.emergencyContact}
                                        onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                        required
                                        placeholder="Phone number"
                                        className="w-full px-3 py-2 border border-[#E0E6E6] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#4CAF50]"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#64748b] tracking-wider uppercase mb-1">Reason</label>
                                <input
                                    type="text"
                                    value={formData.reason}
                                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                    required
                                    placeholder="Why do you need to leave?"
                                    className="w-full px-3 py-2 border border-[#E0E6E6] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#4CAF50]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-[#64748b] tracking-wider uppercase mb-1">Destination</label>
                                <input
                                    type="text"
                                    value={formData.destination}
                                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                    required
                                    placeholder="Where are you going?"
                                    className="w-full px-3 py-2 border border-[#E0E6E6] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#4CAF50]"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#64748b] tracking-wider uppercase mb-1">Departure Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.departureTime}
                                        onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-[#E0E6E6] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#4CAF50]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#64748b] tracking-wider uppercase mb-1">Return Time</label>
                                    <input
                                        type="datetime-local"
                                        value={formData.returnTime}
                                        onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-[#E0E6E6] rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#4CAF50]"
                                    />
                                </div>
                            </div>
                            {formError && (
                                <div className="mx-6 -mt-2 mb-1 px-3 py-2 rounded bg-red-50 border border-red-200 text-red-600 text-xs font-medium">
                                    ⚠️ {formError}
                                </div>
                            )}
                            <div className="flex justify-end gap-3 pt-2 px-6 pb-6">
                                <button
                                    type="button"
                                    onClick={() => { setShowNewRequest(false); setFormError(''); }}
                                    className="px-5 py-2 text-sm font-medium text-[#64748b] hover:text-[#2D3436] border border-[#E0E6E6] rounded hover:bg-slate-50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 text-sm font-bold text-white bg-[#4CAF50] hover:bg-[#43a047] rounded transition-colors"
                                >
                                    Submit Request
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── QR Code Modal ── */}
            {qrCode && (
                <div
                    className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
                    onClick={() => setQrCode(null)}
                >
                    <div
                        className="bg-white p-8 text-center rounded border border-[#E0E6E6] shadow-xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold mb-1 text-[#2D3436] tracking-wide">DIGITAL GATE PASS</h3>
                        <p className="text-[#64748b] text-sm mb-6">Show this at the security gate</p>
                        <img src={qrCode} alt="QR Code" className="mx-auto w-64 h-64 border border-[#E0E6E6]" />
                        <button
                            onClick={() => setQrCode(null)}
                            className="mt-6 px-6 py-2 text-sm font-bold text-white bg-[#4CAF50] hover:bg-[#43a047] rounded transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default StudentDashboard;
