import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
    { key: 'student', label: 'Student', icon: 'school', email: 'student@test.com', password: 'student123' },
    { key: 'parent', label: 'Parent', icon: 'family_restroom', email: 'parent@test.com', password: 'parent123' },
    { key: 'warden', label: 'Warden', icon: 'badge', email: 'warden@test.com', password: 'warden123' },
    { key: 'security', label: 'Security', icon: 'security', email: 'security@test.com', password: 'security123' },
];

const FEATURES = [
    { icon: 'monitoring', label: 'Real-time', sub: 'Analytics' },
    { icon: 'qr_code_2', label: 'QR-Based', sub: 'Secure Outpass' },
    { icon: 'psychology', label: 'ML-Driven', sub: 'Risk Scoring' },
];

export default function Login() {
    const [activeRole, setActiveRole] = useState('student');
    const [email, setEmail] = useState('student@test.com');
    const [password, setPassword] = useState('student123');
    const [showPass, setShowPass] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const selectRole = (role) => {
        setActiveRole(role.key);
        setEmail(role.email);
        setPassword(role.password);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(email, password);
            const role = data.user.role;
            if (role === 'student') navigate('/student');
            else if (role === 'parent') navigate('/parent');
            else if (role === 'admin') navigate('/warden');
            else if (role === 'security') navigate('/security');
            else navigate('/');
        } catch (err) {
            setError(err.message || 'Invalid credentials. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    /* ── inline style helpers ── */
    const inputBase = {
        width: '100%', height: 48, paddingLeft: 40, paddingRight: 16,
        background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 10,
        fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box',
        fontFamily: "'IBM Plex Mono', monospace", transition: 'all 0.2s',
    };
    const onFocus = e => {
        e.target.style.background = '#fff';
        e.target.style.borderColor = '#4CAF50';
        e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.1)';
    };
    const onBlur = e => {
        e.target.style.background = '#F8FAFC';
        e.target.style.borderColor = '#E2E8F0';
        e.target.style.boxShadow = 'none';
    };

    return (
        <div style={{
            minHeight: '100vh', display: 'flex', flexDirection: 'column',
            fontFamily: "'Public Sans', sans-serif", background: '#fff',
            color: '#1e293b', overflowX: 'hidden',
        }}>
            {/* ── HEADER ── */}
            <header style={{
                position: 'absolute', top: 0, left: 0, right: 0,
                padding: '24px 48px', display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', zIndex: 20,
            }}>
                {/* Logo */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 6,
                        background: '#4CAF50', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 20, color: '#fff' }}>shield_lock</span>
                    </div>
                    <span style={{
                        fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700,
                        fontSize: 18, letterSpacing: '-0.02em',
                    }}>
                        HOSTEL<span style={{ color: '#4CAF50' }}>GUARD</span>
                    </span>
                </div>
                {/* Nav */}
                <nav style={{ display: 'flex', gap: 24 }}>
                    {['System Status', 'Documentation', 'Support'].map(n => (
                        <a key={n} href="#" style={{
                            fontSize: 13, fontWeight: 500, color: '#64748b',
                            textDecoration: 'none', transition: 'color .2s',
                        }}
                            onMouseEnter={e => e.target.style.color = '#4CAF50'}
                            onMouseLeave={e => e.target.style.color = '#64748b'}
                        >{n}</a>
                    ))}
                </nav>
            </header>

            {/* ── MAIN ── */}
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', position: 'relative' }}>

                {/* Background layer */}
                <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#fff', pointerEvents: 'none' }}>
                    {/* dot grid */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(76,175,80,0.18) 1px, transparent 0)',
                        backgroundSize: '20px 20px', opacity: 0.7,
                    }} />
                    {/* blobs */}
                    <div style={{
                        position: 'absolute', top: '-20%', right: '-10%',
                        width: 900, height: 900, borderRadius: '50%',
                        background: 'rgba(236,253,245,0.6)', filter: 'blur(100px)',
                    }} />
                    <div style={{
                        position: 'absolute', bottom: '-10%', left: '-10%',
                        width: 600, height: 600, borderRadius: '50%',
                        background: 'rgba(209,250,229,0.5)', filter: 'blur(100px)',
                    }} />
                    {/* decorative SVG triangle */}
                    <svg style={{ position: 'absolute', right: 0, top: 0, height: '100%', width: '50%', opacity: 0.03, color: '#4CAF50' }}
                        viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M0 100 L100 0 L100 100 Z" fill="#4CAF50" />
                        <path d="M20 100 L100 20 L100 100 Z" fill="#4CAF50" />
                        <path d="M40 100 L100 40 L100 100 Z" fill="#4CAF50" />
                    </svg>
                    {/* decorative circles */}
                    <div style={{
                        position: 'absolute', right: '10%', top: '20%',
                        width: 400, height: 400, borderRadius: '50%',
                        border: '1px solid rgba(76,175,80,0.08)',
                    }} />
                    <div style={{
                        position: 'absolute', right: '15%', top: '25%',
                        width: 300, height: 300, borderRadius: '50%',
                        border: '1px dashed rgba(76,175,80,0.15)',
                    }} />
                </div>

                {/* Two-column grid */}
                <div style={{
                    position: 'relative', zIndex: 10, width: '100%',
                    maxWidth: 1200, margin: '0 auto', padding: '100px 48px 60px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64,
                    alignItems: 'center',
                }}>

                    {/* ── LEFT: marketing ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 560 }}>
                        {/* Status badge */}
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: 8,
                            alignSelf: 'flex-start', padding: '4px 12px', borderRadius: 9999,
                            background: 'rgba(187,247,208,0.4)', border: '1px solid #BBF7D0',
                            fontSize: 11, fontWeight: 700, color: '#4CAF50',
                            textTransform: 'uppercase', letterSpacing: '0.08em',
                        }}>
                            <span style={{ position: 'relative', display: 'flex' }}>
                                <span style={{
                                    position: 'absolute', width: 8, height: 8, borderRadius: '50%',
                                    background: 'rgba(74,222,128,0.75)',
                                    animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
                                }} />
                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#22C55E', position: 'relative' }} />
                            </span>
                            System Operational
                        </div>

                        {/* Headline */}
                        <h1 style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 'clamp(28px, 3vw, 44px)', fontWeight: 700,
                            lineHeight: 1.2, letterSpacing: '-0.02em', margin: 0,
                        }}>
                            Smart Hostel Access Control System with{' '}
                            <span style={{ color: '#4CAF50' }}>Predictive Analytics</span>{' '}
                            and AI-Driven Risk Assessment
                        </h1>

                        {/* Subtext */}
                        <p style={{ fontSize: 16, color: '#64748b', lineHeight: 1.7, margin: 0, maxWidth: 480 }}>
                            Next-generation institutional security utilizing biometric verification and machine learning
                            to ensure resident safety and streamlined gate management operations.
                        </p>

                        {/* Feature badges */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
                            {FEATURES.map(f => (
                                <div key={f.icon} style={{
                                    display: 'flex', alignItems: 'center', gap: 10,
                                    padding: '10px 16px', background: 'rgba(255,255,255,0.7)',
                                    border: '1px solid #E2E8F0', borderRadius: 10,
                                    backdropFilter: 'blur(8px)',
                                }}>
                                    <span className="material-symbols-outlined" style={{ fontSize: 24, color: '#4CAF50' }}>{f.icon}</span>
                                    <div style={{ lineHeight: 1.2 }}>
                                        <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.label}</div>
                                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{f.sub}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* ── RIGHT: login card ── */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <div style={{
                            width: '100%', maxWidth: 480,
                            background: '#fff', borderRadius: 16,
                            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
                            overflow: 'hidden', border: '1px solid rgba(255,255,255,0.8)',
                        }}>
                            {/* Role tabs */}
                            <div style={{
                                display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                                borderBottom: '1px solid #E2E8F0', background: '#f8fafc',
                            }}>
                                {ROLES.map(role => {
                                    const active = activeRole === role.key;
                                    return (
                                        <button key={role.key} onClick={() => selectRole(role)} style={{
                                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                                            justifyContent: 'center', padding: '14px 4px',
                                            background: active ? '#fff' : 'transparent',
                                            border: 'none',
                                            borderBottom: active ? '2px solid #4CAF50' : '2px solid transparent',
                                            cursor: 'pointer', transition: 'all 0.2s',
                                            color: active ? '#4CAF50' : '#64748b',
                                        }}>
                                            <span className="material-symbols-outlined" style={{ fontSize: 20, marginBottom: 4 }}>{role.icon}</span>
                                            <span style={{
                                                fontSize: 10, fontWeight: active ? 700 : 500,
                                                textTransform: 'uppercase', letterSpacing: '0.08em',
                                            }}>{role.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Form area */}
                            <div style={{ padding: '32px', background: '#fff' }}>
                                <div style={{ marginBottom: 24 }}>
                                    <h2 style={{ fontSize: 20, fontWeight: 700, margin: '0 0 4px' }}>Welcome Back</h2>
                                    <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Enter your credentials to access the secure portal.</p>
                                </div>

                                {error && (
                                    <div style={{
                                        background: '#FEF2F2', color: '#DC2626', padding: '10px 14px',
                                        borderRadius: 8, fontSize: 13, marginBottom: 20,
                                        border: '1px solid #FECACA',
                                    }}>{error}</div>
                                )}

                                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {/* Email */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: 2 }}>
                                            Institutional ID
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94a3b8', pointerEvents: 'none' }}>id_card</span>
                                            <input
                                                type="email" value={email} required
                                                onChange={e => setEmail(e.target.value)}
                                                placeholder="e.g. student@test.com"
                                                style={inputBase} onFocus={onFocus} onBlur={onBlur}
                                            />
                                        </div>
                                    </div>

                                    {/* Password */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: 2 }}>
                                            Password
                                        </label>
                                        <div style={{ position: 'relative' }}>
                                            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 18, color: '#94a3b8', pointerEvents: 'none' }}>lock</span>
                                            <input
                                                type={showPass ? 'text' : 'password'} value={password} required
                                                onChange={e => setPassword(e.target.value)}
                                                placeholder="Enter password"
                                                style={{ ...inputBase, paddingRight: 44 }} onFocus={onFocus} onBlur={onBlur}
                                            />
                                            <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 0 }}>
                                                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{showPass ? 'visibility' : 'visibility_off'}</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Remember + Forgot */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} style={{ accentColor: '#4CAF50', width: 16, height: 16 }} />
                                            <span style={{ fontSize: 13, color: '#64748b' }}>Remember device</span>
                                        </label>
                                        <a href="#" style={{ fontSize: 13, fontWeight: 600, color: '#4CAF50', textDecoration: 'none' }}>Forgot password?</a>
                                    </div>

                                    {/* Sign In */}
                                    <button type="submit" disabled={loading} style={{
                                        height: 48, width: '100%', marginTop: 4,
                                        background: loading ? '#86C988' : '#4CAF50',
                                        color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '0.02em',
                                        border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                        boxShadow: '0 0 20px rgba(76,175,80,0.3)', transition: 'all 0.2s',
                                    }}
                                        onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#43a047'; }}
                                        onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#4CAF50'; }}
                                    >
                                        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{loading ? 'hourglass_top' : 'login'}</span>
                                        {loading ? 'Signing in...' : 'Sign In'}
                                    </button>
                                </form>
                            </div>

                            {/* Card footer */}
                            <div style={{ padding: '14px 32px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, opacity: 0.8 }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                                        <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#4CAF50' }}>lock</span>
                                        SSL Encrypted
                                    </span>
                                    <span style={{ width: 1, height: 12, background: '#CBD5E1' }} />
                                    <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>v2.4.0</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── FOOTER LINKS ── */}
                <div style={{
                    position: 'absolute', bottom: 24, left: 0, right: 0,
                    display: 'flex', justifyContent: 'flex-start', paddingLeft: 48, zIndex: 20,
                }}>
                    <div style={{ display: 'flex', gap: 0, alignItems: 'center' }}>
                        {[
                            { icon: 'help', label: 'Help Center' },
                            { icon: 'privacy_tip', label: 'Privacy Policy' },
                            { icon: 'gavel', label: 'Terms of Use' },
                        ].map((l, i) => (
                            <React.Fragment key={l.label}>
                                {i > 0 && <span style={{ color: '#CBD5E1', margin: '0 12px' }}>|</span>}
                                <a href="#" style={{
                                    display: 'flex', alignItems: 'center', gap: 4,
                                    fontSize: 12, fontWeight: 500, color: '#64748b',
                                    textDecoration: 'none', transition: 'color .2s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.color = '#4CAF50'}
                                    onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{l.icon}</span>
                                    {l.label}
                                </a>
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            </div>

            {/* Ping animation */}
            <style>{`
                @keyframes ping {
                    75%, 100% { transform: scale(2); opacity: 0; }
                }
            `}</style>
        </div>
    );
}
