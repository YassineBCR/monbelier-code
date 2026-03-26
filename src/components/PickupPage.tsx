import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import {
  CheckCircle2, Clock, Package, Store, User,
  AlertCircle, ArrowLeft, QrCode, Loader2
} from 'lucide-react';

interface ReservationDetail {
  id: string;
  numero_commande: string;
  prenom: string;
  nom: string;
  quantite: number;
  noms_sacrifice: string[];
  statut: string;
  qr_token: string;
  mosquee_id: string;
  mosquees: {
    nom: string;
    adresse: string;
    horaires?: string;
  } | null;
}

export function PickupPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();

  const [reservation, setReservation] = useState<ReservationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [marking, setMarking] = useState(false);
  const [markedDone, setMarkedDone] = useState(false);

  useEffect(() => {
    if (token) fetchReservation();
  }, [token]);

  const fetchReservation = async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, mosquees(nom, adresse, horaires)')
      .eq('qr_token', token)
      .single();

    if (error || !data) {
      setNotFound(true);
    } else {
      setReservation(data as ReservationDetail);
    }
    setLoading(false);
  };

  const handleMarkRecupere = async () => {
    if (!reservation) return;
    setMarking(true);

    const { error } = await supabase
      .from('reservations')
      .update({ statut: 'recuperee' })
      .eq('id', reservation.id);

    if (!error) {
      setMarkedDone(true);
      setReservation(prev => prev ? { ...prev, statut: 'recuperee' } : prev);
    } else {
      alert('Erreur : ' + error.message);
    }
    setMarking(false);
  };

  const isMosqueeAdmin =
    profile?.role === 'mosquee_admin' &&
    profile?.mosquee_id === reservation?.mosquee_id;

  const canMark =
    (isMosqueeAdmin || profile?.role === 'admin') &&
    reservation?.statut === 'a_la_mosquee' &&
    !markedDone;

  // ── Statut badge ───────────────────────────────────────────────────────────
  const statutConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    en_attente: {
      label: 'Paiement en attente',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-slate-600',
      bg: 'bg-slate-100',
    },
    confirmee: {
      label: 'Paiement confirmé — en préparation',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-blue-700',
      bg: 'bg-blue-100',
    },
    en_transit: {
      label: 'En route vers la mosquée',
      icon: <Clock className="w-5 h-5" />,
      color: 'text-amber-700',
      bg: 'bg-amber-100',
    },
    a_la_mosquee: {
      label: 'Disponible à la mosquée ✓',
      icon: <Store className="w-5 h-5" />,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
    },
    recuperee: {
      label: 'Récupérée par le client ✓',
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: 'text-emerald-700',
      bg: 'bg-emerald-100',
    },
  };

  const currentStatut = reservation ? (statutConfig[reservation.statut] || statutConfig['en_attente']) : null;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Chargement de la commande...</p>
        </div>
      </div>
    );
  }

  // ── Not found ──────────────────────────────────────────────────────────────
  if (notFound || !reservation) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-black text-slate-900 mb-2">Commande introuvable</h1>
          <p className="text-slate-500 mb-6">
            Ce QR code ne correspond à aucune commande dans notre système.
            Vérifiez que vous utilisez le bon code.
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-emerald-600 font-semibold hover:text-emerald-700"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // ── Contenu principal ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-4">

        {/* Header */}
        <div className="text-center mb-2">
          <div className="inline-flex items-center gap-2 bg-emerald-700 text-white px-4 py-2 rounded-full text-sm font-bold">
            <QrCode className="w-4 h-4" />
            Mon Bélier · Pass de Retrait
          </div>
        </div>

        {/* Carte principale */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">

          {/* Barre de couleur statut */}
          <div className={`h-2 w-full ${
            reservation.statut === 'recuperee' ? 'bg-emerald-500' :
            reservation.statut === 'a_la_mosquee' ? 'bg-emerald-400' :
            reservation.statut === 'en_transit' ? 'bg-amber-400' :
            'bg-slate-300'
          }`} />

          <div className="p-6">
            {/* N° commande */}
            <div className="text-center mb-5">
              <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Numéro de commande</p>
              <p className="font-mono text-3xl font-black text-slate-900 tracking-wider">
                {reservation.numero_commande}
              </p>
            </div>

            {/* Statut */}
            {currentStatut && (
              <div className={`flex items-center gap-3 ${currentStatut.bg} ${currentStatut.color} px-4 py-3 rounded-xl mb-5`}>
                {currentStatut.icon}
                <span className="font-bold text-sm">{currentStatut.label}</span>
              </div>
            )}

            {/* Détails client */}
            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                <User className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Client</p>
                  <p className="font-bold text-slate-900">{reservation.prenom} {reservation.nom}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                <Package className="w-5 h-5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500">Commande</p>
                  <p className="font-bold text-slate-900">
                    {reservation.quantite} agneau(x)
                  </p>
                  <p className="text-sm text-slate-600">
                    {Array.isArray(reservation.noms_sacrifice)
                      ? reservation.noms_sacrifice.join(', ')
                      : reservation.noms_sacrifice}
                  </p>
                </div>
              </div>

              {reservation.mosquees && (
                <div className="flex items-center gap-3 bg-slate-50 rounded-xl p-3">
                  <Store className="w-5 h-5 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-xs text-slate-500">Mosquée de retrait</p>
                    <p className="font-bold text-slate-900">{reservation.mosquees.nom}</p>
                    {reservation.mosquees.adresse && (
                      <p className="text-sm text-slate-600">{reservation.mosquees.adresse}</p>
                    )}
                    {reservation.mosquees.horaires && (
                      <p className="text-sm text-emerald-700 font-medium mt-0.5">
                        🕐 {reservation.mosquees.horaires}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* QR Code (pour réaffichage) */}
            <div className="flex justify-center mb-5">
              <div className="bg-white border-2 border-slate-200 rounded-xl p-3 inline-block">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(window.location.href)}&bgcolor=ffffff&color=064e3b`}
                  alt="QR Code"
                  className="w-28 h-28"
                />
              </div>
            </div>

            {/* CTA Admin : Marquer comme récupérée */}
            {canMark && (
              <button
                onClick={handleMarkRecupere}
                disabled={marking}
                className="w-full flex items-center justify-center gap-3 bg-emerald-600 text-white py-4 rounded-xl font-black text-lg hover:bg-emerald-500 disabled:opacity-60 transition-colors shadow-lg shadow-emerald-600/25"
              >
                {marking ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Enregistrement...</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Remettre au client</>
                )}
              </button>
            )}

            {/* Déjà récupérée */}
            {(reservation.statut === 'recuperee' || markedDone) && (
              <div className="w-full flex items-center justify-center gap-3 bg-emerald-50 border-2 border-emerald-200 text-emerald-700 py-4 rounded-xl font-bold">
                <CheckCircle2 className="w-5 h-5" />
                Commande récupérée — Al Hamdulillah !
              </div>
            )}

            {/* Message pour les non-admins */}
            {!canMark && reservation.statut === 'a_la_mosquee' && !isMosqueeAdmin && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl text-sm text-center font-medium">
                Présentez ce QR code à l'admin de la mosquée pour récupérer votre commande.
              </div>
            )}
          </div>
        </div>

        {/* Retour */}
        <div className="text-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-700 font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Retour à l'accueil
          </button>
        </div>
      </div>
    </div>
  );
}