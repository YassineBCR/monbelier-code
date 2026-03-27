import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { ReservationForm } from './components/ReservationForm';
import { SuccessPage } from './components/SuccessPage';
import { CancelPage } from './components/CancelPage';
import { AdminDashboard } from './components/AdminDashboard';
import { AbattoirDashboard } from './components/AbattoirDashboard';
import { LivreurDashboard } from './components/LivreurDashboard';
import { MosqueeAdminDashboard } from './components/Mosqueeadmindashboard';
import { PickupPage } from './components/PickupPage';
import { ProtectedRoute } from './components/ProtectedRoute';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* ── Pages publiques ── */}
          <Route path="/"            element={<HomePage />} />
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/success"     element={<SuccessPage />} />
          <Route path="/cancel"      element={<CancelPage />} />

          {/* ── QR Code retrait — accessible sans connexion ── */}
          <Route path="/retrait/:token" element={<PickupPage />} />

          {/* ── Réservation (client connecté) ── */}
          <Route path="/reservation" element={
            <ProtectedRoute roles={['client', 'admin']}>
              <ReservationForm />
            </ProtectedRoute>
          } />

          {/* ── Admin global ── */}
          <Route path="/admin/global" element={
            <ProtectedRoute roles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />

          {/* ── Abattoir ── */}
          <Route path="/abattoir" element={
            <ProtectedRoute roles={['abattoir', 'admin']}>
              <AbattoirDashboard />
            </ProtectedRoute>
          } />

          {/* ── Livreur ── */}
          <Route path="/livreur" element={
            <ProtectedRoute roles={['livreur', 'admin']}>
              <LivreurDashboard />
            </ProtectedRoute>
          } />

          {/* ── Admin mosquée ── */}
          <Route path="/mosquee" element={
            <ProtectedRoute roles={['mosquee_admin', 'admin']}>
              <MosqueeAdminDashboard />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </Router>
  );
}