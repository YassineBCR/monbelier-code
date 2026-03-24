import { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { HomePage } from './components/HomePage';
import { OrderForm } from './components/OrderForm';
import { LoginPage } from './components/LoginPage';
import { AdminDashboard } from './components/AdminDashboard';
import { LivreurDashboard } from './components/LivreurDashboard';

function AppContent() {
  const { user, loading, isAdmin, isLivreur } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'order' | 'login' | 'dashboard'>('home');

  useEffect(() => {
    if (user && currentView === 'login') {
      setCurrentView('dashboard');
    }
  }, [user, currentView]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'dashboard' && user) {
    if (isAdmin) {
      return (
        <>
          <AdminDashboard />
          <button
            onClick={() => setCurrentView('home')}
            className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-all shadow-lg z-50"
          >
            Retour à l'accueil
          </button>
        </>
      );
    }
    if (isLivreur) {
      return (
        <>
          <LivreurDashboard />
          <button
            onClick={() => setCurrentView('home')}
            className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 transition-all shadow-lg z-50"
          >
            Retour à l'accueil
          </button>
        </>
      );
    }
  }

  if (!user && currentView === 'login') {
    return <LoginPage onBack={() => setCurrentView('home')} />;
  }

  if (currentView === 'order') {
    return <OrderForm onBack={() => setCurrentView('home')} />;
  }

  return (
    <HomePage 
      onOrderClick={() => setCurrentView('order')} 
      onDashboardClick={() => setCurrentView('dashboard')} 
      onLoginClick={() => setCurrentView('login')} 
    />
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;