import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle } from 'lucide-react';

interface LoginPageProps {
  onBack?: () => void;
}

// Calcule la force du mot de passe (0-4)
function getPasswordStrength(password: string): number {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score;
}

const strengthLabels = ['', 'Faible', 'Moyen', 'Bon', 'Fort'];
const strengthColors = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'];

export function LoginPage({ onBack }: LoginPageProps) {
  const { signIn, signUp, resetPassword, isRecoveringPassword, updatePassword } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nom, setNom] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    // Validation côté client
    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas.");
        return;
      }
      if (password.length < 8) {
        setError("Le mot de passe doit contenir au moins 8 caractères.");
        return;
      }
    }

    setLoading(true);
    try {
      if (isRecoveringPassword) {
        if (password !== confirmPassword) {
          setError("Les mots de passe ne correspondent pas.");
          return;
        }
        await updatePassword(password);
        setMessage("Votre mot de passe a été mis à jour avec succès !");
        setTimeout(() => window.location.reload(), 2000);
      } else if (mode === 'login') {
        await signIn(email, password);
      } else if (mode === 'signup') {
        await signUp(email, password, nom);
        setMessage(
          "Compte créé ! Un email de confirmation vous a été envoyé. Vérifiez votre boîte mail."
        );
        setMode('login');
      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage(
          "Un email de réinitialisation vous a été envoyé. Vérifiez votre boîte mail (et vos spams)."
        );
      }
    } catch (err: any) {
      // Traduit les erreurs Supabase en français
      const msg: string = err.message || '';
      if (msg.includes('Invalid login credentials')) {
        setError("Email ou mot de passe incorrect.");
      } else if (msg.includes('User already registered')) {
        setError("Un compte existe déjà avec cet email.");
      } else if (msg.includes('Password should be at least')) {
        setError("Le mot de passe doit contenir au moins 8 caractères.");
      } else if (msg.includes('Unable to validate email address')) {
        setError("Adresse email invalide.");
      } else {
        setError(msg || "Une erreur est survenue. Réessayez.");
      }
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode);
    setError(null);
    setMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  const titles = {
    login: 'Connexion',
    signup: 'Créer un compte',
    reset: 'Mot de passe oublié',
  };

  // ─── Mode récupération de mot de passe (depuis l'email) ───────────────────
  if (isRecoveringPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">
            Nouveau mot de passe
          </h2>
          <p className="text-center text-sm text-gray-500 mb-6">
            Choisissez un mot de passe sécurisé
          </p>
        </div>

        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10">
          {message && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg mb-4 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 shrink-0" />
              {message}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordField
              label="Nouveau mot de passe"
              value={password}
              onChange={setPassword}
              show={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
              showStrength
            />
            <PasswordField
              label="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={setConfirmPassword}
              show={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              matchValue={password}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ─── Page principale ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </button>
        )}
        <h2 className="text-center text-3xl font-extrabold text-gray-900">
          {titles[mode]}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          {mode === 'login' && (
            <>
              Pas encore de compte ?{' '}
              <button
                onClick={() => switchMode('signup')}
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                S'inscrire
              </button>
            </>
          )}
          {mode === 'signup' && (
            <>
              Déjà un compte ?{' '}
              <button
                onClick={() => switchMode('login')}
                className="font-medium text-emerald-600 hover:text-emerald-500"
              >
                Se connecter
              </button>
            </>
          )}
          {mode === 'reset' && 'Entrez votre email pour recevoir un lien de réinitialisation'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10">
          {message && (
            <div className="p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg mb-5 flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{message}</span>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg mb-5 text-sm">
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* NOM — inscription uniquement */}
            {mode === 'signup' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <div className="relative rounded-lg shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    required
                    value={nom}
                    onChange={(e) => setNom(e.target.value)}
                    className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>
            )}

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adresse email
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
                  placeholder="vous@exemple.com"
                />
              </div>
            </div>

            {/* MOT DE PASSE */}
            {mode !== 'reset' && (
              <PasswordField
                label="Mot de passe"
                value={password}
                onChange={setPassword}
                show={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
                showStrength={mode === 'signup'}
              />
            )}

            {/* CONFIRMATION MOT DE PASSE — inscription uniquement */}
            {mode === 'signup' && (
              <PasswordField
                label="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={setConfirmPassword}
                show={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
                matchValue={password}
              />
            )}

            {/* Lien mot de passe oublié */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => switchMode('reset')}
                  className="text-sm text-emerald-600 hover:text-emerald-500 font-medium"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
            >
              {loading
                ? 'Chargement...'
                : mode === 'login'
                ? 'Se connecter'
                : mode === 'signup'
                ? 'Créer mon compte'
                : 'Envoyer le lien'}
            </button>

            {mode === 'reset' && (
              <button
                type="button"
                onClick={() => switchMode('login')}
                className="w-full flex justify-center items-center gap-1 py-2 text-sm text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour à la connexion
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Composant champ mot de passe réutilisable ─────────────────────────────

interface PasswordFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggle: () => void;
  showStrength?: boolean;
  matchValue?: string; // pour afficher si les mots de passe correspondent
}

function PasswordField({
  label, value, onChange, show, onToggle, showStrength, matchValue,
}: PasswordFieldProps) {
  const strength = getPasswordStrength(value);
  const matches = matchValue !== undefined ? value === matchValue && value !== '' : null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative rounded-lg shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type={show ? 'text' : 'password'}
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
          placeholder="••••••••"
          minLength={8}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          tabIndex={-1}
        >
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {/* Barre de force du mot de passe */}
      {showStrength && value.length > 0 && (
        <div className="mt-2">
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4].map((level) => (
              <div
                key={level}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  strength >= level ? strengthColors[strength] : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className={`text-xs ${strength <= 1 ? 'text-red-500' : strength <= 2 ? 'text-orange-500' : strength <= 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>
            {strength > 0 && `Force : ${strengthLabels[strength]}`}
            {strength < 3 && ' — Ajoutez majuscules, chiffres et symboles'}
          </p>
        </div>
      )}

      {/* Indicateur de correspondance */}
      {matchValue !== undefined && value.length > 0 && (
        <p className={`text-xs mt-1 ${matches ? 'text-emerald-600' : 'text-red-500'}`}>
          {matches ? '✓ Les mots de passe correspondent' : '✗ Les mots de passe ne correspondent pas'}
        </p>
      )}
    </div>
  );
}