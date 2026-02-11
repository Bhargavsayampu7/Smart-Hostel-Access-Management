import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/Card';
import Button from '../components/Button';

const roles = [
    { key: 'student', label: 'Student', description: 'Request and track your outpasses' },
    { key: 'parent', label: 'Parent', description: 'Review and approve your child’s passes' },
    { key: 'warden', label: 'Warden', description: 'Monitor campus movement and risk' },
    { key: 'security', label: 'Security', description: 'Scan and validate QR outpasses at gates' },
];

const RoleSelect = () => {
    const navigate = useNavigate();

    const handleSelect = (role) => {
        navigate(`/login?role=${role}`);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-4xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">Smart Hostel Access Control</h1>
                    <p className="text-gray-600 mt-2">Choose how you want to sign in</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {roles.map((role) => (
                        <button
                            key={role.key}
                            onClick={() => handleSelect(role.key)}
                            className="text-left focus:outline-none"
                        >
                            <div className="h-full border rounded-xl p-4 hover:shadow-md transition-shadow bg-white">
                                <h2 className="text-lg font-semibold text-gray-900 mb-1">{role.label}</h2>
                                <p className="text-sm text-gray-600 mb-4">{role.description}</p>
                                <Button
                                    type="button"
                                    className="w-full justify-center"
                                >
                                    Continue as {role.label}
                                </Button>
                            </div>
                        </button>
                    ))}
                </div>
            </Card>
        </div>
    );
};

export default RoleSelect;

