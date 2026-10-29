CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- TYPES
-- ============================================================

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('sales', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE inventory_status AS ENUM ('available', 'reserved', 'sold', 'retired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE reservation_status AS ENUM ('pending', 'active', 'expired', 'cancelled', 'converted');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE verification_status AS ENUM ('requested', 'pending', 'verified', 'failed', 'unavailable');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- USERS
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- PRODUCTS
-- ============================================================

CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL DEFAULT 'Phones',
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  storage TEXT NOT NULL DEFAULT 'N/A',
  colour TEXT NOT NULL DEFAULT '',
  color_hex TEXT,
  price_inr INTEGER NOT NULL CHECK (price_inr >= 0),
  original_msp INTEGER,
  bill_available BOOLEAN NOT NULL DEFAULT false,
  bill_amount INTEGER,
  condition_grade TEXT NOT NULL DEFAULT 'Like New (Flawless)',
  condition_description TEXT NOT NULL DEFAULT '',
  battery_health INTEGER CHECK (battery_health IS NULL OR (battery_health >= 0 AND battery_health <= 100)),
  screen_size TEXT,
  ram TEXT,
  processor TEXT,
  stock_tag TEXT UNIQUE,
  price_drop BOOLEAN NOT NULL DEFAULT false,
  featured BOOLEAN NOT NULL DEFAULT false,
  in_box JSONB NOT NULL DEFAULT '{"chargerIncluded":true,"originalBox":true,"taxInvoiceProvided":true,"cableIncluded":true}',
  key_features TEXT[] NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- INVENTORY UNITS
-- ============================================================

CREATE TABLE IF NOT EXISTS inventory_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  stock_tag TEXT NOT NULL UNIQUE,
  imei TEXT CHECK (imei IS NULL OR length(imei) = 15),
  status inventory_status NOT NULL DEFAULT 'available',
  sale_price_inr INTEGER,
  inspection JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inventory_units_product_status ON inventory_units(product_id, status);
CREATE INDEX IF NOT EXISTS idx_inventory_units_status ON inventory_units(status);

-- ============================================================
-- PRODUCT IMAGES
-- ============================================================

CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_images_product ON product_images(product_id, sort_order);

-- ============================================================
-- CUSTOMERS
-- ============================================================

CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_phone_unique ON customers(phone);

-- ============================================================
-- RESERVATIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_unit_id UUID NOT NULL REFERENCES inventory_units(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  status reservation_status NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL,
  created_by UUID REFERENCES users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_reservation_per_unit
  ON reservations (inventory_unit_id) WHERE status IN ('pending', 'active');
CREATE INDEX IF NOT EXISTS idx_reservations_expiry ON reservations(expires_at) WHERE status IN ('pending', 'active');
CREATE INDEX IF NOT EXISTS idx_reservations_unit ON reservations(inventory_unit_id);

-- ============================================================
-- SALES
-- ============================================================

CREATE TABLE IF NOT EXISTS sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_unit_id UUID NOT NULL UNIQUE REFERENCES inventory_units(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  sold_by UUID NOT NULL REFERENCES users(id),
  sale_price_inr INTEGER NOT NULL CHECK (sale_price_inr >= 0),
  discount_inr INTEGER NOT NULL DEFAULT 0 CHECK (discount_inr >= 0),
  notes TEXT,
  sold_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_sales_seller ON sales(sold_by);

-- ============================================================
-- DEVICE INSPECTIONS
-- ============================================================

CREATE TABLE IF NOT EXISTS device_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_unit_id UUID NOT NULL REFERENCES inventory_units(id),
  inspected_by UUID REFERENCES users(id),
  display_ok BOOLEAN NOT NULL DEFAULT false,
  touch_ok BOOLEAN NOT NULL DEFAULT false,
  battery_ok BOOLEAN NOT NULL DEFAULT false,
  cameras_ok BOOLEAN NOT NULL DEFAULT false,
  speakers_ok BOOLEAN NOT NULL DEFAULT false,
  microphone_ok BOOLEAN NOT NULL DEFAULT false,
  charging_ok BOOLEAN NOT NULL DEFAULT false,
  biometric_ok BOOLEAN NOT NULL DEFAULT false,
  true_tone_ok BOOLEAN,
  sensors_ok BOOLEAN NOT NULL DEFAULT false,
  buttons_ok BOOLEAN NOT NULL DEFAULT false,
  network_ok BOOLEAN NOT NULL DEFAULT false,
  wifi_ok BOOLEAN NOT NULL DEFAULT false,
  bluetooth_ok BOOLEAN NOT NULL DEFAULT false,
  physical_condition TEXT NOT NULL DEFAULT '',
  replaced_parts TEXT NOT NULL DEFAULT '',
  technician_notes TEXT NOT NULL DEFAULT '',
  overall_pass BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inspections_unit ON device_inspections(inventory_unit_id);

-- ============================================================
-- DEVICE VERIFICATIONS (IMEI)
-- ============================================================

CREATE TABLE IF NOT EXISTS device_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_unit_id UUID REFERENCES inventory_units(id),
  imei TEXT NOT NULL CHECK (length(imei) = 15),
  status verification_status NOT NULL DEFAULT 'requested',
  provider TEXT,
  provider_reference TEXT,
  result JSONB,
  requested_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_verifications_imei ON device_verifications(imei, created_at DESC);

-- ============================================================
-- AUDIT LOGS
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS request_id TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS ip_address TEXT;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;

