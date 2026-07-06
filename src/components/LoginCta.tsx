import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Banner que convida usuários anônimos a criar conta para salvar progresso.
 * Some automaticamente quando o usuário está logado.
 */
export function LoginCta() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading || user) return null;

  return (
    <Link to="/entrar" state={{ from: location.pathname }} className="login-cta">
      <span className="login-cta-icon">📊</span>
      <span>
        <strong>Entre ou crie uma conta</strong> para salvar seus acertos e
        acompanhar sua evolução por tópico — é opcional e leva 10 segundos.
      </span>
      <span className="login-cta-arrow">→</span>
    </Link>
  );
}
