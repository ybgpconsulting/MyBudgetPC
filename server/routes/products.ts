import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../db';
import { authenticate, authorize, getUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createAuditLog } from '../middleware/audit';
import { createProductSchema, updateProductSchema, productFilterSchema } from '../schemas';

const router = Router();

// GET /api/products - Public catalog
router.get('/', async (req: Request, res: Response) => {
  try {
    const params = productFilterSchema.parse(req.query);
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (params.category) { conditions.push(`p.category = $${idx++}`); values.push(params.category); }
    if (params.brand) { conditions.push(`p.brand = $${idx++}`); values.push(params.brand); }
    if (params.storage) { conditions.push(`p.storage = $${idx++}`); values.push(params.storage); }
    if (params.condition) { conditions.push(`p.condition_grade = $${idx++}`); values.push(params.condition); }
    if (params.minPrice !== undefined) { conditions.push(`p.price_inr >= $${idx++}`); values.push(params.minPrice); }
    if (params.maxPrice !== undefined) { conditions.push(`p.price_inr <= $${idx++}`); values.push(params.maxPrice); }
    if (params.minBatteryHealth !== undefined) { conditions.push(`p.battery_health >= $${idx++}`); values.push(params.minBatteryHealth); }
    if (params.featured !== undefined) { conditions.push(`p.featured = $${idx++}`); values.push(params.featured); }
    if (params.priceDrop !== undefined) { conditions.push(`p.price_drop = $${idx++}`); values.push(params.priceDrop); }
    if (params.search) {
      conditions.push(`(p.brand ILIKE $${idx} OR p.model ILIKE $${idx} OR p.stock_tag ILIKE $${idx} OR p.colour ILIKE $${idx})`);
      values.push(`%${params.search}%`);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let havingClause = '';
    if (params.availableOnly) {
      havingClause = `HAVING COUNT(iu.id) FILTER (WHERE iu.status = 'available') > 0`;
    }

    const sortMap: Record<string, string> = {
      'price-asc': 'p.price_inr ASC',
      'price-desc': 'p.price_inr DESC',
      'battery-desc': 'p.battery_health DESC NULLS LAST',
      'newest': 'p.created_at DESC',
      'featured': 'p.featured DESC, p.created_at DESC',
    };
    const orderBy = sortMap[params.sort || 'featured'] || 'p.featured DESC, p.created_at DESC';
    const offset = (params.page - 1) * params.limit;

    const countQuery = `
      SELECT COUNT(DISTINCT p.id)::int as total
      FROM products p
      LEFT JOIN inventory_units iu ON iu.product_id = p.id
      ${params.availableOnly
        ? `${where ? `${where} AND` : 'WHERE'} EXISTS (SELECT 1 FROM inventory_units available_unit WHERE available_unit.product_id = p.id AND available_unit.status = 'available')`
        : where}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = countResult.rows[0]?.total || 0;

    const dataQuery = `
      SELECT p.*,
        COUNT(iu.id)::int AS total_units,
        COUNT(iu.id) FILTER (WHERE iu.status = 'available')::int AS available_units,
        COUNT(iu.id) FILTER (WHERE iu.status = 'reserved')::int AS reserved_units,
        COUNT(iu.id) FILTER (WHERE iu.status = 'sold')::int AS sold_units
      FROM products p
      LEFT JOIN inventory_units iu ON iu.product_id = p.id
      ${where}
      GROUP BY p.id
      ${havingClause}
      ORDER BY ${orderBy}
      LIMIT $${idx++} OFFSET $${idx++}
    `;
    values.push(params.limit, offset);
    const { rows } = await pool.query(dataQuery, values);

    // Get images for each product
    const productIds = rows.map((r: any) => r.id);
    let imageMap: Record<string, any[]> = {};
    if (productIds.length > 0) {
      const { rows: images } = await pool.query(
        `SELECT * FROM product_images WHERE product_id = ANY($1::uuid[]) ORDER BY sort_order`,
        [productIds]
      );
      for (const img of images) {
        if (!imageMap[img.product_id]) imageMap[img.product_id] = [];
        imageMap[img.product_id].push(img);
      }
    }

    const unitMap: Record<string, any[]> = {};
    if (productIds.length > 0) {
      const { rows: units } = await pool.query(
        `SELECT id, product_id, stock_tag, imei, status, sale_price_inr, inspection, created_at, updated_at
         FROM inventory_units WHERE product_id = ANY($1::uuid[]) ORDER BY created_at`,
        [productIds]
      );
      for (const unit of units) {
        if (!unitMap[unit.product_id]) unitMap[unit.product_id] = [];
        unitMap[unit.product_id].push({ id: unit.id, productId: unit.product_id, stockTag: unit.stock_tag,
          imei: unit.imei, status: unit.status, salePriceInr: unit.sale_price_inr, inspection: unit.inspection,
          createdAt: unit.created_at, updatedAt: unit.updated_at });
      }
    }

    const products = rows.map((r: any) => ({
      id: r.id,
      category: r.category,
      brand: r.brand,
      model: r.model,
      storage: r.storage,
      colour: r.colour,
      colorHex: r.color_hex,
      conditionGrade: r.condition_grade,
      conditionDescription: r.condition_description,
      batteryHealth: r.battery_health,
      priceInr: r.price_inr,
      originalMsp: r.original_msp,
      billAvailable: r.bill_available,
      billAmount: r.bill_amount,
      priceDrop: r.price_drop,
      featured: r.featured,
      stockTag: r.stock_tag,
      screenSize: r.screen_size,
      ram: r.ram,
      processor: r.processor,
      inBox: r.in_box,
      keyFeatures: r.key_features,
      images: (imageMap[r.id] || []).map((i: any) => ({ url: i.url, altText: i.alt_text, sortOrder: i.sort_order, isPrimary: i.is_primary })),
      units: unitMap[r.id] || [],
      dateAdded: r.created_at?.toISOString?.()?.split('T')[0] || '',
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));

    res.json({ products, total, page: params.page, limit: params.limit, pages: Math.ceil(total / params.limit) });
  } catch (err: any) {
    if (err.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid query parameters.' });
    }
    console.error('Products list error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/products/:id - Public product detail
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT p.*,
        COUNT(iu.id)::int AS total_units,
        COUNT(iu.id) FILTER (WHERE iu.status = 'available')::int AS available_units
      FROM products p
      LEFT JOIN inventory_units iu ON iu.product_id = p.id
      WHERE p.id = $1
      GROUP BY p.id`,
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    const r = rows[0];
    const { rows: images } = await pool.query(
      `SELECT * FROM product_images WHERE product_id = $1 ORDER BY sort_order`,
      [id]
    );
    const { rows: units } = await pool.query(
      `SELECT id, product_id, stock_tag, imei, status, sale_price_inr, inspection, created_at, updated_at
       FROM inventory_units WHERE product_id = $1 ORDER BY created_at`, [id]
    );
    const { rows: inspections } = await pool.query(
      `SELECT * FROM device_inspections WHERE inventory_unit_id IN
        (SELECT id FROM inventory_units WHERE product_id = $1)
       ORDER BY created_at DESC LIMIT 1`,
      [id]
    );
    res.json({
      id: r.id,
      category: r.category,
      brand: r.brand,
      model: r.model,
      storage: r.storage,
      colour: r.colour,
      colorHex: r.color_hex,
      conditionGrade: r.condition_grade,
      conditionDescription: r.condition_description,
      batteryHealth: r.battery_health,
      priceInr: r.price_inr,
      originalMsp: r.original_msp,
      billAvailable: r.bill_available,
      billAmount: r.bill_amount,
      priceDrop: r.price_drop,
      featured: r.featured,
      stockTag: r.stock_tag,
      screenSize: r.screen_size,
      ram: r.ram,
      processor: r.processor,
      inBox: r.in_box,
      keyFeatures: r.key_features,
      images: images.map((i: any) => ({ url: i.url, altText: i.alt_text, sortOrder: i.sort_order, isPrimary: i.is_primary })),
      units: units.map((unit: any) => ({ id: unit.id, productId: unit.product_id, stockTag: unit.stock_tag,
        imei: unit.imei, status: unit.status, salePriceInr: unit.sale_price_inr, inspection: unit.inspection,
        createdAt: unit.created_at, updatedAt: unit.updated_at })),
      dateAdded: r.created_at?.toISOString?.()?.split('T')[0] || '',
      status: r.available_units > 0 ? 'available' : 'sold',
      inspection: inspections[0] ? { overallPass: inspections[0].overall_pass, physicalCondition: inspections[0].physical_condition,
        inspectedAt: inspections[0].created_at } : null,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    });
  } catch (err) {
    console.error('Product detail error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/products - Admin/Sales create product
router.post('/', authenticate, authorize('admin', 'sales'), validate(createProductSchema), async (req: Request, res: Response) => {
  try {
    const d = req.body;
    const stockTag = d.stockTag || `CK-${Date.now().toString(36).toUpperCase().slice(-6)}`;
    const productId = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `INSERT INTO products (category, brand, model, storage, colour, color_hex, price_inr, original_msp,
          bill_available, bill_amount, condition_grade, condition_description, battery_health,
          screen_size, ram, processor, stock_tag, price_drop, featured, in_box, key_features)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
         RETURNING id`,
        [d.category, d.brand, d.model, d.storage, d.colour, d.colorHex || null,
         d.priceInr, d.originalMsp || null, d.billAvailable, d.billAmount || null,
         d.conditionGrade, d.conditionDescription, d.batteryHealth || null,
         d.screenSize || null, d.ram || null, d.processor || null,
         stockTag, d.priceDrop, d.featured, JSON.stringify(d.inBox), d.keyFeatures]
      );
      const product = rows[0];
      await client.query(
        `INSERT INTO inventory_units (product_id, stock_tag, status, sale_price_inr, created_by)
         VALUES ($1, $2, 'available', $3, $4)`,
        [product.id, `${stockTag}-U1`, d.priceInr, getUser(req)!.id]
      );
      for (const image of d.images) {
        await client.query(
          `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
           VALUES ($1, $2, $3, $4, $5)`,
          [product.id, image.url, image.altText, image.sortOrder, image.isPrimary]
        );
      }
      await createAuditLog(req, 'PRODUCT_CREATED', 'product', product.id, { brand: d.brand, model: d.model }, client);
      return product.id;
    });

    const { rows: created } = await pool.query(
      `SELECT p.*, COALESCE(json_agg(DISTINCT jsonb_build_object(
         'id', iu.id, 'productId', iu.product_id, 'stockTag', iu.stock_tag, 'status', iu.status,
         'imei', iu.imei, 'salePriceInr', iu.sale_price_inr, 'inspection', iu.inspection
       )) FILTER (WHERE iu.id IS NOT NULL), '[]') AS units,
       COALESCE(json_agg(DISTINCT jsonb_build_object(
         'url', pi.url, 'altText', pi.alt_text, 'sortOrder', pi.sort_order, 'isPrimary', pi.is_primary
       )) FILTER (WHERE pi.id IS NOT NULL), '[]') AS images
       FROM products p LEFT JOIN inventory_units iu ON iu.product_id = p.id
       LEFT JOIN product_images pi ON pi.product_id = p.id WHERE p.id = $1 GROUP BY p.id`, [productId]
    );
    res.status(201).json({ ...created[0], colorHex: created[0].color_hex, priceInr: created[0].price_inr,
      originalMsp: created[0].original_msp, billAvailable: created[0].bill_available, billAmount: created[0].bill_amount,
      conditionGrade: created[0].condition_grade, conditionDescription: created[0].condition_description,
      batteryHealth: created[0].battery_health, screenSize: created[0].screen_size, stockTag: created[0].stock_tag,
      priceDrop: created[0].price_drop, inBox: created[0].in_box, keyFeatures: created[0].key_features,
      dateAdded: created[0].created_at, createdAt: created[0].created_at, updatedAt: created[0].updated_at });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Stock tag already exists.' });
    }
    console.error('Product create error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/products/:id - Admin/Sales update product
router.patch('/:id', authenticate, authorize('admin', 'sales'), validate(updateProductSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const d = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    const fieldMap: Record<string, string> = {
      category: 'category', brand: 'brand', model: 'model', storage: 'storage',
      colour: 'colour', colorHex: 'color_hex', priceInr: 'price_inr',
      originalMsp: 'original_msp', billAvailable: 'bill_available',
      billAmount: 'bill_amount', conditionGrade: 'condition_grade',
      conditionDescription: 'condition_description', batteryHealth: 'battery_health',
      screenSize: 'screen_size', ram: 'ram', processor: 'processor',
      stockTag: 'stock_tag', priceDrop: 'price_drop', featured: 'featured',
    };

    for (const [key, col] of Object.entries(fieldMap)) {
      if (d[key] !== undefined) {
        fields.push(`${col} = $${idx++}`);
        values.push(d[key]);
      }
    }
    if (d.inBox) {
      fields.push(`in_box = $${idx++}`);
      values.push(JSON.stringify(d.inBox));
    }
    if (d.keyFeatures) {
      fields.push(`key_features = $${idx++}`);
      values.push(d.keyFeatures);
    }

    fields.push(`updated_at = now()`);
    values.push(id);

    const updated = await withTransaction(async (client) => {
      const { rows } = await client.query(
        `UPDATE products SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id`,
        values
      );
      if (rows.length === 0) throw new Error('PRODUCT_NOT_FOUND');

      if (d.images) {
        await client.query('DELETE FROM product_images WHERE product_id = $1', [id]);
        for (const img of d.images) {
          await client.query(
            `INSERT INTO product_images (product_id, url, alt_text, sort_order, is_primary)
             VALUES ($1, $2, $3, $4, $5)`,
            [id, img.url, img.altText || '', img.sortOrder || 0, img.isPrimary || false]
          );
        }
      }

      if (d.priceInr !== undefined) {
        await client.query(
          `UPDATE inventory_units SET sale_price_inr = $1, updated_at = now()
           WHERE product_id = $2 AND status IN ('available', 'reserved')`,
          [d.priceInr, id]
        );
      }

      await createAuditLog(req, 'PRODUCT_UPDATED', 'product', id, { changes: Object.keys(d) }, client);
      return rows[0];
    }).catch(error => {
      if (error instanceof Error && error.message === 'PRODUCT_NOT_FOUND') return null;
      throw error;
    });
    if (!updated) return res.status(404).json({ error: 'Product not found.' });
    res.json({ message: 'Product updated.' });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Stock tag already exists.' });
    }
    console.error('Product update error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/products/:id - Admin only
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const deleted = await withTransaction(async (client) => {
      const { rows: sales } = await client.query(
        `SELECT 1 FROM sales s JOIN inventory_units iu ON iu.id = s.inventory_unit_id
         WHERE iu.product_id = $1 LIMIT 1`, [id]
      );
      if (sales.length > 0) throw new Error('PRODUCT_HAS_SALES');
      const { rows } = await client.query('DELETE FROM products WHERE id = $1 RETURNING id, model', [id]);
      if (rows.length === 0) throw new Error('PRODUCT_NOT_FOUND');
      await createAuditLog(req, 'PRODUCT_DELETED', 'product', id, { model: rows[0].model }, client);
      return rows[0];
    });
    res.json({ message: 'Product deleted.' });
  } catch (err: any) {
    if (err.message === 'PRODUCT_NOT_FOUND') return res.status(404).json({ error: 'Product not found.' });
    if (err.message === 'PRODUCT_HAS_SALES') return res.status(409).json({ error: 'Sold products cannot be deleted.' });
    console.error('Product delete error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/products/:id/inventory - Get inventory units for a product
router.get('/:id/inventory', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rows } = await pool.query(
      `SELECT * FROM inventory_units WHERE product_id = $1 ORDER BY created_at DESC`,
      [id]
    );
    res.json(rows.map(r => ({
      id: r.id,
      stockTag: r.stock_tag,
      imei: r.imei,
      status: r.status,
      salePriceInr: r.sale_price_inr,
      inspection: r.inspection,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('Inventory list error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
