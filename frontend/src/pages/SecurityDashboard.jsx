import React, { useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import { scanAPI } from '../services/api';
import QrReader from 'react-qr-reader';

const SecurityDashboard = () => {
    const [gateId, setGateId] = useState('MAIN_GATE');
    const [token, setToken] = useState('');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [scanError, setScanError] = useState('');

    const verifyToken = async (value) => {
        if (!value) return;
        setLoading(true);
        setResult(null);
        setScanError('');
        try {
            const data = await scanAPI.scan(value, gateId);
            setResult(data);
        } catch (err) {
            setResult({ result: 'deny', reason: err.message || 'scan_failed' });
        } finally {
            setLoading(false);
        }
    };

    const handleScanSubmit = async (e) => {
        e.preventDefault();
        await verifyToken(token);
    };

    return (
        <Layout title="Security Gate Scan">
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Live Camera Scanner */}
                <Card title="Live Camera Scan">
                    <div className="space-y-4">
                        {/* Make the scanning viewport larger for easier framing */}
                        <div className="h-96 bg-black/5 rounded-lg overflow-hidden">
                            <QrReader
                                delay={300}
                                onError={(err) => {
                                    if (err) {
                                        setScanError(err.message || 'Camera scan error');
                                    }
                                }}
                                onScan={async (data) => {
                                    const text = (data || '').trim();
                                    if (text && text !== token && !loading) {
                                        setToken(text);
                                        await verifyToken(text);
                                    }
                                }}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        </div>
                        {scanError && (
                            <p className="text-sm text-red-500">
                                {scanError}
                            </p>
                        )}
                        <p className="text-xs text-gray-500">
                            Point the camera at a student&apos;s QR pass. The token will be decoded and verified automatically.
                        </p>
                    </div>
                </Card>

                {/* Manual / Fallback Scan */}
                <Card title="Manual Token / Fallback Scan">
                    <form onSubmit={handleScanSubmit}>
                        <Input
                            label="Gate ID"
                            name="gateId"
                            value={gateId}
                            onChange={(e) => setGateId(e.target.value)}
                            required
                        />
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">QR Token</label>
                            <textarea
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                                rows={6}
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Paste the QR token payload here"
                                required
                            />
                        </div>

                        <Button type="submit" disabled={loading}>
                            {loading ? 'Verifying…' : 'Verify Scan'}
                        </Button>
                    </form>
                </Card>

                {result && (
                    <Card title="Scan Result">
                        <div className="space-y-2">
                            <div
                                className={
                                    result.result === 'allow'
                                        ? 'text-3xl font-bold text-green-600'
                                        : 'text-3xl font-bold text-red-600'
                                }
                            >
                                {result.result === 'allow' ? 'ALLOW' : 'DENY'}
                            </div>
                            {result.reason && (
                                <div className="text-sm text-gray-600">
                                    Reason:{' '}
                                    <span className="font-mono">
                                        {result.reason === 'out'
                                            ? 'exit_scan'
                                            : result.reason === 'in'
                                            ? 'return_scan'
                                            : result.reason}
                                    </span>
                                </div>
                            )}
                            {result.pass_id && (
                                <div className="text-sm text-gray-600">
                                    Pass ID: <span className="font-mono">{result.pass_id}</span>
                                </div>
                            )}
                        </div>
                    </Card>
                )}
            </div>
        </Layout>
    );
};

export default SecurityDashboard;


