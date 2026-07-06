import type { MistakesBlock } from '../../domain/types';
import { RichText } from '../RichText';

export function MistakesBlockView({ block }: { block: MistakesBlock }) {
  return (
    <section className="common-mistakes">
      <h3>⚠️ {block.title ?? 'Erros Comuns — Fique Atento'}</h3>
      {block.items.map((item, i) => (
        <div className="mistake-pair" key={i}>
          <div className="mistake">
            <div className="mistake-label w">✗</div>
            <div className="wrong">
              <RichText text={item.wrong} />
              {item.note && <em> ({item.note})</em>}
            </div>
          </div>
          <div className="mistake">
            <div className="mistake-label r">✓</div>
            <div className="right">
              <RichText text={item.right} />
            </div>
          </div>
        </div>
      ))}
    </section>
  );
}
