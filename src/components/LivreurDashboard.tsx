import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Store, Package, Phone, Navigation,
  CheckCircle2, Printer, Map, ChevronDown, ChevronUp,
  List, CheckCheck
} from 'lucide-react';

interface Reservation {
  id: string;
  numero_commande: string;
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  quantite: number;
  noms_sacrifice: string[];
  mosquee_id: string;
  qr_token: string;
  statut: string;
  mosquees: { id: string; nom: string; adresse: string } | null;
}

interface MosqueeGroup {
  mosquee: { id: string; nom: string; adresse: string };
  orders: Reservation[];
}

export function LivreurDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [circuitGroups, setCircuitGroups] = useState<MosqueeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Onglets : 'toutes', 'a_livrer', 'livrees'
  const [activeTab, setActiveTab] = useState('a_livrer');
  
  const [expandedMosquee, setExpandedMosquee] = useState<string | null>(null);
  const [depositing, setDepositing] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      fetchOrders();
      
      const channel = supabase
        .channel('livreur_orders_updates')
        .on(
          'postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'reservations'
          }, 
          (payload) => {
            console.log('🔄 Mise à jour livreur reçue !', payload);
            fetchOrders();
          }
        )
        .subscribe();
        
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // CORRECTION ICI : On a retiré "horaires" de la requête
      const { data, error } = await supabase
        .from('reservations')
        .select('*, mosquees(id, nom, adresse)')
        .order('created_at', { ascending: false });

      if (error) {
        alert("Erreur de base de données : " + error.message);
        throw error;
      }
      
      const allOrders = (data as Reservation[]) || [];
      setReservations(allOrders);

      // Création du circuit
      const toDeliver = allOrders.filter(r => r.statut === 'en_livraison' || r.statut === 'en_transit');
      
      const byMosquee: Record<string, MosqueeGroup> = {};
      for (const r of toDeliver) {
        const key = r.mosquee_id;
        if (!key) continue;
        
        if (!byMosquee[key]) {
          byMosquee[key] = {
            mosquee: r.mosquees || { id: key, nom: 'Point de retrait inconnu', adresse: '' },
            orders: [],
          };
        }
        byMosquee[key].orders.push(r);
      }

      const grouped = Object.values(byMosquee);
      setCircuitGroups(grouped);
      
      if (grouped.length > 0 && !expandedMosquee) {
        setExpandedMosquee(grouped[0].mosquee.id);
      }
    } catch (error) {
      console.error("Erreur chargement commandes livreur:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeposer = async (group: MosqueeGroup) => {
    setDepositing(group.mosquee.id);
    const ids = group.orders.map(o => o.id);

    try {
      const { error } = await supabase
        .from('reservations')
        .update({ statut: 'a_recuperer' })
        .in('id', ids);

      if (error) throw error;

      setSuccessMsg(`✅ ${ids.length} agneau(x) déposé(s) à ${group.mosquee.nom}. La mosquée est notifiée !`);
      setTimeout(() => setSuccessMsg(''), 6000);
      
      fetchOrders();
    } catch (error: any) {
      alert('Erreur lors du dépôt : ' + error.message);
    } finally {
      setDepositing(null);
      setExpandedMosquee(null);
    }
  };

  const handlePrintTicket = (group: MosqueeGroup) => {
    const { mosquee, orders } = group;
    const totalAgneaux = orders.reduce((a, r) => a + (r.quantite || 1), 0);

    const printContent = `
      <html><head>
        <title>Ticket Livraison — ${mosquee.nom}</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 16px; color: #1e293b; font-size: 13px; }
          h1 { color: #065f46; font-size: 18px; margin-bottom: 4px; }
          .meta { color: #64748b; font-size: 12px; margin-bottom: 16px; }
          .mosquee-card { background: #f0fdf4; border: 2px solid #059669; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; }
          .mosquee-card h2 { color: #065f46; font-size: 16px; margin: 0 0 4px; }
          .mosquee-card p { color: #374151; margin: 2px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #1e293b; color: #fff; text-align: left; padding: 8px; font-size: 11px; text-transform: uppercase; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 12px; vertical-align: top; }
          tr:nth-child(even) td { background: #f8fafc; }
          .badge { display: inline-block; background: #fef3c7; color: #92400e; border-radius: 4px; padding: 2px 6px; font-weight: bold; }
          .footer { margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 12px; color: #94a3b8; font-size: 11px; }
          @media print { body { padding: 8px; } }
        </style>
      </head><body>
        <h1>🚚 Ticket de Livraison — Mon Bélier</h1>
        <p class="meta">Date : ${new Date().toLocaleDateString('fr-FR')} | Livreur : ${profile?.nom || user?.email || '—'} | Total : ${totalAgneaux} agneau(x)</p>
        <div class="mosquee-card">
          <h2>📍 ${mosquee.nom}</h2>
          <p>${mosquee.adresse || '—'}</p>
        </div>
        <table>
          <thead><tr><th style="width:24px;">#</th><th>N° Commande</th><th>Client</th><th>Qté</th><th>Téléphone</th></tr></thead>
          <tbody>
            ${orders.map((r, i) => `<tr><td>${i + 1}</td><td><strong>${r.numero_commande}</strong></td><td>${r.prenom} ${r.nom}</td><td><span class="badge">${r.quantite}</span></td><td>${r.telephone || '—'}</td></tr>`).join('')}
          </tbody>
        </table>
        <p class="footer">Mon Bélier · ✅ Faites signer ce ticket à la mosquée lors du dépôt.</p>
      </body></html>
    `;

    const win = window.open('', '_blank');
    if (win) { win.document.write(printContent); win.document.close(); win.print(); }
  };

  const filteredReservations = reservations.filter(res => {
    if (activeTab === 'toutes') return true;
    if (activeTab === 'a_livrer') return res.statut === 'en_livraison' || res.statut === 'en_transit';
    if (activeTab === 'livrees') return ['a_recuperer', 'termine'].includes(res.statut);
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 p-3 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
        
        {loading && reservations.length === 0 ? (
          <div className="text-center py-20 text-slate-500 font-medium">Chargement de votre tournée...</div>
        ) : (
          <>
            <header className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3 md:gap-4">
                <span className="bg-blue-100 p-3 md:p-4 rounded-2xl text-blue-600 shrink-0">
                  <Truck className="w-7 h-7 md:w-8 md:h-8" />
                </span>
                <div>
                  <h1 className="text-xl md:text-3xl font-black text-slate-900 leading-tight">
                    Espace Livreur
                  </h1>
                  <p className="text-slate-500 mt-1 font-medium flex items-center gap-1.5 text-xs md:text-sm">
                    {profile?.nom || user?.email}
                  </p>
                </div>
              </div>
              <button onClick={() => { signOut(); navigate('/'); }} className="text-sm font-bold text-red-500 hover:text-red-600 bg-red-50 px-4 py-2 rounded-xl transition-colors w-max">
                Déconnexion
              </button>
            </header>

            <section className="bg-slate-900 rounded-3xl p-4 md:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
              
              <div className="relative z-10 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                    <Map className="w-5 h-5 md:w-6 md:h-6 text-blue-400"/>
                    Votre Circuit de Livraison
                  </h2>
                  <span className="bg-blue-500/20 text-blue-300 px-4 py-1.5 rounded-full text-sm font-bold border border-blue-500/30">
                    {circuitGroups.length} arrêt(s) restant(s)
                  </span>
                </div>

                <p className="text-slate-400 text-xs md:text-sm max-w-2xl">
                  Voici la liste des mosquées où vous devez vous rendre. Sélectionnez une mosquée pour voir les agneaux à y déposer.
                </p>

                {successMsg && (
                  <div className="p-4 rounded-xl font-bold text-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-[fadeIn_0.3s_ease-out]">
                    {successMsg}
                  </div>
                )}

                {circuitGroups.length === 0 ? (
                  <div className="bg-slate-800/50 rounded-2xl p-8 border border-slate-700 text-center">
                    <CheckCircle2 className="w-12 h-12 text-blue-400/50 mx-auto mb-3" />
                    <p className="text-white font-bold">Tournée vide !</p>
                    <p className="text-slate-400 text-sm mt-1">Vous n'avez pas de livraisons en attente dans votre camion.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {circuitGroups.map((group, index) => {
                      const isOpen = expandedMosquee === group.mosquee.id;
                      const totalAgneauxGroup = group.orders.reduce((a, r) => a + (r.quantite || 1), 0);

                      return (
                        <div key={group.mosquee.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden transition-all">
                          <button
                            onClick={() => setExpandedMosquee(isOpen ? null : group.mosquee.id)}
                            className="w-full flex items-center justify-between p-4 md:p-5 text-left hover:bg-slate-700/50 transition-colors"
                          >
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="bg-slate-700 w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0">
                                {index + 1}
                              </div>
                              <div>
                                <h3 className="font-bold text-white text-sm md:text-base">{group.mosquee.nom}</h3>
                                <p className="text-slate-400 text-xs md:text-sm truncate max-w-[200px] sm:max-w-xs">{group.mosquee.adresse}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 md:gap-4">
                              <div className="text-right hidden sm:block">
                                <p className="font-bold text-white text-sm">{group.orders.length} cmd</p>
                                <p className="text-xs text-blue-400 font-semibold">{totalAgneauxGroup} agneaux</p>
                              </div>
                              {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                            </div>
                          </button>

                          {isOpen && (
                            <div className="border-t border-slate-700 bg-slate-800/50 p-4">
                              <div className="flex flex-wrap gap-2 mb-4">
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(group.mosquee.adresse || group.mosquee.nom)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl text-xs md:text-sm font-semibold hover:bg-slate-600 transition-colors"
                                >
                                  <Navigation className="w-4 h-4" /> GPS
                                </a>
                                <button
                                  onClick={() => handlePrintTicket(group)}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 text-white rounded-xl text-xs md:text-sm font-semibold hover:bg-slate-600 transition-colors"
                                >
                                  <Printer className="w-4 h-4" /> Ticket
                                </button>
                                <button
                                  onClick={() => handleDeposer(group)}
                                  disabled={depositing === group.mosquee.id}
                                  className="w-full sm:w-auto ml-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-500 disabled:opacity-60 transition-colors shadow-lg shadow-blue-900/20"
                                >
                                  <CheckCircle2 className="w-4 h-4" />
                                  {depositing === group.mosquee.id ? 'Dépôt...' : 'Valider le dépôt ici'}
                                </button>
                              </div>

                              <div className="space-y-2">
                                {group.orders.map((order) => (
                                  <div key={order.id} className="bg-slate-800 border border-slate-700 p-3 rounded-xl flex items-center justify-between">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] md:text-xs text-slate-400 font-mono">{order.numero_commande}</span>
                                      <span className="text-sm md:text-base font-bold text-white">{order.prenom} {order.nom}</span>
                                    </div>
                                    <span className="bg-slate-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-600">
                                      {order.quantite} <Package className="w-3 h-3 inline pb-0.5"/>
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 px-3">
                <TabButton active={activeTab === 'toutes'} onClick={() => setActiveTab('toutes')} icon={List} label="Toutes mes assignations" count={reservations.length} />
                <TabButton active={activeTab === 'a_livrer'} onClick={() => setActiveTab('a_livrer')} icon={Truck} label="À livrer (Camion)" count={reservations.filter(r => r.statut === 'en_livraison' || r.statut === 'en_transit').length} color="text-amber-600" bg="bg-amber-100" />
                <TabButton active={activeTab === 'livrees'} onClick={() => setActiveTab('livrees')} icon={CheckCheck} label="Déposées aux mosquées" count={reservations.filter(r => ['a_recuperer', 'termine'].includes(r.statut)).length} color="text-emerald-600" bg="bg-emerald-100" />
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 md:p-6">
                  {filteredReservations.length === 0 ? (
                    <div className="text-center py-12 md:py-16">
                      <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium text-sm md:text-base">Aucune commande dans cet onglet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-3 md:gap-4">
                      {filteredReservations.map(res => (
                        <div key={res.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors gap-3">
                          <div className="flex flex-col">
                            <span className="text-[10px] md:text-xs font-bold text-slate-400 mb-0.5">{res.numero_commande}</span>
                            <span className="font-black text-base text-slate-900 leading-tight">{res.prenom} {res.nom}</span>
                            <span className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                              <Store className="w-3 h-3"/> {res.mosquees?.nom || 'Inconnue'}
                            </span>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                            <span className="text-xs md:text-sm font-bold bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 whitespace-nowrap">
                              {res.quantite} <Package className="w-3 h-3 inline pb-0.5"/>
                            </span>

                            {(res.statut === 'en_livraison' || res.statut === 'en_transit') && (
                              <span className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-bold text-xs md:text-sm flex items-center gap-1.5 whitespace-nowrap">
                                <Truck className="w-3.5 h-3.5"/> Dans votre camion
                              </span>
                            )}
                            {(res.statut === 'a_recuperer' || res.statut === 'termine') && (
                              <span className="bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg font-bold text-xs md:text-sm flex items-center gap-1.5 whitespace-nowrap">
                                <CheckCircle2 className="w-3.5 h-3.5"/> Déposé
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>
            
          </>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label, count, color = "text-slate-600", bg = "bg-slate-100" }: any) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2.5 md:py-3 rounded-xl md:rounded-2xl font-bold whitespace-nowrap transition-all text-xs md:text-base shrink-0 ${
        active 
          ? 'bg-slate-900 text-white shadow-md' 
          : 'bg-white text-slate-500 hover:bg-slate-50 border border-slate-200'
      }`}
    >
      <Icon className={`w-4 h-4 md:w-5 md:h-5 ${active ? 'text-white' : ''}`} />
      {label}
      <span className={`px-2 md:px-2.5 py-0.5 rounded-full text-[10px] md:text-xs ${active ? 'bg-slate-700 text-white' : `${bg} ${color}`}`}>
        {count}
      </span>
    </button>
  );
}