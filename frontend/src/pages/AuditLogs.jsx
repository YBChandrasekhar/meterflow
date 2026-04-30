import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';

export default function AuditLogs() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page],
    queryFn: () => api.get(`/audit?page=${page}&limit=20`).then(r => r.data),
  });

  const ACTION_COLORS = {
    CREATE: 'bg-green-900 text-green-300',
    UPDATE: 'bg-yellow-900 text-yellow-300',
    DELETE: 'bg-red-900 text-red-300',
    GENERATE_KEY: 'bg-blue-900 text-blue-300',
    REVOKE_KEY: 'bg-red-900 text-red-300',
    ROTATE_KEY: 'bg-purple-900 text-purple-300',
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Audit Logs</h2>
        <p className="text-gray-400 text-sm mt-1">Track all actions performed on your account</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        {isLoading && <p className="text-gray-400 text-sm">Loading...</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-400 border-b border-gray-800">
                <th className="text-left py-2">Time</th>
                <th className="text-left py-2">Action</th>
                <th className="text-left py-2">Resource</th>
                <th className="text-left py-2">IP</th>
              </tr>
            </thead>
            <tbody>
              {data?.logs?.map(log => (
                <tr key={log._id} className="border-b border-gray-800 text-gray-300">
                  <td className="py-2 text-xs text-gray-500">{new Date(log.createdAt).toLocaleString()}</td>
                  <td className="py-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] || 'bg-gray-700 text-gray-300'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-2 text-xs font-mono">{log.resource}</td>
                  <td className="py-2 text-xs text-gray-500">{log.ip || 'N/A'}</td>
                </tr>
              ))}
              {!isLoading && !data?.logs?.length && (
                <tr><td colSpan={4} className="text-gray-500 py-4 text-center">No audit logs yet</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {data?.pages > 1 && (
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-sm text-blue-400 hover:underline disabled:opacity-40"
            >← Previous</button>
            <span className="text-gray-400 text-sm">Page {page} of {data.pages}</span>
            <button
              onClick={() => setPage(p => Math.min(data.pages, p + 1))}
              disabled={page === data.pages}
              className="text-sm text-blue-400 hover:underline disabled:opacity-40"
            >Next →</button>
          </div>
        )}
      </div>
    </div>
  );
}
