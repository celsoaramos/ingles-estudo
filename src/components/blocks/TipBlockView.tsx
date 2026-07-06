import type { TipBlock } from '../../domain/types';
import { RichText } from '../RichText';

export function TipBlockView({ block }: { block: TipBlock }) {
  return (
    <section className="tip">
      <div className="tip-icon">💡</div>
      <div>
        <strong>Dica: </strong>
        <RichText text={block.text} />
      </div>
    </section>
  );
}
