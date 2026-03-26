import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'livreur' | 'client' | 'abattoir' | 'mosquee_admin';
  nom: string | null;
  telephone: string | null;
  mosquee_id: string | null; // Pour les mosquee_admin
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nom: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
  isRecoveringPassword: boolean;
  isAdmin: boolean;
  isLivreur: boolean;
  isClient: boolean;
  isAbattoir: boolean;
  isMosqueeAdmin: boolean;
  // Redirection automatique selon le rôle
  getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') setIsRecoveringPassword(true);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadProfile(session.user.id);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      if (error.message.includes('Invalid login credentials'))
        throw new Error('Email ou mot de passe incorrect.');
      if (error.message.includes('Email not confirmed'))
        throw new Error('Veuillez confirmer votre email avant de vous connecter.');
      throw new Error(error.message);
    }
  };

  const signUp = async (email: string, password: string, nom: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nom } },
    });
    if (error) {
      if (error.message.includes('User already registered'))
        throw new Error('Un compte existe déjà avec cet email.');
      throw new Error(error.message);
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw error;
  };

  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setIsRecoveringPassword(false);
  };

  const getDashboardPath = (): string => {
    if (!profile) return '/';
    const paths: Record<string, string> = {
      admin: '/admin/global',
      abattoir: '/abattoir',
      livreur: '/livreur',
      mosquee_admin: '/mosquee',
      client: '/',
    };
    return paths[profile.role] || '/';
  };

  const role = profile?.role?.trim().toLowerCase();

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isRecoveringPassword,
    isAdmin: role === 'admin',
    isLivreur: role === 'livreur',
    isClient: role === 'client',
    isAbattoir: role === 'abattoir',
    isMosqueeAdmin: role === 'mosquee_admin',
    getDashboardPath,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}