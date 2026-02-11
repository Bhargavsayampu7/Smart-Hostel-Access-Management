import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import ParentDashboard from './pages/ParentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import SecurityDashboard from './pages/SecurityDashboard';
import RoleSelect from './pages/RoleSelect';
import PassHistory from './pages/PassHistory';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

    if (!user) return <Navigate to="/login" />;

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" />; // Or unauthorized page
    }

    return children;
};

function App() {
    return (
        <AuthProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<RoleSelect />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Placeholder Routes for now */}
                    <Route path="/student" element={
                        <ProtectedRoute allowedRoles={['student']}>
                            <StudentDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/parent" element={
                        <ProtectedRoute allowedRoles={['parent']}>
                            <ParentDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/warden" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="/security" element={
                        <ProtectedRoute allowedRoles={['security', 'admin']}>
                            <SecurityDashboard />
                        </ProtectedRoute>
                    } />
                    <Route path="/security/history/:passId" element={
                        <ProtectedRoute allowedRoles={['security', 'admin']}>
                            <PassHistory />
                        </ProtectedRoute>
                    } />
                    {/* Fallback */}
                    <Route path="*" element={<Navigate to="/" />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;
