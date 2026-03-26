import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { 
  ArrowLeft, ArrowRight, CreditCard, ShoppingBasket, 
  User, CheckCircle2, FileText, Loader2, ShieldCheck 
} from 'lucide-react';

export function ReservationForm() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // L'état qui stocke toutes les informations du formulaire
  const [formData, setFormData] = useState({
    nom: profile?.nom || '',
    prenom: '',
    email: user?.email || '',
    telephone: profile?.telephone || '',
    quantite: 1,
    sacrifices: [''], // Tableau qui contiendra un nom par agneau
  });

  const prixUnitaire = 360; // Prix de l'agneau

  // Met à jour dynamiquement le nombre de champs "Nom de sacrifice"
  const handleQuantiteChange = (nouvelleQuantite: number) => {
    if (nouvelleQuantite < 1) return;
    
    // On recrée un tableau de la bonne taille en gardant les noms déjà saisis
    const nouveauxSacrifices = Array(nouvelleQuantite).fill('').map((_, index) => {
      return formData.sacrifices[index] || '';
    });

    setFormData({ 
      ...formData, 
      quantite: nouvelleQuantite, 
      sacrifices: nouveauxSacrifices 
    });
  };

  // Met à jour un nom de sacrifice spécifique dans le tableau
  const handleSacrificeChange = (index: number, valeur: string) => {
    const nouveauxSacrifices = [...formData.sacrifices];
    nouveauxSacrifices[index] = valeur;
    setFormData({ ...formData, sacrifices: nouveauxSacrifices });
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, 4));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  // ÉTAPE 4 : Soumission et redirection Stripe
  const handlePayment = async () => {
    if (!user) return alert("Veuillez vous connecter pour réserver.");
    setLoading(true);
    setError('');

    try {
      // 1. Sauvegarde dans la base de données
      const { data: res, error: resError } = await supabase
        .from('reservations')
        .insert([{
          user_id: user.id,
          nom: formData.nom,
          prenom: formData.prenom,
          telephone: formData.telephone,
          quantite: formData.quantite,
          noms_sacrifice: formData.sacrifices,
          // On envoie des chaînes vides pour l'adresse si elles sont requises par votre base
          adresse_livraison: '', 
          ville_livraison: '',
          code_postal_livraison: '',
        }])
        .select().single();

      if (resError) throw new Error(`Erreur Base de données: ${resError.message}`);

      // 2. Appel de la fonction Edge Supabase pour créer la session Stripe
      const { data, error: funcError } = await supabase.functions.invoke('create-payment-intent', {
        body: { 
          reservationId: res.id, 
          quantite: formData.quantite,
          email: formData.email 
        }
      });

      if (funcError) throw new Error(`Erreur Fonction: ${funcError.message}`);
      if (data?.error) throw new Error(`Erreur Stripe Backend: ${data.error}`);
      if (!data?.url) throw new Error("L'URL de paiement est introuvable. Avez-vous bien redéployé la fonction ?");

      // 3. Redirection native Javascript vers la page Stripe sécurisée
      window.location.href = data.url;

    } catch (err: any) {
      console.error("Erreur de paiement:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-emerald-600"/></div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Bouton retour */}
        <button onClick={() => navigate('/')} className="text-slate-500 hover:text-emerald-700 flex items-center gap-2 mb-8 transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" /> Retour à l'accueil
        </button>

        <div className="bg-white rounded-[2rem] shadow-xl p-8 md:p-12 border border-slate-100">
          
          {/* BARRE DE PROGRESSION */}
          <div className="mb-10">
            <div className="flex justify-between items-center mb-4">
              {[
                { id: 1, icon: User, label: 'Contact' },
                { id: 2, icon: ShoppingBasket, label: 'Agneaux' },
                { id: 3, icon: FileText, label: 'Résumé' },
                { id: 4, icon: CreditCard, label: 'Paiement' },
              ].map((s) => (
                <div key={s.id} className={`flex flex-col items-center gap-2 ${step >= s.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${step >= s.id ? 'border-emerald-500 bg-emerald-50 shadow-lg shadow-emerald-500/20' : 'border-slate-200 bg-white'}`}>
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider hidden sm:block">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-500 transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              ></div>
            </div>
          </div>

          {/* CONTENU DES ÉTAPES */}
          <div className="min-h-[350px]">
            
            {/* ÉTAPE 1 : INFORMATIONS */}
            {step === 1 && (
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Vos informations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Prénom</label>
                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.prenom} onChange={e => setFormData({...formData, prenom: e.target.value})} placeholder="Votre prénom" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nom</label>
                    <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.nom} onChange={e => setFormData({...formData, nom: e.target.value})} placeholder="Votre nom" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <input type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="exemple@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Téléphone</label>
                    <input type="tel" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" value={formData.telephone} onChange={e => setFormData({...formData, telephone: e.target.value})} placeholder="06 12 34 56 78" />
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : COMMANDE & SACRIFICES */}
            {step === 2 && (
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Détails de la réservation</h2>
                
                {/* Sélecteur de quantité */}
                <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900">Combien d'agneaux souhaitez-vous ?</h3>
                    <p className="text-emerald-600 font-semibold">{prixUnitaire}€ l'unité</p>
                  </div>
                  <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <button onClick={() => handleQuantiteChange(formData.quantite - 1)} className="text-slate-400 hover:text-emerald-600 font-bold text-2xl px-2">-</button>
                    <span className="font-bold text-xl w-6 text-center">{formData.quantite}</span>
                    <button onClick={() => handleQuantiteChange(formData.quantite + 1)} className="text-slate-400 hover:text-emerald-600 font-bold text-2xl px-2">+</button>
                  </div>
                </div>

                {/* Champs dynamiques pour les noms de sacrifice */}
                <div className="space-y-4">
                  <h3 className="font-bold text-slate-800 border-b pb-2">Noms pour le sacrifice (Bismillah Allahu Akbar)</h3>
                  {formData.sacrifices.map((sacrificeName, index) => (
                    <div key={index} className="flex flex-col gap-2">
                      <label className="text-sm font-medium text-slate-600">Agneau n°{index + 1}</label>
                      <input 
                        type="text" 
                        placeholder="Ex: Pour la famille Dupont" 
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" 
                        value={sacrificeName} 
                        onChange={e => handleSacrificeChange(index, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : RÉCAPITULATIF */}
            {step === 3 && (
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Récapitulatif de votre commande</h2>
                
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
                  {/* Info Client */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Vos informations</h3>
                    <p className="font-medium text-slate-800">{formData.prenom} {formData.nom}</p>
                    <p className="text-slate-600">{formData.email} • {formData.telephone}</p>
                  </div>

                  <hr className="border-slate-200" />

                  {/* Info Commande */}
                  <div>
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Détails de l'Aïd</h3>
                    <div className="flex justify-between items-center font-medium text-slate-800 mb-2">
                      <span>{formData.quantite}x Agneau(x)</span>
                      <span>{formData.quantite * prixUnitaire}€</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      {formData.sacrifices.map((nom, i) => (
                        <li key={i}>Agneau {i+1} : <span className="font-medium text-slate-800">{nom || "Non renseigné"}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-8 flex justify-between items-center px-4">
                  <span className="text-lg font-bold text-slate-600">Total à régler :</span>
                  <span className="text-3xl font-black text-emerald-600">{formData.quantite * prixUnitaire}€</span>
                </div>
              </div>
            )}

            {/* ÉTAPE 4 : PAIEMENT (STRIPE) */}
            {step === 4 && (
              <div className="animate-[fadeIn_0.5s_ease-out] text-center pt-8">
                <ShieldCheck className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                <h2 className="text-3xl font-black text-slate-900 mb-4">Paiement Sécurisé</h2>
                <p className="text-slate-600 mb-8 max-w-md mx-auto">
                  Vous allez être redirigé vers la plateforme de paiement sécurisée Stripe pour finaliser votre réservation de <strong>{formData.quantite * prixUnitaire}€</strong>.
                </p>

                {error && (
                  <div className="mb-6 bg-red-50 text-red-600 px-4 py-4 rounded-xl text-sm border border-red-100 font-medium">
                    {error}
                  </div>
                )}

                <button 
                  onClick={handlePayment} 
                  disabled={loading} 
                  className="w-full sm:w-auto mx-auto bg-emerald-600 text-white px-10 py-4 rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-lg flex items-center justify-center gap-3 disabled:opacity-70 transform hover:-translate-y-0.5"
                >
                  {loading ? (
                    <><Loader2 className="w-6 h-6 animate-spin" /> Création de la session...</>
                  ) : (
                    <><CreditCard className="w-6 h-6" /> Payer {formData.quantite * prixUnitaire}€ via Stripe</>
                  )}
                </button>
              </div>
            )}

          </div>

          {/* BOUTONS DE NAVIGATION INTER-ÉTAPES (Affichés seulement pour les étapes 1, 2 et 3) */}
          {step < 4 && (
            <div className="mt-10 pt-6 border-t border-slate-100 flex justify-between items-center">
              {step > 1 ? (
                <button onClick={prevStep} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors flex items-center gap-2">
                  <ArrowLeft className="w-5 h-5" /> Précédent
                </button>
              ) : <div></div>}

              <button onClick={nextStep} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5">
                {step === 3 ? 'Passer au paiement' : 'Continuer'} <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}