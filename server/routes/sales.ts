import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../db';
import { authenticate, authorize, getUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createAuditLog } from '../middleware/audit';
import { createSaleSchema } from '../schemas';

const router = Router();

// GET /api/sales
router.get('/', authenticate, authorize('admin', 'sales'), async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query(`
      SELECT s.*, c.name as customer_name, c.phone as customer_phone,
        u.name as seller_name, u.email as seller_email,
        p.brand, p.model, p.storage, p.colour, iu.stock_tag
      FROM sales s
      JOIN customers c ON c.id = s.customer_id
      JOIN users u ON u.id = s.sold_by
      JOIN inventory_units iu ON iu.id = s.inventory_unit_id
      JOIN products p ON p.id = iu.product_id
      ORDER BY s.sold_at DESC
      LIMIT 200
    `);
    res.json(rows.map(r => ({
      id: r.id, inventoryUnitId: r.inventory_unit_id,
      customerName: r.customer_name, customerPhone: r.customer_phone,
      sellerName: r.seller_name, brand: r.brand, model: r.model,
      storage: r.storage, colour: r.colour, stockTag: r.stock_tag,
      salePriceInr: r.sale_price_inr, discountInr: r.discount_inr,
      notes: r.notes, soldAt: r.sold_at,
    })));
  } catch (err) {
    console.error('Sales list error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/sales - Record a sale (transactional)
router.post('/', authenticate, authorize('admin', 'sales'), validate(createSaleSchema), async (req: Request, res: Response) => {
  try {
    const result = await withTransaction(async (client) => {
      const { inventoryUnitId, customerId, customerName, customerPhone, customerEmail,
        salePriceInr, discountInr, reservationId, notes } = req.body;

      // Find or create customer
      let actualCustomerId = customerId;
      if (!actualCustomerId) {
        const contactKey = customerPhone || `walk-in-${inventoryUnitId}`;
        const { rows: existing } = await client.query(
          'SELECT id FROM customers WHERE phone = $1', [contactKey]
        );
        if (existing.length > 0) {
          actualCustomerId = existing[0].id;
        } else {
          const { rows: newCust } = await client.query(
            'INSERT INTO customers (name, phone, email) VALUES ($1, $2, $3) RETURNING id',
            [customerName || 'Walk-in', contactKey, customerEmail || null]
          );
          actualCustomerId = newCust[0].id;
        }
      }

      // Lock inventory unit
      const { rows: units } = await client.query(
        'SELECT * FROM inventory_units WHERE id = $1 FOR UPDATE',
        [inventoryUnitId]
      );
      if (units.length === 0) throw new Error('UNIT_NOT_FOUND');
      const unit = units[0];
      if (unit.status === 'sold') throw new Error('ALREADY_SOLD');
      if (unit.status === 'retired') throw new Error('UNIT_RETIRED');

      // If unit is reserved, verify reservation exists
      if (unit.status === 'reserved' && reservationId) {
        const { rows: res } = await client.query(
          `SELECT * FROM reservations WHERE id = $1 AND inventory_unit_id = $2 AND status IN ('pending', 'active')`,
          [reservationId, inventoryUnitId]
        );
        if (res.length === 0) throw new Error('RESERVATION_MISMATCH');
        // Convert reservation
        await client.query(
          `UPDATE reservations SET status = 'converted', updated_at = now() WHERE id = $1`,
          [reservationId]
        );
      } else if (unit.status === 'reserved' && !reservationId) {
        throw new Error('RESERVATION_REQUIRED');
      }

      // Mark unit as sold
      await client.query(
        `UPDATE inventory_units SET status = 'sold', sale_price_inr = $1, updated_at = now() WHERE id = $2`,
        [salePriceInr, inventoryUnitId]
      );

      // Create sale record
      const { rows: saleRows } = await client.query(
        `INSERT INTO sales (inventory_unit_id, customer_id, sold_by, sale_price_inr, discount_inr, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [inventoryUnitId, actualCustomerId, getUser(req)!.id, salePriceInr, discountInr || 0, notes || null]
      );

      // Cancel any active reservations for this unit
      await client.query(
        `UPDATE reservations SET status = 'converted', updated_at = now()
         WHERE inventory_unit_id = $1 AND status IN ('pending', 'active')`,
        [inventoryUnitId]
      );

      await createAuditLog(req, 'SALE_CREATED', 'sale', saleRows[0].id, {
        inventoryUnitId, salePriceInr,
      }, client);

      return { sale: saleRows[0], customerId: actualCustomerId };
    });
    res.status(201).json({
      id: result.sale.id,
      inventoryUnitId: result.sale.inventory_unit_id,
      salePriceInr: result.sale.sale_price_inr,
      soldAt: result.sale.sold_at,
    });
  } catch (err: any) {
    const errorMap: Record<string, [number, string]> = {
      UNIT_NOT_FOUND: [404, 'Inventory unit not found.'],
      ALREADY_SOLD: [409, 'This unit has already been sold.'],
      UNIT_RETIRED: [400, 'This unit is no longer available.'],
      CUSTOMER_REQUIRED: [400, 'Customer information required.'],
      RESERVATION_REQUIRED: [400, 'Reservation ID required for reserved units.'],
      RESERVATION_MISMATCH: [400, 'Reservation does not match this unit.'],
    };
    const mapped = errorMap[err.message];
    if (mapped) return res.status(mapped[0]).json({ error: mapped[1] });
    console.error('Sale create error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/sales/metrics
router.get('/metrics', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { rows: products } = await pool.query('SELECT COUNT(*)::int as total FROM products');
    const { rows: available } = await pool.query("SELECT COUNT(*)::int as total FROM inventory_units WHERE status = 'available'");
    const { rows: reserved } = await pool.query("SELECT COUNT(*)::int as total FROM inventory_units WHERE status = 'reserved'");
    const { rows: sold } = await pool.query("SELECT COUNT(*)::int as total FROM inventory_units WHERE status = 'sold'");
    const { rows: totalValue } = await pool.query("SELECT COALESCE(SUM(sale_price_inr), 0)::bigint as total FROM inventory_units WHERE status = 'available'");
    const { rows: totalRevenue } = await pool.query("SELECT COALESCE(SUM(sale_price_inr), 0)::bigint as total FROM inventory_units WHERE status = 'sold'");
    const { rows: avgPrice } = await pool.query("SELECT COALESCE(AVG(sale_price_inr), 0)::bigint as avg FROM inventory_units WHERE status = 'available' AND sale_price_inr > 0");

    res.json({
      totalProducts: products[0].total,
      availableUnits: available[0].total,
      reservedUnits: reserved[0].total,
      soldUnits: sold[0].total,
      totalStockValue: totalValue[0].total,
      totalRevenue: totalRevenue[0].total,
      avgUnitPrice: avgPrice[0].avg,
    });
  } catch (err) {
    console.error('Metrics error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
