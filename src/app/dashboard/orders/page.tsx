import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function OrdersPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Mon espace"
        title="Mes commandes"
        description="Tes achats sur le marché et leur suivi de livraison."
      />
      <EmptyState
        title="Aucune commande pour l’instant"
        description="Les achats auprès des boutiques du marché apparaîtront ici, avec leur statut de paiement et de livraison."
        action={{ href: '/market', label: 'Parcourir le marché' }}
      />
    </div>
  );
}
