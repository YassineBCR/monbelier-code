import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Store, QrCode, CheckCircle2, Clock, Package,
  LogOut, RefreshCw, Search, X, User, AlertCircle, ScanLine
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
  qr_token: string;
  statut: string;
  created_at: string;
}

interface ScannedOrder extends Reservation {
  mosquees: { nom: string } | null;
}

export function MosqueeAdminDashboard() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const scanInputRef = useRef<HTMLInputElement>(null);

  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanValue, setScanValue] = useState('');
  const [scannedOrder, setScannedOrder] = useState<ScannedOrder | null>(null);
  const [scanError, setScanError] = useState('');
  const [scanning, setScanning] = useState(false);
  const [marking, setMarking] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [filterStatut, setFilterStatut] = useState('all');

  useEffect(() => {
    fetchOrders();
    // Auto-focus sur le champ de scan
    scanInputRef.current?.focus();

    const channel = supabase
      .channel('mosquee_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [profile]);

  const fetchOrders = async () => {
    if (!profile?.mosquee_id) return;
    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('mosquee_id', profile.mosquee_id)
      .in('statut', ['a_la_mosquee', 'recuperee'])
      .order('created_at', { ascending: false });

    if (!error) setReservations((data as Reservation[]) || []);
    setLoading(false);
  };

  // ── Extraction du token depuis l'entrée scanner ──
  const extractToken = (value: string): string => {
    // Si c'est une URL complète : https://...app.com/retrait/TOKEN
    const urlMatch = value.match(/\/retrait\/([a-f0-9-]{36})/i);
    if (urlMatch) return urlMatch[1];
    // Si c'est directement un UUID
    const uuidMatch = value.match(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i);
    if (uuidMatch) return value.trim();
    // Si c'est un numéro de commande (MB-XXXX-XXXXX)
    const numMatch = value.match(/^MB-\d{4}-\d{5}$/i);
    if (numMatch) return value.trim(); // Sera traité comme numero_commande
    return '';
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanValue.trim()) return;

    setScanning(true);
    setScanError('');
    setScannedOrder(null);

    const token = extractToken(scanValue.trim());

    try {
      let query = supabase
        .from('reservations')
        .select('*, mosquees(nom)')
        .single();

      // Cherche par token ou par numero_commande
      let result;
      if (token.includes('-') && token.length === 36) {
        // UUID : qr_token
        result = await supabase
          .from('reservations')
          .select('*, mosquees(nom)')
          .eq('qr_token', token)
          .single();
      } else {
        // Numéro de commande
        result = await supabase
          .from('reservations')
          .select('*, mosquees(nom)')
          .ilike('numero_commande', scanValue.trim())
          .single();
      }

      const { data, error } = result;

      if (error || !data) {
        setScanError('Commande introuvable. Vérifiez le QR code ou le numéro de commande.');
        setScanning(false);
        return;
      }

      // Vérifier que la commande appartient bien à cette mosquée
      if (data.mosquee_id !== profile?.mosquee_id) {
        setScanError('Cette commande est assignée à une autre mosquée.');
        setScanning(false);
        return;
      }

      setScannedOrder(data as ScannedOrder);
    } catch (err) {
      setScanError('Erreur de connexion. Réessayez.');
    }
    setScanning(false);
  };

  const handleMarkRecupere = async () => {
    if (!scannedOrder) return;
    setMarking(true);

    const { error } = await supabase
      .from('reservations')
      .update({ statut: 'recuperee' })
      .eq('id', scannedOrder.id);

    if (error) {
      alert('Erreur : ' + error.message);
    } else {
      setSuccessMsg(`✅ Commande ${scannedOrder.numero_commande} remise au client !`);
      setTimeout(() => setSuccessMsg(''), 5000);
      setScannedOrder(null);
      setScanValue('');
      fetchOrders();
      setTimeout(() => scanInputRef.current?.focus(), 100);
    }
    setMarking(false);
  };

  const filtered = reservations.filter(r =>
    filterStatut === 'all' || r.statut === filterStatut
  );

  const stats = {
    total: reservations.length,
    en_attente: reservations.filter(r => r.statut === 'a_la_mosquee').length,
    recuperees: reservations.filter(r => r.statut === 'recuperee').length,
  };

  const statutLabel = (s: string) => {
    if (s === 'a_la_mosquee') return { label: 'En attente de retrait', color: 'bg-amber-100 text-amber-800' };
    if (s === 'recuperee') return { label: 'Récupérée ✓', color: 'bg-emerald-100 text-emerald-800' };
    return { label: s, color: 'bg-slate-100 text-slate-600' };
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* NAVBAR */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-xl">
              <Store className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 leading-none">Admin Mosquée</h1>
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

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* STATS */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm text-center">
            <p className="text-3xl font-black text-slate-900">{stats.total}</p>
            <p className="text-sm text-slate-500 mt-1">Total reçues</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-amber-200 shadow-sm text-center bg-amber-50">
            <p className="text-3xl font-black text-amber-600">{stats.en_attente}</p>
            <p className="text-sm text-amber-600 mt-1 font-medium">En attente</p>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-emerald-200 shadow-sm text-center bg-emerald-50">
            <p className="text-3xl font-black text-emerald-600">{stats.recuperees}</p>
            <p className="text-sm text-emerald-600 mt-1 font-medium">Récupérées</p>
          </div>
        </div>

        {/* SUCCESS */}
        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-5 py-4 rounded-xl flex items-center gap-3 font-medium">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            {successMsg}
          </div>
        )}

        {/* ── ZONE SCAN ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <QrCode className="w-5 h-5 text-purple-600" />
              Scanner / Identifier une commande
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Scannez le QR code avec un scanner USB, ou saisissez manuellement le numéro de commande.
            </p>
          </div>

          <div className="p-5">
            <form onSubmit={handleScan} className="flex gap-3">
              <div className="relative flex-1">
                <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  ref={scanInputRef}
                  type="text"
                  value={scanValue}
                  onChange={e => { setScanValue(e.target.value); setScanError(''); setScannedOrder(null); }}
                  placeholder="Scannez le QR code ou entrez le n° de commande (MB-2024-XXXXX)"
                  className="w-full pl-10 pr-10 py-3 bg-slate-50 border-2 border-purple-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-mono"
                  autoFocus
                />
                {scanValue && (
                  <button
                    type="button"
                    onClick={() => { setScanValue(''); setScanError(''); setScannedOrder(null); scanInputRef.current?.focus(); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={scanning || !scanValue.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 disabled:opacity-50 transition-colors"
              >
                {scanning ? '...' : 'Chercher'}
              </button>
            </form>

            {/* ERREUR SCAN */}
            {scanError && (
              <div className="mt-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {scanError}
              </div>
            )}

            {/* RÉSULTAT SCAN */}
            {scannedOrder && (
              <div className={`mt-4 rounded-2xl border-2 p-5 ${
                scannedOrder.statut === 'recuperee'
                  ? 'border-slate-200 bg-slate-50'
                  : 'border-emerald-400 bg-emerald-50'
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(window.location.origin + '/retrait/' + scannedOrder.qr_token)}&bgcolor=ffffff&color=064e3b`}
                        alt="QR"
                        className="w-16 h-16"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-black text-lg text-slate-900">{scannedOrder.numero_commande}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${statutLabel(scannedOrder.statut).color}`}>
                          {statutLabel(scannedOrder.statut).label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-900">{scannedOrder.prenom} {scannedOrder.nom}</span>
                      </div>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold">{scannedOrder.quantite} agneau(x)</span>
                        {' · '}
                        {Array.isArray(scannedOrder.noms_sacrifice)
                          ? scannedOrder.noms_sacrifice.join(', ')
                          : scannedOrder.noms_sacrifice}
                      </p>
                      {scannedOrder.telephone && (
                        <a href={`tel:${scannedOrder.telephone}`} className="text-sm text-purple-600 font-medium mt-1 inline-block">
                          📞 {scannedOrder.telephone}
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    {scannedOrder.statut === 'recuperee' ? (
                      <div className="flex items-center gap-2 bg-slate-200 text-slate-500 px-4 py-3 rounded-xl font-bold text-sm">
                        <CheckCircle2 className="w-4 h-4" />
                        Déjà récupérée
                      </div>
                    ) : (
                      <button
                        onClick={handleMarkRecupere}
                        disabled={marking}
                        className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-500 disabled:opacity-60 transition-colors shadow-lg shadow-emerald-600/20"
                      >
                        <CheckCircle2 className="w-5 h-5" />
                        {marking ? 'Enregistrement...' : 'Remettre au client ✓'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── LISTE DES COMMANDES ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <h2 className="font-black text-slate-900 flex items-center gap-2">
              <Package className="w-5 h-5 text-slate-600" />
              Toutes les commandes
            </h2>
            <div className="flex gap-2">
              {['all', 'a_la_mosquee', 'recuperee'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterStatut(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    filterStatut === s
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s === 'all' ? 'Toutes' : s === 'a_la_mosquee' ? 'En attente' : 'Récupérées'}
                  <span className="ml-1 opacity-70">
                    ({s === 'all' ? stats.total : s === 'a_la_mosquee' ? stats.en_attente : stats.recuperees})
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {loading ? (
              <div className="p-12 text-center text-slate-400">Chargement...</div>
            ) : filtered.length === 0 ? (
              <div className="p-12 text-center text-slate-400">Aucune commande dans cette catégorie.</div>
            ) : (
              filtered.map(r => {
                const st = statutLabel(r.statut);
                return (
                  <div
                    key={r.id}
                    className={`p-4 flex items-center gap-4 hover:bg-slate-50 cursor-pointer transition-colors ${
                      r.statut === 'recuperee' ? 'opacity-60' : ''
                    }`}
                    onClick={() => {
                      setScanValue(r.numero_commande);
                      setScanError('');
                      setScannedOrder(r as any);
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-slate-900 text-sm">{r.numero_commande}</span>
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full shrink-0 ${st.color}`}>
                          {st.label}
                        </span>
                      </div>
                      <p className="text-slate-700 font-medium mt-0.5">{r.prenom} {r.nom}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {r.quantite} agneau(x) · {Array.isArray(r.noms_sacrifice) ? r.noms_sacrifice.join(', ') : r.noms_sacrifice}
                      </p>
                    </div>
                    <div className="text-xs text-slate-400 shrink-0">
                      {new Date(r.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}