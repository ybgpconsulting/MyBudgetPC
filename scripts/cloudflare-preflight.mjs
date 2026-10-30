import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function validateCloudflareLaunch(config, siteUrl, demoCatalog) {
  const errors = [];

  const isPages = Boolean(config.pages_build_output_dir);
  if (!['mybudgetpc', 'my-budget-pc'].includes(config.name)) {
    errors.push('Cloudflare config must target the My Budget PC Worker or Pages project.');
  }
  if (Object.keys(config.vars || {}).some((name) => /(?:SECRET|PASSWORD|TOKEN|PRIVATE_KEY)/i.test(name))) {
    errors.push('Do not put secrets in Wrangler vars; configure them with the Cloudflare secrets command.');
  }
  if (isPages) {
    if (config.pages_build_output_dir !== './dist') {
      errors.push('Cloudflare Pages must publish the ./dist build output.');
    }
  } else {
    if (config.main !== 'worker.ts') {
      errors.push('wrangler.jsonc must use worker.ts as the Worker entry point.');
    }
    if (config.workers_dev !== true && !config.route && !config.routes?.length) {
      errors.push('Configure a Worker route or enable workers.dev so the deployed Worker is reachable.');
    }
    if (config.assets?.directory !== './dist' || config.assets?.binding !== 'ASSETS') {
      errors.push('Worker static assets must use ./dist and the ASSETS binding.');
    }
    if (!config.assets?.run_worker_first?.includes('/api')
      || !config.assets.run_worker_first.includes('/api/*')) {
      errors.push('Worker API routes must run before static asset handling.');
    }
  }

  const database = config.d1_databases?.find((binding) => binding.binding === 'DB');
  if (!database) {
    errors.push('Add the verified My Budget PC D1 database as the DB binding in the selected Wrangler config.');
  } else {
    if (!database.database_name?.trim()) {
      errors.push('Set the verified D1 database name for the DB binding.');
    }
    if (!uuidPattern.test(database.database_id || '')) {
      errors.push('Set the verified Cloudflare D1 database UUID for the DB binding.');
    }
  }

  if (!siteUrl) {
    errors.push('Set VITE_SITE_URL to the production site origin before building.');
  } else {
    try {
      const url = new URL(siteUrl);
      if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/'
        || url.search || url.hash || ['localhost', '127.0.0.1'].includes(url.hostname)) {
        errors.push('VITE_SITE_URL must be the production HTTPS origin only (no path, credentials, query, or fragment).');
      }
    } catch {
      errors.push('VITE_SITE_URL must be an absolute HTTPS origin.');
    }
  }

  if (demoCatalog?.trim().toLowerCase() === 'true') {
    errors.push('VITE_DEMO_CATALOG must not enable demo data for a Cloudflare production deploy.');
  }

  return errors;
}

async function main(configPath = 'wrangler.jsonc') {
  let config;
  try {
    config = JSON.parse(await readFile(resolve(projectRoot, configPath), 'utf8'));
  } catch (error) {
    throw new Error(`Unable to read valid JSON from ${configPath}: ${error instanceof Error ? error.message : String(error)}`);
  }

  const schema = await readFile(resolve(projectRoot, 'db/my-budget-pc-state.sql'), 'utf8');
  if (!schema.includes('CREATE TABLE IF NOT EXISTS my_budget_pc_state')) {
    throw new Error('D1 schema file does not create the expected my_budget_pc_state table.');
  }

  const errors = validateCloudflareLaunch(
    config,
    process.env.VITE_SITE_URL?.trim(),
    process.env.VITE_DEMO_CATALOG,
  );
  if (errors.length) {
    console.error('Cloudflare deployment preflight failed:');
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }

  console.info('Cloudflare static deployment preflight passed.');
  console.info('Still verify the remote D1 schema, Worker secrets, domain routing, backups, and production data suitability before launch.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main(process.argv[2] || 'wrangler.jsonc');
}
