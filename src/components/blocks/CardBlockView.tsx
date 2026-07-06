import type { CardBlock } from '../../domain/types';
import { RichText } from '../RichText';

export function CardBlockView({ block }: { block: CardBlock }) {
  return (
    <section className={`card accent-${block.accent}`}>
      <div className="card-header">
        <div className="badge">{block.badge}</div>
        <div className="card-title">
          <h2>{block.title}</h2>
          {block.subtitle && <p>{block.subtitle}</p>}
        </div>
      </div>

      {block.formula && block.formula.length > 0 && (
        <div className="formula-box">
          {block.formula.map((row, i) => (
            <div className="row" key={i}>
              {row.label && <span className="key">{row.label}</span>}
              <RichText text={row.value} />
            </div>
          ))}
        </div>
      )}

      {block.examples && block.examples.length > 0 && (
        <>
          <div className="examples-title">Exemplos</div>
          {block.examples.map((ex, i) => (
            <div className="example" key={i}>
              <div className="example-en">
                <RichText text={ex.en} />
              </div>
              <div className="example-pt">{ex.pt}</div>
            </div>
          ))}
        </>
      )}

      {block.keyPoints && block.keyPoints.length > 0 && (
        <div className="key-points">
          {block.keyPoints.map((point, i) => (
            <div className="pill" key={i}>
              <span>✓</span> {point}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
