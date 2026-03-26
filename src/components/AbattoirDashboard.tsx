import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Factory, Package, Truck, CheckCircle2, Printer,
  LogOut, RefreshCw, Users, ChevronDown, AlertCircle,
  Search
} from 'lucide-react';

interface Reservation {
  id: string;
  numero_commande: string;
  prenom: string;
  nom: string;
  telephone: string;
  quantite: number;
  noms_sacrifice: string[];
  mosquee_id: string;
  statut: string;
  created_at: string;
  mosquees: { nom: string; adresse: string } | null;
}

interface Livreur {
  id: string;
  nom: string | null;
  email: string;
}

export function AbattoirDashboard() {
  const { signOut, profile } = useAuth();
  const navigate = useNavigate();

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedLivreurId, setSelectedLivreurId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMosquee, setFilterMosquee] = useState('all');
  const [successMsg, setSuccessMsg] = useState('');
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    // Rafraîchissement temps réel
    const channel = supabase
      .channel('abattoir_reservations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: res }, { data: liv }] = await Promise.all([
      supabase
        .from('reservations')
        .select('*, mosquees(nom, adresse)')
        .in('statut', ['confirmee'])
        .order('created_at', { ascending: true }),
      supabase
        .from('profiles')
        .select('id, nom, email')
        .eq('role', 'livreur'),
    ]);
    setReservations((res as Reservation[]) || []);
    setLivreurs(liv || []);
    setLoading(false);
  };

  // Filtrage
  const mosquees = Array.from(
    new Map(reservations.map(r => [r.mosquee_id, r.mosquees?.nom || 'Inconnue'])).entries()
  );

  const filtered = reservations.filter(r => {
    const term = searchTerm.toLowerCase();
    const matchSearch =
      r.numero_commande?.toLowerCase().includes(term) ||
      r.nom?.toLowerCase().includes(term) ||
      r.prenom?.toLowerCase().includes(term);
    const matchMosquee = filterMosquee === 'all' || r.mosquee_id === filterMosquee;
    return matchSearch && matchMosquee;
  });

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(r => r.id)));
    }
  };

  // Charger dans le camion
  const handleCharger = async () => {
    if (!selectedLivreurId) return alert('Choisissez un livreur avant de charger.');
    if (selectedIds.size === 0) return alert('Sélectionnez au moins une commande.');

    setAssigning(true);
    const ids = Array.from(selectedIds);

    const { error } = await supabase
      .from('reservations')
      .update({ statut: 'en_transit', livreur_id: selectedLivreurId })
      .in('id', ids);

    if (error) {
      alert('Erreur lors du chargement : ' + error.message);
    } else {
      const livreur = livreurs.find(l => l.id === selectedLivreurId);
      setSuccessMsg(
        `✅ ${ids.length} commande(s) chargée(s) pour ${livreur?.nom || livreur?.email}`
      );
      setSelectedIds(new Set());
      setTimeout(() => setSuccessMsg(''), 5000);
      fetchData();
    }
    setAssigning(false);
  };

  // Impression du manifeste de chargement
  const handlePrint = () => {
    const selected = reservations.filter(r => selectedIds.has(r.id));
    if (selected.length === 0) return alert('Sélectionnez des commandes à imprimer.');
    const livreur = livreurs.find(l => l.id === selectedLivreurId);

    // Group par mosquée
    const byMosquee = selected.reduce((acc, r) => {
      const key = r.mosquees?.nom || 'Inconnue';
      if (!acc[key]) acc[key] = [];
      acc[key].push(r);
      return acc;
    }, {} as Record<string, Reservation[]>);

    const printContent = `
      <html><head>
        <title>Manifeste de Chargement - Mon Bélier</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #1e293b; }
          h1 { color: #065f46; font-size: 22px; border-bottom: 3px solid #059669; padding-bottom: 10px; }
          h2 { color: #047857; font-size: 16px; margin-top: 24px; background: #ecfdf5; padding: 8px 12px; border-radius: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th { background: #f1f5f9; text-align: left; padding: 8px; font-size: 12px; text-transform: uppercase; }
          td { padding: 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
          .meta { font-size: 13px; color: #64748b; margin: 8px 0 20px; }
          @media print { body { padding: 0; } }
        </style>
      </head><body>
        <h1>🐑 Manifeste de Chargement — Mon Bélier</h1>
        <p class="meta">
          Date : ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}<br/>
          Livreur : ${livreur?.nom || livreur?.email || 'Non assigné'}<br/>
          Total : ${selected.length} commande(s) — ${selected.reduce((a, r) => a + (r.quantite || 1), 0)} agneau(x)
        </p>
        ${Object.entries(byMosquee).map(([nom, orders]) => `
          <h2>📍 ${nom} (${orders.length} commandes — ${orders.reduce((a, r) => a + (r.quantite || 1), 0)} agneaux)</h2>
          <table>
            <thead><tr>
              <th>#</th><th>N° Commande</th><th>Client</th><th>Qté</th><th>Nom(s) sacrifice</th><th>Tél.</th>
            </tr></thead>
            <tbody>
              ${orders.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${r.numero_commande}</strong></td>
                  <td>${r.prenom} ${r.nom}</td>
                  <td>${r.quantite}</td>
                  <td>${Array.isArray(r.noms_sacrifice) ? r.noms_sacrifice.join(', ') : r.noms_sacrifice}</td>
                  <td>${r.telephone || '—'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        `).join('')}
      </body></html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(printContent);
      win.document.close();
      win.print();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500 p-2 rounded-xl">
              <Factory className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 leading-none">Abattoir</h1>
              <p className="text-xs text-slate-500">{profile?.nom || profile?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors">
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => signOut().then(() => navigate('/'))}
              className="flex items-center gap-2 text-slate-500 hover:text-red-600 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
            >
              <LogOut className="w-4 h-4" /> Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
            <p className="text-3xl font-black text-amber-500">{reservations.length}</p>
            <p className="text-sm text-slate-500 mt-1">Commandes confirmées</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
            <p className="text-3xl font-black text-emerald-600">
              {reservations.reduce((a, r) => a + (r.quantite || 1), 0)}
            </p>
            <p className="text-sm text-slate-500 mt-1">Agneaux à charger</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
            <p className="text-3xl font-black text-blue-600">{selectedIds.size}</p>
            <p className="text-sm text-slate-500 mt-1">Sélectionnées</p>
          </div>
        </div>

        {/* MESSAGE SUCCESS */}
        {successMsg && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl flex items-center gap-3 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* BARRE D'ACTIONS */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par n°, nom..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              />
            </div>

            {/* Filtre mosquée */}
            <select
              value={filterMosquee}
              onChange={e => setFilterMosquee(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="all">Toutes les mosquées</option>
              {mosquees.map(([id, nom]) => (
                <option key={id} value={id}>{nom}</option>
              ))}
            </select>

            {/* Livreur */}
            <select
              value={selectedLivreurId}
              onChange={e => setSelectedLivreurId(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-amber-500 outline-none"
            >
              <option value="">— Choisir un livreur —</option>
              {livreurs.map(l => (
                <option key={l.id} value={l.id}>{l.nom || l.email}</option>
              ))}
            </select>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors"
              >
                <Printer className="w-4 h-4" /> Imprimer
              </button>
              <button
                onClick={handleCharger}
                disabled={assigning || selectedIds.size === 0 || !selectedLivreurId}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-xl text-sm font-bold hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Truck className="w-4 h-4" />
                {assigning ? 'Chargement...' : `Charger (${selectedIds.size})`}
              </button>
            </div>
          </div>
        </div>

        {/* TABLEAU */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                  </th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">N° Commande</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Client</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Agneaux</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Nom(s) sacrifice</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Mosquée</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={7} className="p-12 text-center text-slate-400">Chargement...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-12 text-center">
                      <CheckCircle2 className="w-12 h-12 text-emerald-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">Aucune commande en attente de chargement</p>
                    </td>
                  </tr>
                ) : (
                  filtered.map(r => (
                    <tr
                      key={r.id}
                      className={`hover:bg-slate-50 cursor-pointer transition-colors ${selectedIds.has(r.id) ? 'bg-amber-50' : ''}`}
                      onClick={() => toggleSelect(r.id)}
                    >
                      <td className="p-4" onClick={e => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(r.id)}
                          onChange={() => toggleSelect(r.id)}
                          className="rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                        />
                      </td>
                      <td className="p-4">
                        <span className="font-mono font-bold text-slate-900 text-sm">{r.numero_commande}</span>
                      </td>
                      <td className="p-4">
                        <p className="font-semibold text-slate-900">{r.prenom} {r.nom}</p>
                        <p className="text-xs text-slate-500">{r.telephone}</p>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-bold">
                          <Package className="w-3.5 h-3.5" /> {r.quantite}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-700">
                        {Array.isArray(r.noms_sacrifice)
                          ? r.noms_sacrifice.join(', ')
                          : r.noms_sacrifice || '—'}
                      </td>
                      <td className="p-4">
                        <span className="text-sm font-medium text-purple-700 bg-purple-50 px-2 py-1 rounded">
                          {r.mosquees?.nom || '—'}
                        </span>
                      </td>
                      <td className="p-4 text-sm text-slate-500">
                        {new Date(r.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}