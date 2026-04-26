import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import toast from 'react-hot-toast';

const CreateApiModal = ({ onClose }) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({ name: '', description: '', baseUrl: '', rateLimit: 1000 });

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => api.post('/apis', data),
    onSuccess: () => {
      qc.invalidateQueries(['apis']);
      toast.success('API created!');
      onClose();
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed'),
  });

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-md">
        <h3 className="text-white font-bold text-lg mb-4">Create New API</h3>
        <div className="space-y-3">
          {[['name', 'API Name'], ['description', 'Description'], ['baseUrl', 'Base URL (e.g. https://pokeapi.co/api/v2)']].map(([key, ph]) => (
            <input key={key} placeholder={ph}
              className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
              value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            />
          ))}
          <input type="number" placeholder="Rate Limit (req/min)"
            className="w-full bg-gray-800 text-white px-4 py-2.5 rounded-lg border border-gray-700 focus:outline-none focus:border-blue-500"
            value={form.rateLimit} onChange={(e) => setForm({ ...form, rateLimit: +e.target.value })}
          />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 bg-gray-800 text-white py-2 rounded-lg hover:bg-gray-700">Cancel</button>
          <button onClick={() => mutate(form)} disabled={isPending}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50">
            {isPending ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  );
};

const ApiKeysPanel = ({ apiId }) => {
  const qc = useQueryClient();
  const { data: keys } = useQuery({
    queryKey: ['keys', apiId],
    queryFn: () => api.get(`/apis/${apiId}/keys`).then(r => r.data),
  });

  const revoke = useMutation({
    mutationFn: (keyId) => api.patch(`/apis/${apiId}/keys/${keyId}/revoke`),
    onSuccess: () => { qc.invalidateQueries(['keys', apiId]); toast.success('Key revoked'); },
  });

  const rotate = useMutation({
    mutationFn: (keyId) => api.patch(`/apis/${apiId}/keys/${keyId}/rotate`),
    onSuccess: () => { qc.invalidateQueries(['keys', apiId]); toast.success('Key rotated'); },
  });

  return (
    <div className="mt-3 space-y-2">
      {keys?.map((k) => (
        <div key={k._id} className="flex items-center justify-between bg-gray-800 px-3 py-2 rounded-lg">
          <div>
            <p className="text-xs text-gray-400">{k.label}</p>
            <p className="text-xs font-mono text-green-400">{k.key}</p>
          </div>
          <div className="flex gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${k.status === 'active' ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
              {k.status}
            </span>
            {k.status === 'active' && (
              <>
                <button onClick={() => rotate.mutate(k._id)} className="text-xs text-yellow-400 hover:underline">Rotate</button>
                <button onClick={() => revoke.mutate(k._id)} className="text-xs text-red-400 hover:underline">Revoke</button>
              </>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default function APIs() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [expandedApi, setExpandedApi] = useState(null);

  const { data: apis, isLoading } = useQuery({
    queryKey: ['apis'],
    queryFn: () => api.get('/apis').then(r => r.data),
  });

  const deleteApi = useMutation({
    mutationFn: (id) => api.delete(`/apis/${id}`),
    onSuccess: () => { qc.invalidateQueries(['apis']); toast.success('API deleted'); },
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">My APIs</h2>
        <button onClick={() => setShowModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">
          + Create API
        </button>
      </div>

      {isLoading && <p className="text-gray-400">Loading...</p>}

      <div className="space-y-4">
        {apis?.map((a) => (
          <div key={a._id} className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-white font-semibold">{a.name}</h3>
                <p className="text-gray-400 text-sm">{a.description}</p>
                <p className="text-blue-400 text-xs font-mono mt-1">{a.baseUrl}</p>
                <p className="text-gray-500 text-xs mt-1">Rate limit: {a.rateLimit} req/min</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setExpandedApi(expandedApi === a._id ? null : a._id)}
                  className="text-sm text-blue-400 hover:underline">
                  {expandedApi === a._id ? 'Hide Keys' : 'View Keys'}
                </button>
                <button onClick={() => deleteApi.mutate(a._id)} className="text-sm text-red-400 hover:underline">Delete</button>
              </div>
            </div>
            {expandedApi === a._id && <ApiKeysPanel apiId={a._id} />}
          </div>
        ))}
        {!isLoading && !apis?.length && (
          <p className="text-gray-500 text-center py-10">No APIs yet. Create your first one!</p>
        )}
      </div>

      {showModal && <CreateApiModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
