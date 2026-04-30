import { useQuery } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../services/api';
import { useAuth } from '../store/AuthContext';

const StatCard = ({ label, value, color }) => (
  <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
    <p className="text-gray-400 text-sm">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${color || 'text-white'}`}>{value}</p>
  </div>
);

export default function Dashboard() {
  const { user } = useAuth();

  const { data: summary } = useQuery({
    queryKey: ['usage-summary'],
    queryFn: () => api.get('/usage/summary').then(r => r.data),
  });

  const { data: daily } = useQuery({
    queryKey: ['daily-usage'],
    queryFn: () => api.get('/usage/daily?days=14').then(r => r.data),
  });

  const { data: billing } = useQuery({
    queryKey: ['billing'],
    queryFn: () => api.get('/usage/billing').then(r => r.data),
  });

  const { data: apis } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/apis').then(r => r.data),
  });

  const { data: allKeys } = useQuery({
    queryKey: ['all-keys-count'],
    queryFn: async () => {
      const apisData = await api.get('/apis').then(r => r.data);
      const counts = await Promise.all(apisData.map(a => api.get(`/apis/${a._id}/keys`).then(r => r.data)));
      return counts.flat().filter(k => k.status === 'active').length;
    },
  });

  const errors = summary?.byStatus?.filter(s => s._id >= 400).reduce((a, b) => a + b.count, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Dashboard</h2>
        <p className="text-gray-400">Welcome back, {user?.name}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Requests" value={summary?.total || 0} />
        <StatCard label="Active API Keys" value={allKeys || 0} color="text-yellow-400" />
        <StatCard label="Errors" value={errors} color="text-red-400" />
        <StatCard label="Plan" value={user?.plan?.toUpperCase() || 'FREE'} color="text-blue-400" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-2 gap-4">
        <StatCard label="Amount Due" value={`₹${billing?.amount?.toFixed(2) || '0.00'}`} color="text-green-400" />
        <StatCard label="Total APIs" value={apis?.length || 0} color="text-purple-400" />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Requests (Last 14 Days)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={daily || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="_id" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff' }} />
            <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={false} name="Requests" />
            <Line type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={2} dot={false} name="Errors" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Top Endpoints</h3>
        <div className="space-y-2">
          {summary?.byEndpoint?.map((e) => (
            <div key={e._id} className="flex justify-between text-sm">
              <span className="text-gray-300 font-mono">{e._id}</span>
              <span className="text-gray-400">{e.count} reqs · {Math.round(e.avgLatency)}ms avg</span>
            </div>
          ))}
          {!summary?.byEndpoint?.length && <p className="text-gray-500 text-sm">No data yet</p>}
        </div>
      </div>
    </div>
  );
}
