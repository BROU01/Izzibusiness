import PageHeader from '@/components/ui/PageHeader';
import BroadcastForm from './BroadcastForm';

export default function AdminNotificationsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Administration"
        title="Annonces"
        description="Le message apparaît dans les notifications de chaque membre concerné."
      />
      <BroadcastForm />
    </div>
  );
}
