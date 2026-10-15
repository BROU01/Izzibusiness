import Link from 'next/link';

interface EmptyStateProps {
  title: string;
  description: string;
  action?: { href: string; label: string };
}

/**
 * État vide honnête : explique pourquoi il n'y a rien et ce que
 * l'utilisateur peut faire. Remplace les listes de données inventées.
 */
export default function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="border-3 border-dashed border-ink bg-paper px-6 py-10 text-center">
      <h2 className="text-xl">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-ink-70">{description}</p>
      {action && (
        <Link href={action.href} className="btn btn-primary mt-6">
          {action.label}
        </Link>
      )}
    </div>
  );
}
