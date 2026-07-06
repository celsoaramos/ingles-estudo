import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

type Mode = 'entrar' | 'criar' | 'recuperar';

export function LoginPage() {
  const { user, signIn, signUp, signOut, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState<Mode>('entrar');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const from = (location.state as { from?: string } | null)?.from ?? '/';

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setBusy(true);
    if (mode === 'recuperar') {
      const err = await resetPassword(email.trim());
      setBusy(false);
      if (err) setError(err);
      else
        setInfo(
          'Se este e-mail tiver conta, você receberá um link para redefinir a senha. Confira também a caixa de spam.',
        );
      return;
    }
    const err =
      mode === 'entrar'
        ? await signIn(email.trim(), password)
        : await signUp(email.trim(), password);
    setBusy(false);
    if (err) {
      setError(err);
    } else {
      navigate(from, { replace: true });
    }
  }

  if (user) {
    return (
      <div className="container auth-page">
        <header className="home-header">
          <div className="label">Sua conta</div>
          <h1>
            Você está <span className="accent">logado</span>
          </h1>
          <p className="subtitle">{user.email}</p>
        </header>
        <div className="auth-card">
          <p className="auth-hint">
            Seu progresso nos exercícios e flashcards está sendo salvo na sua
            conta.
          </p>
          <Link className="button-primary" to="/estatisticas">
            Ver minhas estatísticas
          </Link>
          <button className="button-ghost" onClick={() => signOut()}>
            Sair da conta
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container auth-page">
      <header className="home-header">
        <div className="label">Conta opcional</div>
        <h1>
          {mode === 'recuperar' ? (
            <>
              Recuperar <span className="accent">senha</span>
            </>
          ) : (
            <>
              {mode === 'entrar' ? 'Entrar' : 'Criar'}{' '}
              <span className="accent">conta</span>
            </>
          )}
        </h1>
        <p className="subtitle">
          {mode === 'recuperar'
            ? 'Informe seu e-mail e enviaremos um link para você definir uma nova senha.'
            : 'Com uma conta, seus acertos e erros ficam salvos e você acompanha sua evolução por tópico. Sem conta, dá para estudar do mesmo jeito.'}
        </p>
      </header>

      <form className="auth-card" onSubmit={handleSubmit}>
        <div className="auth-tabs">
          <button
            type="button"
            className={mode === 'entrar' ? 'active' : ''}
            onClick={() => setMode('entrar')}
          >
            Entrar
          </button>
          <button
            type="button"
            className={mode === 'criar' ? 'active' : ''}
            onClick={() => setMode('criar')}
          >
            Criar conta
          </button>
        </div>

        <label className="auth-field">
          E-mail
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
          />
        </label>
        {mode !== 'recuperar' && (
          <label className="auth-field">
            Senha
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'entrar' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="mínimo 6 caracteres"
            />
          </label>
        )}

        {error && <p className="auth-error">{error}</p>}
        {info && <p className="auth-info">{info}</p>}

        <button className="button-primary" type="submit" disabled={busy}>
          {busy
            ? 'Aguarde…'
            : mode === 'entrar'
              ? 'Entrar'
              : mode === 'criar'
                ? 'Criar conta'
                : 'Enviar link de recuperação'}
        </button>

        {mode === 'entrar' && (
          <button
            type="button"
            className="auth-forgot"
            onClick={() => {
              setMode('recuperar');
              setError(null);
              setInfo(null);
            }}
          >
            Esqueci minha senha
          </button>
        )}
        {mode === 'recuperar' && (
          <button
            type="button"
            className="auth-forgot"
            onClick={() => {
              setMode('entrar');
              setError(null);
              setInfo(null);
            }}
          >
            ← Voltar para o login
          </button>
        )}

        <Link className="button-ghost" to={from}>
          Continuar sem conta
        </Link>
      </form>
    </div>
  );
}
