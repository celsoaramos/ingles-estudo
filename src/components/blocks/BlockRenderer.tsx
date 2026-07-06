import type { Block } from '../../domain/types';
import { CardBlockView } from './CardBlockView';
import { MistakesBlockView } from './MistakesBlockView';
import { TableBlockView } from './TableBlockView';
import { TipBlockView } from './TipBlockView';

export function BlockRenderer({ block }: { block: Block }) {
  switch (block.type) {
    case 'card':
      return <CardBlockView block={block} />;
    case 'table':
      return <TableBlockView block={block} />;
    case 'mistakes':
      return <MistakesBlockView block={block} />;
    case 'tip':
      return <TipBlockView block={block} />;
  }
}
