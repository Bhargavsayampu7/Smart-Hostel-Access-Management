import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { scanAPI } from '../services/api';

// ─── Native QR Scanner (getUserMedia + jsQR via CDN) ─────────────────────────
function QrScanner({ onScan, onError }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const rafRef = useRef(null);
    const streamRef = useRef(null);
    const lastScan = useRef('');

    const tick = useCallback(() => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
            rafRef.current = requestAnimationFrame(tick);
            return;
        }
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (window.jsQR) {
            const code = window.jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
            if (code && code.data && code.data !== lastScan.current) {
                lastScan.current = code.data;
                onScan(code.data);
                setTimeout(() => { lastScan.current = ''; }, 2000);
            }
        }
        rafRef.current = requestAnimationFrame(tick);
    }, [onScan]);

    useEffect(() => {
        let stopped = false;
        // Load jsQR from CDN if not present
        if (!window.jsQR) {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js';
            script.async = true;
            document.head.appendChild(script);
        }
        navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            .then((stream) => {
                if (stopped) { stream.getTracks().forEach(t => t.stop()); return; }
                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(() => { });
                }
                rafRef.current = requestAnimationFrame(tick);
            })
            .catch((err) => onError && onError(err.message || 'Camera access denied'));
        return () => {
            stopped = true;
            cancelAnimationFrame(rafRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        };
    }, [tick, onError]);

    return (
        <div style={{ position: 'absolute', inset: 0, background: '#000' }}>
            <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>
    );
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const pad = (n) => String(n).padStart(2, '0');

function LiveClock() {
    const [now, setNow] = useState(new Date());
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(id);
    }, []);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return (
        <div className="text-right">
            <div className="font-mono text-xl font-medium text-slate-800 leading-none">
                {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
            </div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                {months[now.getMonth()]} {pad(now.getDate())}, {now.getFullYear()}
            </div>
        </div>
    );
}

// ─── Scan result helpers ──────────────────────────────────────────────────────

function resultToEntry(result, token) {
    return {
        id: Date.now(),
        name: result.student_name || result.studentName || 'Unknown',
        studentId: result.student_id || result.studentId || token?.slice(0, 12) || '—',
        result: result.result === 'allow' ? 'ALLOW' : 'DENY',
        reason: result.reason || '',
        message: result.message || '',   // e.g. "Allowed with violation: 13 minutes late"
        passId: result.pass_id || '',
        time: new Date(),
        room: result.room || '—',
        status: result.status || '',
        lastExit: result.lastExit || '—',
        department: result.department || '',
        year: result.year || '',
    };
}

