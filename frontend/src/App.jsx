import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './store/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import APIs from './pages/APIs';
import Billing from './pages/Billing';
import RateLimit from './pages/RateLimit';
import Pricing from './pages/Pricing';
import Playground from './pages/Playground';
import Webhooks from './pages/Webhooks';
import AuditLogs from './pages/AuditLogs';
import Admin from './pages/Admin';

const queryClient = new QueryClient();

const Protected = ({ children }) => (
  <ProtectedRoute><Layout>{children}</Layout></ProtectedRoute>
);

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" toastOptions={{ style: { background: '#1F2937', color: '#fff' } }} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Protected><Dashboard /></Protected>} />
            <Route path="/apis" element={<Protected><APIs /></Protected>} />
            <Route path="/billing" element={<Protected><Billing /></Protected>} />
            <Route path="/ratelimit" element={<Protected><RateLimit /></Protected>} />
            <Route path="/pricing" element={<Protected><Pricing /></Protected>} />
            <Route path="/playground" element={<Protected><Playground /></Protected>} />
            <Route path="/webhooks" element={<Protected><Webhooks /></Protected>} />
            <Route path="/audit" element={<Protected><AuditLogs /></Protected>} />
            <Route path="/admin" element={<Protected><Admin /></Protected>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
