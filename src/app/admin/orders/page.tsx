import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminOrdersPage() {
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Commandes" />
      <EmptyState
        title="Pas encore de commandes"
        description="Le suivi des commandes arrive avec la marketplace multi-vendeurs (boutiques, produits, paiement PayDunya)."
      />
    </div>
  );
}
