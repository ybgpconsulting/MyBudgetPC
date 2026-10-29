# My Budget PC

My Budget PC is a mobile-first computer and components storefront. Customers can browse administrator-managed listings, review an enquiry cart, and prepare a WhatsApp message. It does not collect online payments or treat opening WhatsApp as a sent message or confirmed order.

## Technology

- React, TypeScript, and Vite frontend.
- Express/PostgreSQL backend for local and self-hosted use.
- Cloudflare Worker/Pages assets and D1 API adapter; optional R2 image storage.

## Local development

1. Copy `.env.example` to `.env`. Configure `DATABASE_URL`, local JWT/bootstrap passwords, and unique staff email addresses. Never commit `.env`.
2. Start PostgreSQL, then run `npm run db:migrate` and `npm run db:seed`.
3. Start the API with `npm run server:dev`.
4. In another terminal, run `npm run dev`. The Vite client uses `VITE_API_URL` from `.env` to reach the API.
5. To enable customer WhatsApp enquiries, set `VITE_STORE_WHATSAPP_NUMBER` to the store's international phone number (digits only). This is a public contact number, not a secret. The storefront keeps WhatsApp actions unavailable when it is unset.
6. Local Vite development shows clearly marked, read-only sample listings across the storefront categories by default. These names, specifications, prices, images, and quantities are fictional and cannot be purchased or sent to WhatsApp. Set `VITE_DEMO_CATALOG=false` to use the live API while developing. Demo products are never enabled in production builds. Add verified products and images through the authenticated admin page at `/login`; no demo staff credentials are included.

Useful checks:

```text
npm run lint
npm test
npm run build
```

## Product and enquiry behavior

In live mode, product data, categories, prices, image URLs, availability, and configuration descriptions come from the inventory API. Product records represent a specific configuration; matching model records are selectable as alternate configurations. Local demo mode uses a separate read-only set of fictional sample listings and does not write them to the API or database.

The storefront loads every product API page so larger inventories are not silently cut off at the API's default page size. Customers can filter by category, brand, condition grade, price, and availability. Product pages display the recorded condition notes, configuration details, and only the accessories or warranty items explicitly marked for that listing. Admin and sales staff must select a condition grade when creating a listing and can enter verified, category-specific specifications one per line.

The enquiry cart is stored in this browser, and quantities are limited to API-reported available inventory. Review requires customer contact information and either delivery details or pickup selection. The generated message includes all listed items, SKUs, selected configuration, quantities, verified prices where present, subtotal when computable, delivery preference, address/PIN when applicable, pending delivery charges, notes, and a request to confirm availability and final pricing. Customers must review and send the message in WhatsApp themselves. The cart is not cleared when WhatsApp opens.

The Express product catalogue omits per-unit inventory identifiers, IMEIs, and inspection records from anonymous product-list and product-detail responses. Authenticated staff retain those details for inventory workflows, and the per-product inventory endpoint requires staff authentication.

Bulk inventory imports accept `.xlsx` and `.csv` files up to 10MB and 1,000 data rows; legacy `.xls` files are not supported. The supplied CSV template includes an optional `KeyFeatures` column; separate multiple specifications with `|`.

## Cloudflare

Create a separate My Budget PC D1 database, then add its binding (`DB`) to `wrangler.jsonc` or `wrangler.pages.jsonc` and apply `db/my-budget-pc-state.sql`. Configure staff authentication using deployment secrets; do not copy credentials or bindings from the source store. If using uploads, create an independent R2 bucket and bind it as `R2`.

The Pages Function accepts the following staff secrets; `MBPC_AUTH_SECRET` must be at least 32 characters and passwords at least 12 characters:

- `MBPC_AUTH_SECRET`
- `MBPC_ADMIN_EMAIL`
- `MBPC_ADMIN_PASSWORD`
- `MBPC_SALES_EMAIL` (optional)
- `MBPC_SALES_PASSWORD` (required when sales access is enabled)

Set them with `wrangler secret put <NAME>` for the target environment. Build and deploy with `npm run deploy` or `npm run deploy:pages` after provisioning the new resources.

The Cloudflare adapter currently stores its D1 catalog and sales state in a single JSON record. This preserves the existing API surface for the copied application, but it is a demo-scale storage design, not a recommended high-volume production database. Review and migrate that storage model before processing real orders or customer records at scale.

## Production setup still required

- Confirm whether the published phone accepts WhatsApp, the precise street address, public domain, social links, delivery policy, and shipping charges.
- The published IQD Technologies site identifies the business area as Preet Vihar, Delhi and lists `+91 90132-66337` for calls. My Budget PC displays that call number and links to a Maps search for the area; the source does not publish a more precise street address or verified WhatsApp designation, so WhatsApp remains separately configured.
- Add verified My Budget PC inventory and product photography through the admin interface.
- Provision independent production database, image storage, and deployment resources.
- Review the D1 JSON-state limitation before accepting business data; use the PostgreSQL backend or a properly normalized production data model as appropriate.
- Replace the sitemap once the canonical production domain is known. Current SEO URLs use the active site origin.
