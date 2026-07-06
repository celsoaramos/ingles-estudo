import type { TableBlock } from '../../domain/types';
import { RichText } from '../RichText';

export function TableBlockView({ block }: { block: TableBlock }) {
  return (
    <section className="table-card">
      <div className="table-header">📊 {block.title}</div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              {block.headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j}>
                    <RichText text={cell} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