function fmtTime(d) {
    return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

// ─── Recent scan card ─────────────────────────────────────────────────────────

function ScanCard({ entry, onClick, active }) {
    const allow = entry.result === 'ALLOW';
    return (
        <div
            onClick={() => onClick(entry)}
            className={`p-3 bg-white rounded border shadow-sm hover:shadow-md transition-all cursor-pointer group ${active ? 'border-[#4CAF50]/40' : 'border-[#E0E6E6]'}`}
        >
            <div className="flex gap-3">
                <div className="w-10 h-10 rounded bg-slate-200 overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center text-slate-400 font-bold text-sm">
                    {entry.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-0.5">
                        <span className="text-slate-800 font-semibold text-sm truncate pr-2">{entry.name}</span>
                        <span className={`text-xs font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${allow ? 'text-[#4CAF50] bg-green-50' : 'text-[#D94F4F] bg-[#D94F4F]/10'}`}>
                            {entry.result}
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-slate-500 font-mono">
                        <span>{entry.studentId}</span>
                        <span>{fmtTime(entry.time)}</span>
                    </div>
                    {!allow && entry.reason && (
                        <div className="mt-1.5 inline-block px-1.5 py-0.5 bg-red-50 text-[#D94F4F] text-[10px] font-medium rounded border border-red-100">
                            {entry.reason}
                        </div>
                    )}
                    {allow && entry.message && (
                        <div className={`mt-1.5 px-1.5 py-0.5 text-[10px] font-medium rounded border ${entry.message.includes('violation')
                                ? 'bg-orange-50 text-orange-600 border-orange-200'
                                : 'bg-green-50 text-green-600 border-green-200'
                            }`}>
                            {entry.message}
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
}

// ─── Camera scan frame overlay ────────────────────────────────────────────────

function ScanFrame() {
    return (
        <div className="relative w-72 h-72 border-2 border-[#4CAF50]/50 rounded-lg flex flex-col justify-between p-2 z-10 bg-white/5 backdrop-blur-[2px]"
            style={{ boxShadow: '0 0 50px -10px rgba(76,175,80,0.2)' }}>
            {/* Corners */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#4CAF50] -mt-1 -ml-1" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#4CAF50] -mt-1 -mr-1" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#4CAF50] -mb-1 -ml-1" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#4CAF50] -mb-1 -mr-1" />
            {/* Scan line */}
            <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                <div className="scan-line" />
            </div>
            {/* Label */}
            <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-white font-mono text-xs uppercase tracking-widest bg-black/60 px-3 py-1.5 rounded backdrop-blur-sm shadow-sm">
                    Align QR Code
                </span>
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const SecurityDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const [gateId] = useState('NORTH_GATE_T01');
    const [token, setToken] = useState('');
    const [result, setResult] = useState(null);    // latest scan result entry
    const [loading, setLoading] = useState(false);
    const [scanError, setScanError] = useState('');
    const [recentScans, setRecentScans] = useState([]);
    const [selected, setSelected] = useState(null); // which scan is highlighted in result panel

    const verifyToken = async (value) => {
        if (!value || loading) return;
        setLoading(true);
        setScanError('');
        try {
            const data = await scanAPI.scan(value, gateId);
            const entry = resultToEntry(data, value);
            setResult(entry);
            setSelected(entry);
            setRecentScans((prev) => [entry, ...prev].slice(0, 20));
        } catch (err) {
            const entry = resultToEntry({ result: 'deny', reason: err.message || 'scan_failed' }, value);
            setResult(entry);
            setSelected(entry);
            setRecentScans((prev) => [entry, ...prev].slice(0, 20));
        } finally {
            setLoading(false);
        }
    };

    const handleScanSubmit = (e) => {
        e.preventDefault();
        verifyToken(token.trim());
    };

    const handleLogout = () => { logout(); navigate('/login'); };

    const displayEntry = selected || result;
    const isAllow = displayEntry?.result === 'ALLOW';

    // ── Render ────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Fonts + Icons */}

            <style>{`
                @keyframes scan {
                    0%   { top: 0%;   opacity: 0; }
                    10%  { opacity: 1; }
                    90%  { opacity: 1; }
                    100% { top: 100%; opacity: 0; }
                }
                .scan-line {
                    width: 100%; height: 2px;
                    background: #4CAF50; position: absolute;
                    box-shadow: 0 0 15px #4CAF50, 0 0 5px #4CAF50;
                    animation: scan 2s linear infinite;
                }
                .grid-overlay {
                    background-image:
                        linear-gradient(rgba(76,175,80,0.1) 1px, transparent 1px),
                        linear-gradient(90deg, rgba(76,175,80,0.1) 1px, transparent 1px);
                    background-size: 40px 40px;
                }
                @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
                .live-indicator { animation: blink 2s infinite; }
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius:4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #4CAF50; }
            `}</style>

            <div className="bg-[#F7F9F9] text-slate-900 min-h-screen flex flex-col overflow-hidden" style={{ fontFamily: "'Public Sans', sans-serif" }}>

                {/* ── Header ── */}
                <header className="h-16 flex items-center justify-between px-6 border-b border-[#E0E6E6] bg-white shrink-0 z-20 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <span className="material-icons-round text-[#4CAF50] text-2xl">security</span>
                            <h1 className="text-xl font-bold tracking-tight text-slate-800">
                                GATEKEEPER <span className="text-[#4CAF50] font-normal">OS</span>
                            </h1>
                        </div>
                        <div className="h-6 w-px bg-slate-200 mx-2" />
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                            <span className="material-icons-round text-base">place</span>
                            <span className="font-medium tracking-wide text-slate-700">NORTH GATE - TERMINAL 01</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* System online status */}
                        <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                            <div className="w-2 h-2 rounded-full bg-[#4CAF50] live-indicator" style={{ boxShadow: '0 0 8px #4CAF50' }} />
                            <span className="text-[#4CAF50] font-mono font-bold text-sm tracking-wider">SYSTEM ONLINE</span>
                        </div>

                        <LiveClock />

                        <button className="w-10 h-10 flex items-center justify-center rounded hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-800 relative">
                            <span className="material-icons-round">notifications</span>
                            <span className="absolute top-2 right-2 w-2 h-2 bg-[#4CAF50] rounded-full border border-white" />
                        </button>

                        <button
                            onClick={handleLogout}
                            className="w-8 h-8 rounded bg-[#4CAF50] text-white font-bold flex items-center justify-center text-sm shadow-md hover:bg-[#3d8b40] transition-colors"
                            title="Logout"
                        >
                            {user?.name?.[0]?.toUpperCase() || 'G'}
                        </button>
                    </div>
                </header>

                {/* ── Main Content ── */}
                <main className="flex-1 flex h-[calc(100vh-64px)] overflow-hidden">

                    {/* ── Left: Camera + Input + Result ── */}
                    <section className="flex-1 flex flex-col p-6 gap-6 bg-[#F7F9F9] overflow-y-auto">

                        {/* Camera feed panel */}
                        <div className="flex-1 flex flex-col bg-white rounded-lg border border-[#E0E6E6] overflow-hidden relative shadow-md min-h-[320px]">
                            {/* Camera toolbar */}
                            <div className="bg-white/80 backdrop-blur absolute top-0 w-full p-3 flex justify-between items-center z-10 border-b border-[#E0E6E6]">
                                <span className="text-xs font-mono text-[#4CAF50] flex items-center gap-2 font-bold">
                                    <span className="material-icons-round text-sm animate-spin">sync</span>
                                    LIVE FEED: CAMERA_01
                                </span>
                                <div className="flex gap-2">
                                    <button className="p-1 hover:bg-slate-100 text-slate-500 transition-colors rounded">
                                        <span className="material-icons-round text-lg">settings</span>
                                    </button>
                                    <button className="p-1 hover:bg-slate-100 text-slate-500 transition-colors rounded">
                                        <span className="material-icons-round text-lg">fullscreen</span>
                                    </button>
                                </div>
                            </div>

                            {/* Camera viewport */}
                            <div className="relative flex-1 bg-slate-100 flex items-center justify-center overflow-hidden" style={{ paddingTop: '48px' }}>
                                {/* Grid overlay */}
                                <div className="absolute inset-0 grid-overlay opacity-30 pointer-events-none" />

                                {/* QrScanner — native camera via getUserMedia */}
                                <QrScanner
                                    onScan={async (data) => {
                                        const text = (data || '').trim();
                                        if (text && text !== token && !loading) {
                                            setToken(text);
                                            await verifyToken(text);
                                        }
                                    }}
                                    onError={(err) => err && setScanError(typeof err === 'string' ? err : err.message || 'Camera error')}
                                />

                                <ScanFrame />
                            </div>

                            {/* Manual ID input bar */}
                            <div className="h-20 bg-white border-t border-[#E0E6E6] flex items-center px-6 gap-4 shrink-0">
                                <form onSubmit={handleScanSubmit} className="flex items-center gap-4 w-full">
                                    <div className="flex-1 relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 material-icons-round">keyboard</span>
                                        <input
                                            className="w-full bg-slate-50 border border-slate-200 rounded pl-12 pr-4 py-3 text-slate-900 placeholder-slate-400 focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none font-mono transition-all"
                                            placeholder="Enter Student ID manually (e.g., 2023-CS-042)..."
                                            value={token}
                                            onChange={(e) => setToken(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="bg-[#4CAF50] hover:bg-[#3d8b40] disabled:opacity-60 text-white font-bold px-8 py-3 rounded uppercase tracking-wide text-sm transition-colors flex items-center gap-2 shadow-lg"
                                        style={{ boxShadow: '0 4px 15px rgba(76,175,80,0.3)' }}
                                    >
                                        <span>{loading ? 'Verifying…' : 'Verify ID'}</span>
                                        {!loading && <span className="material-icons-round text-lg">arrow_forward</span>}
                                    </button>
                                </form>
                            </div>
                        </div>

                        {/* Scan result card */}
                        {displayEntry && (
                            <div className="bg-white rounded border border-[#E0E6E6] p-1 relative overflow-hidden shadow-sm">
                                {/* Coloured left stripe */}
                                <div className={`absolute top-0 left-0 w-1 h-full ${isAllow ? 'bg-[#4CAF50]' : 'bg-[#D94F4F]'}`} />
                                <div className="flex items-stretch gap-6 p-4">
                                    {/* Avatar */}
                                    <div className="w-24 h-24 rounded bg-slate-100 shrink-0 border border-slate-200 overflow-hidden relative shadow-inner flex items-center justify-center text-slate-400 font-bold text-3xl">
                                        {displayEntry.name?.[0]?.toUpperCase() || '?'}
                                        <div className={`absolute bottom-0 inset-x-0 ${isAllow ? 'bg-[#4CAF50]' : 'bg-[#D94F4F]'} text-white text-[10px] text-center py-0.5 font-mono font-bold tracking-wider`}>
                                            {isAllow ? 'LIVE SCAN' : 'DENIED'}
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 flex flex-col justify-center">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h2 className="text-2xl font-bold text-slate-900 leading-tight">{displayEntry.name}</h2>
                                                <p className="text-slate-500 text-sm mt-1">
                                                    {displayEntry.department}{displayEntry.year ? ` • Year ${displayEntry.year}` : ''}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded shadow-sm font-bold text-sm uppercase tracking-wide text-white ${isAllow ? 'bg-[#4CAF50]' : 'bg-[#D94F4F]'}`}>
                                                    <span className="material-icons-round text-base">{isAllow ? 'check_circle' : 'cancel'}</span>
                                                    {isAllow ? 'ALLOW ENTRY' : 'DENY ENTRY'}
                                                </span>
                                                <div className="text-slate-400 text-xs font-mono mt-2">ID: #{displayEntry.studentId}</div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mt-4 border-t border-slate-100 pt-3">
                                            <div>
                                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-0.5">Room No.</span>
                                                <span className="text-slate-800 font-mono text-sm font-medium">{displayEntry.room}</span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-0.5">Status</span>
                                                <span className={`font-mono text-sm font-bold ${isAllow ? 'text-[#4CAF50]' : 'text-[#D94F4F]'}`}>
                                                    {isAllow ? 'Active Resident' : displayEntry.reason || 'Denied'}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-[10px] uppercase text-slate-400 font-bold tracking-wider block mb-0.5">Pass ID</span>
                                                <span className="text-slate-800 font-mono text-sm font-medium">{displayEntry.passId || '—'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {scanError && (
                            <p className="text-sm text-red-500 font-mono">{scanError}</p>
                        )}
                    </section>

                    {/* ── Right Sidebar: Recent Scans ── */}
                    <aside className="w-96 bg-white border-l border-[#E0E6E6] flex flex-col shrink-0 shadow-sm">
                        {/* Header */}
                        <div className="p-5 border-b border-[#E0E6E6] flex justify-between items-center bg-white">
                            <h3 className="font-bold text-slate-700 uppercase tracking-wider text-sm flex items-center gap-2">
                                <span className="material-icons-round text-[#4CAF50] text-base">history</span>
                                Recent Scans
                            </h3>
                            <button className="text-xs text-[#4CAF50] hover:text-[#3d8b40] transition-colors underline decoration-dotted font-medium">
                                View All
                            </button>
                        </div>

                        {/* Scan list */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3 bg-slate-50/50">
                            {recentScans.length === 0 ? (
                                <div className="text-center py-12 text-slate-400 text-sm font-mono">
                                    No scans yet. Scan a QR or enter an ID.
                                </div>
                            ) : (
                                recentScans.map((entry) => (
                                    <ScanCard
                                        key={entry.id}
                                        entry={entry}
                                        onClick={setSelected}
                                        active={selected?.id === entry.id}
                                    />
                                ))
                            )}
                        </div>

                        {/* Quick actions */}
                        <div className="p-4 border-t border-[#E0E6E6] bg-white">
                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex flex-col items-center justify-center p-3 rounded bg-slate-50 border border-slate-200 hover:border-[#D94F4F]/30 hover:bg-red-50 text-slate-500 hover:text-[#D94F4F] transition-all group shadow-sm">
                                    <span className="material-icons-round text-2xl mb-1 group-hover:scale-110 transition-transform">report_problem</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wide">Report Incident</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-3 rounded bg-slate-50 border border-slate-200 hover:border-[#4CAF50]/30 hover:bg-green-50 text-slate-500 hover:text-[#4CAF50] transition-all group shadow-sm">
                                    <span className="material-icons-round text-2xl mb-1 group-hover:scale-110 transition-transform">lock_open</span>
                                    <span className="text-[10px] uppercase font-bold tracking-wide">Manual Override</span>
                                </button>
                            </div>
                        </div>
                    </aside>
                </main>
            </div>
        </>
    );
};

export default SecurityDashboard;
