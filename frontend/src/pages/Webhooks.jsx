import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

const EVENTS = ['rate_limit_exceeded', 'billing_threshold', 'key_revoked'];

export default function Webhooks() {
  const qc = useQueryClient();
  const [form, setForm] = useState({ url: '', events: [] });
  const [showForm, setShowForm] = useState(false);

  const { data: webhooks, isLoading } = useQuery({
    queryKey: ['webhooks'],
    queryFn: () => api.get('/webhooks').then(r => r.data),
  });

  const create = useMutation({
    mutationFn: (data) => api.post('/webhooks', data),
    onSuccess: () => { qc.invalidateQueries(['webhooks']); toast.success('Webhook created'); setShowForm(false); setForm({ url: '', events: [] }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  const remove = useMutation({
    mutationFn: (id) => api.delete(`/webhooks/${id}`),
    onSuccess: () => { qc.invalidateQueries(['webhooks']); toast.success('Webhook deleted'); },
  });

  const toggle = useMutation({
    mutationFn: (id) => api.patch(`/webhooks/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries(['webhooks']),
  });

  const toggleEvent = (event) => {
    setForm(f => ({
      ...f,
      events: f.events.includes(event) ? f.events.filter(e => e !== event) : [...f.events, event],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">Webhooks</h2>
          <p className="text-gray-400 text-sm mt-1">Get notified when events happen</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
          + Add Webhook
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <h3 className="text-white font-semibold">New Webhook</h3>
          <input
            placeholder="Webhook URL (https://...)"
            className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
          />
          <div>
            <p className="text-gray-400 text-xs mb-2">Select Events:</p>
            <div className="flex gap-3 flex-wrap">
              {EVENTS.map(event => (
                <label key={event} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.events.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="accent-blue-500"
                  />
                  <span className="text-gray-300 text-sm">{event}</span>
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setShowForm(false)} className="flex-1 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700">Cancel</button>
            <button
              onClick={() => create.mutate(form)}
              disabled={!form.url || !form.events.length || create.isPending}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {create.isPending ? 'Creating...' : 'Create Webhook'}
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}
        {webhooks?.map(wh => (
          <div key={wh._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-white font-mono text-sm">{wh.url}</p>
                <div className="flex gap-2 flex-wrap mt-2">
                  {wh.events.map(e => (
                    <span key={e} className="bg-blue-900 text-blue-300 text-xs px-2 py-0.5 rounded-full">{e}</span>
                  ))}
                </div>
                <p className="text-gray-500 text-xs mt-1">Secret: <span className="font-mono">{wh.secret.slice(0, 16)}...</span></p>
              </div>
              <div className="flex gap-3 items-center">
                <span className={`text-xs px-2 py-0.5 rounded-full ${wh.isActive ? 'bg-green-900 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                  {wh.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => toggle.mutate(wh._id)} className="text-xs text-yellow-400 hover:underline">
                  {wh.isActive ? 'Disable' : 'Enable'}
                </button>
                <button onClick={() => remove.mutate(wh._id)} className="text-xs text-red-400 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
        {!isLoading && !webhooks?.length && (
          <p className="text-gray-500 text-center py-8">No webhooks yet. Add one to get notified.</p>
        )}
      </div>
    </div>
  );
}
