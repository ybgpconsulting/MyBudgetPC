import 'dotenv/config';
import crypto from 'node:crypto';
import { pool, withTransaction } from './db';
import { verifySchema } from './schemaVerification';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const digest = crypto.scryptSync(password, salt, 64).toString('hex');
  return `scrypt$${salt}$${digest}`;
}

const adminPassword = process.env.ADMIN_BOOTSTRAP_PASSWORD;
const salesPassword = process.env.SALES_BOOTSTRAP_PASSWORD;
const adminEmail = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
const salesEmail = process.env.SALES_BOOTSTRAP_EMAIL?.trim().toLowerCase();
if (!adminEmail || !salesEmail || !adminPassword || adminPassword.length < 12 || !salesPassword || salesPassword.length < 12) {
  throw new Error('Set ADMIN_BOOTSTRAP_EMAIL, SALES_BOOTSTRAP_EMAIL, and both bootstrap passwords (at least 12 characters).');
}

await verifySchema(pool);

// Seed admin user
const adminHash = hashPassword(adminPassword);
await pool.query(
  `INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, 'admin', 'My Budget PC Admin')
   ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = 'My Budget PC Admin'`,
  [adminEmail, adminHash]
);

// Seed sales user
const salesHash = hashPassword(salesPassword);
await pool.query(
  `INSERT INTO users (email, password_hash, role, name) VALUES ($1, $2, 'sales', 'My Budget PC Sales')
   ON CONFLICT (email) DO UPDATE SET password_hash = $2, name = 'My Budget PC Sales'`,
  [salesEmail, salesHash]
);
console.log('Configured staff accounts seeded.');

// Load the initial catalog used to initialize PostgreSQL.
const { SEED_PHONES } = await import('../src/data/seedPhones');

await withTransaction(async (client) => {
  for (const phone of SEED_PHONES) {
    const { rows: productRows } = await client.query(
      `INSERT INTO products (category, brand, model, storage, colour, color_hex,
        price_inr, original_msp, bill_available, bill_amount, condition_grade,
        condition_description, battery_health, screen_size, ram, processor,
        stock_tag, price_drop, featured, in_box, key_features)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
       ON CONFLICT (stock_tag) DO NOTHING
       RETURNING id`,
      [
        phone.category, phone.brand, phone.model, phone.storage,
        phone.colour, phone.colorHex || null, phone.price, phone.originalMsp || null,
        phone.billAvailable ?? false, phone.billAmount || null,
        phone.condition, phone.conditionDescription, phone.batteryHealth || null,
        phone.screenSize || null, phone.ram || null, phone.processor || null,
        phone.stockTag || `MBPC-${phone.id}`, phone.priceDrop ?? false, phone.featured ?? false,
        JSON.stringify(phone.inBox), phone.keyFeatures || [],
      ]
    );

    if (productRows.length > 0) {
      const productId = productRows[0].id;

      // Create inventory unit
      const unitTag = `${phone.stockTag || `MBPC-${phone.id}`}-U1`;
      const statusMap: Record<string, string> = { Available: 'available', Booked: 'reserved', 'Sold Out': 'sold' };
      await client.query(
        `INSERT INTO inventory_units (product_id, stock_tag, status, sale_price_inr)
         VALUES ($1, $2, $3::inventory_status, $4) ON CONFLICT (stock_tag) DO NOTHING`,
        [productId, unitTag, statusMap[phone.status] || 'available', phone.price]
      );

      // Create images
      if (phone.images && phone.images.length > 0) {
        for (let i = 0; i < phone.images.length; i++) {
          await client.query(
            `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
             VALUES ($1, $2, $3, $4, $5)`,
            [productId, phone.images[i], `${phone.brand} ${phone.model}`, i, i === 0]
          );
        }
      }
    }
  }
});

console.log(`Seeded ${SEED_PHONES.length} catalog records with inventory units and images.`);
await pool.end();
