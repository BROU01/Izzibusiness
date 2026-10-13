import PageHeader from '@/components/ui/PageHeader';
import EmptyState from '@/components/ui/EmptyState';

export default function MissionsPage() {
  return (
    <div>
      <PageHeader
        eyebrow="Mon espace"
        title="Missions"
        description="Des tâches rémunérées, créditées sur ton wallet après vérification."
      />
      <EmptyState
        title="Aucune mission ouverte"
        description="Les missions seront publiées ici avec leur rémunération exacte. Tu recevras une notification à l’ouverture."
        action={{ href: '/dashboard/onboarding/calendar', label: 'Avancer dans le programme' }}
      />
    </div>
  );
}
