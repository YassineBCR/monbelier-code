import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Truck, Store, Package, Phone, Navigation,
  CheckCircle2, Printer, LogOut, RefreshCw, ChevronDown, ChevronUp
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
  mosquees: { id: string; nom: string; adresse: string; horaires?: string } | null;
}

interface MosqueeGroup {
  mosquee: { id: string; nom: string; adresse: string; horaires?: string };
  orders: Reservation[];
}

export function LivreurDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [groups, setGroups] = useState<MosqueeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMosquee, setExpandedMosquee] = useState<string | null>(null);
  const [depositing, setDepositing] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (user) {
      fetchOrders();
      const channel = supabase
        .channel('livreur_orders')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchOrders)
        .subscribe();
      return () => { supabase.removeChannel(channel); };
    }
  }, [user]);

  const fetchOrders = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('reservations')
      .select('*, mosquees(id, nom, adresse, horaires)')
      .eq('livreur_id', user.id)
      .in('statut', ['en_transit'])
      .order('mosquee_id');

    if (error) { console.error(error); return; }

    // Grouper par mosquée
    const byMosquee: Record<string, MosqueeGroup> = {};
    for (const r of (data as Reservation[]) || []) {
      const key = r.mosquee_id;
      if (!byMosquee[key]) {
        byMosquee[key] = {
          mosquee: r.mosquees || { id: key, nom: 'Inconnue', adresse: '' },
          orders: [],
        };
      }
      byMosquee[key].orders.push(r);
    }

    const grouped = Object.values(byMosquee);
    setGroups(grouped);
    if (grouped.length > 0 && !expandedMosquee) {
      setExpandedMosquee(grouped[0].mosquee.id);
    }
    setLoading(false);
  };

  // Déposer toutes les commandes d'une mosquée
  const handleDeposer = async (group: MosqueeGroup) => {
    setDepositing(group.mosquee.id);
    const ids = group.orders.map(o => o.id);

    // 1. Mise à jour statut
    const { error } = await supabase
      .from('reservations')
      .update({ statut: 'a_la_mosquee' })
      .in('id', ids);

    if (error) {
      alert('Erreur lors du dépôt : ' + error.message);
      setDepositing(null);
      return;
    }

    // 2. Envoi email pour chaque commande
    for (const order of group.orders) {
      try {
        await supabase.functions.invoke('send-email', {
          body: { reservationId: order.id, type: 'pret_a_recuperer' },
        });
      } catch (e) {
        console.warn('Email non envoyé pour', order.numero_commande, e);
      }
    }

    setSuccessMsg(`✅ ${ids.length} commande(s) déposée(s) à ${group.mosquee.nom} — clients notifiés par email`);
    setTimeout(() => setSuccessMsg(''), 6000);
    setDepositing(null);
    fetchOrders();
  };

  // Impression ticket de livraison pour une mosquée
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
          .mosquee-card {
            background: #f0fdf4; border: 2px solid #059669; border-radius: 8px;
            padding: 12px 16px; margin-bottom: 16px;
          }
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
        <p class="meta">
          Date : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}&nbsp;&nbsp;|&nbsp;&nbsp;
          Livreur : ${profile?.nom || user?.email || '—'}&nbsp;&nbsp;|&nbsp;&nbsp;
          Total : ${orders.length} commande(s) — ${totalAgneaux} agneau(x)
        </p>

        <div class="mosquee-card">
          <h2>📍 ${mosquee.nom}</h2>
          <p>${mosquee.adresse || '—'}</p>
          ${mosquee.horaires ? `<p>🕐 ${mosquee.horaires}</p>` : ''}
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:24px;">#</th>
              <th>N° Commande</th>
              <th>Client</th>
              <th>Qté</th>
              <th>Nom(s) du sacrifice</th>
              <th>Téléphone</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><strong>${r.numero_commande}</strong></td>
                <td>${r.prenom} ${r.nom}</td>
                <td><span class="badge">${r.quantite}</span></td>
                <td>${Array.isArray(r.noms_sacrifice) ? r.noms_sacrifice.join('<br/>') : (r.noms_sacrifice || '—')}</td>
                <td>${r.telephone || '—'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <p class="footer">
          Mon Bélier · Service de livraison pour l'Aïd · Montpellier<br/>
          ✅ Faites signer ce ticket à la mosquée lors du dépôt.
        </p>
      </body></html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  };

  const totalCommandes = groups.reduce((a, g) => a + g.orders.length, 0);
  const totalAgneaux = groups.reduce((a, g) => g.orders.reduce((b, r) => b + (r.quantite || 1), 0) + a, 0);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-3xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 leading-none">Livreur</h1>
              <p className="text-xs text-slate-500">{profile?.nom || profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={fetchOrders} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => signOut().then(() => navigate('/'))}
              className="flex items-center gap-1 text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 text-sm font-medium"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-6">
        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
            <p className="text-2xl font-black text-blue-600">{groups.length}</p>
            <p className="text-xs text-slate-500 mt-1">Mosquée(s)</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
            <p className="text-2xl font-black text-slate-900">{totalCommandes}</p>
            <p className="text-xs text-slate-500 mt-1">Commandes</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm text-center">
            <p className="text-2xl font-black text-emerald-600">{totalAgneaux}</p>
            <p className="text-xs text-slate-500 mt-1">Agneaux</p>
          </div>
        </div>

        {/* SUCCESS MSG */}
        {successMsg && (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl flex items-center gap-3 font-medium text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* GROUPES PAR MOSQUÉE */}
        {loading ? (
          <div className="text-center py-16 text-slate-400">Chargement...</div>
        ) : groups.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
            <p className="text-slate-600 font-semibold">Aucune livraison en cours</p>
            <p className="text-slate-400 text-sm mt-1">Vous n'avez pas de commandes assignées pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => {
              const isOpen = expandedMosquee === group.mosquee.id;
              const totalAgneauxGroup = group.orders.reduce((a, r) => a + (r.quantite || 1), 0);

              return (
                <div key={group.mosquee.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  {/* Header mosquée */}
                  <button
                    onClick={() => setExpandedMosquee(isOpen ? null : group.mosquee.id)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="bg-purple-100 p-3 rounded-xl">
                        <Store className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <h2 className="font-black text-slate-900 text-lg">{group.mosquee.nom}</h2>
                        <p className="text-slate-500 text-sm">{group.mosquee.adresse || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-bold text-slate-900">{group.orders.length} cmd</p>
                        <p className="text-sm text-emerald-600 font-semibold">{totalAgneauxGroup} agneaux</p>
                      </div>
                      {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </button>

                  {/* Contenu déroulé */}
                  {isOpen && (
                    <div className="border-t border-slate-100">
                      {/* Actions */}
                      <div className="flex gap-3 p-4 bg-slate-50 border-b border-slate-100">
                        <button
                          onClick={() => handlePrintTicket(group)}
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
                        >
                          <Printer className="w-4 h-4" /> Imprimer le ticket
                        </button>

                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(group.mosquee.adresse || group.mosquee.nom)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-100 transition-colors"
                        >
                          <Navigation className="w-4 h-4" /> Naviguer
                        </a>

                        <button
                          onClick={() => handleDeposer(group)}
                          disabled={depositing === group.mosquee.id}
                          className="ml-auto flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-500 disabled:opacity-60 transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          {depositing === group.mosquee.id ? 'Dépôt en cours...' : 'Déposé à la mosquée'}
                        </button>
                      </div>

                      {/* Liste commandes */}
                      <div className="divide-y divide-slate-100">
                        {group.orders.map((order, i) => (
                          <div key={order.id} className="p-4 flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold shrink-0">
                              {i + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-mono font-bold text-slate-900 text-sm">{order.numero_commande}</span>
                                <span className="bg-amber-100 text-amber-800 text-xs font-bold px-2 py-0.5 rounded-full">
                                  {order.quantite} agneau(x)
                                </span>
                              </div>
                              <p className="font-semibold text-slate-800">{order.prenom} {order.nom}</p>
                              <p className="text-sm text-slate-500 mt-0.5">
                                Sacrifice : {Array.isArray(order.noms_sacrifice) ? order.noms_sacrifice.join(', ') : order.noms_sacrifice}
                              </p>
                            </div>
                            {order.telephone && (
                              <a
                                href={`tel:${order.telephone}`}
                                className="flex items-center gap-1 text-emerald-600 text-sm font-medium hover:text-emerald-700 shrink-0"
                              >
                                <Phone className="w-4 h-4" />
                                {order.telephone}
                              </a>
                            )}
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
    </div>
  );
}