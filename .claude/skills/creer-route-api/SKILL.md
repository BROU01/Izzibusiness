---
name: creer-route-api
description: Créer une route API dans src/app/api/**/route.ts en suivant le schéma canonique du projet (auth, validation zod, codes d'erreur, réponses typées). Utiliser à chaque nouvelle route ou endpoint métier.
---

# Créer une route API

## Schéma canonique

Référence de référence : `src/app/api/wallet/deposit/route.ts`.
Structure à respecter à l'identique :

```ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({ /* champs stricts, pas de z.any() */ });

export async function POST(request: Request) {
  // 1. Auth obligatoire — jamais d'endpoint sensible anonyme
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // 2. Validation de l'entrée — toujours parser avant d'utiliser
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  // 3. Logique métier — règles métier dans src/lib/config.ts, jamais en dur
  // 4. Réponse typée, jamais de données sensibles (service role, clés, PII)
  return NextResponse.json({ ok: true, /* data */ }, { status: 200 });
}
```

## Règles non-négociables

1. **Auth avant toute écriture** : `getUser()` systématique ; 401 sinon.
2. **Validation zod** : `safeParse`, pas de `as` sur `request.json()`.
3. **Pas de service role route** : `SUPABASE_SERVICE_ROLE_KEY` uniquement pour les tâches admin vérifiées (voir la liste dans `CLAUDE.md`).
4. **Réponses** : `{ error: string }` avec code en snake_case + status HTTP cohérent (401, 403, 404, 409, 422).
5. **Logique métier** : constantes (ADHESION_FEE, MIN_WITHDRAWAL…) dans `src/lib/config.ts`.
6. **GET en lecture seule** ; toute mutation en POST/PATCH/DELETE.

## Après création

- Exécuter `npm run lint` et `npm run typecheck`.
- Vérifier la route dans un appel réel (pas seulement TypeScript).
