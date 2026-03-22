import { useState } from 'react';
import { ShoppingBag, Loader2, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LoginPageProps {
  onBack: () => void;
}

export function LoginPage({ onBack }: LoginPageProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [isResetting, setIsResetting] = useState(false); // <-- Nouveau state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nom, setNom] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { signIn, signUp, resetPassword } = useAuth(); // <-- On récupère resetPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      if (isResetting) {
        // --- LOGIQUE MOT DE PASSE OUBLIÉ ---
        await resetPassword(email);
        setSuccessMsg('Un lien de réinitialisation a été envoyé à votre adresse e-mail.');
        setIsResetting(false); // On repasse sur la vue de connexion
        setIsLogin(true);
      } else if (isLogin) {
        // --- LOGIQUE CONNEXION ---
        await signIn(email, password);
      } else {
        // --- LOGIQUE INSCRIPTION ---
        await signUp(email, password, nom);
        setSuccessMsg('Un e-mail de confirmation a été envoyé ! Veuillez vérifier votre boîte de réception.');
        setIsLogin(true);
        setPassword('');
      }
    } catch (err: any) {
      if (err.message === 'Email not confirmed') {
        setError('Veuillez confirmer votre e-mail via le lien reçu avant de vous connecter.');
      } else if (err.message === 'User already registered') {
        setError('Cet e-mail est déjà utilisé.');
      } else {
        setError(err.message || 'Une erreur est survenue');
      }
    } finally {
      setLoading(false);
    }
  };

  // Déterminer le titre selon la vue active
  const getTitle = () => {
    if (isResetting) return 'Mot de passe oublié ?';
    if (isLogin) return 'Bon retour parmi nous';
    return 'Créez votre compte';
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-gradient-to-br from-emerald-900 via-teal-800 to-emerald-950">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
      <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>

      <div className="w-full max-w-md relative z-10">
        <button onClick={onBack} className="text-white/80 hover:text-white flex items-center gap-2 mb-6 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Retour à l'accueil
        </button>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex justify-center items-center w-16 h-16 rounded-2xl bg-white/10 border border-white/20 mb-4 shadow-inner">
              <ShoppingBag className="h-8 w-8 text-emerald-400" />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Monbelier</h1>
            <p className="text-emerald-100/70 mt-2">{getTitle()}</p>
          </div>

          {/* NOTIFICATION DE SUCCÈS */}
          {successMsg && (
            <div className="mb-6 bg-emerald-500/20 border border-emerald-500/50 text-emerald-100 px-4 py-3 rounded-xl text-sm backdrop-blur-sm flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
              <p>{successMsg}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* CHAMP NOM (Seulement pour l'inscription) */}
            {!isLogin && !isResetting && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <label className="block text-sm font-medium text-emerald-100/90 mb-1">Nom complet</label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all outline-none"
                  placeholder="Jean Dupont"
                />
              </div>
            )}

            {/* CHAMP EMAIL (Toujours visible) */}
            <div className="animate-[fadeIn_0.3s_ease-out]">
              <label className="block text-sm font-medium text-emerald-100/90 mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all outline-none"
                placeholder="votre@email.com"
              />
            </div>

            {/* CHAMP MOT DE PASSE (Caché si on est en train de réinitialiser) */}
            {!isResetting && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-sm font-medium text-emerald-100/90">Mot de passe</label>
                  {/* LIEN MOT DE PASSE OUBLIÉ */}
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => { setIsResetting(true); setError(''); setSuccessMsg(''); }}
                      className="text-xs text-emerald-300 hover:text-emerald-100 transition-colors"
                    >
                      Oublié ?
                    </button>
                  )}
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all outline-none"
                  placeholder="••••••••"
                />
              </div>
            )}

            {error && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl text-sm backdrop-blur-sm animate-[fadeIn_0.3s_ease-out]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-emerald-400 hover:shadow-[0_0_20px_rgba(52,211,153,0.4)] transition-all disabled:opacity-50 flex items-center justify-center mt-6"
            >
              {loading ? (
                <><Loader2 className="animate-spin h-5 w-5 mr-2" /> Chargement...</>
              ) : isResetting ? (
                'Envoyer le lien'
              ) : isLogin ? (
                'Se connecter'
              ) : (
                "S'inscrire"
              )}
            </button>
          </form>

          {/* LIENS DE NAVIGATION DU BAS */}
          <div className="mt-6 text-center">
            {isResetting ? (
              <button
                type="button"
                onClick={() => { setIsResetting(false); setError(''); setSuccessMsg(''); }}
                className="text-emerald-200/80 hover:text-white text-sm transition-colors"
              >
                Retour à la connexion
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError('');
                  setSuccessMsg('');
                }}
                className="text-emerald-200/80 hover:text-white text-sm transition-colors"
              >
                {isLogin ? "Pas encore de compte ? S'inscrire" : "Déjà un compte ? Se connecter"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}