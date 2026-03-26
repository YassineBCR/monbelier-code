import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { ArrowLeft, ArrowRight, CreditCard, ShoppingBasket, User, MapPin } from 'lucide-react';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

export function ReservationForm() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mosquees, setMosquees] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nom: profile?.nom || '',
    prenom: '',
    telephone: profile?.telephone || '',
    adresse: '',
    ville: '',
    cp: '',
    mosquee_id: '',
    quantite: 1,
    sacrifices: [''],
  });

  useEffect(() => {
    supabase.from('mosquees').select('*').then(({ data }) => setMosquees(data || []));
  }, []);

  const handleQuantiteChange = (q: number) => {
    const names = Array(q).fill('').map((_, i) => formData.sacrifices[i] || '');
    setFormData({ ...formData, quantite: q, sacrifices: names });
  };

  const handlePayment = async () => {
    if (!user) return alert("Veuillez vous connecter");
    setLoading(true);
    try {
      // 1. Sauvegarde dans la table 'reservations'
      const { data: res, error: resError } = await supabase
        .from('reservations')
        .insert([{
          user_id: user.id,
          mosquee_id: formData.mosquee_id || null, // Gestion du null pour la FK
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          adresse_livraison: formData.adresse,
          ville_livraison: formData.ville,
          code_postal_livraison: formData.cp,
          quantite: formData.quantite,
          noms_sacrifice: formData.sacrifices
        }])
        .select().single();

      if (resError) throw resError;

      // 2. Appel de la fonction Edge Supabase
      const { data, error: funcError } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          reservationId: res.id, 
          quantite: formData.quantite,
          email: user.email 
        }
      });

      if (funcError || !data?.sessionId) throw new Error(funcError?.message || "Erreur Stripe");

      // 3. Redirection Stripe
      const stripe = await stripePromise;
      await stripe?.redirectToCheckout({ sessionId: data.sessionId });

    } catch (err: any) {
      alert("Erreur de réservation : " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className="text-center py-20">Chargement...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl p-8">
        
        {step === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><User className="text-emerald-600"/> Vos coordonnées</h2>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Nom" className="border p-3 rounded-xl" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})}/>
              <input type="text" placeholder="Prénom" className="border p-3 rounded-xl" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})}/>
            </div>
            <input type="text" placeholder="Téléphone" className="w-full border p-3 rounded-xl" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})}/>
            <h2 className="text-2xl font-bold flex items-center gap-2 pt-4"><MapPin className="text-emerald-600"/> Adresse de livraison</h2>
            <input type="text" placeholder="Adresse" className="w-full border p-3 rounded-xl" value={formData.adresse} onChange={e => setFormData({...formData, adresse: e.target.value})}/>
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Ville" className="border p-3 rounded-xl" value={formData.ville} onChange={e => setFormData({...formData, ville: e.target.value})}/>
              <input type="text" placeholder="Code Postal" className="border p-3 rounded-xl" value={formData.cp} onChange={e => setFormData({...formData, cp: e.target.value})}/>
            </div>
            <button onClick={() => setStep(2)} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2">Continuer <ArrowRight/></button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><ShoppingBasket className="text-emerald-600"/> Commande</h2>
            <div className="flex gap-4">
              {[1, 2, 3].map(n => (
                <button key={n} onClick={() => handleQuantiteChange(n)} className={`flex-1 py-3 rounded-xl border-2 font-bold ${formData.quantite === n ? 'border-emerald-600 bg-emerald-50 text-emerald-700' : 'border-slate-100'}`}>{n}</button>
              ))}
            </div>
            {formData.sacrifices.map((s, i) => (
              <input key={i} type="text" placeholder={`Nom pour le sacrifice ${i+1}`} className="w-full border p-3 rounded-xl mb-2" value={s} onChange={e => {
                const newS = [...formData.sacrifices]; newS[i] = e.target.value; setFormData({...formData, sacrifices: newS});
              }}/>
            ))}
            <label className="block font-medium">Mosquée pour le don (optionnel)</label>
            <select className="w-full border p-3 rounded-xl" value={formData.mosquee_id} onChange={e => setFormData({...formData, mosquee_id: e.target.value})}>
              <option value="">Aucune</option>
              {mosquees.map(m => <option key={m.id} value={m.id}>{m.nom}</option>)}
            </select>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setStep(1)} className="flex-1 bg-slate-100 py-4 rounded-xl font-bold">Retour</button>
              <button onClick={() => setStep(3)} className="flex-[2] bg-emerald-600 text-white py-4 rounded-xl font-bold">Récapitulatif</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 text-center">
            <h2 className="text-2xl font-bold">Confirmation</h2>
            <div className="bg-slate-50 p-6 rounded-2xl text-left">
              <p><strong>Total à payer :</strong> {formData.quantite * 360}€</p>
            </div>
            <button disabled={loading} onClick={handlePayment} className="w-full bg-emerald-600 text-white py-4 rounded-xl font-bold flex justify-center items-center gap-2">
              {loading ? "Traitement..." : <><CreditCard/> Payer via Stripe</>}
            </button>
            <button onClick={() => setStep(2)} className="text-slate-400">Modifier</button>
          </div>
        )}
      </div>
    </div>
  );
}