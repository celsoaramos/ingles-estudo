import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const NAV_LINKS = [
  { to: '/topicos', label: 'Tópicos' },
  { to: '/exercicios', label: 'Exercícios' },
  { to: '/flashcards', label: 'Flashcards' },
  { to: '/dicionario', label: 'Dicionário' },
  { to: '/videos', label: 'Vídeos' },
  { to: '/estatisticas', label: 'Estatísticas' },
];

const TAB_LINKS = [
  { to: '/', label: 'Início', icon: '🏠', exact: true },
  { to: '/topicos', label: 'Tópicos', icon: '📚' },
  { to: '/exercicios', label: 'Exercícios', icon: '✏️' },
  { to: '/flashcards', label: 'Cards', icon: '🃏' },
  { to: '/dicionario', label: 'Dicionário', icon: '📖' },
];

export function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="app-shell">
      <header className="top-bar">
        <Link to="/" className="brand">
          Resumos de <span className="accent">Inglês</span>
        </Link>
        <nav className="top-nav">
          {NAV_LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) => (isActive ? 'active' : '')}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/entrar"
          state={{ from: location.pathname }}
          className={`auth-button ${user ? 'logged' : ''}`}
          title={user ? user.email ?? 'Sua conta' : 'Entrar ou criar conta'}
        >
          {user ? (user.email?.[0] ?? '•').toUpperCase() : 'Entrar'}
        </Link>
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="tab-bar">
        {TAB_LINKS.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.exact}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <span className="tab-icon">{l.icon}</span>
            {l.label}
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
