import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
import { ReservationForm } from './components/ReservationForm';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reservation" element={<ReservationForm />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}