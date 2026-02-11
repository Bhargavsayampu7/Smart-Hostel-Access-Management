import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { requestAPI, studentAPI, riskAPI, locationAPI } from '../services/api';
import { Clock, CheckCircle, XCircle, AlertCircle, QrCode } from 'lucide-react';
import QRCode from 'qrcode';

const StudentDashboard = () => {
    const [requests, setRequests] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [risk, setRisk] = useState(null);
    const [riskLoading, setRiskLoading] = useState(false);
    const [riskError, setRiskError] = useState('');
    const [showNewRequest, setShowNewRequest] = useState(false);
    const [qrCode, setQrCode] = useState(null);

    // Live location state
    const [activePassId, setActivePassId] = useState(null);
    const [locationStatus, setLocationStatus] = useState('idle'); // idle | active | error | unsupported
    const [lastLocation, setLastLocation] = useState(null);

    // New Request Form State
    const [formData, setFormData] = useState({
        type: 'outpass',
        reason: '',
        departureTime: '',
        returnTime: '',
        destination: '',
        emergencyContact: ''
    });

    const fetchData = async () => {
        try {
            const [reqData, statsData] = await Promise.all([
                requestAPI.getAll(),
                studentAPI.getStats()
            ]);
            const allRequests = reqData.requests || [];
            setRequests(allRequests);
            setStats(statsData);

            // Determine if there is an active approved pass
            const nowTs = Date.now();
            const active = allRequests.find((r) => {
                if (r.status !== 'approved') return false;
                try {
                    const dep = new Date(r.departureTime).getTime();
                    const ret = new Date(r.returnTime).getTime();
                    return nowTs >= dep && nowTs <= ret;
                } catch {
                    return false;
                }
            });
            setActivePassId(active?._id || null);

            // Once basic stats are available, compute ML risk for the student
            setRiskLoading(true);
            setRiskError('');
            try {
                const now = new Date();
                const isWeekend = now.getDay() === 0 || now.getDay() === 6;

                const features = {
                    // For now we use reasonable defaults; backend/ML handle real scoring.
                    age: 20,
                    year: 3,
                    gpa: 8.0,
                    hostel_block: 'A',
                    parent_contact_reliable: 1,
                    past_violations_30d: statsData?.violations || 0,
                    past_violations_365d: statsData?.violations || 0,
                    request_time_hour: now.getHours(),
                    requested_duration_hours: 4,
                    actual_return_delay_minutes: 0,
                    parent_response_time_minutes: 10,
                    parent_action: 1,
                    destination_risk: 'medium',
                    emergency_flag: 0,
                    group_request: 0,
                    weekend_request: isWeekend ? 1 : 0,
                    previous_no_show: 0,
                    requests_last_7days: statsData?.totalRequests || 0,
                };

                const riskResponse = await riskAPI.compute(features);
                setRisk(riskResponse);
            } catch (err) {
                console.error('Error computing risk:', err);
                setRiskError(err.message || 'Unable to compute risk score');
                setRisk(null);
            } finally {
                setRiskLoading(false);
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

    // Geolocation heartbeat when there is an active pass
    useEffect(() => {
        if (!activePassId) {
            setLocationStatus('idle');
            setLastLocation(null);
            return;
        }

        if (!('geolocation' in navigator)) {
            setLocationStatus('unsupported');
            return;
        }

        let intervalId;
        let cancelled = false;

        const sendHeartbeat = () => {
            navigator.geolocation.getCurrentPosition(
                async (pos) => {
                    if (cancelled) return;
                    const { latitude, longitude, accuracy } = pos.coords;
                    const payload = {
                        pass_id: activePassId,
                        lat: latitude,
                        lon: longitude,
                        accuracy,
                        recorded_at: new Date().toISOString(),
                    };

                    setLastLocation(payload);
                    setLocationStatus('active');
                    try {
                        await locationAPI.send(payload);
                    } catch (err) {
                        console.error('Error sending location heartbeat', err);
                        setLocationStatus('error');
                    }
                },
                (err) => {
                    console.error('Geolocation error', err);
                    setLocationStatus('error');
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 10_000,
                    timeout: 10_000,
                }
            );
        };

        // Send immediately, then every 30s
        sendHeartbeat();
        intervalId = window.setInterval(sendHeartbeat, 30_000);

        return () => {
            cancelled = true;
            if (intervalId) {
                window.clearInterval(intervalId);
            }
        };
    }, [activePassId]);

    const handleCreateRequest = async (e) => {
        e.preventDefault();
        try {
            await requestAPI.create(formData);
            setShowNewRequest(false);
            setFormData({ type: 'outpass', reason: '', departureTime: '', returnTime: '', destination: '', emergencyContact: '' });
            fetchData(); // Refresh list
        } catch (error) {
            alert(error.message);
        }
    };

    const handleViewQR = async (id) => {
        try {
            const data = await requestAPI.getQR(id);
            const qrDataUrl = await QRCode.toDataURL(data.qrCode);
            setQrCode(qrDataUrl);
        } catch (error) {
            alert('Could not load QR code');
        }
    };

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            rejected: 'bg-red-100 text-red-800',
            completed: 'bg-gray-100 text-gray-800'
        };
        return (
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <Layout title="Student Dashboard">
            {/* Stats + Risk Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Active Requests</p>
                            <p className="text-2xl font-bold">{stats?.activeRequests || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 rounded-full text-green-600">
                            <CheckCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Approved</p>
                            <p className="text-2xl font-bold">{stats?.approvedRequests || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 rounded-full text-red-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Violations</p>
                            <p className="text-2xl font-bold">{stats?.violations || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-100 rounded-full text-indigo-600">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">ML Risk Score</p>
                            {riskLoading ? (
                                <p className="text-sm text-gray-500">Calculating...</p>
                            ) : risk ? (
                                <>
                                    <p className="text-2xl font-bold">
                                        {typeof risk.risk_score === 'number'
                                            ? Math.round(risk.risk_score)
                                            : '-'}
                                    </p>
                                    <p className="text-xs uppercase tracking-wide text-gray-500">
                                        {risk.risk_category || 'Unknown'}
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    {riskError || 'No risk score available'}
                                </p>
                            )}
                        </div>
                    </div>
                </Card>
            </div>

            {/* Live Location Status */}
            <div className="mb-6">
                <Card>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-500 mb-1">Live Location Sharing</p>
                            {activePassId ? (
                                <>
                                    {locationStatus === 'active' && lastLocation && (
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium text-green-600 mr-2">
                                                Location sharing active
                                            </span>
                                            Lat:{' '}
                                            <span className="font-mono">
                                                {lastLocation.lat.toFixed(5)}
                                            </span>
                                            , Lon:{' '}
                                            <span className="font-mono">
                                                {lastLocation.lon.toFixed(5)}
                                            </span>
                                        </p>
                                    )}
                                    {locationStatus === 'idle' && (
                                        <p className="text-sm text-gray-500">
                                            Waiting for first location fix...
                                        </p>
                                    )}
                                    {locationStatus === 'unsupported' && (
                                        <p className="text-sm text-red-500">
                                            Geolocation not supported in this browser.
                                        </p>
                                    )}
                                    {locationStatus === 'error' && (
                                        <p className="text-sm text-red-500">
                                            Error sending location. Check permissions and network.
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    No active approved pass. Location sharing is paused.
                                </p>
                            )}
                        </div>
                        {activePassId && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                                Live
                            </span>
                        )}
                    </div>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">My Requests</h2>
                <Button onClick={() => setShowNewRequest(true)}>New Outpass Request</Button>
            </div>

            {/* New Request Modal (Simple inline for now) */}
            {showNewRequest && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="w-full max-w-lg mx-4" title="Create Outpass Request">
                        <form onSubmit={handleCreateRequest}>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        name="type"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                                    >
                                        <option value="outpass">Outpass</option>
                                        <option value="homepass">Home Pass</option>
                                        <option value="emergency">Emergency</option>
                                    </select>
                                </div>
                                <Input
                                    label="Emergency Contact"
                                    name="emergencyContact"
                                    value={formData.emergencyContact}
                                    onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                                    required
                                    placeholder="Phone number"
                                />
                            </div>
                            <Input
                                label="Reason"
                                name="reason"
                                value={formData.reason}
                                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                                required
                                placeholder="Why do you need to leave?"
                            />
                            <Input
                                label="Destination"
                                name="destination"
                                value={formData.destination}
                                onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                                required
                                placeholder="Where are you going?"
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <Input
                                    label="Departure Time"
                                    type="datetime-local"
                                    name="departureTime"
                                    value={formData.departureTime}
                                    onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Return Time"
                                    type="datetime-local"
                                    name="returnTime"
                                    value={formData.returnTime}
                                    onChange={(e) => setFormData({ ...formData, returnTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <Button variant="ghost" onClick={() => setShowNewRequest(false)}>Cancel</Button>
                                <Button type="submit">Submit Request</Button>
                            </div>
                        </form>
                    </Card>
                </div>
            )}

            {/* QR Code Modal */}
            {qrCode && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setQrCode(null)}>
                    <Card className="bg-white p-8 text-center" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4">Your Gate Pass</h3>
                        <img src={qrCode} alt="QR Code" className="mx-auto w-64 h-64" />
                        <p className="text-sm text-gray-500 mt-4">Show this at the security gate</p>
                        <Button className="mt-4" onClick={() => setQrCode(null)}>Close</Button>
                    </Card>
                </div>
            )}

            {/* Requests List */}
            <div className="space-y-4">
                {requests.map((req) => (
                    <Card key={req._id} className="hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="flex items-center gap-3 mb-2">
                                    <h3 className="font-semibold text-lg">{req.reason}</h3>
                                    {getStatusBadge(req.status)}
                                </div>
                                <p className="text-gray-600 text-sm mb-1">
                                    <span className="font-medium">Destination:</span> {req.destination}
                                </p>
                                <p className="text-gray-500 text-sm">
                                    {new Date(req.departureTime).toLocaleString()} — {new Date(req.returnTime).toLocaleString()}
                                </p>
                                {req.mlRiskScore > 50 && (
                                    <div className="mt-2 inline-flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                                        <AlertCircle className="w-3 h-3" />
                                        Risk Score: {req.mlRiskScore}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                {req.status === 'approved' && (
                                    <Button size="sm" variant="secondary" onClick={() => handleViewQR(req._id)}>
                                        <QrCode className="w-4 h-4 mr-1 inline" />
                                        View QR
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
                {requests.length === 0 && !loading && (
                    <div className="text-center py-12 text-gray-500">
                        No requests found. Create one to get started!
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default StudentDashboard;
