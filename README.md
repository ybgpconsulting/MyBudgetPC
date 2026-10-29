# My Budget PC

My Budget PC is a mobile-first refurbished computer, component, and peripherals storefront. Customers can review an enquiry before choosing to open WhatsApp. The site does not collect online payments, claim that WhatsApp messages were sent, or treat an enquiry as a confirmed order.

## Technology and backend choices

- React, TypeScript, and Vite storefront.
- Express/PostgreSQL backend for local and self-hosted use.
- Cloudflare Worker or Pages Function API with D1 state storage.
- Express image uploads are decoded by Sharp and normalized to WebP. Cloudflare image uploads currently fail closed with HTTP 503 because a Worker-compatible image decoder/normalizer is not configured.

The PostgreSQL and Cloudflare configurations are independent. Provision new My Budget PC resources; do not copy credentials, database IDs, R2 bucket names, or bindings from another business.

## Local development with PostgreSQL

1. Install the locked dependencies with `npm install`.
2. Copy `.env.example` to `.env`. Set a local PostgreSQL `DATABASE_URL`, unique admin and sales email addresses, bootstrap passwords of at least 12 characters, and a random `JWT_SECRET` of at least 32 bytes. Keep `.env` private.
3. Start PostgreSQL and run `npm run db:migrate`.
4. Run `npm run db:seed` once to bootstrap the staff accounts. This command updates the configured accounts' password hashes when re-run; do not re-run it unintentionally against a live database. The product seed file is intentionally empty.
5. Start the API with `npm run server:dev`, then start Vite in another terminal with `npm run dev`.
6. Open `/login` to sign in with the locally configured staff account. No demo credentials or authentication bypass are shipped.

Local Vite development displays clearly labeled, read-only fictional sample products by default. These samples cannot be purchased, put into the enquiry cart, or sent to WhatsApp. They are loaded only in Vite development for unauthenticated users; set `VITE_DEMO_CATALOG=false` to use the live API while developing. Production builds do not include the demo catalogue.

## Environment configuration

Copy `.env.example` and configure only values that have been verified:

### Backend and local development

| Variable | Purpose |
| --- | --- |
| `PORT` | Express API port (default `5000`). |
| `APP_ORIGIN` | Exact browser origin allowed by the Express API. |
| `VITE_API_URL` | API origin used by Vite; leave empty when the API is served from the same origin. |
| `DATABASE_URL` | PostgreSQL connection string for the independent My Budget PC database. |
| `DATABASE_SSL` | Set to `true` for TLS with certificate verification; local PostgreSQL may use `false`. |
| `JWT_SECRET` | Server-only random signing key, minimum 32 bytes. |
| `ADMIN_BOOTSTRAP_EMAIL`, `SALES_BOOTSTRAP_EMAIL` | Staff identities used by the one-time seed/bootstrap command. |
| `ADMIN_BOOTSTRAP_PASSWORD`, `SALES_BOOTSTRAP_PASSWORD` | Bootstrap passwords, each at least 12 characters. |
| `UPLOAD_DIR` | Persistent directory for Express image uploads. |
| `MAX_FILE_SIZE` | Optional smaller upload limit in bytes; maximum is 5 MiB. Invalid values stop the API at startup. |

