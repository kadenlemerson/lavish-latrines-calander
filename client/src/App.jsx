import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LandingPage from './pages/LandingPage';
import BookingPage from './pages/BookingPage';
import QuotePage from './pages/QuotePage';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import StaffDashboard from './pages/StaffDashboard';
import HowItWorksPage from './pages/HowItWorksPage';

function ProtectedRoute({ children, requireAdmin = false }) {
  const { user, isAdmin, isStaff } = useAuth();
  if (!user || !isStaff) return <Navigate to="/login" replace />;
  if (requireAdmin && !isAdmin) return <Navigate to="/staff" replace />;
  return children;
}

function AppRoutes() {
  const { user, isAdmin } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/book" element={<BookingPage />} />
      <Route path="/quote" element={<QuotePage />} />
      <Route path="/how-it-works" element={<HowItWorksPage />} />
      <Route path="/login" element={
        user ? <Navigate to={isAdmin ? '/admin' : '/staff'} replace /> : <LoginPage />
      } />
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/staff" element={
        <ProtectedRoute>
          <StaffDashboard />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
