import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import { scanAPI } from '../services/api';

const PassHistory = () => {
    const { passId } = useParams();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const resp = await scanAPI.history(passId);
                setData(resp);
            } catch (err) {
                setError(err.message || 'Failed to load history');
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [passId]);

    return (
        <Layout title="Pass History">
            <div className="max-w-4xl mx-auto space-y-6">
                {loading && (
                    <div className="text-center py-8 text-gray-500">Loading history...</div>
                )}

                {error && !loading && (
                    <Card>
                        <div className="text-red-600 text-sm">{error}</div>
                    </Card>
                )}

                {data && (
                    <>
                        <Card title="Pass Summary">
                            <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Destination:</span>{' '}
                                {data.pass.destination}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Reason:</span>{' '}
                                {data.pass.reason}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">From:</span>{' '}
                                {new Date(data.pass.from_time).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">To:</span>{' '}
                                {new Date(data.pass.to_time).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-600 mb-1">
                                <span className="font-medium">Returned At:</span>{' '}
                                {data.pass.returned_at
                                    ? new Date(data.pass.returned_at).toLocaleString()
                                    : 'Not recorded'}
                            </p>
                            <p className="text-sm text-gray-600">
                                <span className="font-medium">Delay (minutes):</span>{' '}
                                {data.delayMinutes.toFixed(1)}
                            </p>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Card title="Scan Events">
                                {data.scanEvents.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        No scan events recorded.
                                    </p>
                                ) : (
                                    <ul className="space-y-2 text-sm text-gray-700">
                                        {data.scanEvents.map((s, idx) => (
                                            <li
                                                key={`${s.scanned_at}-${idx}`}
                                                className="flex justify-between border-b border-gray-100 pb-1"
                                            >
                                                <div>
                                                    <div className="font-mono text-xs text-gray-500">
                                                        {new Date(s.scanned_at).toLocaleString()}
                                                    </div>
                                                    <div>
                                                        Gate:{' '}
                                                        <span className="font-medium">
                                                            {s.gate_id}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div
                                                        className={
                                                            s.result === 'allow'
                                                                ? 'text-green-600 font-semibold'
                                                                : 'text-red-600 font-semibold'
                                                        }
                                                    >
                                                        {s.result.toUpperCase()}
                                                    </div>
                                                    {s.reason && (
                                                        <div className="text-xs text-gray-500">
                                                            {s.reason}
                                                        </div>
                                                    )}
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Card>

                            <Card title="Location Points">
                                {data.locations.length === 0 ? (
                                    <p className="text-sm text-gray-500">
                                        No location data recorded.
                                    </p>
                                ) : (
                                    <ul className="space-y-2 text-sm text-gray-700 max-h-64 overflow-y-auto">
                                        {data.locations.map((lp, idx) => (
                                            <li key={`${lp.recorded_at}-${idx}`}>
                                                <div className="font-mono text-xs text-gray-500">
                                                    {new Date(lp.recorded_at).toLocaleString()}
                                                </div>
                                                <div>
                                                    Lat:{' '}
                                                    <span className="font-mono">
                                                        {lp.lat.toFixed(5)}
                                                    </span>
                                                    , Lon:{' '}
                                                    <span className="font-mono">
                                                        {lp.lon.toFixed(5)}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
};

export default PassHistory;