For example, generate a JWT secret locally with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`. Never put backend secrets in a `VITE_` variable, source file, log, or committed file.

### Public business details and SEO

All `VITE_` values below are public browser configuration, not secrets. Set them in the environment used to build the site. Unset values remain hidden; no phone, address, map, social account, or WhatsApp contact is assumed.

| Variable | Purpose |
| --- | --- |
| `VITE_STORE_CALLING_NUMBER` | Verified call number in international format. This only enables a `tel:` link. |
| `VITE_STORE_WHATSAPP_NUMBER` | Separately verified WhatsApp number, digits only with country code. |
| `VITE_STORE_EMAIL` | Verified customer-support email. |
| `VITE_STORE_LOCATION_NAME`, `VITE_STORE_ADDRESS_LINE1`, `VITE_STORE_AREA`, `VITE_STORE_CITY`, `VITE_STORE_STATE`, `VITE_STORE_PINCODE`, `VITE_STORE_LANDMARK` | Confirmed public location details. |
| `VITE_STORE_MAPS_URL` | Verified HTTPS map listing or directions URL; no map link is shown when unset. |
| `VITE_STORE_WHATSAPP_COMMUNITY_URL`, `VITE_STORE_INSTAGRAM_URL`, `VITE_STORE_YOUTUBE_URL`, `VITE_STORE_FACEBOOK_URL`, `VITE_STORE_GOOGLE_URL`, `VITE_STORE_GOOGLE_REVIEWS_URL` | Verified public profiles or review links. |
| `VITE_SITE_URL` | Canonical HTTPS site origin. The sitemap is skipped when unset; configured production URLs must be an origin only, without path, credentials, query, or fragment. |
| `VITE_DEMO_CATALOG` | Local development demo toggle; it does not enable demo data in production. |

The owner identifies IQD Technologies as the same business under a different store name. Its published telephone number is a calling contact, not confirmation that the number accepts WhatsApp. The available reference does not establish a precise street address or map listing, so keep contact fields unset until the owner provides the final public details; configure the call and WhatsApp numbers separately.

## Catalogue, enquiries, and inventory

Live catalogue data comes from the selected backend. Admin and sales workflows manage product listings, configuration, condition, images, and inventory. The storefront supports catalogue pagination, search, filters, product details, local cart persistence, quantities bounded by available stock, and an enquiry review step. It displays only recorded prices and product facts and asks the customer to confirm availability and final pricing. Opening WhatsApp does not clear the cart.

Anonymous product responses omit inventory-unit IDs, unit stock tags, inspection data, and other staff-only fields in both Express and Cloudflare APIs. Inventory-unit endpoints and customer, sales, reservation, and inspection operations require staff authorization. Invalid supplied bearer tokens are rejected rather than downgraded to anonymous access.

Bulk inventory imports accept `.xlsx` and `.csv` files up to 10 MB and 1,000 data rows; legacy `.xls` files are unsupported. The CSV template includes an optional `KeyFeatures` column; separate multiple specifications with `|`.

### Image uploads

- **Express:** staff-only upload accepts JPEG, PNG, WebP, or GIF based on file bytes, enforces a maximum 5 MiB input, decodes with Sharp, applies orientation, and stores normalized WebP under a server-generated name. SVG/HTML and undecodable files are rejected. Configure `UPLOAD_DIR` on persistent storage and back it up.
- **Cloudflare:** `POST /api/uploads/image` is intentionally disabled with HTTP 503, even when R2 is bound. The current Worker has no supported safe decoder/re-encoder. R2 reads are limited to generated raster-image key patterns, use a fixed image content type and `nosniff`; admin-only deletion is retained. Verify any pre-existing objects before displaying them. Do not re-enable Worker uploads until a supported decode-and-normalize implementation and regression tests are in place.

## PostgreSQL setup and operations

Use an independently provisioned PostgreSQL database and a private connection string. Set `DATABASE_SSL=true` for a remote database; certificate verification remains enabled. If a provider requires a custom CA certificate, provision that securely rather than disabling verification.

Run `npm run db:migrate` to apply the numbered SQL migrations. The local `npm run db:seed` command creates or resets the configured bootstrap staff accounts; it does not provide production demo users. Production image storage must be persistent, access-controlled, and backed up.

## Cloudflare setup

The active `npm run deploy` command publishes a Worker with Assets. The checked-in `wrangler.jsonc` does not declare a D1 binding, and this repository does not contain a verified production D1 database name or ID. The owner/operator must provide those values and add the `DB` binding before deploying the Worker API; do not use an example database name or copy another business's ID. The separate `deploy:pages` script uses `wrangler.pages.jsonc` and is not the active deployment path.

1. Provision a separate D1 database for My Budget PC, verify its exact name and ID in the intended Cloudflare account, and add a `d1_databases` entry bound as `DB` to `wrangler.jsonc`.
2. Apply the schema to that verified database with `npx wrangler d1 execute YOUR_VERIFIED_DATABASE_NAME --remote --file=db/my-budget-pc-state.sql`.
3. Set `MBPC_AUTH_SECRET` (minimum 32 characters), `MBPC_ADMIN_EMAIL`, and `MBPC_ADMIN_PASSWORD` (minimum 12 characters) using `wrangler secret put`. Sales access is enabled only when both `MBPC_SALES_EMAIL` and `MBPC_SALES_PASSWORD` (minimum 12 characters) are configured.
4. Bind an independent R2 bucket as `R2` only if the deployment needs to serve existing verified image objects. Worker uploads remain disabled.
5. Set the public `VITE_*` build variables in the deployment's build environment, run `npm run build`, then deploy intentionally using `npm run deploy`.

Do not run deployment commands as part of local verification. Confirm the selected production environment, bindings, secrets, access policies, backups, and custom domain before deploying.

### D1 storage limitation

The Cloudflare adapter keeps the catalogue, reservations, sales, and customer state in one JSON value in one D1 row. Each write reads and rewrites that whole value and uses a revision check; concurrent writes can return HTTP 409 and require a retry. The record is capped below D1's row limit (900 KiB), and this design has no relational constraints or per-record transaction model. It is suitable only for a small, low-concurrency demonstration or evaluation—not for production customer records or sales. Use the PostgreSQL backend or plan a tested, backward-compatible normalized D1 migration before accepting real business data. No production data migration is performed by this project.

## Checks and deployment readiness

```text
npm run lint
npm test
npm run build
npm audit
git diff --check
```

Before accepting real inventory or customer data, the owner must verify public contact and location details, inventory/prices/photos, shipping and pickup policy, database and image-storage resources, backups and access policies, and the chosen production domain. Build success alone is not production approval.
