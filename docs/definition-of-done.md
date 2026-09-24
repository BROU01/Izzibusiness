# Definition of Done

Une tâche frontend est terminée seulement lorsque le comportement demandé est implémenté, que les chemins d’erreur sont traités, que les routes concernées sont accessibles et que les contrôles disponibles passent.

| Domaine       | Vérification minimale                                                       |
| ------------- | --------------------------------------------------------------------------- |
| Fonctionnel   | Parcours nominal, état vide, chargement, erreur et retour arrière vérifiés. |
| Responsive    | 390 px et 1280 px vérifiés ; aucun débordement horizontal.                  |
| Accessibilité | Titres, labels, alt, focus clavier et contraste vérifiés.                   |
| Qualité       | TypeScript, lint, tests et build exécutés si les scripts existent.          |
| Sécurité      | Aucun secret dans le client ; aucune donnée personnelle de test exposée.    |
| Maintenance   | Composants partagés réutilisés ; duplication et imports inutiles évités.    |
| Livraison     | Résumé des fichiers modifiés, commandes lancées et limites restantes.       |

Si une vérification ne peut pas être exécutée, indique exactement pourquoi au lieu de déclarer la tâche validée.
