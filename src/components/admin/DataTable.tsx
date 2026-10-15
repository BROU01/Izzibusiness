import type { ReactNode } from 'react';

/** Tableau admin : défile horizontalement sur mobile, en-têtes mono. */
export default function DataTable({
  headers,
  children,
  minWidth = '48rem',
}: {
  headers: { label: string; align?: 'right' }[];
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="overflow-x-auto border-3 border-ink bg-paper">
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        <thead className="bg-paper-2 font-mono text-xs uppercase tracking-wider">
          <tr>
            {headers.map((h) => (
              <th key={h.label} className={`px-4 py-3 ${h.align === 'right' ? 'text-right' : ''}`}>
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="[&>tr]:border-t-2 [&>tr]:border-ink [&_td]:px-4 [&_td]:py-3 [&_td]:align-top">
          {children}
        </tbody>
      </table>
    </div>
  );
}

export function formatDate(iso: string | null | undefined, withTime = true) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', {
    dateStyle: 'short',
    ...(withTime ? { timeStyle: 'short' } : {}),
  });
}

export function LoadError() {
  return (
    <p role="alert" className="mb-6 border-3 border-ink bg-[#ffe1d6] px-4 py-3 font-semibold">
      Certaines données n’ont pas pu être chargées. Recharge la page.
    </p>
  );
}
