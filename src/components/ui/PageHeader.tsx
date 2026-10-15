import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  /** Action principale de la page (un seul bouton mis en avant). */
  action?: ReactNode;
}

/** En-tête de page des espaces membre et admin : un seul h1 par page. */
export default function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b-3 border-ink pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-1 text-[clamp(1.75rem,1.2rem+2vw,2.5rem)]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-ink-70">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
