import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "../services/supabase";
import { UserProfile } from "../types";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  isAuthorized: boolean;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  // O loading começa como true para não piscar a tela de login antes de verificar a sessão
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const isLocalPreview = import.meta.env.DEV && import.meta.env.VITE_ADMIN_PREVIEW === 'true';
    if (isLocalPreview) {
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Busca a sessão inicial ao carregar a página
    const loadProfile = async (currentUser: User | null) => {
      if (!currentUser) {
        setProfile(null);
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUser.id)
        .eq('active', true)
        .maybeSingle();
      setProfile(data as UserProfile | null);
    };

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      await loadProfile(session?.user ?? null);
      setLoading(false);
    });

    // Escuta mudanças de estado (ex: usuário fez login, logout, ou o token expirou)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      // Consultas ao próprio Supabase não devem ser aguardadas dentro do
      // callback de autenticação, pois podem disputar o lock da sessão OAuth.
      window.setTimeout(() => {
        void loadProfile(session?.user ?? null).finally(() => setLoading(false));
      }, 0);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error("Supabase não configurado. Adicione VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.");
    }

    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/admin`,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
  };

  const isAuthorized = Boolean(profile && (profile.role === 'ADMIN' || profile.role === 'PROFESSIONAL'));

  return (
    <AuthContext.Provider
      value={{ session, user, profile, isAuthorized, loading, signInWithGoogle, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// Hook customizado para facilitar o uso nos componentes
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
};
