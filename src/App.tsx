import {
  HashRouter,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';
import { useEffect } from 'react';
import { AppLayout } from './components/layout/AppLayout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DeckStudyPage } from './pages/DeckStudyPage';
import { DictionaryPage } from './pages/DictionaryPage';
import { ExerciseSessionPage } from './pages/ExerciseSessionPage';
import { FlashcardsPage } from './pages/FlashcardsPage';
import { ExercisesResultPage } from './pages/ExercisesResultPage';
import { ExercisesSetupPage } from './pages/ExercisesSetupPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { StatsPage } from './pages/StatsPage';
import { TopicPage } from './pages/TopicPage';
import { TopicsPage } from './pages/TopicsPage';
import { VideosPage } from './pages/VideosPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Quem chega pelo link de recuperação de senha cai direto na tela de redefinir. */
function RecoveryRedirect() {
  const { recoveryMode } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  useEffect(() => {
    if (recoveryMode && pathname !== '/redefinir-senha') {
      navigate('/redefinir-senha', { replace: true });
    }
  }, [recoveryMode, pathname, navigate]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ScrollToTop />
        <RecoveryRedirect />
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/topicos" element={<TopicsPage />} />
            <Route path="/topico/:id" element={<TopicPage />} />
            <Route path="/entrar" element={<LoginPage />} />
            <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
            {/* rota desconhecida (ex.: hash do link de recuperação antes de ser
                processado pelo supabase-js) mostra a home sem mexer na URL */}
            <Route path="*" element={<HomePage />} />
            <Route path="/exercicios" element={<ExercisesSetupPage />} />
            <Route path="/exercicios/sessao" element={<ExerciseSessionPage />} />
            <Route path="/exercicios/resultado" element={<ExercisesResultPage />} />
            <Route path="/flashcards" element={<FlashcardsPage />} />
            <Route path="/flashcards/:deckId" element={<DeckStudyPage />} />
            <Route path="/dicionario" element={<DictionaryPage />} />
            <Route path="/videos" element={<VideosPage />} />
            <Route path="/estatisticas" element={<StatsPage />} />
          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}
