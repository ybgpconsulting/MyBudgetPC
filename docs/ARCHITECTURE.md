# My Budget PC architecture

## Application layers

- React and TypeScript storefront: catalogue, category/search/price filters, product details, persisted enquiry cart, customer review form, and WhatsApp message generation.
- Existing inventory context and API contracts: product CRUD, image records, availability units, staff authentication, reservations, and internal sales records.
- Express/PostgreSQL backend: self-hosted application backend with password hashing, signed sessions, database migrations, and staff account bootstrap from environment settings.
- Cloudflare Worker/Pages API adapter: optional D1-backed catalog and staff API; R2 can be bound for durable product uploads.

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

No D1 database identifier is checked into Wrangler configuration. Provision a separate D1 database and bind it as `DB` before deploying the Pages API. The current Cloudflare D1 adapter stores state as one JSON record for compatibility; it is not suitable as a high-volume production data model and should be normalized before substantial customer or sales data is stored.
