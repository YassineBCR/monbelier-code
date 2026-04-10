import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { loadStripe } from '@stripe/stripe-js';
import { 
  ArrowLeft, ChevronRight, ChevronLeft, CreditCard, 
  CheckCircle2, MapPin, User, Package, ShieldCheck, Loader2 
} from 'lucide-react';

// Initialisation de Stripe (Assurez-vous d'avoir VITE_STRIPE_PUBLIC_KEY dans votre fichier .env)
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

interface OrderFormProps {
  onBack: () => void;
}

export function OrderForm({ onBack }: OrderFormProps) {
  const { user, profile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [orderData, setOrderData] = useState<any>(null);

  const [formData, setFormData] = useState({
    client_prenom: '',
    client_nom: profile?.nom || '',
    client_email: user?.email || '',
    client_telephone: profile?.telephone || '',
    quantite: 1,
    nom_sacrifice: '',
    adresse_livraison: '',
    code_postal: '',
    ville: '',
    notes: ''
  });

  const prixUnitaire = 350;
  const total = formData.quantite * prixUnitaire;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const nextStep = () => setStep((prev) => Math.min(prev + 1, 4));
  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // 1. Enregistrement en base de données avec statut en attente de paiement
      const { data: newOrderData, error: submitError } = await supabase
        .from('orders')
        .insert({
          client_prenom: formData.client_prenom,
          client_nom: formData.client_nom,
          client_email: formData.client_email,
          client_telephone: formData.client_telephone,
          quantite: formData.quantite,
          nom_sacrifice: formData.nom_sacrifice,
          adresse_livraison: formData.adresse_livraison,
          code_postal: formData.code_postal,
          ville: formData.ville,
          notes: formData.notes,
          prix: total,
          statut: 'en_attente',
          payment_status: 'pending' // En attente du paiement réel Stripe
        })
        .select()
        .single();

      if (submitError) throw submitError;

      // 2. Appel de l'API Vercel au lieu de la Edge Function Supabase
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items: [
            {
              price_data: {
                currency: 'eur',
                product_data: {
                  name: "Agneau de l'Aïd (Carcasse entière)",
                },
                unit_amount: prixUnitaire * 100, // Stripe attend le montant en centimes
              },
              quantity: formData.quantite,
            }
          ],
          customer_email: formData.client_email,
          metadata: {
            order_id: newOrderData.id // Permet au Webhook Stripe de mettre à jour la bonne commande
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erreur lors de la création de la session Stripe");
      }

      // 3. Redirection vers la vraie page de paiement Stripe
      if (data.url) {
        window.location.href = data.url; 
      } else {
        throw new Error("L'URL de paiement n'a pas été générée.");
      }

    } catch (err: any) {
      console.error("Erreur Stripe:", err);
      setError(err.message || 'Erreur lors de la validation de la commande');
      setLoading(false); // On arrête le chargement seulement en cas d'erreur
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] relative overflow-hidden font-sans py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      {/* ARRIÈRE-PLAN ANIMÉ */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 fixed">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-emerald-300/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-teal-300/30 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="w-full max-w-3xl relative z-10">
        {step < 5 && (
          <button onClick={onBack} className="text-slate-500 hover:text-emerald-700 flex items-center gap-2 mb-8 transition-colors font-medium">
            <ArrowLeft className="w-5 h-5" /> Retour à l'accueil
          </button>
        )}

        {/* CONTENEUR PRINCIPAL GLASSMORPHISM */}
        <div className="bg-white/70 backdrop-blur-xl border border-white/60 shadow-2xl shadow-emerald-900/10 rounded-[2rem] p-8 md:p-12 transition-all duration-500">
          
          {/* PROGRESS BAR (Cachée sur l'écran de succès) */}
          {step < 5 && (
            <div className="mb-10">
              <div className="flex justify-between items-center mb-4">
                {[
                  { id: 1, icon: User, label: 'Contact' },
                  { id: 2, icon: Package, label: 'Commande' },
                  { id: 3, icon: MapPin, label: 'Livraison' },
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
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-500 ease-out"
                  style={{ width: `${((step - 1) / 3) * 100}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* CONTENU DES ÉTAPES */}
          <div className="min-h-[300px]">
            {/* ÉTAPE 1 : CONTACT */}
            {step === 1 && (
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Vos informations</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Prénom</label>
                    <input type="text" name="client_prenom" value={formData.client_prenom} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Nom</label>
                    <input type="text" name="client_nom" value={formData.client_nom} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
                    <input type="email" name="client_email" value={formData.client_email} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" required />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Téléphone</label>
                    <input type="tel" name="client_telephone" value={formData.client_telephone} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" required />
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 2 : COMMANDE */}
            {step === 2 && (
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Détails du sacrifice</h2>
                
                <div className="bg-emerald-50/50 border border-emerald-100 p-6 rounded-2xl mb-6 flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-900">Agneau de l'Aïd (Carcasse entière)</h3>
                    <p className="text-emerald-600 font-semibold">{prixUnitaire}€ l'unité</p>
                  </div>
                  <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
                    <button onClick={() => setFormData(prev => ({...prev, quantite: Math.max(1, prev.quantite - 1)}))} className="text-slate-400 hover:text-emerald-600 font-bold text-xl px-2">-</button>
                    <span className="font-bold text-lg w-4 text-center">{formData.quantite}</span>
                    <button onClick={() => setFormData(prev => ({...prev, quantite: prev.quantite + 1}))} className="text-slate-400 hover:text-emerald-600 font-bold text-xl px-2">+</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Nom(s) pour le sacrifice (Bismillah Allahu Akbar)</label>
                  <textarea name="nom_sacrifice" value={formData.nom_sacrifice} onChange={handleChange} rows={3} placeholder="Ex: Pour la famille Dupont" className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none" required></textarea>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : LIVRAISON */}
            {step === 3 && (
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <h2 className="text-2xl font-extrabold text-slate-900 mb-6">Coordonnées de livraison</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Adresse complète</label>
                    <input type="text" name="adresse_livraison" value={formData.adresse_livraison} onChange={handleChange} placeholder="123 rue de la Paix" className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" required />
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Code Postal</label>
                      <input type="text" name="code_postal" value={formData.code_postal} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" required />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Ville</label>
                      <input type="text" name="ville" value={formData.ville} onChange={handleChange} className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Notes pour le livreur (Optionnel)</label>
                    <input type="text" name="notes" value={formData.notes} onChange={handleChange} placeholder="Code porte, bâtiment..." className="w-full px-4 py-3 bg-white/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
            )}

            {/* ÉTAPE 4 : PAIEMENT (STRIPE) */}
            {step === 4 && (
              <div className="animate-[fadeIn_0.5s_ease-out]">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-black text-slate-900">Total à régler : {total}€</h2>
                  <p className="text-slate-500 mt-2 font-medium">Pour {formData.quantite} agneau(x) livré(s) à domicile</p>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center">
                  <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-900 mb-2">Paiement 100% Sécurisé</h3>
                  <p className="text-slate-600 text-sm">
                    En cliquant sur "Payer", vous serez redirigé vers la plateforme sécurisée de Stripe pour finaliser votre transaction.
                  </p>
                </div>

                {error && (
                  <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl text-sm border border-red-100 font-medium text-center">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* ÉTAPE 5 : SUCCÈS & QR CODE (Aura lieu après le retour de Stripe si géré par query param) */}
            {step === 5 && orderData && (
              <div className="text-center animate-[fadeIn_0.5s_ease-out] py-8">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/20">
                  <CheckCircle2 className="w-12 h-12 text-emerald-600" />
                </div>
                <h2 className="text-4xl font-black text-slate-900 mb-4">Commande Validée !</h2>
                <p className="text-lg text-slate-600 mb-8 max-w-md mx-auto">
                  Al Hamdulillah, votre réservation a été enregistrée avec succès. Un e-mail de confirmation vous a été envoyé.
                </p>

                {/* CARTE QR CODE */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 max-w-sm mx-auto shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                  <h3 className="text-emerald-400 font-bold uppercase tracking-widest text-sm mb-6">Votre Pass Livraison</h3>
                  
                  <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-inner">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${orderData.numero_commande || orderData.id}`} 
                      alt="QR Code Commande"
                      className="w-40 h-40"
                    />
                  </div>
                  
                  <div className="text-white">
                    <p className="text-slate-400 text-sm mb-1">Numéro de commande</p>
                    <p className="text-2xl font-mono font-bold tracking-wider">{orderData.numero_commande || "Bientôt disponible"}</p>
                  </div>
                </div>

                <button
                  onClick={onBack}
                  className="mt-10 text-emerald-600 font-bold hover:text-emerald-700 transition-colors"
                >
                  ← Retourner à l'accueil
                </button>
              </div>
            )}
          </div>

          {/* BOUTONS DE NAVIGATION */}
          {step < 5 && (
            <div className="mt-10 pt-6 border-t border-slate-200/60 flex justify-between items-center">
              {step > 1 ? (
                <button type="button" onClick={prevStep} className="px-6 py-3 text-slate-500 font-bold hover:text-slate-800 transition-colors flex items-center gap-2">
                  <ChevronLeft className="w-5 h-5" /> Précédent
                </button>
              ) : <div></div>}

              {step < 4 ? (
                <button type="button" onClick={nextStep} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2 transform hover:-translate-y-0.5">
                  Continuer <ChevronRight className="w-5 h-5" />
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={loading} className="bg-emerald-600 text-white px-10 py-3.5 rounded-xl font-bold hover:bg-emerald-500 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] flex items-center gap-2 disabled:opacity-70 transform hover:-translate-y-0.5">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />}
                  {loading ? 'Redirection vers Stripe...' : `Payer ${total}€`}
                </button>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}