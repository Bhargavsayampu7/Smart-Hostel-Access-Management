import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from './Button';
import { LogOut, User, Home } from 'lucide-react';

const Layout = ({ children, title }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex items-center gap-2 text-primary font-bold text-xl">
                                <Home className="w-6 h-6" />
                                <span>HostelPass</span>
                            </Link>
                            {title && (
                                <span className="ml-4 px-3 py-1 bg-gray-100 rounded-full text-sm font-medium text-gray-600">
                                    {title}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <User className="w-4 h-4" />
                                <span>{user?.name}</span>
                                <span className="capitalize text-xs bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                                    {user?.role}
                                </span>
                            </div>
                            <Button variant="ghost" onClick={handleLogout} className="text-sm">
                                <LogOut className="w-4 h-4 mr-2 inline" />
                                Logout
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    );
};

export default Layout;
