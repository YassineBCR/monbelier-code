import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { CheckCircle2, Loader2, Home } from 'lucide-react';

export function SuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  
  const [loading, setLoading] = useState(true);
  const [reservation, setReservation] = useState<any>(null);
  const [error, setError] = useState('');
  const hasVerified = useRef(false);

  useEffect(() => {
    if (!sessionId) {
      navigate('/');
      return;
    }

    async function verifyPayment() {
      if (hasVerified.current) return;
      hasVerified.current = true;
      
      try {
        // C'est ici qu'on vérifie Stripe et qu'on crée la commande en base
        const { data, error: funcError } = await supabase.functions.invoke('verify-payment', {
          body: { session_id: sessionId },
          headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY }
        });

        if (funcError) throw new Error(funcError.message);
        if (data?.error) throw new Error(data.error);
        
        setReservation(data.reservation);
      } catch (err: any) {
        setError("Erreur lors de la validation : " + err.message);
      } finally {
        setLoading(false);
      }
    }

    verifyPayment();
  }, [sessionId, navigate]);

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-green-800" />
      <p className="text-xl font-bold text-green-950">Validation de votre paiement en cours...</p>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#FAF7F2] p-4">
      <div className="bg-white p-8 md:p-12 rounded-[2rem] shadow-xl max-w-lg w-full text-center">
        {error ? (
          <div>
            <div className="w-20 h-20 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold">!</div>
            <h1 className="text-2xl font-black text-slate-800 mb-4">{error}</h1>
            <p className="text-slate-600 mb-8">Veuillez nous contacter si votre compte a été débité.</p>
          </div>
        ) : (
          <div>
            <CheckCircle2 className="w-24 h-24 text-green-500 mx-auto mb-6" />
            <h1 className="text-3xl font-black text-green-950 mb-2 uppercase tracking-tight">Paiement Réussi !</h1>
            <p className="text-slate-600 mb-8 text-lg">Votre réservation pour l'Aïd a bien été enregistrée.</p>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Numéro de réservation</p>
              <p className="text-2xl font-black text-amber-600">{reservation?.id?.split('-')[0] || 'MB-2026-OK'}</p>
            </div>
          </div>
        )}
        
        <button onClick={() => navigate('/')} className="w-full bg-slate-100 text-slate-700 px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-colors flex items-center justify-center gap-2">
          <Home className="w-5 h-5" /> Retour à l'accueil
        </button>
      </div>
    </div>
  );
}