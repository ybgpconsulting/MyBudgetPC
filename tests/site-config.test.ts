import assert from 'node:assert/strict';
import test from 'node:test';
import { SITE_CONFIG } from '../src/config/siteConfig';
import { createWhatsAppUrl } from '../src/utils/whatsapp';

test('unverified public contact and location settings stay unset', () => {
  assert.equal(SITE_CONFIG.callingNumber, '');
  assert.equal(SITE_CONFIG.displayPhone, '');
  assert.equal(SITE_CONFIG.whatsappNumber, '');
  assert.equal(SITE_CONFIG.email, '');
  assert.equal(SITE_CONFIG.location.addressLine1, '');
  assert.equal(SITE_CONFIG.location.area, '');
  assert.equal(SITE_CONFIG.location.city, '');
  assert.equal(SITE_CONFIG.location.googleMapsSearchUrl, '');
  assert.equal(SITE_CONFIG.siteUrl, '');
  assert.equal(createWhatsAppUrl('Hello'), null);
});
