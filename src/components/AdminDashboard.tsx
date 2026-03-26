import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Store, ShoppingBag, BarChart3, Users, 
  Plus, CheckCircle2, MapPin, Phone, Mail, ChevronRight, Package, Edit2, X,
  Truck, Factory, Box, CheckCheck
} from 'lucide-react';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('commandes');
  
  // Nouveaux sous-onglets logistiques
  const [commandesSubTab, setCommandesSubTab] = useState('abattoir'); // 'total', 'abattoir', 'transit', 'mosquee'
  
  const [reservations, setReservations] = useState<any[]>([]);
  const [mosquees, setMosquees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Mosquées
  const [isMosqueeModalOpen, setIsMosqueeModalOpen] = useState(false);
  const [editingMosqueeId, setEditingMosqueeId] = useState<string | null>(null);
  const [mosqueeForm, setMosqueeForm] = useState({
    nom: '', adresse: '', telephone: '', email: '', horaires: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: resData } = await supabase
        .from('reservations')
        .select(`*, mosquees(nom)`)
        .order('created_at', { ascending: false });
        
      const { data: mosqData } = await supabase
        .from('mosquees')
        .select('*')
        .order('nom');

      setReservations(resData || []);
      setMosquees(mosqData || []);
    } catch (error) {
      console.error("Erreur", error);
    } finally {
      setLoading(false);
    }
  };

  // --- GESTION DES MOSQUÉES ---
  const openCreateModal = () => {
    setMosqueeForm({ nom: '', adresse: '', telephone: '', email: '', horaires: '' });
    setEditingMosqueeId(null);
    setIsMosqueeModalOpen(true);
  };

  const openEditModal = (mosquee: any) => {
    setMosqueeForm({
      nom: mosquee.nom || '', adresse: mosquee.adresse || '', telephone: mosquee.telephone || '',
      email: mosquee.email || '', horaires: mosquee.horaires || ''
    });
    setEditingMosqueeId(mosquee.id);
    setIsMosqueeModalOpen(true);
  };

  const handleSaveMosquee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingMosqueeId) {
        await supabase.from('mosquees').update(mosqueeForm).eq('id', editingMosqueeId);
      } else {
        await supabase.from('mosquees').insert([mosqueeForm]);
      }
      setIsMosqueeModalOpen(false);
      fetchData();
    } catch (error: any) {
      alert("Erreur : " + error.message);
    }
  };

  // --- LOGISTIQUE DES COMMANDES ---
  const updateStatus = async (id: string, nouveauStatut: string) => {
    try {
      const { error } = await supabase
        .from('reservations')
        .update({ statut: nouveauStatut })
        .eq('id', id);
        
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      alert("Erreur de mise à jour : " + error.message);
    }
  };

  // Filtrage avancé selon l'étape logistique
  const filteredReservations = reservations.filter(res => {
    const statut = res.statut || 'en_attente';
    if (commandesSubTab === 'total') return true;
    if (commandesSubTab === 'abattoir') return statut === 'en_attente';
    if (commandesSubTab === 'transit') return statut === 'en_livraison';
    if (commandesSubTab === 'mosquee') return statut === 'a_recuperer';
    return true;
  });

  const totalAgneaux = reservations.reduce((acc, curr) => acc + (curr.quantite || 1), 0);
  const chiffreAffaires = totalAgneaux * 360;

  return (
    <div className="min-h-screen bg-slate-50 flex">
      
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shadow-2xl z-10 hidden md:flex fixed h-full">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <span className="bg-emerald-500 text-white p-1.5 rounded-lg"><BarChart3 className="w-5 h-5"/></span>
            Admin
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <SidebarButton icon={ShoppingBag} label="Logistique" active={activeTab === 'commandes'} onClick={() => setActiveTab('commandes')} />
          <SidebarButton icon={Store} label="Mosquées" active={activeTab === 'mosquees'} onClick={() => setActiveTab('mosquees')} />
          <SidebarButton icon={BarChart3} label="Statistiques" active={activeTab === 'statistiques'} onClick={() => setActiveTab('statistiques')} />
          <SidebarButton icon={Users} label="Utilisateurs" active={activeTab === 'utilisateurs'} onClick={() => setActiveTab('utilisateurs')} />
        </nav>
      </aside>

      {/* CONTENU PRINCIPAL */}
      <main className="flex-1 md:ml-64 overflow-y-auto min-h-screen">
        <div className="p-8 max-w-7xl mx-auto">
          
          {loading ? (
            <div className="flex items-center justify-center h-64 text-slate-400">Chargement des données...</div>
          ) : (
            <>
              {/* ONGLET : LOGISTIQUE / COMMANDES */}
              {activeTab === 'commandes' && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <h2 className="text-3xl font-black text-slate-900 mb-6">Suivi Logistique</h2>
                  
                  {/* BARRE DE PROGRESSION LOGISTIQUE */}
                  <div className="flex gap-3 mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
                    <button onClick={() => setCommandesSubTab('abattoir')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${commandesSubTab === 'abattoir' ? 'bg-slate-900 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                      <Factory className="w-4 h-4"/> 1. À l'abattoir ({reservations.filter(r => (r.statut || 'en_attente') === 'en_attente').length})
                    </button>
                    <button onClick={() => setCommandesSubTab('transit')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${commandesSubTab === 'transit' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                      <Truck className="w-4 h-4"/> 2. En transit ({reservations.filter(r => r.statut === 'en_livraison').length})
                    </button>
                    <button onClick={() => setCommandesSubTab('mosquee')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${commandesSubTab === 'mosquee' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>
                      <Store className="w-4 h-4"/> 3. À la mosquée ({reservations.filter(r => r.statut === 'a_recuperer').length})
                    </button>
                    <div className="w-px bg-slate-200 mx-2"></div>
                    <button onClick={() => setCommandesSubTab('total')} className={`px-5 py-2.5 rounded-xl font-bold transition-all whitespace-nowrap ${commandesSubTab === 'total' ? 'bg-blue-50 text-blue-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                      Toutes les commandes
                    </button>
                  </div>

                  {/* TABLEAU DES COMMANDES */}
                  <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                            <th className="p-4 font-bold text-sm uppercase tracking-wider">ID & Client</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider">Contenu</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider">Destination</th>
                            <th className="p-4 font-bold text-sm uppercase tracking-wider">Statut Logistique</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredReservations.map((res) => {
                            const statut = res.statut || 'en_attente';
                            return (
                              <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                  <div className="font-bold text-slate-900">{res.prenom} {res.nom}</div>
                                  <div className="text-xs text-slate-500 mt-1 font-mono bg-slate-100 inline-block px-2 py-0.5 rounded">
                                    {res.id.split('-')[0]}
                                  </div>
                                </td>
                                <td className="p-4">
                                  <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-3 py-1 rounded-lg font-bold text-sm border border-slate-200">
                                    <Package className="w-4 h-4" /> {res.quantite} Agneau(x)
                                  </div>
                                </td>
                                <td className="p-4 text-sm font-medium text-slate-700">
                                  <span className="flex items-center gap-1 text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded w-max">
                                    <Store className="w-4 h-4"/> {res.mosquees?.nom || "Non assignée"}
                                  </span>
                                </td>
                                <td className="p-4">
                                  
                                  {/* WORKFLOW LOGISTIQUE - Les boutons changent selon l'état actuel */}
                                  {statut === 'en_attente' && (
                                    <button onClick={() => updateStatus(res.id, 'en_livraison')} className="text-sm bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm">
                                      <Truck className="w-4 h-4"/> Expédier (Camion)
                                    </button>
                                  )}

                                  {statut === 'en_livraison' && (
                                    <button onClick={() => updateStatus(res.id, 'a_recuperer')} className="text-sm bg-amber-500 text-white hover:bg-amber-400 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm shadow-amber-500/20">
                                      <Box className="w-4 h-4"/> Réceptionner à la Mosquée
                                    </button>
                                  )}

                                  {statut === 'a_recuperer' && (
                                    <button onClick={() => updateStatus(res.id, 'termine')} className="text-sm bg-emerald-500 text-white hover:bg-emerald-400 px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 shadow-sm shadow-emerald-500/20">
                                      <CheckCircle2 className="w-4 h-4"/> Remettre au client
                                    </button>
                                  )}

                                  {statut === 'termine' && (
                                    <span className="text-sm bg-slate-100 text-slate-500 px-4 py-2 rounded-xl font-bold flex items-center gap-2 w-max border border-slate-200">
                                      <CheckCheck className="w-4 h-4"/> Commande retirée
                                    </span>
                                  )}

                                </td>
                              </tr>
                            );
                          })}
                          {filteredReservations.length === 0 && (
                            <tr><td colSpan={4} className="p-12 text-center text-slate-500 font-medium">Aucune commande dans cette étape logistique.</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* ONGLET : MOSQUÉES */}
              {activeTab === 'mosquees' && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Points de Retrait (Mosquées)</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    
                    <button onClick={openCreateModal} className="border-2 border-dashed border-emerald-300 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-600 rounded-3xl p-8 flex flex-col items-center justify-center min-h-[250px] transition-all hover:scale-[1.02] group">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:bg-emerald-600 group-hover:text-white transition-colors"><Plus className="w-8 h-8" /></div>
                      <span className="font-bold text-lg">Ajouter une mosquée</span>
                    </button>

                    {mosquees.map(mosquee => (
                      <div key={mosquee.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm relative hover:shadow-md transition-shadow flex flex-col h-full min-h-[250px]">
                        <button onClick={() => openEditModal(mosquee)} className="absolute top-4 right-4 p-2.5 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"><Edit2 className="w-4 h-4" /></button>
                        <div className="bg-emerald-100 w-12 h-12 rounded-xl flex items-center justify-center text-emerald-600 mb-4"><Store className="w-6 h-6" /></div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 pr-10">{mosquee.nom}</h3>
                        <div className="space-y-3 mt-auto pt-4 text-sm font-medium text-slate-600">
                          <p className="flex items-start gap-2"><MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5"/> <span className="line-clamp-2">{mosquee.adresse}</span></p>
                          {mosquee.telephone && <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400 shrink-0"/> {mosquee.telephone}</p>}
                          {mosquee.email && <p className="flex items-center gap-2 truncate"><Mail className="w-4 h-4 text-slate-400 shrink-0"/> {mosquee.email}</p>}
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
                          <Clock className="w-4 h-4"/><span className="truncate">{mosquee.horaires || "Horaires non renseignés"}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ONGLET : STATISTIQUES */}
              {activeTab === 'statistiques' && (
                <div className="animate-[fadeIn_0.3s_ease-out]">
                  <h2 className="text-3xl font-black text-slate-900 mb-8">Statistiques Globales</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard title="Total Réservations" value={reservations.length.toString()} icon={<ShoppingBag className="w-8 h-8 text-blue-500"/>} bgColor="bg-blue-50" />
                    <StatCard title="Agneaux Commandés" value={totalAgneaux.toString()} icon={<Package className="w-8 h-8 text-emerald-500"/>} bgColor="bg-emerald-50" />
                    <StatCard title="Chiffre d'Affaires" value={`${chiffreAffaires} €`} icon={<BarChart3 className="w-8 h-8 text-amber-500"/>} bgColor="bg-amber-50" />
                  </div>
                </div>
              )}

              {/* ONGLET : UTILISATEURS */}
              {activeTab === 'utilisateurs' && (
                <div className="animate-[fadeIn_0.3s_ease-out] flex flex-col items-center justify-center h-[60vh] text-center">
                  <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6"><Users className="w-10 h-10 text-slate-400" /></div>
                  <h2 className="text-3xl font-black text-slate-900 mb-4">Gestion des Utilisateurs</h2>
                  <p className="text-slate-500 max-w-md">Interface bientôt disponible.</p>
                </div>
              )}

            </>
          )}
        </div>
      </main>

      {/* MODAL MOSQUÉE */}
      {isMosqueeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-emerald-600"/>
                {editingMosqueeId ? 'Modifier la mosquée' : 'Ajouter une mosquée'}
              </h3>
              <button onClick={() => setIsMosqueeModalOpen(false)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveMosquee} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nom de la mosquée *</label>
                <input type="text" required value={mosqueeForm.nom} onChange={e => setMosqueeForm({...mosqueeForm, nom: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Mosquée de la Paix" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Adresse complète *</label>
                <input type="text" required value={mosqueeForm.adresse} onChange={e => setMosqueeForm({...mosqueeForm, adresse: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="123 rue de la République..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input type="tel" value={mosqueeForm.telephone} onChange={e => setMosqueeForm({...mosqueeForm, telephone: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="06 12 34 56 78" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" value={mosqueeForm.email} onChange={e => setMosqueeForm({...mosqueeForm, email: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="contact@mosquee.fr" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Horaires de retrait</label>
                <input type="text" value={mosqueeForm.horaires} onChange={e => setMosqueeForm({...mosqueeForm, horaires: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="Ex: Jour de l'Aïd de 10h à 14h" />
              </div>
              <div className="pt-4 mt-6 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsMosqueeModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Annuler</button>
                <button type="submit" className="flex-[2] px-4 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20">
                  {editingMosqueeId ? 'Enregistrer' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

// --- Composants Utilitaires ---
function SidebarButton({ icon: Icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${active ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
      <div className="flex items-center gap-3 font-bold"><Icon className="w-5 h-5" />{label}</div>
      {active && <ChevronRight className="w-4 h-4 opacity-70" />}
    </button>
  );
}

function StatCard({ title, value, icon, bgColor }: { title: string, value: string, icon: any, bgColor: string }) {
  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex items-center gap-6">
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${bgColor}`}>{icon}</div>
      <div>
        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</h4>
        <span className="text-3xl font-black text-slate-900">{value}</span>
      </div>
    </div>
  );
}