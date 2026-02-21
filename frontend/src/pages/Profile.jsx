import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../services/api';

const Profile = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await studentAPI.getStats();
                setStats(data);
            } catch (err) {
                console.error('Failed to fetch stats for profile', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Derived values
    const safeScore = 15; // Example dynamic value as per design
    const attendance = 98; // Example dynamic value
    const lateEntries = stats?.lateReturns || 0;

    const studentName = user?.name || 'Student';
    const initial = studentName[0]?.toUpperCase() || 'S';
    const studentId = user?.studentId || user?._id?.slice(-8)?.toUpperCase() || 'ST-2024-8892';

    return (
        <div className="bg-[#f6f8f6] dark:bg-[#102216] font-sans text-slate-900 dark:text-slate-100 min-h-screen flex flex-col" style={{ fontFamily: "'Public Sans', sans-serif" }}>
            {/* Fonts */}

<style>{`
                .font-ibm { font-family: 'IBM Plex Mono', monospace; }
                .font-dm { font-family: 'DM Sans', sans-serif; }
            `}</style>

            {/* Header */}
            <header className="sticky top-0 z-50 flex items-center justify-between whitespace-nowrap border-b border-solid border-slate-200 bg-white dark:bg-[#152e1e] dark:border-slate-800 px-6 py-3 shadow-sm">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 text-slate-900 dark:text-white">
                        <div className="size-8 bg-[#13ec5b] flex items-center justify-center rounded text-black">
                            <span className="material-symbols-outlined text-2xl">shield_person</span>
                        </div>
                        <h2 className="text-lg font-bold leading-tight tracking-tight">GateKeeper <span className="text-xs font-normal text-slate-500 uppercase tracking-widest ml-1">Student</span></h2>
                    </div>
                    <nav className="hidden md:flex items-center gap-6">
                        <Link to="/profile" className="text-slate-900 dark:text-white border-b-2 border-[#13ec5b] text-sm font-medium">My Profile</Link>
                        <Link to="/student" className="text-slate-600 dark:text-slate-300 hover:text-[#13ec5b] text-sm font-medium transition-colors">Gatepasses</Link>
                        <a href="#" className="text-slate-600 dark:text-slate-300 hover:text-[#13ec5b] text-sm font-medium transition-colors">Notifications</a>
                        <a href="#" className="text-slate-600 dark:text-slate-300 hover:text-[#13ec5b] text-sm font-medium transition-colors">Help & Support</a>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden lg:flex flex-col text-right">
                        <span className="text-xs font-ibm text-slate-500 font-medium">SYSTEM TIME</span>
                        <span className="text-sm font-ibm font-bold">14:32:05 UTC</span>
                    </div>
                    <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-700 mx-2 hidden lg:block" />
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-slate-500 overflow-hidden relative">
                            {initial}
                            <div className="absolute inset-0 bg-cover bg-center opacity-0 hover:opacity-100 transition-opacity" style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCAPUMvXPp47qR1_had5Bqvf9MK4N5vraaGnxsR2Ag265Wmupj6qy6o69fQwdWRkWVFcN3BU0VD_7kjV7By4uctqTtvnssD-hyei8DNjYVY60hOivJVUhgBTvGtHQ1kF8LAE5mprpAa-f4T8ZjPRRpHy7HenRmLaulEk-LxkrsXS4SLqxxHro6zzY9PAS4VXFTxpeG-C62-JnfEDPE_sHCVkWeJkQzw-YU5TzAWo2LXXx2D2DY1KyqSlnE3Mb4RUMCd6kuqRHMjog")' }} />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-xs text-slate-500 font-medium leading-none mb-1">Student</p>
                            <p className="text-sm font-bold leading-none">{studentName}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-grow p-6 lg:px-12 lg:py-8 max-w-[1600px] mx-auto w-full">

                {/* Top Section */}
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                    <div>
                        <nav className="flex text-xs font-medium text-slate-500 mb-2 font-dm uppercase tracking-wide">
                            <Link to="/student" className="hover:text-[#13ec5b] cursor-pointer">Portal</Link>
                            <span className="mx-2">/</span>
                            <span className="text-slate-900 dark:text-white">My Profile</span>
                        </nav>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-display">
                            Welcome back, {studentName.split(' ')[0]}
                        </h1>
                    </div>
                    <div className="flex gap-3">
                        <Link to="/student" className="flex items-center gap-2 px-6 py-3 bg-[#13ec5b] text-black text-sm font-bold rounded shadow-sm hover:bg-[#0fd650] transition-colors font-dm ring-2 ring-[#13ec5b]/20 ring-offset-1">
                            <span className="material-symbols-outlined text-xl">add_circle</span>
                            Request New Gatepass
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Left Column - Profile Card */}
                    <div className="lg:col-span-4 xl:col-span-3 flex flex-col gap-4">
                        <div className="bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
                            {/* Photo Area */}
                            <div className="relative w-full aspect-square bg-slate-100 rounded-lg overflow-hidden mb-5 border border-slate-200 dark:border-slate-600 group flex items-center justify-center">
                                <span className="text-6xl text-slate-300 font-bold">{initial}</span>
                                <div className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105" data-alt={`Portrait of ${studentName}`} style={{ backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuCAPUMvXPp47qR1_had5Bqvf9MK4N5vraaGnxsR2Ag265Wmupj6qy6o69fQwdWRkWVFcN3BU0VD_7kjV7By4uctqTtvnssD-hyei8DNjYVY60hOivJVUhgBTvGtHQ1kF8LAE5mprpAa-f4T8ZjPRRpHy7HenRmLaulEk-LxkrsXS4SLqxxHro6zzY9PAS4VXFTxpeG-C62-JnfEDPE_sHCVkWeJkQzw-YU5TzAWo2LXXx2D2DY1KyqSlnE3Mb4RUMCd6kuqRHMjog")' }} />
                                <div className="absolute bottom-2 right-2">
                                    <span className="flex size-3">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#13ec5b] opacity-75" />
                                        <span className="relative inline-flex rounded-full size-3 bg-[#13ec5b]" />
                                    </span>
                                </div>
                            </div>

                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight mb-1 font-display">{studentName}</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400 font-ibm tracking-wide">ID: {studentId}</p>
                            </div>

                            {/* Safety Score */}
                            <div className="bg-[#13ec5b]/10 border border-[#13ec5b]/20 rounded p-4 mb-6">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-dm">My Safety Score</span>
                                    <span className="material-symbols-outlined text-[#13ec5b] text-xl">verified_user</span>
                                </div>
                                <div className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-[#13ec5b]" />
                                    GOOD STANDING
                                </div>
                                <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 dark:bg-slate-700">
                                    <div className="bg-[#13ec5b] h-1.5 rounded-full" style={{ width: '15%' }} />
                                </div>
                                <p className="text-xs text-slate-500 mt-2 font-ibm">Score: {safeScore}/100 (Safe)</p>
                            </div>

                            {/* Actions */}
                            <div className="grid grid-cols-2 gap-3">
                                <button className="flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group">
                                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 mb-1 group-hover:text-[#13ec5b]">contact_emergency</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">SOS</span>
                                </button>
                                <button className="flex flex-col items-center justify-center p-3 border border-slate-200 dark:border-slate-600 rounded bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group">
                                    <span className="material-symbols-outlined text-slate-600 dark:text-slate-300 mb-1 group-hover:text-[#13ec5b]">support_agent</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Support</span>
                                </button>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 rounded-lg p-5 shadow-sm">
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 font-dm">My Recent Activity</h3>
                            <div className="flex items-start gap-3">
                                <div className="size-10 rounded bg-slate-100 flex items-center justify-center text-slate-600">
                                    <span className="material-symbols-outlined">door_front</span>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">Main Gate Entrance</p>
                                    <p className="text-xs text-slate-500 font-ibm mt-1">Checked In • Today, 08:45 AM</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Info & Stats */}
                    <div className="lg:col-span-8 xl:col-span-9 flex flex-col gap-6">

                        {/* Personal Information */}
                        <div className="bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-dm">Personal Information</h3>
                                <button className="text-[#13ec5b] text-xs font-bold hover:underline flex items-center gap-1">
                                    REQUEST INFORMATION UPDATE
                                    <span className="material-symbols-outlined text-sm">edit_note</span>
                                </button>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-8">
                                <div>
                                    <p className="text-xs text-slate-500 font-dm mb-1">Hostel Block</p>
                                    <p className="text-sm font-ibm font-medium text-slate-900 dark:text-white">{stats?.block ? `Block ${stats.block}` : 'Block B (North Wing)'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-dm mb-1">Room Number</p>
                                    <p className="text-sm font-ibm font-medium text-slate-900 dark:text-white">{stats?.room ? stats.room : '304'}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-dm mb-1">Date of Birth</p>
                                    <p className="text-sm font-ibm font-medium text-slate-900 dark:text-white">12 Aug 2002</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-dm mb-1">Program</p>
                                    <p className="text-sm font-ibm font-medium text-slate-900 dark:text-white">B.Tech Computer Science</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-dm mb-1">Contact Number</p>
                                    <p className="text-sm font-ibm font-medium text-slate-900 dark:text-white">+1 (555) 0199-283</p>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-500 font-dm mb-1">Guardian Contact</p>
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-ibm font-medium text-slate-900 dark:text-white">Mrs. Mercer (Mother)</p>
                                        <span className="text-slate-400 cursor-not-allowed" title="Contact Admin to update"><span className="material-symbols-outlined text-[16px]">lock</span></span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Stats Row */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                            {/* Trend Chart */}
                            <div className="lg:col-span-2 bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-dm">My Activity Trend (30 Days)</h3>
                                    <div className="flex items-center gap-2">
                                        <span className="size-2 rounded-full bg-slate-300" />
                                        <span className="text-xs text-slate-500 font-ibm">Avg: Normal</span>
                                    </div>
                                </div>
                                <div className="h-32 flex items-end justify-between gap-1 w-full px-2">
                                    {[20, 15, 18, 12, 10, 45, 25, 15, 12, 10, 10, 15, 10, 10].map((val, idx) => (
                                        <div key={idx} className="w-full bg-[#13ec5b]/20 rounded-t-sm hover:bg-[#13ec5b] transition-colors group relative" style={{ height: `${val}%` }}>
                                            <div className="hidden group-hover:block absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] px-2 py-1 rounded">Day {idx + 1}</div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-4 flex justify-between text-[10px] text-slate-400 font-ibm uppercase">
                                    <span>Last Month</span>
                                    <span>Yesterday</span>
                                </div>
                            </div>

                            <div className="flex flex-col gap-4">
                                {/* Attendance Stat */}
                                <div className="flex-1 bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 rounded-lg p-5 flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-4 opacity-10">
                                        <span className="material-symbols-outlined text-6xl text-slate-900 dark:text-white">event_available</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-dm font-bold uppercase tracking-wider mb-2">My Attendance Stats</p>
                                    <p className="text-3xl font-bold font-ibm text-slate-900 dark:text-white">{attendance}%</p>
                                    <p className="text-xs text-slate-400 mt-1 font-dm">Attendance Rate</p>
                                </div>

                                {/* Late Entries */}
                                <div className="flex-1 bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 rounded-lg p-5 flex flex-col justify-center relative overflow-hidden">
                                    <div className="absolute right-0 top-0 p-4 opacity-10">
                                        <span className="material-symbols-outlined text-6xl text-slate-900 dark:text-white">history_toggle_off</span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-dm font-bold uppercase tracking-wider mb-2">Late Entries</p>
                                    <p className="text-3xl font-bold font-ibm text-slate-900 dark:text-white">{loading ? '—' : lateEntries}</p>
                                    <p className="text-xs text-slate-400 mt-1 font-dm">This Semester</p>
                                </div>
                            </div>
                        </div>

                        {/* Digital Credentials */}
                        <div className="bg-white dark:bg-[#1a2c20] border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">
                            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700">
                                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-dm">Digital Credentials</h3>
                            </div>
                            <div className="p-6">
                                <div className="flex flex-col md:flex-row gap-6">
                                    <div className="flex-1 border border-slate-200 dark:border-slate-600 rounded p-4 flex items-center justify-between bg-slate-50 dark:bg-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 bg-white dark:bg-black rounded flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                <span className="material-symbols-outlined text-2xl text-slate-800 dark:text-slate-200">qr_code_2</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">My QR Gate Pass</p>
                                                <p className="text-xs text-slate-500">Auto-generated daily</p>
                                            </div>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" defaultChecked className="sr-only peer" />
                                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#13ec5b]" />
                                        </label>
                                    </div>

                                    <div className="flex-1 border border-slate-200 dark:border-slate-600 rounded p-4 flex items-center justify-between bg-slate-50 dark:bg-white/5">
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 bg-white dark:bg-black rounded flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                                <span className="material-symbols-outlined text-2xl text-slate-800 dark:text-slate-200">fingerprint</span>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white">Biometrics</p>
                                                <p className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                    ENROLLED
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-400 font-ibm">Last Updated</p>
                                            <p className="text-xs font-bold font-ibm text-slate-700 dark:text-slate-300">01 Sep 2024</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Info */}
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-4 px-2">
                            <p className="font-dm">GateKeeper Student Portal v4.2.0</p>
                            <p className="font-ibm">Last Synced: Just now</p>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Profile;
