import { FilterBar } from '../components/FilterBar';
import { TopicListItem } from '../components/TopicListItem';
import { useTopicFilter } from '../hooks/useTopicFilter';
import { useTopics } from '../hooks/useTopics';

export function TopicsPage() {
  const { topics, loading } = useTopics();
  const { search, setSearch, category, setCategory, filtered } =
    useTopicFilter(topics);

  return (
    <div className="container">
      <header className="home-header">
        <div className="label">Teoria · Resumos</div>
        <h1>
          Resumos de <span className="accent">Inglês</span>
        </h1>
        <p className="subtitle">
          Leitura rápida, direto ao ponto — escolha o que quer estudar
        </p>
      </header>

      <FilterBar
        search={search}
        onSearchChange={setSearch}
        category={category}
        onCategoryChange={setCategory}
      />

      {loading ? (
        <p className="empty-state">Carregando…</p>
      ) : filtered.length === 0 ? (
        <p className="empty-state">
          Nenhum assunto encontrado. Tente outra busca ou categoria.
        </p>
      ) : (
        <div className="topic-list">
          {filtered.map((t) => (
            <TopicListItem key={t.id} topic={t} />
          ))}
        </div>
      )}
    </div>
  );
}
