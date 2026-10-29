import { writeFile } from 'node:fs/promises';

const configuredUrl = process.env.VITE_SITE_URL?.trim();
if (!configuredUrl) {
  console.info('VITE_SITE_URL is not set; skipping sitemap generation until the production domain is configured.');
  process.exit(0);
}

let siteUrl;
try {
  siteUrl = new URL(configuredUrl);
} catch {
  throw new Error('VITE_SITE_URL must be an absolute site URL.');
}

if (siteUrl.protocol !== 'https:' && siteUrl.hostname !== 'localhost') {
  throw new Error('VITE_SITE_URL must use HTTPS outside localhost.');
}

const origin = siteUrl.origin;
const routes = ['/', '/catalog'];
const urls = routes.map((route) => `  <url><loc>${origin}${route}</loc></url>`).join('\n');
const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  urls,
  '</urlset>',
  '',
].join('\n');

await writeFile('dist/sitemap.xml', sitemap, 'utf8');
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /api/\nDisallow: /admin\nDisallow: /sales\nDisallow: /login\nDisallow: /checkout\nSitemap: ${origin}/sitemap.xml\n`, 'utf8');
