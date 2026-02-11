import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { adminAPI, requestAPI } from '../services/api';
import { Users, FileText, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import {
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [queue, setQueue] = useState([]);
    const [students, setStudents] = useState([]);
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [statsData, queueData, studentsData, analyticsData] = await Promise.all([
                adminAPI.getOverview(),
                adminAPI.getQueue(),
                adminAPI.getStudents(),
                adminAPI.getAnalytics(),
            ]);
            setStats(statsData);
            setQueue(queueData.requests || []);
            setStudents(studentsData.students || []);
            setAnalytics(analyticsData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApproval = async (id, approved) => {
        try {
            await requestAPI.adminApprove(id, approved);
            fetchData(); // Refresh list
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <Layout title="Warden Dashboard">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Total Students</p>
                            <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Pending Requests</p>
                            <p className="text-2xl font-bold">{stats?.pendingRequests || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-full text-green-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Outpasses</p>
                            <p className="text-2xl font-bold">{stats?.activeOutpasses || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-full text-red-600">
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Violations</p>
                            <p className="text-2xl font-bold">{stats?.violations || 0}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Analytics Charts */}
            {analytics && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                    {/* Risk Distribution Pie */}
                    <Card title="Risk Distribution">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Low', value: analytics.riskDistribution.low },
                                            { name: 'Medium', value: analytics.riskDistribution.medium },
                                            { name: 'High', value: analytics.riskDistribution.high },
                                        ]}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={80}
                                        label
                                    >
                                        <Cell fill="#22c55e" />
                                        <Cell fill="#facc15" />
                                        <Cell fill="#ef4444" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Late Returns by Day */}
                    <Card title="Late Returns (per day)">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.lateReturnsByDay}>
                                    <XAxis dataKey="date" hide />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#0ea5e9" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>

                    {/* Parent Response Time Histogram */}
                    <Card title="Parent Response Time (minutes)">
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.parentResponseHistogram}>
                                    <XAxis dataKey="bucket" />
                                    <YAxis allowDecimals={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#6366f1" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}

            {/* Approval Queue */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Approval Queue</h2>

                {queue.length === 0 ? (
                    <Card>
                        <div className="text-center py-8 text-gray-500">
                            No requests pending admin approval.
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {queue.map((req) => (
                            <Card key={req._id}>
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold text-lg">{req.studentName}</h3>
                                            <span className="text-sm text-gray-500">({req.studentId})</span>
                                        </div>
                                        <p className="text-gray-600">{req.reason}</p>
                                        <div className="text-sm text-gray-500 mt-1">
                                            <span className="font-medium">Destination:</span> {req.destination}
                                            <span className="mx-2">•</span>
                                            <span>{new Date(req.departureTime).toLocaleString()} — {new Date(req.returnTime).toLocaleString()}</span>
                                        </div>
                                        {req.parentApproved && (
                                            <div className="mt-1 text-xs text-green-600 flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" /> Parent Approved
                                            </div>
                                        )}
                                        {req.mlRiskScore > 50 && (
                                            <div className="mt-2 inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded font-medium">
                                                <AlertTriangle className="w-3 h-3" />
                                                High Risk Request (Score: {req.mlRiskScore})
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex gap-3 w-full md:w-auto">
                                        <Button
                                            variant="danger"
                                            className="flex-1 md:flex-none"
                                            onClick={() => handleApproval(req._id, false)}
                                        >
                                            Reject
                                        </Button>
                                        <Button
                                            variant="primary"
                                            className="flex-1 md:flex-none"
                                            onClick={() => handleApproval(req._id, true)}
                                        >
                                            Approve
                                        </Button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Students & Risk Table */}
            <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Students & Risk Overview</h2>
                <Card>
                    {students.length === 0 ? (
                        <div className="text-center py-6 text-gray-500">No student records found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Name
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Email
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Risk Score
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Risk Category
                                        </th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Latest Pass Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((s) => {
                                        const highRisk =
                                            typeof s.riskScore === 'number' && s.riskScore >= 60;
                                        return (
                                            <tr
                                                key={s.id}
                                                className={highRisk ? 'bg-red-50' : undefined}
                                            >
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900">
                                                    {s.name || '—'}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                                    {s.email}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm">
                                                    {typeof s.riskScore === 'number'
                                                        ? Math.round(s.riskScore)
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">
                                                    {s.riskCategory || 'unknown'}
                                                </td>
                                                <td className="px-4 py-2 whitespace-nowrap text-sm capitalize">
                                                    {s.latestPassStatus || 'none'}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </Layout>
    );
};

export default AdminDashboard;
