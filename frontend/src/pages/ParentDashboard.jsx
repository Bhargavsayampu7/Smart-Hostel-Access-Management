import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import { parentAPI, requestAPI, locationAPI } from '../services/api';
import { CheckCircle, XCircle, Clock, AlertTriangle, MapPin } from 'lucide-react';

const ParentDashboard = () => {
    const [pendingRequests, setPendingRequests] = useState([]);
    const [activity, setActivity] = useState([]);
    const [dashboard, setDashboard] = useState(null);
    const [lastLocation, setLastLocation] = useState(null);
    const [activePassId, setActivePassId] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        try {
            const [pendingData, activityData, dashboardData] = await Promise.all([
                parentAPI.getPendingApprovals(),
                parentAPI.getActivity(),
                parentAPI.getDashboard(),
            ]);
            setPendingRequests(pendingData.requests || []);
            setActivity(activityData.requests || []);

            setDashboard(dashboardData);

            // Best-effort: find an active approved pass and fetch its latest location
            const activePass = (activityData.requests || []).find(
                (req) => req.status === 'approved'
            );
            if (activePass && activePass._id) {
                setActivePassId(activePass._id);
                try {
                    const loc = await locationAPI.latest(activePass._id);
                    setLastLocation(loc);
                } catch {
                    setLastLocation(null);
                }
            } else {
                setActivePassId(null);
                setLastLocation(null);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Auto-refresh last known location every 30 seconds while there is an active pass
    useEffect(() => {
        if (!activePassId) {
            return;
        }

        let intervalId;
        let cancelled = false;

        const refreshLocation = async () => {
            try {
                const loc = await locationAPI.latest(activePassId);
                if (!cancelled) {
                    setLastLocation(loc);
                }
            } catch {
                if (!cancelled) {
                    setLastLocation(null);
                }
            }
        };

        intervalId = window.setInterval(refreshLocation, 30_000);

        return () => {
            cancelled = true;
            if (intervalId) {
                window.clearInterval(intervalId);
            }
        };
    }, [activePassId]);

    const handleApproval = async (id, approved) => {
        try {
            await requestAPI.parentApprove(id, approved);
            fetchData(); // Refresh list
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <Layout title="Parent Dashboard">
            {/* Overview Stats */}
            {dashboard && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-orange-100 rounded-full text-orange-600">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Pending Approvals</p>
                                <p className="text-2xl font-bold">{dashboard.pendingCount || 0}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-full text-green-600">
                                <CheckCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Approved Passes</p>
                                <p className="text-2xl font-bold">{dashboard.approvedCount || 0}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Child Risk Score</p>
                                <p className="text-2xl font-bold">{dashboard.childRisk ?? 0}</p>
                            </div>
                        </div>
                    </Card>
                    <Card>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-red-100 rounded-full text-red-600">
                                <XCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Violations</p>
                                <p className="text-2xl font-bold">{dashboard.childViolations || 0}</p>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Live Location (if available) */}
            {lastLocation && (
                <div className="mb-8">
                    <Card>
                        <div className="flex items-center gap-3 mb-2">
                            <MapPin className="w-5 h-5 text-blue-500" />
                            <h2 className="text-lg font-semibold text-gray-900">Last Known Location</h2>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                            Lat: <span className="font-mono">{lastLocation.lat.toFixed(5)}</span>, Lon:{' '}
                            <span className="font-mono">{lastLocation.lon.toFixed(5)}</span>
                        </p>
                        <p className="text-sm text-gray-500 mb-3">
                            Recorded at:{' '}
                            {new Date(lastLocation.recorded_at).toLocaleString()}
                        </p>
                        {/* Simple embedded map using Google Maps */}
                        <div className="h-64 rounded-lg overflow-hidden border border-gray-200">
                            <iframe
                                title="Child live location"
                                className="w-full h-full"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://www.google.com/maps?q=${lastLocation.lat},${lastLocation.lon}&z=15&output=embed`}
                            />
                        </div>
                    </Card>
                </div>
            )}

            {/* Pending Approvals Section */}
            <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-orange-500" />
                    Pending Approvals
                </h2>

                {pendingRequests.length === 0 ? (
                    <Card>
                        <div className="text-center py-8 text-gray-500">
                            No pending requests to approve.
                        </div>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {pendingRequests.map((req) => (
                            <Card key={req._id} className="border-l-4 border-l-orange-400">
                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{req.studentName}</h3>
                                        <p className="text-gray-600">{req.reason}</p>
                                        <div className="text-sm text-gray-500 mt-1">
                                            <span className="font-medium">Destination:</span> {req.destination}
                                            <span className="mx-2">•</span>
                                            <span>{new Date(req.departureTime).toLocaleString()} — {new Date(req.returnTime).toLocaleString()}</span>
                                        </div>
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
                                            variant="secondary"
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

            {/* Recent Activity Section */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
                <div className="space-y-4">
                    {activity.map((act) => (
                        <Card key={act._id} className="py-4">
                            <div className="flex items-center gap-4">
                                {act.status === 'approved' ? (
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                ) : act.status === 'rejected' ? (
                                    <XCircle className="w-5 h-5 text-red-500" />
                                ) : (
                                    <Clock className="w-5 h-5 text-gray-400" />
                                )}
                                <div>
                                    <p className="font-medium text-gray-900">{act.reason}</p>
                                    <p className="text-sm text-gray-500">
                                        {act.status.charAt(0).toUpperCase() + act.status.slice(1)} on {new Date(act.updatedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    ))}
                    {activity.length === 0 && !loading && (
                        <p className="text-gray-500">No recent activity.</p>
                    )}
                </div>
            </div>
        </Layout>
    );
};

export default ParentDashboard;
