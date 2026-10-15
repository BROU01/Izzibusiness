# Base de données Neon : mise en place pas à pas

Izzibusiness stocke tout (comptes, wallets, paiements, jeux, missions…) dans une base
**PostgreSQL hébergée chez Neon**. Les comptes et les sessions sont gérés par
**Better Auth**, une librairie qui écrit dans cette même base. Il n'y a plus de Supabase.

> Les intitulés exacts des menus Neon et Vercel peuvent évoluer. Si un écran ne
> correspond pas, cherche l'équivalent ou consulte la documentation de Neon.

Ce qu'il te faut : Node.js 22 ou plus récent (`node -v`), le projet cloné, et 15 minutes.

---

## 1. Créer la base chez Neon

1. Va sur [neon.tech](https://neon.tech) et crée un compte (offre gratuite).
2. **Create project** :
   - Nom : `izzibusiness` ;
   - Version PostgreSQL : la plus récente proposée ;
   - Région : la plus proche de ton hébergement. Si ton site est sur Vercel en Europe,
     choisis **AWS Europe (Frankfurt)** ; garde la même région partout pour que le site
     reste rapide.
3. Une fois le projet créé, clique sur **Connect**. Active l'option **Connection pooling**
   (la chaîne contient alors `-pooler`) et copie la chaîne qui ressemble à :

   ```
   postgresql://neondb_owner:MOT_DE_PASSE@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
   ```

   C'est ta `DATABASE_URL`. Elle contient un mot de passe : ne la partage jamais, ne la
   mets jamais dans le code, ne la préfixe jamais par `NEXT_PUBLIC_`.

## 2. Remplir `.env.local` (sur ton ordinateur)

À la racine du projet, copie le modèle puis complète-le :

```powershell
Copy-Item .env.example .env.local
```

| Variable              | Valeur                                                                   |
| --------------------- | ------------------------------------------------------------------------ |
| `DATABASE_URL`        | la chaîne copiée à l'étape 1                                             |
| `BETTER_AUTH_SECRET`  | une chaîne aléatoire de 32 caractères ou plus (voir ci-dessous)          |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` en local, l'adresse du site en production        |
| `RESEND_API_KEY`      | clé Resend, pour l'e-mail « mot de passe oublié » (facultatif au départ) |
| `EMAIL_FROM`          | expéditeur d'un domaine vérifié chez Resend                              |
| `PAYDUNYA_*`          | voir [`docs/paydunya.md`](./paydunya.md)                                 |

Générer `BETTER_AUTH_SECRET` (une fois, puis ne plus le changer : le changer
déconnecte tout le monde) :

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

`.env.local` n'est jamais commité (il est dans `.gitignore`).

## 3. Créer les tables

```powershell
npm install
npm run db:migrate
```

Résultat attendu :

```
Appliquée : 001_schema.sql
1 migration(s) appliquée(s).
```

Relancer la commande ne refait rien (« Base déjà à jour ») : chaque fichier de
`db/migrations/` n'est appliqué qu'une fois. Dans Neon, l'onglet **Tables** montre
maintenant `user`, `session`, `profiles`, `wallets`, `transactions`, etc.

## 4. Lancer le site et créer ton compte admin

```powershell
npm run dev
```

1. Ouvre `http://localhost:3000/register` et crée ton compte normalement.
2. Donne-lui le rôle administrateur (remplace `monpseudo`) :

   ```powershell
   npm run admin:promote -- monpseudo
   ```

3. Déconnecte-toi puis reconnecte-toi : le lien **/admin** est accessible.

## 5. Mettre en production sur Vercel

1. Vercel : _Project > Settings > Environment Variables_. Ajoute pour **Production**
   (et **Preview** si tu t'en sers) : `DATABASE_URL`, `BETTER_AUTH_SECRET`,
   `NEXT_PUBLIC_APP_URL` (ex. `https://izzibusiness.com`), `RESEND_API_KEY`,
   `EMAIL_FROM` et les variables `PAYDUNYA_*`.
2. _Settings > Functions > Region_ : choisis la même région que la base Neon
   (ex. Frankfurt `fra1`).
3. Vérifie que la **Production Branch** est `main` (_Settings > Git_), puis redéploie.
4. Les tables de production sont créées depuis ton ordinateur : mets temporairement la
   `DATABASE_URL` de production dans `.env.local`, lance `npm run db:migrate`, puis
   remets ta base de développement. Astuce : crée une **branche Neon** `dev` (onglet
   **Branches**) pour développer sans toucher aux vraies données ; elle a sa propre
   chaîne de connexion.

> Alternative : l'intégration **Neon** du Marketplace Vercel remplit `DATABASE_URL`
> toute seule. Vérifie seulement que la chaîne utilisée est bien la version
> _pooled_ (`-pooler`).

## 6. Sauvegardes et limites de l'offre gratuite

- Neon garde un historique qui permet de restaurer la base à un instant passé
  (onglet **Restore** / **Branches**). Sur l'offre gratuite cette fenêtre est courte :
  pour un site avec de l'argent réel, passe à une offre payante avant l'ouverture.
- La base se met en veille quand personne ne l'utilise ; la première requête après une
  pause prend une ou deux secondes de plus. C'est normal.

## 7. En cas de problème

| Symptôme                                                            | Piste                                                                                               |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `DATABASE_URL manquante` en lançant `npm run db:migrate`            | `.env.local` absent ou variable mal nommée ; il doit être à la racine du projet.                    |
| `bad option: --env-file-if-exists`                                  | Node.js trop ancien : installe Node 22 ou plus récent.                                              |
| « Service temporairement indisponible » à l'inscription             | Variables absentes chez l'hébergeur (`DATABASE_URL`, `BETTER_AUTH_SECRET`) ; redéploie après ajout. |
| Connexion qui ne tient pas en production                            | `NEXT_PUBLIC_APP_URL` ne correspond pas à l'adresse réelle du site (https, sans `/` final).         |
| « L'envoi d'e-mails n'est pas encore activé » (mot de passe oublié) | `RESEND_API_KEY` ou `EMAIL_FROM` absent ; le domaine de l'expéditeur doit être vérifié chez Resend. |
| `relation "profiles" does not exist`                                | Les migrations n'ont pas été appliquées sur cette base : `npm run db:migrate`.                      |
