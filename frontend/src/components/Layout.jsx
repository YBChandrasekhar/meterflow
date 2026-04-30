import { NavLink } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';
import toast from 'react-hot-toast';

const links = [
  { to: '/dashboard', label: '📊 Dashboard' },
  { to: '/apis', label: '🔌 My APIs' },
  { to: '/playground', label: '🧪 Playground' },
  { to: '/ratelimit', label: '⚡ Rate Limits' },
  { to: '/billing', label: '💳 Billing' },
  { to: '/pricing', label: '💎 Pricing' },
  { to: '/webhooks', label: '🔔 Webhooks' },
  { to: '/audit', label: '📋 Audit Logs' },
];

const adminLinks = [
  { to: '/admin', label: '🛡️ Admin' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out');
  };

  return (
    <div className="flex min-h-screen bg-gray-950">
      <aside className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <h1 className="text-white font-bold text-lg">⚡ MeterFlow</h1>
          <p className="text-gray-400 text-xs mt-0.5">{user?.plan?.toUpperCase()} plan</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {links.map(({ to, label }) => (
            <NavLink key={to} to={to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm transition ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
              }>
              {label}
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <>
              <div className="border-t border-gray-800 my-2" />
              {adminLinks.map(({ to, label }) => (
                <NavLink key={to} to={to}
                  className={({ isActive }) =>
                    `block px-3 py-2 rounded-lg text-sm transition ${isActive ? 'bg-red-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}`
                  }>
                  {label}
                </NavLink>
              ))}
            </>
          )}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <p className="text-gray-400 text-xs truncate">{user?.email}</p>
          <p className="text-gray-500 text-xs">{user?.role}</p>
          <button onClick={handleLogout} className="text-red-400 text-xs mt-2 hover:underline">Logout</button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-auto">{children}</main>
    </div>
  );
}
