import { useState } from 'react';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface OrderFormProps {
  onBack: () => void;
}

export function OrderForm({ onBack }: OrderFormProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [formData, setFormData] = useState({
    client_prenom: '',
    client_nom: '',
    client_email: '',
    client_telephone: '',
    adresse_livraison: '',
    code_postal: '',
    ville: '',
    nom_sacrifice: '',
    date_livraison_souhaitee: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          ...formData,
          prix: 350,
          statut: 'en_attente',
          payment_status: 'paid'
        }])
        .select()
        .single();

      if (error) throw error;

      setOrderNumber(data.numero_commande);
      setSuccess(true);
    } catch (error) {
      console.error('Error creating order:', error);
      alert('Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircle className="h-16 w-16 text-emerald-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Commande confirmée !
          </h2>
          <p className="text-gray-600 mb-6">
            Votre numéro de commande est :
          </p>
          <div className="bg-emerald-50 rounded-lg p-4 mb-6">
            <p className="text-2xl font-bold text-emerald-600">{orderNumber}</p>
          </div>
          <p className="text-gray-600 mb-8">
            Nous vous contacterons prochainement pour confirmer les détails de livraison.
            Un email de confirmation a été envoyé à {formData.client_email}.
          </p>
          <button
            onClick={onBack}
            className="bg-emerald-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-emerald-700 transition-all w-full"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={onBack}
          className="flex items-center text-emerald-600 hover:text-emerald-700 mb-6 font-semibold transition-colors"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Retour
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8 lg:p-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Commander votre agneau
          </h2>
          <p className="text-gray-600 mb-8">
            Remplissez ce formulaire pour réserver votre agneau pour l'Aïd.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Prénom *
                </label>
                <input
                  type="text"
                  name="client_prenom"
                  required
                  value={formData.client_prenom}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Nom *
                </label>
                <input
                  type="text"
                  name="client_nom"
                  required
                  value={formData.client_nom}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email *
                </label>
                <input
                  type="email"
                  name="client_email"
                  required
                  value={formData.client_email}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Téléphone *
                </label>
                <input
                  type="tel"
                  name="client_telephone"
                  required
                  value={formData.client_telephone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Adresse de livraison *
              </label>
              <input
                type="text"
                name="adresse_livraison"
                required
                value={formData.adresse_livraison}
                onChange={handleChange}
                placeholder="Numéro et nom de rue"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Code postal *
                </label>
                <input
                  type="text"
                  name="code_postal"
                  required
                  value={formData.code_postal}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ville *
                </label>
                <input
                  type="text"
                  name="ville"
                  required
                  value={formData.ville}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nom du sacrifice *
              </label>
              <input
                type="text"
                name="nom_sacrifice"
                required
                value={formData.nom_sacrifice}
                onChange={handleChange}
                placeholder="Nom de la personne pour qui le sacrifice est fait"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Date de livraison souhaitée *
              </label>
              <input
                type="date"
                name="date_livraison_souhaitee"
                required
                value={formData.date_livraison_souhaitee}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Notes complémentaires
              </label>
              <textarea
                name="notes"
                rows={3}
                value={formData.notes}
                onChange={handleChange}
                placeholder="Instructions spéciales, code d'accès, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
              />
            </div>

            <div className="border-t pt-6 mt-8">
              <div className="flex justify-between items-center mb-6">
                <span className="text-lg font-semibold text-gray-900">Total à payer</span>
                <span className="text-3xl font-bold text-emerald-600">350€</span>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-emerald-700 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Traitement en cours...
                  </>
                ) : (
                  'Confirmer ma commande'
                )}
              </button>
              <p className="text-sm text-gray-500 text-center mt-4">
                En confirmant, vous acceptez nos conditions de vente
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
