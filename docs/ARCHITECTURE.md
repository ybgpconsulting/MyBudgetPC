# My Budget PC architecture

## Application layers

- React and TypeScript storefront: catalogue, category/search/price filters, product details, persisted enquiry cart, customer review form, and WhatsApp message generation.
- Existing inventory context and API contracts: product CRUD, image records, availability units, staff authentication, reservations, and internal sales records.
- Express/PostgreSQL backend: self-hosted application backend with password hashing, signed sessions, database migrations, and staff account bootstrap from environment settings.
- Cloudflare Worker/Pages API adapter: optional D1-backed catalog and staff API; R2 may serve verified existing images. Cloudflare uploads remain disabled.

## Product and stock model

The existing product schema is retained to avoid breaking API consumers. Product category is free text and product fields such as storage, RAM, processor, screen size, price, descriptions, feature lists, SKU, images, and status are reused for computer hardware listings. A product record describes one listed configuration; products sharing a model can be offered as alternative configurations. Physical inventory units remain the source of available quantities.

The catalogue is intentionally unseeded. It does not show unrelated sample inventory or invented My Budget PC listings, prices, stock, ratings, warranties, or location details. Administrators add verified listings and categories after authenticating.

## Enquiry flow

The browser stores cart item IDs and quantities under a My Budget PC-specific local-storage key. Current catalogue data supplies the displayed configuration, SKU, availability, and price; stale or unavailable items are reported and cannot be submitted as an available cart. Checkout asks for name, phone, delivery or pickup, conditional address/PIN, and notes. A shared formatter builds a WhatsApp click-to-chat URL only when `VITE_STORE_WHATSAPP_NUMBER` is configured. Opening WhatsApp neither sends the message nor confirms an order; the cart remains stored.

No conventional online payment step is used. Existing internal reservation and sales APIs remain available for staff workflows; a WhatsApp enquiry is not an order record or a confirmed sale.

## Authentication and authorization

The Express/PostgreSQL path retains the existing role checks and password hashing. Staff account email addresses and bootstrap passwords are supplied through environment variables; there are no committed demo credentials. The Cloudflare adapter issues HMAC-signed, expiring staff tokens only when independent My Budget PC secrets are configured. The HMAC secret must contain at least 32 characters and staff passwords at least 12 characters.

## Images and deployment

Product uploads continue to use the existing protected `/api/uploads/image` contract. Cloudflare R2 is optional and must be provisioned independently; a missing bucket or database is surfaced as an API error rather than reusing another store's bindings. Both the Worker static assets and Pages configuration support SPA route fallback for product details and staff login.

The active `npm run deploy` path is the Workers Assets deployment configured by `wrangler.jsonc`. That configuration currently has no D1 binding, and the authenticated account inventory checked for this deployment did not identify a MyBudgetPC database. The owner/operator must confirm the intended existing database's exact name and identifier and add a `d1_databases` binding named `DB` before deploying the Worker API; do not bind an unrelated database, create a replacement, or infer identifiers from example commands. Deployment preflight checks local configuration, but does not verify remote secrets, database schema, domain routing, backups, or account selection. The separate Pages configuration is used only by `deploy:pages`. If the D1 table exists but its state row does not, the adapter initializes an empty catalogue; `SEED_PHONES` is empty. The current Cloudflare D1 adapter stores state as one JSON record for compatibility; it is not suitable for real inventory, customer records, reservations, or sales and must be replaced with a tested normalized model before accepting business data.
