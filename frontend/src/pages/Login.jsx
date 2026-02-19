import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLES = [
    { key: 'student', label: 'Student', icon: 'school', email: 'student@test.com', password: 'student123' },
    { key: 'parent', label: 'Parent', icon: 'family_restroom', email: 'parent@test.com', password: 'parent123' },
    { key: 'warden', label: 'Warden', icon: 'badge', email: 'warden@test.com', password: 'warden123' },
    { key: 'security', label: 'Security', icon: 'security', email: 'security@test.com', password: 'security123' },
];

const Login = () => {
    const [activeRole, setActiveRole] = useState('student');
    const [email, setEmail] = useState('student@test.com');
    const [password, setPassword] = useState('student123');
    const [showPass, setShowPass] = useState(false);
    const [remember, setRemember] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    // When a role tab is clicked, prefill credentials
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

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
            style={{ background: '#F4F7F5', fontFamily: "'Public Sans', sans-serif" }}>

            {/* Background blobs */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div style={{
                    position: 'absolute', top: '-10%', left: '-10%',
                    width: 800, height: 800, borderRadius: '50%',
                    background: 'rgba(187,247,208,0.35)', filter: 'blur(120px)'
                }} />
                <div style={{
                    position: 'absolute', bottom: '-10%', right: '-10%',
                    width: 600, height: 600, borderRadius: '50%',
                    background: 'rgba(209,250,229,0.5)', filter: 'blur(100px)'
                }} />
                {/* Subtle grid */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(76,175,80,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(76,175,80,0.03) 1px,transparent 1px)',
                    backgroundSize: '40px 40px'
                }} />
            </div>

            {/* Card */}
            <main style={{
                position: 'relative', width: '100%', maxWidth: 480,
                background: '#fff', borderRadius: 16,
                boxShadow: '0 20px 40px -15px rgba(0,0,0,0.08)',
                overflow: 'hidden', zIndex: 10
            }}>

                {/* Header */}
                <div style={{
                    padding: '40px 32px 24px', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', borderBottom: '1px solid #E2E8F0', background: '#fff'
                }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: 16,
                        background: '#F0FDF4', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', marginBottom: 20,
                        boxShadow: '0 2px 8px rgba(76,175,80,0.15)'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 36, color: '#4CAF50' }}>
                            shield_person
                        </span>
                    </div>
                    <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>Gatepass Portal</h1>
                    <p style={{ fontSize: 14, color: '#64748b', marginTop: 6 }}>Secure Institutional Access System</p>
                </div>

                {/* Role Tabs */}
                <div style={{
                    display: 'grid', gridTemplateColumns: 'repeat(4,1fr)',
                    borderBottom: '1px solid #E2E8F0', background: '#f8fafc'
                }}>
                    {ROLES.map((role) => {
                        const active = activeRole === role.key;
                        return (
                            <button
                                key={role.key}
                                onClick={() => selectRole(role)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    justifyContent: 'center', padding: '14px 4px',
                                    background: active ? '#fff' : 'transparent',
                                    border: 'none', borderBottom: active ? '2px solid #4CAF50' : '2px solid transparent',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                    color: active ? '#4CAF50' : '#64748b',
                                }}
                            >
                                <span className="material-symbols-outlined" style={{ fontSize: 20, marginBottom: 4 }}>
                                    {role.icon}
                                </span>
                                <span style={{
                                    fontSize: 10, fontWeight: active ? 700 : 500,
                                    textTransform: 'uppercase', letterSpacing: '0.08em'
                                }}>
                                    {role.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* Form */}
                <div style={{ padding: '32px', background: '#fff' }}>
                    {error && (
                        <div style={{
                            background: '#FEF2F2', color: '#DC2626', padding: '10px 14px',
                            borderRadius: 8, fontSize: 13, marginBottom: 20,
                            border: '1px solid #FECACA'
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                        {/* Email / Institutional ID */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{
                                fontSize: 10, fontWeight: 700, color: '#64748b',
                                textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: 2
                            }}>
                                Institutional ID / Email
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <span className="material-symbols-outlined" style={{
                                    position: 'absolute', left: 12, fontSize: 18,
                                    color: '#94a3b8', pointerEvents: 'none'
                                }}>
                                    id_card
                                </span>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="e.g. student@test.com"
                                    required
                                    style={{
                                        width: '100%', height: 48, paddingLeft: 40, paddingRight: 16,
                                        background: '#F8FAFC', border: '1px solid #E2E8F0',
                                        borderRadius: 10, fontSize: 14, color: '#1e293b',
                                        outline: 'none', boxSizing: 'border-box',
                                        fontFamily: 'monospace', transition: 'all 0.2s'
                                    }}
                                    onFocus={e => {
                                        e.target.style.background = '#fff';
                                        e.target.style.borderColor = '#4CAF50';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.1)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.background = '#F8FAFC';
                                        e.target.style.borderColor = '#E2E8F0';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label style={{
                                fontSize: 10, fontWeight: 700, color: '#64748b',
                                textTransform: 'uppercase', letterSpacing: '0.1em', paddingLeft: 2
                            }}>
                                Password
                            </label>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <span className="material-symbols-outlined" style={{
                                    position: 'absolute', left: 12, fontSize: 18,
                                    color: '#94a3b8', pointerEvents: 'none'
                                }}>
                                    lock
                                </span>
                                <input
                                    type={showPass ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    required
                                    style={{
                                        width: '100%', height: 48, paddingLeft: 40, paddingRight: 44,
                                        background: '#F8FAFC', border: '1px solid #E2E8F0',
                                        borderRadius: 10, fontSize: 14, color: '#1e293b',
                                        outline: 'none', boxSizing: 'border-box',
                                        fontFamily: 'monospace', transition: 'all 0.2s'
                                    }}
                                    onFocus={e => {
                                        e.target.style.background = '#fff';
                                        e.target.style.borderColor = '#4CAF50';
                                        e.target.style.boxShadow = '0 0 0 3px rgba(76,175,80,0.1)';
                                    }}
                                    onBlur={e => {
                                        e.target.style.background = '#F8FAFC';
                                        e.target.style.borderColor = '#E2E8F0';
                                        e.target.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPass(!showPass)}
                                    style={{
                                        position: 'absolute', right: 12, background: 'none',
                                        border: 'none', cursor: 'pointer', color: '#94a3b8',
                                        display: 'flex', alignItems: 'center', padding: 0
                                    }}
                                >
                                    <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                                        {showPass ? 'visibility' : 'visibility_off'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        {/* Remember + Forgot */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={remember}
                                    onChange={(e) => setRemember(e.target.checked)}
                                    style={{ accentColor: '#4CAF50', width: 16, height: 16 }}
                                />
                                <span style={{ fontSize: 13, color: '#64748b' }}>Remember device</span>
                            </label>
                            <a href="#" style={{
                                fontSize: 13, fontWeight: 600, color: '#4CAF50',
                                textDecoration: 'none'
                            }}>
                                Forgot password?
                            </a>
                        </div>

                        {/* Sign In Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                height: 48, width: '100%',
                                background: loading ? '#86C988' : '#4CAF50',
                                color: '#fff', fontWeight: 700, fontSize: 15,
                                border: 'none', borderRadius: 10, cursor: loading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                boxShadow: '0 0 20px rgba(76,175,80,0.3)',
                                transition: 'all 0.2s', letterSpacing: '0.02em',
                                marginTop: 4
                            }}
                            onMouseEnter={e => { if (!loading) e.target.style.background = '#43a047'; }}
                            onMouseLeave={e => { if (!loading) e.target.style.background = '#4CAF50'; }}
                        >
                            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                                {loading ? 'hourglass_top' : 'login'}
                            </span>
                            {loading ? 'Signing in...' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div style={{
                    padding: '18px 32px', background: '#F8FAFC',
                    borderTop: '1px solid #F1F5F9', textAlign: 'center'
                }}>
                    <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                        Unauthorized access is strictly prohibited and monitored.
                    </p>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 12, marginTop: 8, opacity: 0.8
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 14, color: '#4CAF50' }}>lock</span>
                            SSL Encrypted
                        </span>
                        <span style={{ width: 1, height: 12, background: '#CBD5E1' }} />
                        <span style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            v2.4.0
                        </span>
                    </div>
                </div>
            </main>

            {/* Bottom links */}
            <div style={{ marginTop: 28, display: 'flex', gap: 16, zIndex: 10 }}>
                {[
                    { icon: 'help', label: 'Need Help?' },
                    { icon: 'privacy_tip', label: 'Privacy Policy' },
                ].map((link) => (
                    <a key={link.label} href="#" style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 13, fontWeight: 500, color: '#64748b', textDecoration: 'none',
                        background: 'rgba(255,255,255,0.8)', padding: '8px 16px',
                        borderRadius: 9999, border: '1px solid rgba(255,255,255,0.6)',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.05)', backdropFilter: 'blur(4px)',
                        transition: 'color 0.2s'
                    }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{link.icon}</span>
                        {link.label}
                    </a>
                ))}
            </div>
        </div>
    );
};

export default Login;
