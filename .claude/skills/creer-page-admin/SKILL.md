---
name: creer-page-admin
description: Créer une page sous src/app/admin/** en respectant le pattern d'auth admin, la structure de layout et les composants existants du design system Izzibusiness. Utiliser pour tout écran d'administration.
---

# Créer une page admin

## Références à lire avant d'écrire

- `src/app/admin/layout.tsx` — la garde admin est DANS le layout : toute page ajoutée sous `src/app/admin/` est protégée automatiquement. Ne pas dupliquer la vérification dans la page.
- `src/app/admin/users/page.tsx` — exemple canonique (chargement, tableau, actions).
- `src/app/admin/migrations/page.tsx` — exemple d'affichage de données Supabase.
- `DESIGN.md` — design system Izzibusiness (couleurs, composants, spacing).

## Structure d'une page

```tsx
// src/app/admin/<feature>/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function Admin<Feature>Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Chargement des données — états loading/empty/error gérés côté client
  // si la page est interactive (spinner → liste → message vide → erreur)
  return (/* contenu */);
}
```

## Règles non-négociables

1. **Layout first** : ne pas re-vérifier l'admin dans chaque page, le layout le fait.
2. **Composants existants avant nouveaux** : réutiliser `src/components/` (Spinner, boutons du design system) plutôt que de réinventer.
3. **États obligatoires** : chargement, vide, erreur — même pour un simple tableau.
4. **Responsive** : vérifier mobile (les admins consultent aussi depuis un téléphone).
5. **Pas de données sensibles en clair** (clés, service role, PII complète).
6. **Sortie** : tout écran admin a un lien de retour ou de navigation.

## Après création

- `npm run lint` + `npm run typecheck` + `npm run build`.
- Vérifier à la fois l'état connecté admin ET l'état non-connecté (redirection).
