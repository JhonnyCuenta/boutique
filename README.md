# MW Developpement

Boutique premium de scripts FiveM avec paiement PayPal, livraison automatique par email et licences.

## Installation locale

```powershell
cd "C:\Users\djonn\Desktop\serveur fiveM last survivors\[SAAS]\mw-developpement"
npm install
copy .env.example .env.local
npm run db:deploy
npm run db:seed
npm run dev
```

Le site local demarre sur:

```txt
http://localhost:30178
```

## Variables importantes

- `DATABASE_URL`: PostgreSQL Neon/Vercel.
- `JWT_SECRET`: secret long pour les sessions owner.
- `OWNER1_*` et `OWNER2_*`: deux comptes owner crees par `npm run db:seed`.
- `PAYPAL_*`: credentials PayPal REST + webhook.
- `RESEND_API_KEY` et `FROM_EMAIL`: livraison email.
- `BLOB_READ_WRITE_TOKEN`: stockage prive des fichiers ZIP.

## Flux paiement

1. Le client ajoute un produit au panier.
2. Le serveur cree une commande PayPal avec les prix recalcules depuis la base.
3. Apres validation PayPal, le serveur capture le paiement.
4. La livraison se fait uniquement si PayPal confirme un paiement `COMPLETED`.
5. Le webhook PayPal verifie sert de rattrapage fiable et empeche les doubles livraisons.

## Deploiement

Stack conseillee: Vercel + Neon PostgreSQL + Vercel Blob prive + Resend.

```powershell
npm run build
npm run db:deploy
vercel --prod
```
