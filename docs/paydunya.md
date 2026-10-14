# Configurer PayDunya pour Izzibusiness

Ce guide explique comment obtenir les clés API PayDunya, où les mettre, et comment
tester les dépôts, l'adhésion et les retraits avant d'ouvrir les vrais paiements.

> Les intitulés exacts des menus PayDunya peuvent évoluer. Si un écran ne correspond
> pas, cherche l'équivalent dans le tableau de bord ou contacte le support PayDunya.

---

## 1. Créer le compte marchand

1. Va sur [paydunya.com](https://paydunya.com) et crée un **compte Business** avec l'e-mail
   de l'entreprise.
2. Confirme l'adresse e-mail, puis complète le profil de l'entreprise.
3. **Vérification (KYC)** : pour encaisser de vrais paiements, PayDunya demande les
   documents de l'entreprise (registre de commerce, identifiant fiscal, pièce d'identité
   du responsable…). La liste exacte s'affiche dans ton tableau de bord. Tant que la
   vérification n'est pas validée, seul le **mode test** fonctionne.

## 2. Créer l'application et obtenir les clés

1. Dans le tableau de bord : **Intégrez notre API** puis **Configurer une nouvelle
   application** (page `paydunya.com/integration-setups/create`).
2. Remplis le formulaire :

   | Champ                              | Valeur à saisir                                            |
   | ---------------------------------- | ---------------------------------------------------------- |
   | Nom de l'application               | `Izzibusiness`                                             |
   | Site web                           | l'adresse publique du site, ex. `https://izzibusiness.com` |
   | Mode                               | **Test** pour commencer                                    |
   | Instant Payment Notification (IPN) | `https://<ton-domaine>/api/payment/paydunya/ipn`           |

3. Valide : PayDunya affiche **4 éléments**. Garde-les secrets :
   - **Master Key** (clé principale) ;
   - **Private Key** (commence par `test_private_` en test, `live_private_` en production) ;
   - **Public Key** (non utilisée par le serveur) ;
   - **Token**.

### Qu'est-ce que l'IPN ?

C'est l'adresse que PayDunya appelle **de serveur à serveur** quand un client a payé.
Elle existe dans le projet : `src/app/api/payment/paydunya/ipn/route.ts`.

- PayDunya envoie un `hash` ; le serveur vérifie qu'il vaut le SHA-512 de ta Master Key.
- Le serveur ne croit pas le contenu reçu : il relit la facture chez PayDunya avant
  de créditer le wallet ou d'activer l'adhésion.
- Un paiement ne peut être crédité qu'une fois, même si PayDunya envoie l'IPN plusieurs fois.

L'URL de retour (où le client revient après avoir payé) est différente :
`/dashboard/wallet/paiement`. Le projet la transmet automatiquement à chaque facture.

> L'IPN doit être une adresse **publique en HTTPS**. `http://localhost:3000` ne reçoit
> jamais l'IPN. Pour tester en local, expose ton serveur avec un tunnel (ngrok,
> Cloudflare Tunnel) et utilise cette adresse dans `NEXT_PUBLIC_APP_URL`.

## 3. Renseigner les variables d'environnement

Chez ton hébergeur (Vercel : _Project > Settings > Environment Variables_), ajoute :

```
PAYDUNYA_MASTER_KEY=…
PAYDUNYA_PRIVATE_KEY=…
PAYDUNYA_TOKEN=…
PAYDUNYA_MODE=test          # puis live en production
PAYDUNYA_STORE_NAME=Izzibusiness
NEXT_PUBLIC_APP_URL=https://<ton-domaine>
```

Ces clés restent côté serveur : ne les préfixe **jamais** par `NEXT_PUBLIC_` et ne les
committe pas. Redéploie après l'ajout. La page **Admin > Paramètres** indique si PayDunya
est configuré et dans quel mode.

## 4. Tester en mode test (sandbox)

1. Dans le tableau de bord PayDunya (mode test), crée un ou deux **clients fictifs** :
   ce sont eux qui « paient » sur la page de paiement de test.
2. Sur le site : connecte-toi, va dans **Wallet**, dépose 1 000 FCFA.
3. Paie sur la page PayDunya avec le client fictif.
4. Vérifie :
   - retour sur `/dashboard/wallet/paiement` avec « Paiement confirmé » ;
   - solde crédité dans le wallet ;
   - ligne **Confirmé** dans **Admin > Paiements**.
5. Refais le test avec **l'adhésion** : le compte doit passer « Adhérent » et le parrain,
   s'il y en a un, recevoir son bonus.
6. Annule un paiement sur la page PayDunya : le statut doit passer à « Annulé », sans crédit.

## 5. Activer les retraits (déboursement)

Les retraits utilisent l'API **Déboursement** de PayDunya (paiement sortant vers Mobile Money).

1. Dans le tableau de bord, active le **déboursement** et approvisionne le **solde de
   déboursement**. C'est sur ce solde que sont prélevés les envois aux membres.
2. Vérifie les **codes opérateurs** (`withdraw_mode`) acceptés pour chaque pays et
   compare-les avec `WITHDRAW_OPERATORS` dans `src/lib/config.ts`. Par exemple
   `mtn-benin` et `moov-benin` pour le Bénin. Corrige la liste si un code diffère.
3. Déclare l'URL de retour des déboursements si PayDunya la demande :
   `https://<ton-domaine>/api/payment/paydunya/disburse`.
4. Test : un membre adhérent demande un retrait, puis dans **Admin > Retraits** :
   - **Payer** prépare puis envoie le déboursement ;
   - **Refuser** restitue montant et frais au membre ;
   - **Vérifier le statut** relit le résultat chez PayDunya si la réponse a tardé.

> L'environnement de développement de ce projet n'a pas pu consulter la documentation
> officielle du déboursement (accès réseau bloqué). Les appels utilisent l'API v2
> (`/v2/disburse/get-invoice`, `/submit-invoice`, `/check-status`). Fais un premier
> retrait réel de petit montant et vérifie-le dans le tableau de bord PayDunya avant
> d'ouvrir les retraits à tous.

## 6. Passer en production

1. Attends la validation KYC de PayDunya.
2. Passe l'application en mode **Production** dans le tableau de bord et récupère les clés
   `live_…`.
3. Remplace les variables chez l'hébergeur et mets `PAYDUNYA_MODE=live`.
4. Vérifie que l'IPN pointe bien sur le domaine de production.
5. Fais un dépôt réel de petit montant, puis un retrait réel, avant toute communication.

## 7. En cas de problème

| Symptôme                                                  | Piste                                                                                                      |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| « Les paiements Mobile Money ne sont pas encore activés » | Variables `PAYDUNYA_*` absentes ou mal nommées ; redéploie après correction.                               |
| Paiement payé mais solde non crédité                      | IPN mal configurée ou non publique. Le retour sur `/dashboard/wallet/paiement` revérifie aussi la facture. |
| IPN rejetée (401)                                         | La Master Key de l'environnement ne correspond pas à celle de l'application PayDunya.                      |
| Retrait « Préparation refusée »                           | Déboursement non activé, solde de déboursement insuffisant ou `withdraw_mode` incorrect.                   |
