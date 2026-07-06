import type { CategoryId } from '../domain/types';
import { CATEGORIES } from '../domain/categories';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  category: CategoryId | null;
  onCategoryChange: (value: CategoryId | null) => void;
}

export function FilterBar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <input
        type="search"
        className="search-input"
        placeholder="Buscar assunto… (ex.: perfect, used to)"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        aria-label="Buscar assunto"
      />
      <div className="category-chips">
        <button
          type="button"
          className={`chip ${category === null ? 'active' : ''}`}
          onClick={() => onCategoryChange(null)}
        >
          Todos
        </button>
        {CATEGORIES.map((c) => (
          <button
            type="button"
            key={c.id}
            className={`chip ${category === c.id ? 'active' : ''}`}
            onClick={() => onCategoryChange(category === c.id ? null : c.id)}
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
