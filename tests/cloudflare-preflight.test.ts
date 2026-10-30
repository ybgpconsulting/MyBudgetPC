import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { validateCloudflareLaunch } from '../scripts/cloudflare-preflight.mjs';

const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
const validConfig = {
  ...config,
  d1_databases: [{
    binding: 'DB',
    database_name: 'my-budget-pc',
    database_id: '123e4567-e89b-42d3-a456-426614174000',
  }],
};
const validSiteUrl = 'https://store.example';

test('Cloudflare preflight accepts complete Worker configuration', () => {
  assert.deepEqual(validateCloudflareLaunch(validConfig, validSiteUrl, 'false'), []);
});

test('Cloudflare preflight blocks deployments without a verified D1 binding', () => {
  const errors = validateCloudflareLaunch(config, validSiteUrl, 'false');

  assert.ok(errors.some((error) => error.includes('verified My Budget PC D1 database')));
});

test('Cloudflare preflight requires a production HTTPS origin', () => {
  for (const siteUrl of ['', 'http://store.example', 'https://store.example/shop', 'https://localhost']) {
    assert.ok(validateCloudflareLaunch(validConfig, siteUrl, 'false')
      .some((error) => error.includes('VITE_SITE_URL')));
  }
});

test('Cloudflare preflight prevents demo catalogue builds', () => {
  assert.ok(validateCloudflareLaunch(validConfig, validSiteUrl, 'true')
    .some((error) => error.includes('VITE_DEMO_CATALOG')));
});

test('Cloudflare preflight rejects secrets stored as Wrangler vars', () => {
  const configWithSecret = { ...validConfig, vars: { MBPC_ADMIN_PASSWORD: 'do-not-commit' } };

  assert.ok(validateCloudflareLaunch(configWithSecret, validSiteUrl, 'false')
    .some((error) => error.includes('Do not put secrets in Wrangler vars')));
});

test('Cloudflare Pages config also requires an explicit D1 binding', () => {
  const pagesConfig = { name: 'my-budget-pc', pages_build_output_dir: './dist' };

  assert.ok(validateCloudflareLaunch(pagesConfig, validSiteUrl, 'false')
    .some((error) => error.includes('verified My Budget PC D1 database')));
});
