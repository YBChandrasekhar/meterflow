import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../store/AuthContext';

export default function Billing() {
  const { user } = useAuth();

  const { data: current } = useQuery({
    queryKey: ['billing-current'],
    queryFn: () => api.get('/usage/billing').then(r => r.data),
  });

  const { data: history } = useQuery({
    queryKey: ['billing-history'],
    queryFn: () => api.get('/usage/billing/history').then(r => r.data),
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Billing</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Current Plan', value: user?.plan?.toUpperCase() || 'FREE', color: 'text-blue-400' },
          { label: 'Total Requests', value: current?.totalRequests || 0, color: 'text-white' },
          { label: 'Amount Due', value: `₹${current?.amount?.toFixed(2) || '0.00'}`, color: 'text-green-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <p className="text-gray-400 text-sm">{label}</p>
            <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-1">Pricing</h3>
        <p className="text-gray-400 text-sm mb-4">Free: 1,000 requests/month · Pro: ₹0.5 per 100 requests after free tier</p>
        <div className="bg-gray-800 rounded-lg p-4 text-sm text-gray-300 space-y-1">
          <p>Free requests this month: <span className="text-white">{current?.freeRequests || 1000}</span></p>
          <p>Billable requests: <span className="text-yellow-400">{current?.billableRequests || 0}</span></p>
          <p>Total amount: <span className="text-green-400">₹{current?.amount?.toFixed(2) || '0.00'}</span></p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Billing History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-2">Month</th>
                <th className="text-left py-2">Requests</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {history?.map((b) => (
                <tr key={b._id} className="border-b border-gray-800 text-gray-300">
                  <td className="py-2">{b.month}</td>
                  <td className="py-2">{b.totalRequests}</td>
                  <td className="py-2">₹{b.amount.toFixed(2)}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      b.status === 'paid' ? 'bg-green-900 text-green-300' :
                      b.status === 'overdue' ? 'bg-red-900 text-red-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>{b.status}</span>
                  </td>
                </tr>
              ))}
              {!history?.length && (
                <tr><td colSpan={4} className="text-gray-500 py-4 text-center">No billing history</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
