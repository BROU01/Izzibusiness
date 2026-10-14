/** Libellés affichés pour les statuts stockés en base. */
export const GAME_LABELS: Record<string, string> = {
  spin: 'Spin & Win',
  apple: 'Apple Fortunes',
  aviator: 'Aviator',
};

export const ROUND_STATUS: Record<string, string> = {
  active: 'En cours',
  won: 'Gagnée',
  lost: 'Perdue',
};

export const WITHDRAWAL_STATUS: Record<string, string> = {
  requested: 'À valider',
  processing: 'Envoi en cours',
  paid: 'Payé',
  rejected: 'Refusé (remboursé)',
  failed: 'Échec (remboursé)',
};

export const PAYMENT_STATUS: Record<string, string> = {
  pending: 'En attente',
  completed: 'Confirmé',
  failed: 'Échoué',
  cancelled: 'Annulé',
};

export const PAYMENT_KIND: Record<string, string> = {
  deposit: 'Dépôt',
  membership: 'Adhésion',
};

export const MISSION_STATUS: Record<string, string> = {
  draft: 'Brouillon',
  open: 'Publiée',
  closed: 'Clôturée',
};

export const SUBMISSION_STATUS: Record<string, string> = {
  pending: 'À vérifier',
  approved: 'Validée',
  rejected: 'Refusée',
};

export const MESSAGE_STATUS: Record<string, string> = {
  new: 'Nouveau',
  in_progress: 'En cours',
  resolved: 'Résolu',
};

export const REGISTRATION_STATUS: Record<string, string> = {
  new: 'Nouvelle',
  contacted: 'Contacté',
  enrolled: 'Inscrit',
  cancelled: 'Annulée',
};
