import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { parentAPI, requestAPI, locationAPI } from '../services/api';

// ─── helpers ────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

function fmtDate(iso) {
    if (!iso) return '--';
    const d = new Date(iso);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[d.getMonth()]} ${pad(d.getDate())}`;
}

function fmtDateTime(iso) {
    if (!iso) return '--';
    const d = new Date(iso);
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return `${months[d.getMonth()]} ${pad(d.getDate())}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fmtTime(iso) {
    if (!iso) return '--:--:--';
    const d = new Date(iso);
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function ActivityStatusBadge({ status }) {
    if (status === 'completed' || status === 'approved') {
        return (
            <span className="inline-block px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 text-[10px] font-bold uppercase rounded-sm">
                Completed
            </span>
        );
    }
    if (status === 'rejected') {
        return (
            <span className="inline-block px-2 py-0.5 bg-gray-50 border border-gray-200 text-gray-500 line-through text-[10px] font-bold uppercase rounded-sm">
                Rejected
            </span>
        );
    }
    if (status === 'late') {
        return (
            <span className="inline-block px-2 py-0.5 bg-red-50 border border-red-200 text-[#D94F4F] text-[10px] font-bold uppercase rounded-sm">
                Late
            </span>
        );
    }
    return (
        <span className="inline-block px-2 py-0.5 bg-yellow-50 border border-yellow-200 text-yellow-700 text-[10px] font-bold uppercase rounded-sm">
            {status}
        </span>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────

const ParentDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [pendingRequests, setPendingRequests] = useState([]);
    const [activity, setActivity] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [lastLocation, setLastLocation] = useState(null);
    const [activePassId, setActivePassId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Which pending request is shown in the approval card (first by default)
    const [selectedReqIdx, setSelectedReqIdx] = useState(0);

    const fetchData = async () => {
        try {
            const [pendingData, activityData, dashboardData] = await Promise.all([
                parentAPI.getPendingApprovals(),
                parentAPI.getActivity(),
                parentAPI.getDashboard(),
            ]);
            const pending = pendingData.requests || [];
            const acts = activityData.requests || [];
            setPendingRequests(pending);
            setActivity(acts);
            setDashboard(dashboardData);

            const activePass = acts.find((r) => r.status === 'approved');
            if (activePass?._id) {
                setActivePassId(activePass._id);
                try { setLastLocation(await locationAPI.latest(activePass._id)); }
                catch { setLastLocation(null); }
            } else {
                setActivePassId(null);
                setLastLocation(null);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    useEffect(() => {
        if (!activePassId) return;
        let cancelled = false;
        const refresh = async () => {
            try {
                const loc = await locationAPI.latest(activePassId);
                if (!cancelled) setLastLocation(loc);
            } catch {
                if (!cancelled) setLastLocation(null);
            }
        };
        const id = window.setInterval(refresh, 30_000);
        return () => { cancelled = true; window.clearInterval(id); };
    }, [activePassId]);

    const handleApproval = async (id, approved) => {
        try {
            await requestAPI.parentApprove(id, approved);
            fetchData();
        } catch (err) { alert(err.message); }
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    // Focused pending request
    const focusedReq = pendingRequests[selectedReqIdx] || null;

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Font + Icons */}

            <div className="min-h-screen flex flex-col bg-[#F7F9F9]" style={{ fontFamily: "'DM Sans', sans-serif", color: '#2D3436' }}>

                {/* ── Top Navbar ── */}
                <header className="w-full border-b border-[#E0E6E6] bg-white px-4 md:px-6 py-3 md:py-4 flex flex-col sticky top-0 z-50">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[#4CAF50] text-2xl md:text-3xl">shield_person</span>
                            <div>
                                <h1 className="text-[#2D3436] text-base md:text-lg font-bold tracking-tight uppercase">Parental Oversight Portal</h1>
                                <p className="text-[#4CAF50] text-[10px] font-mono tracking-widest uppercase">SECURE CONNECTION ESTABLISHED</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Desktop nav - hidden on mobile */}
                            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-[#636E72]">
                                <span className="text-[#2D3436] border-b-2 border-[#4CAF50] pb-0.5 cursor-default">DASHBOARD</span>
                                <a href="#" className="hover:text-[#4CAF50] transition-colors pb-0.5 border-b-2 border-transparent">STUDENTS</a>
                                <a href="#" className="hover:text-[#4CAF50] transition-colors pb-0.5 border-b-2 border-transparent">HISTORY</a>
                                <button onClick={handleLogout} className="hover:text-[#4CAF50] transition-colors pb-0.5 border-b-2 border-transparent">LOGOUT</button>
                            </nav>

                            {/* Notification + avatar */}
                            <div className="flex items-center gap-3 md:gap-4 md:border-l md:border-[#E0E6E6] md:pl-6">
                                <button className="relative text-[#636E72] hover:text-[#2D3436] transition-colors">
                                    <span className="material-symbols-outlined">notifications</span>
                                    {pendingRequests.length > 0 && (
                                        <span className="absolute top-0 right-0 size-2 bg-[#4CAF50] rounded-full ring-2 ring-white"></span>
                                    )}
                                </button>
                                <div className="size-8 rounded bg-[#4CAF50]/10 border border-[#E0E6E6] flex items-center justify-center text-[#4CAF50] font-bold text-sm">
                                    {user?.name?.[0]?.toUpperCase() || 'P'}
                                </div>
                                {/* Hamburger - mobile only */}
                                <button className="md:hidden text-[#636E72] p-1" onClick={() => setMobileMenuOpen(v => !v)}>
                                    <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Mobile dropdown nav */}
                    {mobileMenuOpen && (
                        <nav className="md:hidden flex flex-col gap-1 pt-3 pb-1 border-t border-[#E0E6E6] mt-3 text-sm font-medium text-[#636E72]">
                            <span className="text-[#2D3436] font-bold py-2">DASHBOARD</span>
                            <a href="#" className="hover:text-[#4CAF50] py-2">STUDENTS</a>
                            <a href="#" className="hover:text-[#4CAF50] py-2">HISTORY</a>
                            <button onClick={handleLogout} className="text-left hover:text-[#4CAF50] py-2">LOGOUT</button>
                        </nav>
                    )}
                </header>

                {/* ── Main Grid ── */}
                <main className="flex-1 p-4 md:p-6 lg:p-10 w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

                    {/* ── LEFT COLUMN (8/12) ── */}
                    <div className="lg:col-span-8 flex flex-col gap-6">

                        {/* Action Required Banner */}
                        {focusedReq ? (
                            <div className="bg-[#E8F5E9] border-l-4 border-l-[#4CAF50] p-4 flex items-start gap-4 rounded-sm">
                                <span className="material-symbols-outlined text-[#4CAF50]">warning</span>
                                <div>
                                    <h3 className="text-[#2D3436] font-bold text-sm uppercase tracking-wider mb-1">Action Required</h3>
                                    <p className="text-[#636E72] text-sm">
                                        {focusedReq.studentName || 'Your child'} has requested a {focusedReq.reason || 'pass'} for {fmtTime(focusedReq.departureTime)} HRS. Approval needed immediately.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-slate-50 border-l-4 border-l-slate-300 p-4 flex items-start gap-4 rounded-sm">
                                <span className="material-symbols-outlined text-slate-400">info</span>
                                <div>
                                    <h3 className="text-[#2D3436] font-bold text-sm uppercase tracking-wider mb-1">All Clear</h3>
                                    <p className="text-[#636E72] text-sm">No pending approval requests at this time.</p>
                                </div>
                            </div>
                        )}

                        {/* Request Approval Card */}
                        {focusedReq ? (
                            <div className="bg-white border border-[#E0E6E6] rounded-sm overflow-hidden flex flex-col md:flex-row shadow-sm">
                                {/* Student info panel */}
                                <div className="w-full md:w-64 bg-[#F7F9F9] p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-[#E0E6E6] shrink-0">
                                    <div className="size-32 rounded-sm overflow-hidden border border-[#E0E6E6] mb-4 bg-slate-100 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-slate-300" style={{ fontSize: 64 }}>person</span>
                                    </div>
                                    <h2 className="text-[#2D3436] font-bold text-lg text-center uppercase">
                                        {focusedReq.studentName || 'Student'}
                                    </h2>
                                    <p className="text-[#636E72] text-xs font-mono mt-1">
                                        ID: {focusedReq.studentId || focusedReq._id?.slice(-8)?.toUpperCase() || '----'}
                                    </p>
                                    <div className="mt-4 px-3 py-1 bg-yellow-100 border border-yellow-200 text-yellow-800 text-xs font-bold uppercase tracking-widest rounded-sm">
                                        Pending
                                    </div>
                                    {/* Selector if multiple pending */}
                                    {pendingRequests.length > 1 && (
                                        <div className="mt-4 flex gap-2">
                                            {pendingRequests.map((_, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => setSelectedReqIdx(i)}
                                                    className={`size-2 rounded-full transition-colors ${i === selectedReqIdx ? 'bg-[#4CAF50]' : 'bg-slate-300'}`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Request details */}
                                <div className="flex-1 p-6 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <p className="text-[#636E72] text-xs font-mono uppercase mb-1">Request Type</p>
                                                <h3 className="text-xl font-bold text-[#2D3436] flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-[#4CAF50]">
                                                        {focusedReq.type === 'emergency' ? 'emergency' : focusedReq.type === 'homepass' ? 'home' : 'medical_services'}
                                                    </span>
                                                    {focusedReq.reason || 'Pass Request'}
                                                </h3>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[#636E72] text-xs font-mono uppercase mb-1">Request Time</p>
                                                <p className="text-[#2D3436] font-mono font-medium">{fmtDateTime(focusedReq.createdAt)}</p>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-6">
                                            <div className="bg-[#F7F9F9] p-3 border border-[#E0E6E6] rounded-sm">
                                                <p className="text-[#636E72] text-[10px] font-mono uppercase mb-1">Destination</p>
                                                <p className="text-[#2D3436] font-medium text-sm">{focusedReq.destination || 'Not specified'}</p>
                                            </div>
                                            <div className="bg-[#F7F9F9] p-3 border border-[#E0E6E6] rounded-sm">
                                                <p className="text-[#636E72] text-[10px] font-mono uppercase mb-1">Emergency Contact</p>
                                                <p className="text-[#2D3436] font-medium text-sm">{focusedReq.emergencyContact || 'None'}</p>
                                            </div>
                                            <div className="bg-[#F7F9F9] p-3 border border-[#E0E6E6] rounded-sm border-l-4 border-l-[#4CAF50]">
                                                <p className="text-[#636E72] text-[10px] font-mono uppercase mb-1">Departure</p>
                                                <p className="text-[#4CAF50] font-mono text-lg font-bold">{fmtTime(focusedReq.departureTime)}</p>
                                            </div>
                                            <div className="bg-[#F7F9F9] p-3 border border-[#E0E6E6] rounded-sm border-l-4 border-l-[#4CAF50]">
                                                <p className="text-[#636E72] text-[10px] font-mono uppercase mb-1">Expected Return</p>
                                                <p className="text-[#4CAF50] font-mono text-lg font-bold">{fmtTime(focusedReq.returnTime)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action buttons */}
                                    <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[#E0E6E6]">
                                        <button
                                            onClick={() => handleApproval(focusedReq._id, true)}
                                            className="flex-1 h-12 bg-[#4CAF50] hover:bg-green-600 text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-colors rounded-sm shadow-sm"
                                        >
                                            <span className="material-symbols-outlined">check_circle</span>
                                            Approve Request
                                        </button>
                                        <button
                                            onClick={() => handleApproval(focusedReq._id, false)}
                                            className="flex-1 h-12 bg-[#D94F4F] hover:bg-red-700 text-white font-bold uppercase tracking-wider text-sm flex items-center justify-center gap-2 transition-colors rounded-sm shadow-sm"
                                        >
                                            <span className="material-symbols-outlined">cancel</span>
                                            Reject Request
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Empty state for approval card */
                            <div className="bg-white border border-[#E0E6E6] rounded-sm p-10 text-center shadow-sm">
                                <span className="material-symbols-outlined text-slate-300" style={{ fontSize: 56 }}>task_alt</span>
                                <p className="text-[#636E72] mt-3 text-sm">No pending approvals — you're all caught up!</p>
                            </div>
                        )}

                        {/* Live GPS Feed */}
                        <div className="bg-white border border-[#E0E6E6] rounded-sm overflow-hidden flex flex-col h-[360px] shadow-sm">
                            <div className="px-4 py-3 border-b border-[#E0E6E6] flex justify-between items-center bg-[#F7F9F9]">
                                <h3 className="text-[#2D3436] text-sm font-bold uppercase flex items-center gap-2">
                                    <span className="material-symbols-outlined text-[#4CAF50] text-base">my_location</span>
                                    Live GPS Feed
                                </h3>
                                <div className="flex items-center gap-4 text-xs font-mono text-[#636E72]">
                                    {lastLocation ? (
                                        <>
                                            <span>SIGNAL: STRONG</span>
                                            <span>LAT: {lastLocation.lat?.toFixed(4)}° N</span>
                                            <span>LNG: {lastLocation.lon?.toFixed(4)}° E</span>
                                        </>
                                    ) : (
                                        <span>NO ACTIVE PASS</span>
                                    )}
                                </div>
                            </div>

                            {/* Map area */}
                            {lastLocation ? (
                                <div className="flex-1 overflow-hidden">
                                    <iframe
                                        title="Child live location"
                                        className="w-full h-full"
                                        loading="lazy"
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps?q=${lastLocation.lat},${lastLocation.lon}&z=15&output=embed`}
                                    />
                                </div>
                            ) : (
                                <div className="relative flex-1 bg-slate-50 w-full">
                                    {/* Grid overlay */}
                                    <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none" />
                                    {/* Centre marker */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-2">
                                        <div className="relative">
                                            <div className="size-4 bg-[#4CAF50] rounded-full animate-ping absolute inset-0 opacity-75" />
                                            <div className="size-4 bg-[#4CAF50] rounded-full border-2 border-white relative z-10 shadow-lg" />
                                        </div>
                                        <div className="bg-white/90 backdrop-blur border border-[#E0E6E6] px-2 py-1 rounded text-[10px] font-mono text-[#2D3436] uppercase whitespace-nowrap shadow-sm">
                                            Hostel Block A
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT COLUMN (4/12) ── */}
                    <div className="lg:col-span-4 flex flex-col gap-6">

                        {/* Stat cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-[#E0E6E6] p-4 rounded-sm flex flex-col gap-1 shadow-sm">
                                <span className="text-[#636E72] text-[10px] font-mono uppercase">Passes Used (Monthly)</span>
                                <span className="text-[#2D3436] text-2xl font-bold font-mono">
                                    {String(dashboard?.approvedCount || 0).padStart(2, '0')}
                                    <span className="text-gray-400 text-lg">/05</span>
                                </span>
                            </div>
                            <div className="bg-white border border-[#E0E6E6] p-4 rounded-sm flex flex-col gap-1 shadow-sm">
                                <span className="text-[#636E72] text-[10px] font-mono uppercase">Pending Approvals</span>
                                <span className="text-[#2D3436] text-2xl font-bold font-mono">
                                    {String(pendingRequests.length).padStart(2, '0')}
                                </span>
                            </div>
                        </div>

                        {/* Activity Log */}
                        <div className="bg-white border border-[#E0E6E6] rounded-sm flex flex-col flex-1 min-h-[300px] shadow-sm">
                            <div className="p-4 border-b border-[#E0E6E6] flex justify-between items-center bg-[#F7F9F9]">
                                <h3 className="text-[#2D3436] text-sm font-bold uppercase">Activity Log</h3>
                                <button className="text-[#4CAF50] text-xs font-bold uppercase hover:underline">View All</button>
                            </div>
                            <div className="flex-1 overflow-y-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-[#F7F9F9] sticky top-0 z-10">
                                        <tr>
                                            <th className="p-3 text-[10px] font-mono uppercase text-[#636E72] font-normal border-b border-[#E0E6E6]">Date</th>
                                            <th className="p-3 text-[10px] font-mono uppercase text-[#636E72] font-normal border-b border-[#E0E6E6]">Time</th>
                                            <th className="p-3 text-[10px] font-mono uppercase text-[#636E72] font-normal border-b border-[#E0E6E6] text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={3} className="p-4 text-center text-[#636E72] text-xs font-mono">Loading...</td>
                                            </tr>
                                        ) : activity.length === 0 ? (
                                            <tr>
                                                <td colSpan={3} className="p-4 text-center text-[#636E72] text-xs font-mono">No activity yet.</td>
                                            </tr>
                                        ) : (
                                            activity.slice(0, 10).map((act) => (
                                                <tr key={act._id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="p-3 border-b border-[#E0E6E6] text-[#2D3436] font-mono text-xs font-medium">
                                                        {fmtDate(act.departureTime)}
                                                    </td>
                                                    <td className="p-3 border-b border-[#E0E6E6]">
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-2 text-xs font-mono text-[#2D3436]">
                                                                <span className="text-[#4CAF50] font-bold w-6">OUT</span>
                                                                {act.departureTime ? `${pad(new Date(act.departureTime).getHours())}:${pad(new Date(act.departureTime).getMinutes())}` : '--:--'}
                                                            </div>
                                                            {act.status !== 'pending' && act.status !== 'rejected' && (
                                                                <div className="flex items-center gap-2 text-xs font-mono text-[#636E72]">
                                                                    <span className="w-6 font-bold">IN</span>
                                                                    {(() => {
                                                                        // Show actual scan-in time if available, else planned return time
                                                                        const inTime = act.actualReturnTime || act.returnTime;
                                                                        return inTime
                                                                            ? `${pad(new Date(inTime).getHours())}:${pad(new Date(inTime).getMinutes())}`
                                                                            : '--:--';
                                                                    })()}
                                                                    {act.actualReturnTime && act.returnTime && new Date(act.actualReturnTime) > new Date(act.returnTime) && (
                                                                        <span className="ml-1 text-[#D94F4F] text-[10px] font-bold">LATE</span>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {act.status === 'rejected' && (
                                                                <div className="flex items-center gap-2 text-xs font-mono text-[#636E72]">
                                                                    <span className="text-[#4CAF50] font-bold w-6">REQ</span>
                                                                    <span>--:--</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-3 border-b border-[#E0E6E6] text-right">
                                                        <ActivityStatusBadge status={act.status} />
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* System Status */}
                        <div className="bg-white border border-[#E0E6E6] p-4 rounded-sm flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="size-2 rounded-full bg-[#4CAF50] animate-pulse" />
                                <span className="text-[#636E72] text-xs font-mono uppercase">System Online</span>
                            </div>
                            <span className="text-gray-400 text-[10px] font-mono">V 2.4.0-SECURE</span>
                        </div>
                    </div>
                </main>
            </div>
        </>
    );
};

export default ParentDashboard;
