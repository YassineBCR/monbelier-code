import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth, getRedirectPath } from '../contexts/AuthContext';
import { Mail, Lock, User, Eye, EyeOff, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';

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
const strengthColors  = ['', 'bg-red-400', 'bg-orange-400', 'bg-yellow-400', 'bg-emerald-500'];

export function LoginPage() {
  const navigate  = useNavigate();
  const location  = useLocation();
  const { signIn, signUp, resetPassword, isRecoveringPassword, updatePassword, user, profile, loading } = useAuth();

  const [mode, setMode]                       = useState<'login' | 'signup' | 'reset'>('login');
  const [email, setEmail]                     = useState('');
  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nom, setNom]                         = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [showConfirmPwd, setShowConfirmPwd]   = useState(false);
  const [submitting, setSubmitting]           = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [message, setMessage]                 = useState<string | null>(null);

  // ── Redirection automatique si déjà connecté ─────────────────────────────
  useEffect(() => {
    if (!loading && user && profile) {
      // Si on venait d'une page protégée, on y retourne ; sinon dashboard
      const from = (location.state as any)?.from?.pathname;
      const dest = from || getRedirectPath(profile.role);
      navigate(dest, { replace: true });
    }
  }, [user, profile, loading, navigate, location]);

  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas.');
        return;
      }
      if (password.length < 8) {
        setError('Le mot de passe doit contenir au moins 8 caractères.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (isRecoveringPassword) {
        if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas.'); return; }
        await updatePassword(password);
        setMessage('Mot de passe mis à jour ! Redirection…');
        setTimeout(() => navigate('/', { replace: true }), 1500);

      } else if (mode === 'login') {
        await signIn(email, password);
        // La redirection est gérée par le useEffect ci-dessus
        // (onAuthStateChange → setUser/setProfile → useEffect se déclenche)

      } else if (mode === 'signup') {
        const { needsConfirmation } = await signUp(email, password, nom);
        if (needsConfirmation) {
          setMessage('Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse.');
          setMode('login');
        } else {
          // Confirmation désactivée → directement connecté, useEffect redirige
        }

      } else if (mode === 'reset') {
        await resetPassword(email);
        setMessage('Email envoyé ! Vérifiez votre boîte mail (et vos spams).');
      }
    } catch (err: any) {
      const msg: string = err.message || '';
      if (msg.includes('Invalid login credentials'))         setError('Email ou mot de passe incorrect.');
      else if (msg.includes('User already registered'))      setError('Un compte existe déjà avec cet email.');
      else if (msg.includes('Password should be at least'))  setError('Le mot de passe doit contenir au moins 8 caractères.');
      else if (msg.includes('Unable to validate email'))     setError('Adresse email invalide.');
      else if (msg.includes('Email not confirmed'))          setError('Email non confirmé. Vérifiez votre boîte mail.');
      else                                                   setError(msg || 'Une erreur est survenue. Réessayez.');
    } finally {
      setSubmitting(false);
    }
  };

  const switchMode = (newMode: 'login' | 'signup' | 'reset') => {
    setMode(newMode);
    setError(null);
    setMessage(null);
    setPassword('');
    setConfirmPassword('');
  };

  // ── Loader pendant vérification session ──────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  // ── Mode reset password depuis email ─────────────────────────────────────
  if (isRecoveringPassword) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 mb-2">Nouveau mot de passe</h2>
          <p className="text-center text-sm text-gray-500 mb-6">Choisissez un mot de passe sécurisé</p>
        </div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10">
          {message && <AlertBox type="success" text={message} />}
          {error   && <AlertBox type="error"   text={error}   />}
          <form onSubmit={handleSubmit} className="space-y-5">
            <PasswordField label="Nouveau mot de passe"    value={password}        onChange={setPassword}        show={showPassword}    onToggle={() => setShowPassword(!showPassword)}       showStrength />
            <PasswordField label="Confirmer le mot de passe" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPwd} onToggle={() => setShowConfirmPwd(!showConfirmPwd)} matchValue={password} />
            <SubmitButton loading={submitting} label="Mettre à jour le mot de passe" />
          </form>
        </div>
      </div>
    );
  }

  // ── Page principale login / signup / reset ────────────────────────────────
  const titles = { login: 'Connexion', signup: 'Créer un compte', reset: 'Mot de passe oublié' };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50 to-white flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <button onClick={() => navigate('/')} className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors">
          <ArrowLeft className="h-4 w-4" /> Retour à l'accueil
        </button>
        <h2 className="text-center text-3xl font-extrabold text-gray-900">{titles[mode]}</h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          {mode === 'login' && (
            <>Pas encore de compte ?{' '}
              <button onClick={() => switchMode('signup')} className="font-medium text-emerald-600 hover:text-emerald-500">S'inscrire</button>
            </>
          )}
          {mode === 'signup' && (
            <>Déjà un compte ?{' '}
              <button onClick={() => switchMode('login')} className="font-medium text-emerald-600 hover:text-emerald-500">Se connecter</button>
            </>
          )}
          {mode === 'reset' && 'Entrez votre email pour recevoir un lien de réinitialisation'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-xl sm:px-10">
          {message && <AlertBox type="success" text={message} />}
          {error   && <AlertBox type="error"   text={error}   />}

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Nom — inscription */}
            {mode === 'signup' && (
              <InputField icon={<User className="h-5 w-5 text-gray-400" />} label="Nom complet" type="text" value={nom} onChange={setNom} placeholder="Jean Dupont" required />
            )}

            {/* Email */}
            <InputField icon={<Mail className="h-5 w-5 text-gray-400" />} label="Adresse email" type="email" value={email} onChange={setEmail} placeholder="vous@exemple.com" required />

            {/* Mot de passe */}
            {mode !== 'reset' && (
              <PasswordField label="Mot de passe" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} showStrength={mode === 'signup'} />
            )}

            {/* Confirmation — inscription */}
            {mode === 'signup' && (
              <PasswordField label="Confirmer le mot de passe" value={confirmPassword} onChange={setConfirmPassword} show={showConfirmPwd} onToggle={() => setShowConfirmPwd(!showConfirmPwd)} matchValue={password} />
            )}

            {/* Lien mot de passe oublié */}
            {mode === 'login' && (
              <div className="flex justify-end">
                <button type="button" onClick={() => switchMode('reset')} className="text-sm text-emerald-600 hover:text-emerald-500 font-medium">
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            <SubmitButton loading={submitting} label={
              mode === 'login'  ? 'Se connecter' :
              mode === 'signup' ? 'Créer mon compte' :
              'Envoyer le lien'
            } />

            {mode === 'reset' && (
              <button type="button" onClick={() => switchMode('login')} className="w-full flex justify-center items-center gap-1 py-2 text-sm text-gray-500 hover:text-gray-700">
                <ArrowLeft className="h-4 w-4" /> Retour à la connexion
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Petits composants réutilisables ─────────────────────────────────────────

function AlertBox({ type, text }: { type: 'success' | 'error'; text: string }) {
  return (
    <div className={`p-3 rounded-lg mb-5 flex items-start gap-2 text-sm ${
      type === 'success' ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'
    }`}>
      {type === 'success' && <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />}
      <span>{text}</span>
    </div>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button type="submit" disabled={loading}
      className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-2"
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {loading ? 'Chargement…' : label}
    </button>
  );
}

function InputField({ icon, label, type, value, onChange, placeholder, required }: {
  icon: React.ReactNode; label: string; type: string;
  value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative rounded-lg shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">{icon}</div>
        <input type={type} required={required} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
        />
      </div>
    </div>
  );
}

interface PasswordFieldProps {
  label: string; value: string; onChange: (v: string) => void;
  show: boolean; onToggle: () => void;
  showStrength?: boolean; matchValue?: string;
}

function PasswordField({ label, value, onChange, show, onToggle, showStrength, matchValue }: PasswordFieldProps) {
  const strength = getPasswordStrength(value);
  const matches  = matchValue !== undefined ? value === matchValue && value !== '' : null;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative rounded-lg shadow-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Lock className="h-5 w-5 text-gray-400" />
        </div>
        <input type={show ? 'text' : 'password'} required value={value} onChange={(e) => onChange(e.target.value)}
          className="focus:ring-emerald-500 focus:border-emerald-500 block w-full pl-10 pr-10 sm:text-sm border-gray-300 rounded-lg py-3 border"
          placeholder="••••••••" minLength={8}
        />
        <button type="button" onClick={onToggle} tabIndex={-1}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
          {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="mt-2">
          <div className="flex gap-1 mb-1">
            {[1,2,3,4].map((l) => (
              <div key={l} className={`h-1.5 flex-1 rounded-full transition-colors ${strength >= l ? strengthColors[strength] : 'bg-gray-200'}`} />
            ))}
          </div>
          <p className={`text-xs ${strength <= 1 ? 'text-red-500' : strength <= 2 ? 'text-orange-500' : strength <= 3 ? 'text-yellow-600' : 'text-emerald-600'}`}>
            {strength > 0 && `Force : ${strengthLabels[strength]}`}
            {strength < 3 && ' — Ajoutez majuscules, chiffres et symboles'}
          </p>
        </div>
      )}

      {matchValue !== undefined && value.length > 0 && (
        <p className={`text-xs mt-1 ${matches ? 'text-emerald-600' : 'text-red-500'}`}>
          {matches ? '✓ Les mots de passe correspondent' : '✗ Les mots de passe ne correspondent pas'}
        </p>
      )}
    </div>
  );
}