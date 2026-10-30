import 'dotenv/config';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const wranglerBin = resolve(projectRoot, 'node_modules/wrangler/bin/wrangler.js');

export function generateAuthSecret() {
  return crypto.randomBytes(48).toString('base64url');
}

/**
 * @param {{
 *   authSecret?: string;
 *   adminEmail?: string;
 *   adminPassword?: string;
 *   salesEmail?: string;
 *   salesPassword?: string;
 * }} [inputs]
 */
export function validateSecretInputs({
  authSecret = '',
  adminEmail = '',
  adminPassword = '',
  salesEmail = '',
  salesPassword = '',
} = {}) {
  const errors = [];
  if (!authSecret || authSecret.length < 32) {
    errors.push('MBPC_AUTH_SECRET must be at least 32 characters long.');
  }
  if (!adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail.trim())) {
    errors.push('MBPC_ADMIN_EMAIL must be a valid email address.');
  }
  if (!adminPassword || adminPassword.length < 12) {
    errors.push('MBPC_ADMIN_PASSWORD must be at least 12 characters long.');
  }
  if (salesEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(salesEmail.trim())) {
    errors.push('MBPC_SALES_EMAIL must be a valid email address.');
  }
  if (salesPassword && salesPassword.length < 12) {
    errors.push('MBPC_SALES_PASSWORD must be at least 12 characters long.');
  }
  if ((salesEmail && !salesPassword) || (!salesEmail && salesPassword)) {
    errors.push('Both MBPC_SALES_EMAIL and MBPC_SALES_PASSWORD must be provided together if sales access is enabled.');
  }
  return errors;
}

export function putSecret(key, value) {
  return new Promise((resolvePromise, rejectPromise) => {
    const child = spawn(process.execPath, [wranglerBin, 'secret', 'put', key], {
      stdio: ['pipe', 'inherit', 'inherit'],
      cwd: projectRoot,
    });

    child.on('error', rejectPromise);
    child.on('close', (code) => {
      if (code === 0) resolvePromise();
      else rejectPromise(new Error(`Failed to set Cloudflare secret ${key} (exit code ${code}).`));
    });

    child.stdin.write(`${value}\n`);
    child.stdin.end();
  });
}

async function promptIfMissing(rl, label, currentValue, isSecret = false) {
  if (currentValue) return currentValue;
  if (!input.isTTY) return '';
  const answer = await rl.question(`${label}: `);
  return answer.trim();
}

async function main() {
  console.info('Configuring Cloudflare Worker authentication secrets for My Budget PC...');

  let authSecret = process.env.MBPC_AUTH_SECRET?.trim() || '';
  if (!authSecret) {
    authSecret = generateAuthSecret();
    console.info('Generated cryptographically secure MBPC_AUTH_SECRET.');
  }

  let adminEmail = process.env.MBPC_ADMIN_EMAIL?.trim() || '';
  let adminPassword = process.env.MBPC_ADMIN_PASSWORD || '';
  let salesEmail = process.env.MBPC_SALES_EMAIL?.trim() || '';
  let salesPassword = process.env.MBPC_SALES_PASSWORD || '';

  if ((!adminEmail || !adminPassword) && input.isTTY) {
    const rl = readline.createInterface({ input, output });
    try {
      if (!adminEmail) {
        adminEmail = await promptIfMissing(rl, 'Enter MBPC_ADMIN_EMAIL');
      }
      if (!adminPassword) {
        adminPassword = await promptIfMissing(rl, 'Enter MBPC_ADMIN_PASSWORD (min 12 chars)', '', true);
      }
    } finally {
      rl.close();
    }
  }

  const errors = validateSecretInputs({
    authSecret,
    adminEmail,
    adminPassword,
    salesEmail,
    salesPassword,
  });

  if (errors.length > 0) {
    console.error('Validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    console.error('\nUsage: Pass via environment variables or run interactively in a TTY:');
    console.error('  $env:MBPC_ADMIN_EMAIL="admin@example.com"');
    console.error('  $env:MBPC_ADMIN_PASSWORD="min-12-character-password"');
    console.error('  npm run cloudflare:secrets\n');
    process.exitCode = 1;
    return;
  }

  console.info(`Uploading secrets to Cloudflare Worker (mybudgetpc)...`);
  await putSecret('MBPC_AUTH_SECRET', authSecret);
  await putSecret('MBPC_ADMIN_EMAIL', adminEmail);
  await putSecret('MBPC_ADMIN_PASSWORD', adminPassword);

  if (salesEmail && salesPassword) {
    await putSecret('MBPC_SALES_EMAIL', salesEmail);
    await putSecret('MBPC_SALES_PASSWORD', salesPassword);
  }

  console.info('All authentication secrets successfully registered in Cloudflare.');
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
