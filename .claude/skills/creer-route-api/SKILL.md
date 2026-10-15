---
name: creer-route-api
description: Créer une route API dans src/app/api/**/route.ts en suivant le schéma canonique du projet (auth, validation zod, codes d'erreur, réponses typées). Utiliser à chaque nouvelle route ou endpoint métier.
---

# Créer une route API

## Schéma canonique

Référence de référence : `src/app/api/wallet/deposit/route.ts`.
Structure à respecter à l'identique :

```ts
import { z } from 'zod';
import { ERROR_CODES } from '@/lib/error-codes';
import { apiData, apiError, internalError, readJson, requireProfile } from '@/lib/api-response';
import { query } from '@/lib/db';

const schema = z.object({ /* champs stricts, pas de z.any() */ });

export async function POST(request: Request) {
  try {
    // 1. Session obligatoire (Better Auth) ; 401 / 403 renvoyés tout faits
    const auth = await requireProfile();
    if (auth.response) return auth.response;

    // 2. Validation de l'entrée avant tout usage
    const parsed = schema.safeParse(await readJson(request));
    if (!parsed.success) {
      return apiError(ERROR_CODES.INVALID_PAYLOAD, 'Données invalides.', 400);
    }

    // 3. Logique métier : SQL paramétré, toujours filtré par l'utilisateur de la session
    const rows = await query<{ id: string }>('select id from payments where user_id = $1', [
      auth.user.id,
    ]);

    // 4. Réponse { data }, jamais de données sensibles
    return apiData({ count: rows.length });
  } catch (error) {
    return internalError('scope/route', error);
  }
}
```

## Règles non-négociables

1. **Auth avant toute écriture** : `requireUser()` / `requireProfile()` / `requireAdmin()` ; 401 sinon.
2. **Validation zod** : `safeParse`, pas de `as` sur `request.json()`.
3. **Pas de RLS** : chaque requête filtre explicitement par `auth.user.id` (ou passe par `requireAdmin()`).
4. **Réponses** : `{ data }` ou `{ error: { code, message } }` (codes de `src/lib/error-codes.ts`) + status HTTP cohérent (400, 401, 403, 404, 409).
5. **Logique métier** : constantes (ADHESION_FEE, MIN_WITHDRAWAL…) dans `src/lib/config.ts`.
6. **GET en lecture seule** ; toute mutation en POST/PATCH/DELETE.

## Après création

- Exécuter `npm run lint` et `npm run typecheck`.
- Vérifier la route dans un appel réel (pas seulement TypeScript).
