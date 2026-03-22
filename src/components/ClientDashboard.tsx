import { useAuth } from '../contexts/AuthContext';
import { LogOut, Package, Clock, ShieldCheck } from 'lucide-react';

export function ClientDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar Glassmorphism */}
      <nav className="bg-white/70 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Package className="h-6 w-6 text-emerald-600" />
            </div>
            <span className="text-xl font-bold text-gray-900">Espace Client</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-600">Bonjour, {profile?.nom || 'Client'}</span>
            <button
              onClick={signOut}
              className="flex items-center gap-2 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors text-sm font-semibold"
            >
              <LogOut className="h-4 w-4" /> Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Mes Commandes</h1>
        
        {/* Exemple de carte de commande avec Glassmorphism */}
        <div className="grid gap-6">
          <div className="bg-white/80 backdrop-blur-sm border border-gray-100 shadow-xl shadow-gray-200/40 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-2xl transition-shadow">
            <div className="flex items-center gap-4">
              <div className="bg-emerald-50 h-16 w-16 rounded-2xl flex items-center justify-center border border-emerald-100">
                <ShieldCheck className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium mb-1">Commande #ORD-2026</p>
                <h3 className="text-lg font-bold text-gray-900">Agneau Aïd Al-Adha</h3>
                <p className="text-sm text-emerald-600 font-medium mt-1 flex items-center gap-1">
                  <Clock className="w-4 h-4" /> En attente de préparation
                </p>
              </div>
            </div>
            <div className="text-right w-full md:w-auto">
              <span className="block text-2xl font-bold text-gray-900 mb-2">350,00 €</span>
              <button className="w-full md:w-auto bg-gray-900 text-white px-6 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors">
                Voir les détails
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}