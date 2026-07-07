import { Link } from 'react-router-dom';
import { LoginCta } from '../components/LoginCta';
import { TodayPanel } from '../components/TodayPanel';
import { useAuth } from '../contexts/AuthContext';

const SECTIONS = [
  {
    to: '/trilha',
    accent: 'green',
    icon: '🧭',
    title: 'Trilha',
    text: 'Estude na ordem certa, do básico ao avançado, acompanhando seu progresso',
  },
  {
    to: '/topicos',
    accent: 'blue',
    icon: '📚',
    title: 'Tópicos',
    text: 'Resumos de gramática direto ao ponto, com exemplos e dicas',
  },
  {
    to: '/exercicios',
    accent: 'orange',
    icon: '✏️',
    title: 'Exercícios',
    text: 'Monte seu treino: escolha os tópicos, o modo e pratique',
  },
  {
    to: '/flashcards',
    accent: 'purple',
    icon: '🃏',
    title: 'Flashcards',
    text: 'Memorize verbos, expressões e vocabulário — ou crie os seus',
  },
  {
    to: '/dicionario',
    accent: 'teal',
    icon: '📖',
    title: 'Dicionário · IA',
    text: 'Inglês ↔ Português com IA: contexto, exemplos e colocações',
  },
  {
    to: '/videos',
    accent: 'pink',
    icon: '▶️',
    title: 'Vídeos',
    text: 'Canais selecionados do YouTube para treinar o ouvido',
  },
  {
    to: '/estatisticas',
    accent: 'green',
    icon: '📊',
    title: 'Estatísticas',
    text: 'Seus acertos e erros, no geral e por tópico',
  },
] as const;

export function HomePage() {
  const { user } = useAuth();

  return (
    <div className="container">
      <header className="home-header">
        <div className="label">Inglês · Estudo</div>
        <h1>
          O que vamos <span className="accent">estudar</span> hoje?
        </h1>
        <p className="subtitle">
          Material de apoio para quem faz curso de inglês — rápido e sem
          enrolação
        </p>
      </header>

      <LoginCta />
      {user && (
        <p className="hub-welcome">
          👋 Olá! Seu progresso está sendo salvo na sua conta.
        </p>
      )}

      <TodayPanel />

      <div className="hub-grid">
        {SECTIONS.map((s) => (
          <Link key={s.to} to={s.to} className={`hub-card accent-${s.accent}`}>
            <span className="hub-icon">{s.icon}</span>
            <h2>{s.title}</h2>
            <p>{s.text}</p>
          </Link>
        ))}
      </div>

      <footer>Resumos de Inglês · Material de apoio aos estudos</footer>
    </div>
  );
}
