import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function AdminProductsPage() {
  return (
    <div>
      <PageHeader eyebrow="Administration" title="Produits" />
      <EmptyState
        title="Pas encore de produits"
        description="La modération des boutiques et des produits arrive avec la marketplace multi-vendeurs."
      />
    </div>
  );
}
