import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, ArrowRight, CreditCard, ShoppingBasket, 
  User, CheckCircle2, FileText, Loader2, ShieldCheck, MapPin, Store
} from 'lucide-react';

export function ReservationForm() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mosquees, setMosquees] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    nom: profile?.nom || '',
    prenom: '',
    email: user?.email || '',
    telephone: profile?.telephone || '',
    quantite: 1,
    sacrifices: [''], 
    mosquee_id: '', 
  });

  // ⚠️ PRIX DE TEST À 50 CENTIMES (À remettre à 350 après le test)
  const prixUnitaire = 350; 

  useEffect(() => {
    async function fetchMosquees() {
      const { data, error } = await supabase.from('mosquees').select('id, nom, adresse').order('nom');
      if (!error && data) setMosquees(data);
    }
    fetchMosquees();
  }, []);

  const handleQuantiteChange = (nouvelleQuantite: number) => {
    if (nouvelleQuantite < 1) return;
    const nouveauxSacrifices = Array(nouvelleQuantite).fill('').map((_, index) => formData.sacrifices[index] || '');
    setFormData({ ...formData, quantite: nouvelleQuantite, sacrifices: nouveauxSacrifices });
  };

  const handleSacrificeChange = (index: number, valeur: string) => {
    const nouveauxSacrifices = [...formData.sacrifices];
    nouveauxSacrifices[index] = valeur;
    setFormData({ ...formData, sacrifices: nouveauxSacrifices });
  };

  const nextStep = () => {
    if (step === 2 && !formData.mosquee_id) {
      alert("Veuillez sélectionner une mosquée pour le retrait.");
      return;
    }
    setStep(prev => Math.min(prev + 1, 4));
  };
  
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handlePayment = async () => {
    if (!user) return alert("Veuillez vous connecter pour réserver.");
    setLoading(true);
    setError('');

    try {
      // ON ENVOIE TOUT À STRIPE DIRECTEMENT (Aucune création en base de données)
      const { data, error: funcError } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          user_id: user.id,
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          quantite: formData.quantite,
          email: formData.email,
          mosquee_id: formData.mosquee_id,
          sacrifices: formData.sacrifices
        },
        headers: { 'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY }
      });

      if (funcError) throw new Error(`Erreur Fonction: ${funcError.message}`);
      if (data?.url) {
        window.location.href = data.url; 
      } else {
        throw new Error("Impossible de générer le lien de paiement.");
      }
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-600"/></div>;

  const selectedMosquee = mosquees.find(m => m.id === formData.mosquee_id);

  return (
    <div className="min-h-screen bg-[#FAF7F2] py-12 px-4 sm:px-6 lg:px-8 font-sans text-slate-900">
      <div className="max-w-3xl mx-auto">
        
        <button onClick={() => navigate('/')} className="text-slate-500 hover:text-green-800 flex items-center gap-2 mb-8 transition-colors font-bold uppercase tracking-wider text-xs">
          <ArrowLeft className="w-5 h-5" /> Retour à l'accueil
        </button>

        <div className="bg-white rounded-[2rem] shadow-2xl shadow-amber-900/5 p-8 md:p-12 border border-amber-100">
          
          {/* BARRE DE PROGRESSION */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              {[
                { id: 1, icon: User, label: 'Contact' },
                { id: 2, icon: ShoppingBasket, label: 'Agneaux' },
                { id: 3, icon: FileText, label: 'Résumé' },
                { id: 4, icon: CreditCard, label: 'Paiement' },
              ].map((s) => (
                <div key={s.id} className={`flex flex-col items-center gap-2 ${step >= s.id ? 'text-green-800' : 'text-slate-300'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? 'border-amber-500 bg-amber-50 shadow-lg shadow-amber-500/20' : 'border-slate-100 bg-white'}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-amber-500 transition-all duration-500 ease-out" style={{ width: `${((step - 1) / 3) * 100}%` }}></div>
            </div>
          </div>

          <div className="min-h-[350px]">
            {/* ÉTAPE 1 : CONTACT */}
            {step === 1 && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-3xl font-black text-green-950 mb-8 uppercase tracking-tight">Vos informations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Prénom</label>
                    <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} placeholder="Votre prénom" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Nom</label>
                    <input type="text" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} placeholder="Votre nom" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Email</label>
                    <input type="email" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="exemple@email.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Téléphone</label>
                    <input type="tel" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} placeholder="06 12 34 56 78" />
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : AGNEAUX & POINT DE RETRAIT */}
            {step === 2 && (
              <div className="animate-in fade-in duration-300 space-y-8">
                <div>
                  <h2 className="text-3xl font-black text-green-950 mb-8 uppercase tracking-tight">Votre réservation</h2>
                  <div className="bg-amber-50/50 border border-amber-200/50 p-6 rounded-[2rem] flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                      <h3 className="font-black text-green-950 text-lg">Quantité d'agneaux</h3>
                      <p className="text-amber-600 font-bold">{prixUnitaire}€ l'unité</p>
                    </div>
                    <div className="flex items-center gap-4 bg-white px-5 py-3 rounded-2xl border border-amber-100 shadow-sm">
                      <button onClick={() => handleQuantiteChange(formData.quantite - 1)} className="text-slate-400 hover:text-green-800 font-black text-2xl px-2 transition-colors">-</button>
                      <span className="font-black text-2xl w-8 text-center text-green-950">{formData.quantite}</span>
                      <button onClick={() => handleQuantiteChange(formData.quantite + 1)} className="text-slate-400 hover:text-green-800 font-black text-2xl px-2 transition-colors">+</button>
                    </div>
                  </div>
                </div>

                {/* CHOIX DE LA MOSQUÉE */}
                <div className="space-y-4">
                  <h3 className="font-black text-green-950 flex items-center gap-2 uppercase tracking-tight">
                    <Store className="w-5 h-5 text-amber-500" /> Lieu de retrait
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {mosquees.map((m) => (
                      <label 
                        key={m.id} 
                        className={`relative flex items-start p-5 cursor-pointer rounded-2xl border-2 transition-all duration-200 ${formData.mosquee_id === m.id ? 'border-amber-500 bg-amber-50/30' : 'border-slate-100 hover:border-amber-200 bg-white'}`}
                      >
                        <input 
                          type="radio" 
                          name="mosquee" 
                          className="mt-1 w-5 h-5 text-amber-500 focus:ring-amber-500 border-slate-300"
                          checked={formData.mosquee_id === m.id}
                          onChange={() => setFormData({...formData, mosquee_id: m.id})}
                        />
                        <div className="ml-4">
                          <span className={`block font-black text-lg ${formData.mosquee_id === m.id ? 'text-green-950' : 'text-slate-700'}`}>{m.nom}</span>
                          <span className="block text-sm text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                            <MapPin className="w-3.5 h-3.5" /> {m.adresse}
                          </span>
                        </div>
                      </label>
                    ))}
                    {mosquees.length === 0 && <p className="text-slate-500 italic font-medium">Chargement des points de retrait...</p>}
                  </div>
                </div>

                {/* NOMS SACRIFICE */}
                <div className="space-y-4 pt-4">
                  <h3 className="font-black text-green-950 border-b border-slate-100 pb-3 uppercase tracking-tight">Noms pour le sacrifice</h3>
                  {formData.sacrifices.map((sacrificeName, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Agneau n°{index + 1}</label>
                      <input type="text" placeholder="Ex: Pour la famille Dupont" className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-medium" value={sacrificeName} onChange={e => handleSacrificeChange(index, e.target.value)} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : RÉCAPITULATIF */}
            {step === 3 && (
              <div className="animate-in fade-in duration-300">
                <h2 className="text-3xl font-black text-green-950 mb-8 uppercase tracking-tight">Récapitulatif</h2>
                
                <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Vos informations</h3>
                      <p className="font-black text-lg text-slate-800">{formData.prenom} {formData.nom}</p>
                      <p className="text-slate-500 text-sm font-medium mt-1">{formData.email}<br/>{formData.telephone}</p>
                    </div>
                    <div>
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Point de retrait</h3>
                      <p className="font-black text-lg text-green-800">{selectedMosquee?.nom}</p>
                      <p className="text-slate-500 text-sm font-medium mt-1">{selectedMosquee?.adresse}</p>
                    </div>
                  </div>

                  <hr className="border-slate-200" />

                  <div>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Détails de la commande</h3>
                    <div className="flex justify-between items-center font-black text-xl text-slate-800 mb-4">
                      <span>{formData.quantite}x Agneau(x)</span>
                      <span className="text-green-800">{(formData.quantite * prixUnitaire).toFixed(2)}€</span>
                    </div>
                    <ul className="text-sm text-slate-600 space-y-2 bg-white p-4 rounded-2xl border border-slate-100 font-medium">
                      {formData.sacrifices.map((nom, i) => (
                        <li key={i} className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-amber-500" />
                          Agneau {i+1} : <span className="font-bold text-slate-800">{nom || "Bismillah Allahu Akbar"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-10 flex justify-between items-end px-4">
                  <span className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Total à régler</span>
                  <span className="text-5xl font-black text-amber-500">{(formData.quantite * prixUnitaire).toFixed(2)}€</span>
                </div>
              </div>
            )}

            {/* ÉTAPE 4 : PAIEMENT */}
            {step === 4 && (
              <div className="animate-in fade-in zoom-in duration-300 text-center pt-8">
                <ShieldCheck className="w-24 h-24 text-amber-500 mx-auto mb-8 drop-shadow-lg" />
                <h2 className="text-4xl font-black text-green-950 mb-6 uppercase tracking-tight">Paiement Sécurisé</h2>
                <p className="text-slate-600 mb-10 max-w-md mx-auto font-medium text-lg leading-relaxed">
                  Votre retrait est prévu à la mosquée <strong className="text-green-800">{selectedMosquee?.nom}</strong>. 
                  Cliquez sur le bouton pour finaliser le paiement sur Stripe.
                </p>

                {error && <div className="mb-8 bg-red-50 text-red-600 px-6 py-4 rounded-2xl text-sm border border-red-100 font-bold">{error}</div>}

                <button onClick={handlePayment} disabled={loading} className="w-full sm:w-auto mx-auto bg-green-800 text-white px-12 py-5 rounded-2xl font-black text-xl hover:bg-green-900 transition-all shadow-xl shadow-green-900/20 flex items-center justify-center gap-3 disabled:opacity-70 transform hover:-translate-y-1 uppercase tracking-tight">
                  {loading ? <><Loader2 className="w-6 h-6 animate-spin text-amber-500" /> Connexion à Stripe...</> : <><CreditCard className="w-6 h-6 text-amber-500" /> Payer {(formData.quantite * prixUnitaire).toFixed(2)}€</>}
                </button>
              </div>
            )}

          </div>

          {step < 4 && (
            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-between items-center">
              {step > 1 ? (
                <button onClick={prevStep} className="px-6 py-3 text-slate-400 font-black uppercase tracking-wider text-xs hover:text-slate-800 transition-colors flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Précédent
                </button>
              ) : <div></div>}

              <button onClick={nextStep} className="bg-green-950 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-green-800 transition-all shadow-lg flex items-center gap-3 transform hover:-translate-y-1">
                {step === 3 ? 'Procéder au paiement' : 'Continuer'} <ArrowRight className="w-5 h-5 text-amber-500" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}