import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../services/api';
import { useAuth } from '../store/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function Admin() {
  const { user } = useAuth();
  const qc = useQueryClient();

  if (user?.role !== 'admin') return <Navigate to="/dashboard" replace />;

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  });

  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  });

  const { data: systemUsage } = useQuery({
    queryKey: ['admin-usage'],
    queryFn: () => api.get('/admin/usage?days=7').then(r => r.data),
  });

  const updatePlan = useMutation({
    mutationFn: ({ id, plan }) => api.patch(`/admin/users/${id}/plan`, { plan }),
    onSuccess: () => { qc.invalidateQueries(['admin-users']); toast.success('Plan updated'); },
    onError: () => toast.error('Failed to update plan'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
        <p className="text-gray-400 text-sm mt-1">System-wide overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Users', value: stats?.totalUsers || 0, color: 'text-blue-400' },
          { label: 'Total APIs', value: stats?.totalApis || 0, color: 'text-purple-400' },
          { label: 'Total Requests', value: stats?.totalRequests || 0, color: 'text-white' },
          { label: 'Total Revenue', value: `₹${stats?.totalRevenue?.toFixed(2) || '0.00'}`, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">System Requests (Last 7 Days)</h3>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={systemUsage || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="_id" stroke="#9CA3AF" tick={{ fontSize: 11 }} />
            <YAxis stroke="#9CA3AF" tick={{ fontSize: 11 }} />
            <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none', color: '#fff' }} />
            <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={false} name="Requests" />
            <Line type="monotone" dataKey="errors" stroke="#EF4444" strokeWidth={2} dot={false} name="Errors" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">All Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-2">Name</th>
                <th className="text-left py-2">Email</th>
                <th className="text-left py-2">Role</th>
                <th className="text-left py-2">Plan</th>
                <th className="text-left py-2">Joined</th>
                <th className="text-left py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(u => (
                <tr key={u._id} className="border-b border-gray-800 text-gray-300">
                  <td className="py-2">{u.name}</td>
                  <td className="py-2">{u.email}</td>
                  <td className="py-2">
                    <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full">{u.role}</span>
                  </td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${u.plan === 'pro' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-300'}`}>
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-2">{new Date(u.createdAt).toLocaleDateString()}</td>
                  <td className="py-2">
                    <select
                      className="bg-gray-800 text-white text-xs px-2 py-1 rounded border border-gray-700"
                      value={u.plan}
                      onChange={(e) => updatePlan.mutate({ id: u._id, plan: e.target.value })}
                    >
                      <option value="free">Free</option>
                      <option value="pro">Pro</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
