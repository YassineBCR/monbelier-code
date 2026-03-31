// src/contexts/AuthContext.tsx
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'livreur' | 'client' | 'abattoir' | 'mosquee_admin';
  nom: string | null;
  telephone: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nom: string) => Promise<{ needsConfirmation: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  isRecoveringPassword: boolean;
  isAdmin: boolean;
  isLivreur: boolean;
  isClient: boolean;
}

export function getRedirectPath(role: string): string {
  const map: Record<string, string> = {
    admin:         '/admin/global',
    abattoir:      '/abattoir',
    livreur:       '/livreur',
    mosquee_admin: '/mosquee',
    client:        '/reservation',
  };
  return map[role] || '/';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]                         = useState<User | null>(null);
  const [profile, setProfile]                   = useState<Profile | null>(null);
  const [loading, setLoading]                   = useState(true);
  const [isRecoveringPassword, setIsRecovering] = useState(false);

  useEffect(() => {
    // Vérifie si l'URL contient un token de recovery (#type=recovery)
    if (window.location.hash.includes('type=recovery')) {
      setIsRecovering(true);
    }

    // Session initiale (supabase lit le token dans l'URL grâce à detectSessionFromUrl)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    // Écoute tous les changements d'état auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
        setUser(session?.user ?? null);
        setLoading(false);
        return; // Pas de redirection, on attend que l'utilisateur change son mdp
      }
      if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
        setIsRecovering(false);
        setLoading(false);
        return;
      }
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else { setProfile(null); setLoading(false); }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles').select('*').eq('id', userId).maybeSingle();
      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error('Erreur chargement profil:', err);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, nom: string): Promise<{ needsConfirmation: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { data: { nom }, emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return { needsConfirmation: !data.session };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setIsRecovering(false);
    window.history.replaceState(null, '', window.location.pathname);
  };

  return (
    <AuthContext.Provider value={{
      user, profile, loading, signIn, signUp, signOut,
      resetPassword, updatePassword, isRecoveringPassword,
      isAdmin:   profile?.role === 'admin',
      isLivreur: profile?.role === 'livreur',
      isClient:  profile?.role === 'client',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans un AuthProvider');
  return ctx;
}
