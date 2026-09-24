---
description: Règles de design et d'UX de l'interface Izzibusiness
globs:
  - 'src/app/**/page.tsx'
  - 'src/components/**'
alwaysApply: false
---

# Design et UX

1. Hiérarchie visible : un seul `h1` par page, titres hiérarchisés sans saut de niveau.
2. Une action principale identifiable par écran (CTA unique mis en avant).
3. Aucun dégradé violet générique, aucune carte arrondie décorative sans fonction,
   aucune icône sans rôle.
4. Contraste WCAG AA sur tout le texte et les états focus.
5. Chaque bouton a un libellé décrivant l'action réelle (« Déposer 5 000 FCFA »,
   pas « Valider »).
6. Toute image a un `alt` pertinent ; les images décoratives sont `alt=""`.
7. États obligatoires : chargement, vide, erreur, succès — pour toute liste,
   formulaire ou appel API.
8. Responsive vérifié à 320 px, 768 px, 1280 px ; pas d'overflow horizontal.
9. Navigation clavier : focus visible, ordre logique, pièges de focus évités
   dans les modales (cf. `src/components/PaymentModal.tsx`).
10. Réutiliser les composants existants de `src/components/` avant d'en créer.
