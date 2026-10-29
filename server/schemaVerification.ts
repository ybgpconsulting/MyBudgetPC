import { Pool, PoolClient } from 'pg';

const expectedTables = [
  'users', 'products', 'product_images', 'inventory_units', 'customers',
  'reservations', 'sales', 'device_inspections', 'device_verifications', 'audit_logs',
];

const expectedTypes = ['user_role', 'inventory_status', 'reservation_status', 'verification_status'];

const expectedIndexes = [
  'idx_inventory_units_product_status', 'idx_inventory_units_status',
  'idx_product_images_product', 'idx_customers_phone', 'one_active_reservation_per_unit',
  'idx_reservations_expiry', 'idx_reservations_unit', 'idx_sales_customer', 'idx_sales_seller',
  'idx_inspections_unit', 'idx_verifications_imei', 'idx_audit_logs_entity', 'idx_audit_logs_created',
  'idx_customers_phone_unique',
];

export async function verifySchema(connection: Pool | PoolClient) {
  const tableResult = await connection.query(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
    [expectedTables]
  );
  const actualTables = new Set(tableResult.rows.map(row => row.table_name));
  const missingTables = expectedTables.filter(table => !actualTables.has(table));
  if (missingTables.length > 0) throw new Error(`Missing tables: ${missingTables.join(', ')}`);

  const typeResult = await connection.query(
    `SELECT typname FROM pg_type
     WHERE typnamespace = 'public'::regnamespace AND typname = ANY($1::text[])`,
    [expectedTypes]
  );
  const actualTypes = new Set(typeResult.rows.map(row => row.typname));
  const missingTypes = expectedTypes.filter(type => !actualTypes.has(type));
  if (missingTypes.length > 0) throw new Error(`Missing enum types: ${missingTypes.join(', ')}`);

  const indexResult = await connection.query(
    `SELECT indexname FROM pg_indexes
     WHERE schemaname = 'public' AND indexname = ANY($1::text[])`,
    [expectedIndexes]
  );
  const actualIndexes = new Set(indexResult.rows.map(row => row.indexname));
  const missingIndexes = expectedIndexes.filter(index => !actualIndexes.has(index));
  if (missingIndexes.length > 0) throw new Error(`Missing indexes: ${missingIndexes.join(', ')}`);

  const foreignKeyResult = await connection.query(
    `SELECT COUNT(*)::int AS count FROM information_schema.table_constraints
     WHERE constraint_schema = 'public' AND constraint_type = 'FOREIGN KEY'`
  );
  if (foreignKeyResult.rows[0].count < 10) {
    throw new Error('Expected foreign-key constraints are incomplete.');
  }
}