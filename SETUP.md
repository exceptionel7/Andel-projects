# 🚀 Exceptionel — Guide de démarrage

## Structure du projet

```
exceptionel/
├── app/
│   ├── page.js                        → Page d'accueil (style Amazon)
│   ├── products/page.js               → Catalogue (search + pagination)
│   ├── products/[slug]/page.js        → Page produit individuelle
│   ├── checkout/page.js               → Checkout (shipping form)
│   ├── order/success/page.js          → Confirmation de commande
│   ├── account/page.js                → Mon compte / mes commandes
│   └── api/
│       ├── checkout/stripe/route.js   → Crée la session Stripe
│       └── webhooks/stripe/route.js   → ⚡ FULFILLMENT AUTOMATIQUE
├── components/
│   ├── Navbar.js                      → Navbar style Amazon
│   ├── CartDrawer.js                  → Panier latéral
│   ├── ProductCard.js                 → Carte produit
│   └── Footer.js
├── lib/
│   ├── cj.js                          → Client API CJ Dropshipping
│   ├── stripe.js                      → Client Stripe
│   ├── supabase.js                    → Client Supabase
│   ├── store.js                       → Zustand (panier)
│   └── format.js                      → Utilitaires
├── .env.local                         → Variables d'environnement
└── supabase-schema.sql                → Schéma DB à exécuter
```

---

## Étape 1 — Stripe

1. Va sur https://dashboard.stripe.com
2. **Clé publique** (pk_test_...) → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. **Clé secrète** (sk_test_...) → `STRIPE_SECRET_KEY`
4. Pour le webhook local, installe le CLI Stripe :
   ```
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```
   Copie le `whsec_...` affiché → `STRIPE_WEBHOOK_SECRET`
5. En production, crée un webhook dans le dashboard Stripe pointant vers :
   `https://ton-domaine.com/api/webhooks/stripe`
   Event : `checkout.session.completed`

---

## Étape 2 — Supabase

1. Va sur https://supabase.com → Crée un projet gratuit
2. Copie dans `.env.local` :
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (Settings → API)
3. Dans **SQL Editor**, colle et exécute le contenu de `supabase-schema.sql`

---

## Étape 3 — Démarrer le projet

```bash
cd exceptionel
npm install
npm run dev
```

Ouvre : http://localhost:3000

---

## Flux de commande automatique

```
Client remplit le checkout
    → POST /api/checkout/stripe → Session Stripe créée
    → Redirection vers page paiement Stripe
    → Client paie
    → Stripe envoie webhook → POST /api/webhooks/stripe
    → fulfillOrder() appelé automatiquement
    → createCJOrder() → commande créée chez CJ
    → CJ prépare et expédie la commande
    → Client reçoit le colis 🎉
```

---

## Variables d'environnement (.env.local)

> ⚠️ **Sécurité :** ne mets JAMAIS de vraies clés/secrets dans ce fichier `SETUP.md`
> (il est versionné dans Git). Les valeurs ci-dessous ne sont que des exemples.
> Les vraies valeurs vont uniquement dans `.env.local` (ignoré par Git) et dans les
> variables d'environnement de Vercel.

```env
# CJ Dropshipping (ne jamais committer les vraies valeurs !)
CJ_EMAIL=votre_email_cj@api
CJ_API_KEY=votre_cle_api_cj

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# App
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

---

## Prochaines étapes (optionnel)

- [ ] Ajouter l'authentification Supabase (login/register)
- [ ] Sauvegarder les commandes dans Supabase après le webhook
- [ ] Emails de confirmation (Resend)
- [ ] Suivi de commande en temps réel via l'API CJ
- [ ] Déployer sur Vercel
