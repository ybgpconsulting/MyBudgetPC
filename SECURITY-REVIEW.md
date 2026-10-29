# Security Review — My Budget PC

**Review date:** 29 October 2026  
**Reviewed branch:** `audit/production-readiness`  
**Base commit:** `4d479ee` — Complete refurbished storefront improvements  
**Status:** Identified application-level findings were addressed in this branch. **The application is not approved for production use until the production blockers below are resolved.**

## Scope

The review covered the Express/PostgreSQL API, Cloudflare Pages/Worker API, authentication and authorization, image uploads, public product responses, demo-catalogue isolation, contact configuration, deployment configuration, and the storefront's production build.

This is a source-code review and local verification summary. It is not a penetration test, cloud-account audit, or verification of deployed infrastructure, live secrets, production data, or live endpoints.

## Findings and remediation

| ID | Severity | Finding | Remediation |
| --- | --- | --- | --- |
| SEC-01 | High | Cloudflare image upload accepted data based on signature checks without decoding and normalizing it with a supported image processor. | Worker image-upload endpoint now fails closed with HTTP 503 until a safe decode-and-normalize path is implemented and tested. |
| SEC-02 | Medium | Anonymous Cloudflare product responses could expose inventory-unit details, and a unit-inventory endpoint lacked staff authorization. | Public product responses use an allowlist; inventory-unit access requires staff authentication. Equivalent public/staff response separation was reviewed in Express. |
| SEC-03 | Medium | PostgreSQL TLS could operate without server certificate verification. | Certificate verification is enabled when TLS is configured. Remote database deployments must supply a valid certificate chain; do not disable verification to work around provider configuration. |
| SEC-04 | Medium | JWT secrets could be configured below the intended strength minimum. | Authentication configuration and verification enforce a minimum of 32 bytes for the JWT secret. Bootstrap passwords retain the documented minimum requirements. |
| SEC-05 | Medium | An environment setting could raise the upload limit above the intended cap. | Express upload input is capped at 5 MiB; configuration may lower the cap but not raise it. Uploaded images are decoded and normalized to WebP with server-generated names. |
| SEC-06 | Low | An invalid bearer token on an optional-auth route could be treated as anonymous. | Supplied invalid bearer tokens now receive HTTP 401 rather than being downgraded to anonymous access. |

Severity ratings are qualitative assessments for prioritization, not CVSS scores. They describe the source-code issues and the mitigations applied during this review.

## Verification recorded for this branch

The review session reported these local checks as passing:

- `npm run lint`
- `npm test` — 35 tests passed
- `npm run build`
- `npm audit`
- `git diff --check`

Additional reported checks included:
- Browser layout checks at mobile and desktop viewport widths, with no horizontal overflow observed at the checked sizes.
- Development demo product images loaded, and demo controls were read-only.
- The built production output was checked for demo fixture strings and stale Cortek/IQD branding/contact details.
- The production preview returned the catalogue route directly and after refresh. With no live API configured, it showed the expected unavailable-catalogue state.
- Sitemap generation skipped when the canonical production domain was unset and used the configured origin when tested.

These results are copied from the completed local review session; they are not a claim that GitHub Actions or production deployment checks passed. The repository reported no configured GitHub Actions runs in that session.

## Production blockers

1. **Cloudflare image uploads are disabled.** `POST /api/uploads/image` returns HTTP 503 until a supported Worker-compatible image decoder/re-encoder and regression tests are implemented. Do not re-enable based on MIME type or signature checks alone.
2. **D1 storage is demo-scale.** The current adapter stores catalogue, reservations, sales, and customer state in one JSON record, which is rewritten on writes and can contend under concurrent changes. Do not use this design for real customer or sales data at scale; use PostgreSQL or a tested normalized D1 design.
3. **Production infrastructure was not verified.** Independent database and R2 resources, bindings, permissions, secrets, backups, and deployed environment settings still require owner/operator verification.
4. **Public business details must be confirmed.** The production domain, phone/WhatsApp designation, exact location, social links, inventory, prices, images, shipping and pickup policies must be supplied and verified by the owner. Do not infer that an existing third-party business phone number accepts WhatsApp.
5. **Live functional verification remains outstanding.** The live catalogue, real uploads, staff login, inventory workflows, and customer enquiry flows must be checked against the intended production backend before launch.

## Operating guidance

- Keep production secrets out of source control and frontend variables.
- Use separately provisioned My Budget PC resources; never reuse another business's database, bucket, or credentials.
- Keep staff authorization enforced by the server/Worker, not just the user interface.
- Preserve uploaded-image size limits, byte-level validation, decoding/normalization, generated storage keys, fixed content types, and `X-Content-Type-Options: nosniff`.
- Run lint, tests, build, and dependency audit after further security changes.
- Do not deploy or migrate production data until the blockers above have been addressed and independently verified.

## Conclusion

**NOT READY — BLOCKING ISSUES REMAIN.**

The code-level findings listed above were remediated or mitigated in the review branch, but successful local checks alone do not establish production readiness. Cloudflare image upload functionality remains unavailable, the D1 storage architecture is unsuitable for real transactional data, and production credentials, resources, public business details, and live workflows remain unverified.
