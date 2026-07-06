import type { User } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { mergeLocalProgressIntoAccount } from '../services/mergeLocalProgress';

interface AuthContextValue {
  user: User | null;
  /** true enquanto a sessão inicial ainda não foi resolvida */
  loading: boolean;
  signIn(email: string, password: string): Promise<string | null>;
  signUp(email: string, password: string): Promise<string | null>;
  signOut(): Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Traduz os erros mais comuns do Supabase Auth para PT-BR. */
function translateAuthError(message: string): string {
  const map: [RegExp, string][] = [
    [/invalid login credentials/i, 'E-mail ou senha incorretos.'],
    [/user already registered/i, 'Este e-mail já tem conta. Tente entrar.'],
    [/password should be at least/i, 'A senha precisa ter pelo menos 6 caracteres.'],
    [/unable to validate email|invalid email/i, 'E-mail inválido.'],
    [/email not confirmed/i, 'E-mail ainda não confirmado. Verifique sua caixa de entrada.'],
    [/rate limit|too many requests/i, 'Muitas tentativas. Aguarde um pouco e tente de novo.'],
  ];
  for (const [re, pt] of map) if (re.test(message)) return pt;
  return 'Não foi possível completar a ação. Tente novamente.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (event === 'SIGNED_IN' && session?.user) {
        void mergeLocalProgressIntoAccount(session.user.id);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? translateAuthError(error.message) : null;
  }

  async function signUp(email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return translateAuthError(error.message);
    // Sem sessão = projeto está exigindo confirmação de e-mail
    if (!data.session) {
      return 'Conta criada! Confirme seu e-mail antes de entrar (ou peça para desativar a confirmação).';
    }
    return null;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>');
  return ctx;
}
