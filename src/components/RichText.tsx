import type { ReactNode } from 'react';

/**
 * Converte a marcação leve do conteúdo em spans:
 *   **texto** -> destaque na cor do accent do bloco
 *   `texto`   -> fonte monoespaçada
 */
export function RichText({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|`(.+?)`/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1] !== undefined) {
      parts.push(
        <span key={key++} className="highlight">
          {match[1]}
        </span>,
      );
    } else {
      parts.push(
        <code key={key++} className="mono">
          {match[2]}
        </code>,
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return <>{parts}</>;
}
