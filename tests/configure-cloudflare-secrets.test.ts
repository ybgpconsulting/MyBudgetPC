import assert from 'node:assert/strict';
import test from 'node:test';
import { generateAuthSecret, validateSecretInputs } from '../scripts/configure-cloudflare-secrets.mjs';

test('generateAuthSecret produces a secure random secret of at least 32 characters', () => {
  const secret1 = generateAuthSecret();
  const secret2 = generateAuthSecret();
  assert.ok(secret1.length >= 32);
  assert.ok(secret2.length >= 32);
  assert.notEqual(secret1, secret2);
});

test('validateSecretInputs accepts valid configuration', () => {
  const valid = {
    authSecret: 'this-is-a-valid-auth-secret-with-more-than-32-chars',
    adminEmail: 'admin@mybudgetpc.in',
    adminPassword: 'secure-admin-password-123',
  };
  assert.deepEqual(validateSecretInputs(valid), []);
});

test('validateSecretInputs accepts valid sales credentials when both provided', () => {
  const validWithSales = {
    authSecret: 'this-is-a-valid-auth-secret-with-more-than-32-chars',
    adminEmail: 'admin@mybudgetpc.in',
    adminPassword: 'secure-admin-password-123',
    salesEmail: 'sales@mybudgetpc.in',
    salesPassword: 'secure-sales-password-123',
  };
  assert.deepEqual(validateSecretInputs(validWithSales), []);
});

test('validateSecretInputs rejects short auth secrets and passwords', () => {
  const errors = validateSecretInputs({
    authSecret: 'short',
    adminEmail: 'admin@mybudgetpc.in',
    adminPassword: 'short',
  });
  assert.ok(errors.some((e) => e.includes('MBPC_AUTH_SECRET must be at least 32 characters')));
  assert.ok(errors.some((e) => e.includes('MBPC_ADMIN_PASSWORD must be at least 12 characters')));
});

test('validateSecretInputs rejects invalid email formats', () => {
  const errors = validateSecretInputs({
    authSecret: 'this-is-a-valid-auth-secret-with-more-than-32-chars',
    adminEmail: 'not-an-email',
    adminPassword: 'secure-admin-password-123',
  });
  assert.ok(errors.some((e) => e.includes('MBPC_ADMIN_EMAIL must be a valid email')));
});

test('validateSecretInputs enforces sales email and password provided together', () => {
  const onlyEmail = validateSecretInputs({
    authSecret: 'this-is-a-valid-auth-secret-with-more-than-32-chars',
    adminEmail: 'admin@mybudgetpc.in',
    adminPassword: 'secure-admin-password-123',
    salesEmail: 'sales@mybudgetpc.in',
  });
  assert.ok(onlyEmail.some((e) => e.includes('Both MBPC_SALES_EMAIL and MBPC_SALES_PASSWORD must be provided together')));

  const onlyPassword = validateSecretInputs({
    authSecret: 'this-is-a-valid-auth-secret-with-more-than-32-chars',
    adminEmail: 'admin@mybudgetpc.in',
    adminPassword: 'secure-admin-password-123',
    salesPassword: 'secure-sales-password-123',
  });
  assert.ok(onlyPassword.some((e) => e.includes('Both MBPC_SALES_EMAIL and MBPC_SALES_PASSWORD must be provided together')));
});

