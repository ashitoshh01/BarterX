import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Search from './pages/Search';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-9 h-9 border-3 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/browse" element={<ProtectedRoute><Search /></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/messages" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/offers" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/my-listings" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/saved" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/swap-history" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/trust-reviews" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/wallet" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
