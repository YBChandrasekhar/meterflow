import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../store/AuthContext';
import toast from 'react-hot-toast';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    features: ['1,000 requests/month', '60 req/min rate limit', 'Basic analytics'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 499,
    features: ['Unlimited requests', '600 req/min rate limit', 'Advanced analytics', 'Priority support'],
  },
];

export default function Pricing() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [verifying, setVerifying] = useState(false);

  const { data: history, isLoading: historyLoading, error: historyError } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => api.get('/payment/history').then(r => r.data),
    retry: 1,
  });

  // Handle Stripe redirect back
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    if (success && sessionId) {
      setVerifying(true);
      api.post('/payment/verify', { sessionId })
        .then(() => {
          toast.success('Payment successful! You are now on Pro plan.');
          refetchHistory();
          qc.invalidateQueries(['plans']);
          // Update user in localStorage
          const stored = localStorage.getItem('user');
          if (stored) {
            const u = JSON.parse(stored);
            u.plan = 'pro';
            localStorage.setItem('user', JSON.stringify(u));
          }
          setSearchParams({});
          window.location.reload();
        })
        .catch(() => toast.error('Payment verification failed'))
        .finally(() => setVerifying(false));
    }

    if (canceled) {
      toast.error('Payment was canceled');
      setSearchParams({});
    }
  }, []);

  const { mutate: selectPlan, isPending } = useMutation({
    mutationFn: async (planId) => {
      if (planId === 'free') {
        await api.post('/payment/downgrade');
        const stored = localStorage.getItem('user');
        if (stored) {
          const u = JSON.parse(stored);
          u.plan = 'free';
          localStorage.setItem('user', JSON.stringify(u));
        }
        toast.success('Switched to Free plan');
        window.location.reload();
        return;
      }
      const { data } = await api.post('/payment/checkout', { plan: planId });
      window.location.href = data.url;
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Something went wrong'),
  });

  const currentPlan = user?.plan || 'free';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Plans & Pricing</h2>
        <p className="text-gray-400 text-sm mt-1">
          Current plan: <span className="text-blue-400 font-medium">{currentPlan.toUpperCase()}</span>
        </p>
      </div>

      {verifying && (
        <div className="bg-blue-900 border border-blue-700 rounded-xl p-4 text-blue-300 text-sm">
          ⏳ Verifying your payment...
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isLoading = isPending;

          return (
            <div
              key={plan.id}
              className={`bg-gray-900 border rounded-xl p-6 ${
                isCurrent ? 'border-green-500' :
                plan.id === 'pro' ? 'border-blue-500' :
                'border-gray-800'
              }`}
            >
              {isCurrent && (
                <span className="bg-green-700 text-white text-xs px-2 py-0.5 rounded-full mb-3 inline-block">
                  ✓ Active
                </span>
              )}
              {!isCurrent && plan.id === 'pro' && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full mb-3 inline-block">
                  Recommended
                </span>
              )}

              <h3 className="text-white font-bold text-xl mt-1">{plan.name}</h3>
              <p className="text-3xl font-bold text-white mt-2">
                {plan.price === 0 ? 'Free' : `₹${plan.price}`}
                {plan.price > 0 && <span className="text-gray-400 text-sm font-normal">/month</span>}
              </p>

              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="text-gray-300 text-sm flex items-center gap-2">
                    <span className="text-green-400">✓</span> {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => !isCurrent && !isLoading && selectPlan(plan.id)}
                disabled={isCurrent || isLoading}
                className={`w-full mt-6 py-3 rounded-lg font-medium text-sm transition ${
                  isCurrent
                    ? 'bg-green-800 text-green-300 cursor-default'
                    : plan.id === 'pro'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white cursor-pointer'
                    : 'bg-gray-700 hover:bg-gray-600 text-white cursor-pointer'
                } disabled:opacity-60`}
              >
                {isCurrent
                  ? '✓ Current Plan'
                  : isLoading
                  ? 'Please wait...'
                  : plan.id === 'pro'
                  ? '⚡ Upgrade to Pro — ₹499/mo'
                  : '↓ Switch to Free'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Test Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3">Test Card Details</h3>
        <div className="bg-gray-800 rounded-lg p-4 text-sm space-y-1 font-mono">
          <p className="text-gray-300">Card: <span className="text-green-400">4242 4242 4242 4242</span></p>
          <p className="text-gray-300">Expiry: <span className="text-green-400">12/26</span></p>
          <p className="text-gray-300">CVV: <span className="text-green-400">123</span></p>
          <p className="text-gray-300">ZIP: <span className="text-green-400">12345</span></p>
        </div>
      </div>

      {/* Payment History */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-4">Payment History</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-2">Date</th>
                <th className="text-left py-2">Plan</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading && (
                <tr><td colSpan={4} className="text-gray-400 py-4 text-center">Loading...</td></tr>
              )}
              {historyError && (
                <tr><td colSpan={4} className="text-red-400 py-4 text-center">Failed to load payment history</td></tr>
              )}
              {history?.map((p) => (
                <tr key={p._id} className="border-b border-gray-800 text-gray-300">
                  <td className="py-2">{new Date(p.createdAt).toLocaleDateString()}</td>
                  <td className="py-2 capitalize">{p.plan}</td>
                  <td className="py-2">₹{p.amount}</td>
                  <td className="py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      p.status === 'paid' ? 'bg-green-900 text-green-300' :
                      p.status === 'failed' ? 'bg-red-900 text-red-300' :
                      'bg-yellow-900 text-yellow-300'
                    }`}>{p.status}</span>
                  </td>
                </tr>
              ))}
              {!history?.length && (
                <tr>
                  <td colSpan={4} className="text-gray-500 py-4 text-center">No payments yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
