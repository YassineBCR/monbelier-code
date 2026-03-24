import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
  id: string;
  email: string;
  role: 'admin' | 'livreur' | 'client';
  nom: string | null;
  telephone: string | null;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, nom: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>; // <-- NOUVELLE FONCTION
  isRecoveringPassword: boolean; // <-- NOUVEL ÉTAT
  isAdmin: boolean;
  isLivreur: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false); // État pour la récupération

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) loadProfile(session.user.id);
      else setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // DÉTECTION DU CLIC SUR LE LIEN "MOT DE PASSE OUBLIÉ"
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecoveringPassword(true);
      }

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
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, nom: string) => {
    const { data, error } = await supabase.auth.signUp({
      email, password, options: { data: { nom, role: 'client' } }
    });
    if (error) throw error;
    
    if (data.user) {
      await supabase.from('profiles').insert([
        { id: data.user.id, email, nom, role: 'client' }
      ]);
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

  // --- NOUVELLE FONCTION POUR SAUVEGARDER LE NOUVEAU MOT DE PASSE ---
  const updatePassword = async (password: string) => {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
    setIsRecoveringPassword(false); // On sort du mode récupération
  };

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    isRecoveringPassword,
    // On ajoute .trim() et .toLowerCase() pour éviter les bugs liés aux espaces/majuscules
    isAdmin: profile?.role?.trim().toLowerCase() === 'admin',
    isLivreur: profile?.role?.trim().toLowerCase() === 'livreur',
    isClient: profile?.role?.trim().toLowerCase() === 'client',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}