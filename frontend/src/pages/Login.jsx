import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Input from '../components/Input';
import Button from '../components/Button';
import Card from '../components/Card';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // Prefill credentials based on ?role= query param
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const role = (params.get('role') || '').toLowerCase();

        switch (role) {
            case 'student':
                setEmail('student@test.com');
                setPassword('student123');
                break;
            case 'parent':
                setEmail('parent@test.com');
                setPassword('parent123');
                break;
            case 'warden':
                setEmail('warden@test.com');
                setPassword('warden123');
                break;
            case 'security':
                setEmail('security@test.com');
                setPassword('security123');
                break;
            default:
                // leave empty for manual entry
                break;
        }
    }, [location.search]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const data = await login(email, password);
            // Redirect based on role
            if (data.user.role === 'student') navigate('/student');
            else if (data.user.role === 'parent') navigate('/parent');
            else if (data.user.role === 'admin') navigate('/warden');
            else if (data.user.role === 'security') navigate('/security');
            else navigate('/');
        } catch (err) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-600 mt-2">Sign in to your account</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <Input
                        label="Email Address"
                        type="email"
                        name="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="Enter your email"
                    />

                    <Input
                        label="Password"
                        type="password"
                        name="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        placeholder="Enter your password"
                    />

                    <Button
                        type="submit"
                        className="w-full mt-2"
                        disabled={loading}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-600">
                    Don't have an account?{' '}
                    <Link to="/register" className="text-primary hover:text-indigo-700 font-medium">
                        Register here
                    </Link>
                </div>
            </Card>
        </div>
    );
};

export default Login;
