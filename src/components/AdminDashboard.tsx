import { useState, useEffect } from 'react';
import { LogOut, Package, Truck, CheckCircle, Clock, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export function AdminDashboard() {
  const { signOut, profile } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [livreurs, setLivreurs] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    loadData();

    const channel = supabase
      .channel('orders_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        loadOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadData = async () => {
    await Promise.all([loadOrders(), loadLivreurs()]);
    setLoading(false);
  };

  const loadOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading orders:', error);
      return;
    }
    setOrders(data || []);
  };

  const loadLivreurs = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'livreur');

    if (error) {
      console.error('Error loading livreurs:', error);
      return;
    }
    setLivreurs(data || []);
  };

  const updateOrderStatus = async (orderId: string, statut: Order['statut']) => {
    const { error } = await supabase
      .from('orders')
      .update({ statut })
      .eq('id', orderId);

    if (error) {
      console.error('Error updating order:', error);
      alert('Erreur lors de la mise à jour');
    }
  };

  const assignLivreur = async (orderId: string, livreurId: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ livreur_id: livreurId })
      .eq('id', orderId);

    if (error) {
      console.error('Error assigning livreur:', error);
      alert('Erreur lors de l\'assignation');
    }
  };

  // CORRECTION ICI : Ajout de sécurités (|| '') pour éviter le crash si une donnée est nulle
  const filteredOrders = orders.filter(order => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      (order.numero_commande || '').toLowerCase().includes(searchLower) ||
      (order.client_nom || '').toLowerCase().includes(searchLower) ||
      (order.client_prenom || '').toLowerCase().includes(searchLower);

    const matchesStatus = statusFilter === 'all' || order.statut === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: orders.length,
    en_attente: orders.filter(o => o.statut === 'en_attente').length,
    en_livraison: orders.filter(o => o.statut === 'en_livraison').length,
    livree: orders.filter(o => o.statut === 'livree').length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Dashboard Admin</h1>
              <p className="text-sm text-gray-600">Bienvenue, {profile?.nom || profile?.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center text-gray-600 hover:text-red-600 transition-colors"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Package className="h-6 w-6" />}
            label="Total commandes"
            value={stats.total}
            color="bg-blue-500"
          />
          <StatCard
            icon={<Clock className="h-6 w-6" />}
            label="En attente"
            value={stats.en_attente}
            color="bg-yellow-500"
          />
          <StatCard
            icon={<Truck className="h-6 w-6" />}
            label="En livraison"
            value={stats.en_livraison}
            color="bg-orange-500"
          />
          <StatCard
            icon={<CheckCircle className="h-6 w-6" />}
            label="Livrées"
            value={stats.livree}
            color="bg-emerald-500"
          />
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher par numéro, nom..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">Tous les statuts</option>
              <option value="en_attente">En attente</option>
              <option value="confirmee">Confirmée</option>
              <option value="en_livraison">En livraison</option>
              <option value="livree">Livrée</option>
              <option value="annulee">Annulée</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">N° Commande</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Client</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Adresse</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Nom sacrifice</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date livraison</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Statut</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Livreur</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Prix</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-900">{order.numero_commande}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div>
                        <p className="font-medium text-gray-900">{order.client_prenom} {order.client_nom}</p>
                        <p className="text-sm text-gray-500">{order.client_telephone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-600">
                        <p>{order.adresse_livraison}</p>
                        <p>{order.code_postal} {order.ville}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-900">{order.nom_sacrifice}</td>
                    <td className="px-4 py-4 text-gray-900">
                      {order.date_livraison_souhaitee ? new Date(order.date_livraison_souhaitee).toLocaleDateString('fr-FR') : '-'}
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.statut}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['statut'])}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.statut)} cursor-pointer`}
                      >
                        <option value="en_attente">En attente</option>
                        <option value="confirmee">Confirmée</option>
                        <option value="en_livraison">En livraison</option>
                        <option value="livree">Livrée</option>
                        <option value="annulee">Annulée</option>
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <select
                        value={order.livreur_id || ''}
                        onChange={(e) => assignLivreur(order.id, e.target.value)}
                        className="px-3 py-1 border border-gray-300 rounded text-sm cursor-pointer"
                      >
                        <option value="">Non assigné</option>
                        {livreurs.map((livreur) => (
                          <option key={livreur.id} value={livreur.id}>
                            {livreur.nom || livreur.email}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-emerald-600 font-semibold">{order.prix}€</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">Aucune commande trouvée</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`${color} p-3 rounded-lg text-white shadow-sm`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function getStatusColor(status: string): string {
  const colors = {
    en_attente: 'bg-yellow-100 text-yellow-800',
    confirmee: 'bg-blue-100 text-blue-800',
    en_livraison: 'bg-orange-100 text-orange-800',
    livree: 'bg-emerald-100 text-emerald-800',
    annulee: 'bg-red-100 text-red-800',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800';
}