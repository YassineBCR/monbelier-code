import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';

interface LoginPageProps {
  onBack?: () => void;
}

export function LoginPage({ onBack }: LoginPageProps) {
  const { signIn, signUp, resetPassword, isRecoveringPassword, updatePassword } = useAuth();
  
  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isRecoveringPassword) {
        await updatePassword(password);
        setMessage("Votre mot de passe a été mis à jour avec succès.");
        setTimeout(() => window.location.reload(), 2000); // Recharge la page
      } else if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        await signUp(email, password, nom);
        setMessage("Compte créé avec succès ! Vérifiez vos emails si nécessaire.");
        setMode('login'); // Redirige sur login
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage("Un email de réinitialisation vous a été envoyé.");
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  // Si on est en mode de récupération après avoir cliqué sur l'email
  if (isRecoveringPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 mb-6">
            Nouveau mot de passe
          </h2>
          {message && <div className="p-3 bg-green-50 text-green-700 rounded-md mb-4">{message}</div>}
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-md mb-4">{error}</div>}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nouveau mot de passe</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-3"
                  placeholder="Minimum 6 caractères"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-4 left-4 flex items-center text-emerald-600 hover:text-emerald-700 font-medium"
        >
          <ArrowLeft className="h-5 w-5 mr-1" /> Retour à l'accueil
        </button>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {mode === 'login' && 'Connexion à votre espace'}
          {mode === 'signup' && 'Créer un compte'}
          {mode === 'reset' && 'Mot de passe oublié'}
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {message && <div className="p-3 bg-green-50 text-green-700 rounded-md mb-4 text-sm">{message}</div>}
          {error && <div className="p-3 bg-red-50 text-red-700 rounded-md mb-4 text-sm">{error}</div>}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Champ NOM (uniquement inscription) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom complet</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                    placeholder="Votre nom"
                  />
                </div>
              </div>
            )}

            {/* Champ EMAIL (tous les modes) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Adresse email</label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                  placeholder="vous@exemple.com"
                />
              </div>
            </div>

            {/* Champ MOT DE PASSE (Inscription et Connexion) */}
            {mode !== 'reset' && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Mot de passe</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-md py-3 border"
                    placeholder="••••••••"
                  />
                  {/* Bouton pour afficher/masquer le mot de passe */}
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-gray-400 hover:text-emerald-500"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50"
            >
              {loading ? 'Chargement...' : 
                mode === 'login' ? 'Se connecter' : 
                mode === 'signup' ? 'Créer mon compte' : 
                'Envoyer le lien'}
            </button>
          </form>

          {/* Liens de navigation entre les modes */}
          <div className="mt-6 flex flex-col space-y-3 text-center text-sm">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('reset')} className="text-emerald-600 hover:text-emerald-500">
                  Mot de passe oublié ?
                </button>
                <button onClick={() => setMode('signup')} className="text-gray-600 hover:text-gray-900">
                  Pas encore de compte ? <span className="text-emerald-600 font-semibold">S'inscrire</span>
                </button>
              </>
            )}

            {mode === 'signup' && (
              <button onClick={() => setMode('login')} className="text-gray-600 hover:text-gray-900">
                Déjà un compte ? <span className="text-emerald-600 font-semibold">Se connecter</span>
              </button>
            )}

            {mode === 'reset' && (
              <button onClick={() => setMode('login')} className="text-gray-600 hover:text-gray-900">
                Retour à la <span className="text-emerald-600 font-semibold">connexion</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}