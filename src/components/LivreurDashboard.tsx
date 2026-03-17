import { useState, useEffect } from 'react';
import { LogOut, Package, MapPin, Phone, Navigation, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Order = Database['public']['Tables']['orders']['Row'];

export function LivreurDashboard() {
  const { signOut, profile, user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadOrders();

      const channel = supabase
        .channel('livreur_orders')
        .on('postgres_changes',
          { event: '*', schema: 'public', table: 'orders', filter: `livreur_id=eq.${user.id}` },
          () => {
            loadOrders();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadOrders = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('livreur_id', user.id)
      .in('statut', ['confirmee', 'en_livraison'])
      .order('date_livraison_souhaitee', { ascending: true });

    if (error) {
      console.error('Error loading orders:', error);
      return;
    }
    setOrders(data || []);
    setLoading(false);
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

  const openNavigation = (address: string, ville: string) => {
    const query = encodeURIComponent(`${address}, ${ville}`);
    window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <nav className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-bold text-gray-900">Mes livraisons</h1>
              <p className="text-sm text-gray-600">{profile?.nom || profile?.email}</p>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
            <div className="flex items-center">
              <Package className="h-5 w-5 text-emerald-600 mr-3" />
              <div>
                <p className="font-semibold text-emerald-900">
                  {orders.length} livraison{orders.length > 1 ? 's' : ''} assignée{orders.length > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-emerald-700">
                  {orders.filter(o => o.statut === 'en_livraison').length} en cours
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{order.numero_commande}</h3>
                  <p className="text-sm text-gray-500">
                    {order.date_livraison_souhaitee
                      ? `Livraison : ${new Date(order.date_livraison_souhaitee).toLocaleDateString('fr-FR')}`
                      : 'Date non définie'
                    }
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  order.statut === 'en_livraison'
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {order.statut === 'en_livraison' ? 'En livraison' : 'À livrer'}
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-start">
                  <Package className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="font-semibold text-gray-900">{order.client_prenom} {order.client_nom}</p>
                    <p className="text-sm text-gray-600">Sacrifice : {order.nom_sacrifice}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-gray-900">{order.adresse_livraison}</p>
                    <p className="text-sm text-gray-600">{order.code_postal} {order.ville}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <a href={`tel:${order.client_telephone}`} className="text-emerald-600 hover:text-emerald-700 font-medium">
                    {order.client_telephone}
                  </a>
                </div>

                {order.notes && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                    <p className="text-sm text-yellow-900"><strong>Notes :</strong> {order.notes}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openNavigation(order.adresse_livraison, order.ville)}
                  className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all flex items-center justify-center"
                >
                  <Navigation className="h-5 w-5 mr-2" />
                  Naviguer
                </button>

                {order.statut === 'confirmee' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'en_livraison')}
                    className="flex-1 bg-orange-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-all flex items-center justify-center"
                  >
                    Démarrer
                  </button>
                )}

                {order.statut === 'en_livraison' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'livree')}
                    className="flex-1 bg-blue-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-all flex items-center justify-center"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Livrée
                  </button>
                )}
              </div>
            </div>
          ))}

          {orders.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucune livraison assignée</h3>
              <p className="text-gray-600">Vous n'avez pas de livraisons en cours pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
