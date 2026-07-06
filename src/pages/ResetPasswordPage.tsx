import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ResetPasswordPage() {
  const { user, loading, updatePassword, clearRecovery } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError('As senhas não conferem.');
      return;
    }
    setBusy(true);
    const err = await updatePassword(password);
    setBusy(false);
    if (err) {
      setError(err);
    } else {
      setDone(true);
    }
  }

  if (loading) {
    return (
      <div className="container">
        <p className="empty-state">Carregando…</p>
      </div>
    );
  }

  // sem sessão de recuperação: link expirado, já usado ou acesso direto
  if (!user) {
    return (
      <div className="container auth-page">
        <header className="home-header">
          <div className="label">Recuperar senha</div>
          <h1>
            Link <span className="accent">inválido</span>
          </h1>
          <p className="subtitle">
            Este link de recuperação expirou ou já foi usado. Peça um novo na
            tela de login.
          </p>
        </header>
        <div className="auth-card">
          <Link className="button-primary" to="/entrar">
            Ir para o login
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container auth-page">
        <header className="home-header">
          <div className="label">Recuperar senha</div>
          <h1>
            Senha <span className="accent">atualizada</span> ✓
          </h1>
          <p className="subtitle">
            Pronto! Você já está logado com a nova senha.
          </p>
        </header>
        <div className="auth-card">
          <button
            type="button"
            className="button-primary"
            onClick={() => {
              clearRecovery();
              navigate('/', { replace: true });
            }}
          >
            Começar a estudar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container auth-page">
      <header className="home-header">
        <div className="label">Recuperar senha · {user.email}</div>
        <h1>
          Nova <span className="accent">senha</span>
        </h1>
        <p className="subtitle">Escolha a nova senha da sua conta.</p>
      </header>

      <form className="auth-card" onSubmit={handleSubmit}>
        <label className="auth-field">
          Nova senha
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="mínimo 6 caracteres"
            autoFocus
          />
        </label>
        <label className="auth-field">
          Confirmar nova senha
          <input
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="repita a senha"
          />
        </label>

        {error && <p className="auth-error">{error}</p>}

        <button className="button-primary" type="submit" disabled={busy}>
          {busy ? 'Salvando…' : 'Salvar nova senha'}
        </button>
      </form>
    </div>
  );
}
