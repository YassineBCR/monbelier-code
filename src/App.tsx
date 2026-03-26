import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { ReservationForm } from './components/ReservationForm';
import { SuccessPage } from './components/SuccessPage';
import { CancelPage } from './components/CancelPage';
// 1. IMPORT DU DASHBOARD ADMIN
import { AdminDashboard } from './components/AdminDashboard'; 

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reservation" element={<ReservationForm />} />
          <Route path="/success" element={<SuccessPage />} /> 
          <Route path="/cancel" element={<CancelPage />} />
          {/* 2. AJOUT DE LA ROUTE POUR LE DASHBOARD */}
          <Route path="/admin/global" element={<AdminDashboard />} /> 
        </Routes>
      </AuthProvider>
    </Router>
  );
}