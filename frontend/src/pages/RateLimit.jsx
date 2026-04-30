import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useAuth } from '../store/AuthContext';

const PLAN_LIMITS = { free: 60, pro: 600 };

export default function RateLimit() {
  const { user } = useAuth();

  const { data: statuses, isLoading } = useQuery({
    queryKey: ['ratelimit'],
    queryFn: () => api.get('/usage/ratelimit').then(r => r.data),
    refetchInterval: 10000,
  });

  const planLimit = PLAN_LIMITS[user?.plan] || 60;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Rate Limiting</h2>
        <p className="text-gray-400 text-sm mt-1">
          Current plan: <span className="text-blue-400 font-medium">{user?.plan?.toUpperCase()}</span>
          &nbsp;— limit: <span className="text-white font-medium">{planLimit} requests/min</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Free Plan</p>
          <p className="text-white font-bold text-xl mt-1">60 req/min</p>
          <p className="text-gray-500 text-xs mt-1">1,000 free requests/month</p>
        </div>
        <div className="bg-gray-900 border border-blue-800 rounded-xl p-5">
          <p className="text-gray-400 text-sm">Pro Plan</p>
          <p className="text-blue-400 font-bold text-xl mt-1">600 req/min</p>
          <p className="text-gray-500 text-xs mt-1">₹0.5 per 100 requests after free tier</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Live Rate Limit Status (per API Key)</h3>
        <p className="text-gray-500 text-xs mb-4">Auto-refreshes every 10 seconds</p>

        {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}

        <div className="space-y-4">
          {statuses?.map((s) => (
            <div key={s.keyId} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-300">{s.label}</span>
                <span className="text-gray-400">{s.used} / {s.limit} req/min</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    s.percentage >= 90 ? 'bg-red-500' :
                    s.percentage >= 70 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${s.percentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span className="font-mono">{s.key}</span>
                <span className={
                  s.percentage >= 90 ? 'text-red-400' :
                  s.percentage >= 70 ? 'text-yellow-400' :
                  'text-green-400'
                }>
                  {s.remaining} remaining
                </span>
              </div>
            </div>
          ))}
          {!isLoading && !statuses?.length && (
            <p className="text-gray-500 text-sm text-center py-4">No active API keys found</p>
          )}
        </div>
      </div>
    </div>
  );
}
