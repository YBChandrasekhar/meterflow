import { useQuery, useMutation } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../store/AuthContext';
import toast from 'react-hot-toast';

export default function Pricing() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: () => api.get('/payment/plans').then(r => r.data),
  });

  const { data: history } = useQuery({
    queryKey: ['payment-history'],
    queryFn: () => api.get('/payment/history').then(r => r.data),
  });

  // Handle redirect back from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const sessionId = searchParams.get('session_id');
    const canceled = searchParams.get('canceled');

    if (success && sessionId) {
      api.post('/payment/verify', { sessionId })
        .then(() => toast.success('Payment successful! Plan upgraded to Pro.'))
        .catch(() => toast.error('Payment verification failed'));
    }
    if (canceled) {
      toast.error('Payment canceled');
    }
  }, [searchParams]);

  const { mutate: upgrade, isPending } = useMutation({
    mutationFn: async (planId) => {
      const { data } = await api.post('/payment/checkout', { plan: planId });
      window.location.href = data.url;
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create checkout'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Plans & Pricing</h2>
        <p className="text-gray-400 text-sm mt-1">
          Current plan: <span className="text-blue-400 font-medium">{user?.plan?.toUpperCase()}</span>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans?.map((plan) => (
          <div key={plan.id} className={`bg-gray-900 border rounded-xl p-6 ${plan.id === 'pro' ? 'border-blue-500' : 'border-gray-800'}`}>
            {plan.id === 'pro' && (
              <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full mb-3 inline-block">Recommended</span>
            )}
            <h3 className="text-white font-bold text-xl">{plan.name}</h3>
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
              onClick={() => plan.id === 'pro' && upgrade(plan.id)}
              disabled={user?.plan === plan.id || isPending}
              className={`w-full mt-6 py-2.5 rounded-lg font-medium text-sm transition ${
                user?.plan === plan.id
                  ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  : plan.id === 'pro'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-800 text-gray-300'
              }`}
            >
              {user?.plan === plan.id
                ? 'Current Plan'
                : plan.id === 'pro'
                ? isPending ? 'Redirecting...' : 'Upgrade to Pro'
                : 'Free Plan'}
            </button>
          </div>
        ))}
      </div>

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
                <tr><td colSpan={4} className="text-gray-500 py-4 text-center">No payments yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-2">Test Card Details</h3>
        <div className="bg-gray-800 rounded-lg p-4 text-sm space-y-1 font-mono">
          <p className="text-gray-300">Card: <span className="text-green-400">4242 4242 4242 4242</span></p>
          <p className="text-gray-300">Expiry: <span className="text-green-400">12/26</span></p>
          <p className="text-gray-300">CVV: <span className="text-green-400">123</span></p>
          <p className="text-gray-300">ZIP: <span className="text-green-400">12345</span></p>
        </div>
      </div>
    </div>
  );
}
