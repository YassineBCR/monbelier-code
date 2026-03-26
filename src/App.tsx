// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { HomePage } from './components/HomePage';
import { LoginPage } from './components/LoginPage';
// ... autres imports

export default function App() {
  return (
    <Router> {/* Le Router doit être à l'extérieur de l'AuthProvider */}
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          {/* ... vos autres routes */}
        </Routes>
      </AuthProvider>
    </Router>
  );
}