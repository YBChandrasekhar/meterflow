import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';
import axios from 'axios';

export default function Playground() {
  const [selectedApi, setSelectedApi] = useState('');
  const [selectedKey, setSelectedKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [method, setMethod] = useState('GET');
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState(null);

  const { data: apis } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/apis').then(r => r.data),
  });

  const { data: keys } = useQuery({
    queryKey: ['keys', selectedApi],
    queryFn: () => api.get(`/apis/${selectedApi}/keys`).then(r => r.data),
    enabled: !!selectedApi,
  });

  const handleTest = async () => {
    if (!selectedKey) return toast.error('Select an API key');
    setLoading(true);
    setResponse(null);
    const start = Date.now();
    try {
      const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const res = await axios({
        method,
        url: `${backendUrl}/gateway/${endpoint}`,
        headers: { 'x-api-key': selectedKey },
        timeout: 15000,
      });
      setLatency(Date.now() - start);
      setResponse({ status: res.status, data: res.data, headers: res.headers });
    } catch (err) {
      setLatency(Date.now() - start);
      setResponse({
        status: err.response?.status || 500,
        data: err.response?.data || { message: err.message },
        error: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">API Playground</h2>
        <p className="text-gray-400 text-sm mt-1">Test your APIs directly from the dashboard</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Select API</label>
            <select
              className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              value={selectedApi}
              onChange={(e) => { setSelectedApi(e.target.value); setSelectedKey(''); }}
            >
              <option value="">-- Select API --</option>
              {apis?.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Select API Key</label>
            <select
              className="w-full bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              value={selectedKey}
              onChange={(e) => setSelectedKey(e.target.value)}
              disabled={!selectedApi}
            >
              <option value="">-- Select Key --</option>
              {keys?.filter(k => k.status === 'active').map(k => (
                <option key={k._id} value={k.key}>{k.label} — {k.key.slice(0, 15)}...</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <select
            className="bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 w-28"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
          >
            {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <input
            className="flex-1 bg-gray-800 text-white px-3 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500 font-mono text-sm"
            placeholder="endpoint path (e.g. pokemon/ditto)"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
          />
          <button
            onClick={handleTest}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium disabled:opacity-50"
          >
            {loading ? 'Sending...' : '▶ Send'}
          </button>
        </div>

        {selectedKey && (
          <div className="bg-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-gray-400">
            x-api-key: <span className="text-green-400">{selectedKey}</span>
          </div>
        )}
      </div>

      {response && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-semibold">Response</h3>
            <div className="flex gap-3 text-xs">
              <span className={`px-2 py-1 rounded-full font-mono ${
                response.status < 300 ? 'bg-green-900 text-green-300' :
                response.status < 400 ? 'bg-yellow-900 text-yellow-300' :
                'bg-red-900 text-red-300'
              }`}>
                {response.status}
              </span>
              {latency && <span className="text-gray-400">{latency}ms</span>}
            </div>
          </div>
          <pre className="bg-gray-800 rounded-lg p-4 text-xs text-green-400 overflow-auto max-h-96 font-mono">
            {JSON.stringify(response.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
