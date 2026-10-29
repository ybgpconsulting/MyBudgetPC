import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../db';
import { authenticate, authorize, getUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createAuditLog } from '../middleware/audit';
import { createInventoryUnitSchema, updateInventoryStatusSchema } from '../schemas';
import { assertInventoryTransition } from '../domain/inventory';

const router = Router();

// GET /api/inventory - List all inventory units
router.get('/', authenticate, authorize('admin', 'sales'), async (req: Request, res: Response) => {
  try {
    const { status, productId } = req.query;
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (status) { conditions.push(`iu.status = $${idx++}`); values.push(status); }
    if (productId) { conditions.push(`iu.product_id = $${idx++}`); values.push(productId); }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const { rows } = await pool.query(
      `SELECT iu.*, p.brand, p.model, p.storage, p.colour, p.price_inr, p.stock_tag as product_stock_tag
       FROM inventory_units iu
       JOIN products p ON p.id = iu.product_id
       ${where}
       ORDER BY iu.created_at DESC`,
      values
    );
    res.json(rows.map(r => ({
      id: r.id,
      productId: r.product_id,
      stockTag: r.stock_tag,
      imei: r.imei,
      status: r.status,
      salePriceInr: r.sale_price_inr,
      brand: r.brand,
      model: r.model,
      storage: r.storage,
      colour: r.colour,
      priceInr: r.price_inr,
      productStockTag: r.product_stock_tag,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('Inventory list error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/inventory - Create inventory unit
router.post('/', authenticate, authorize('admin'), validate(createInventoryUnitSchema), async (req: Request, res: Response) => {
  try {
    const { productId, stockTag, imei, salePriceInr } = req.body;
    const rows = await withTransaction(async (client) => {
      const { rows: inserted } = await client.query(
        `INSERT INTO inventory_units (product_id, stock_tag, imei, sale_price_inr, created_by)
         VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [productId, stockTag, imei || null, salePriceInr || null, getUser(req)!.id]
      );
      await createAuditLog(req, 'INVENTORY_CREATED', 'inventory_unit', inserted[0].id, { stockTag, productId }, client);
      return inserted;
    });
    res.status(201).json({
      id: rows[0].id,
      productId: rows[0].product_id,
      stockTag: rows[0].stock_tag,
      status: rows[0].status,
    });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Stock tag already exists.' });
    }
    console.error('Inventory create error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/inventory/:id/status - Status transition
router.patch('/:id/status', authenticate, authorize('admin'), validate(updateInventoryStatusSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const result = await withTransaction(async (client) => {
      // Lock the row
      const { rows: current } = await client.query(
        'SELECT * FROM inventory_units WHERE id = $1 FOR UPDATE',
        [id]
      );
      if (current.length === 0) throw new Error('NOT_FOUND');
      const unit = current[0];

      // Validate status transition using the canonical domain rules.
      assertInventoryTransition(unit.status, status);

      if (unit.status === 'sold' && status === 'available') {
        const { rows: sales } = await client.query(
          'SELECT id, sale_price_inr, sold_by FROM sales WHERE inventory_unit_id = $1 FOR UPDATE',
          [id]
        );
        for (const sale of sales) {
          await createAuditLog(req, 'SALE_REVERSED', 'sale', sale.id, {
            inventoryUnitId: id,
            salePriceInr: sale.sale_price_inr,
            soldBy: sale.sold_by,
            reason: 'Admin restored sold stock to available',
          }, client);
        }
        await client.query('DELETE FROM sales WHERE inventory_unit_id = $1', [id]);
        await client.query(
          `UPDATE reservations SET status = 'cancelled', updated_at = now()
           WHERE inventory_unit_id = $1 AND status = 'converted'`,
          [id]
        );
      }

      const { rows } = await client.query(
        `UPDATE inventory_units SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
        [status, id]
      );
      await createAuditLog(req, 'INVENTORY_STATUS_CHANGED', 'inventory_unit', rows[0].id, {
        from: unit.status, to: status,
      }, client);
      return rows[0];
    });
    res.json({ id: result.id, status: result.status });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Inventory unit not found.' });
    }
    if (err.message?.startsWith('INVALID_TRANSITION')) {
      return res.status(400).json({ error: err.message });
    }
    console.error('Status update error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/inventory/:id - Admin permanently removes an unsold inventory unit.
router.delete('/:id', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const result = await withTransaction(async (client) => {
      const { rows: current } = await client.query(
        'SELECT * FROM inventory_units WHERE id = $1 FOR UPDATE', [id]
      );
      if (current.length === 0) throw new Error('NOT_FOUND');
      const unit = current[0];

      if (unit.status === 'sold') throw new Error('UNIT_HAS_SALE');

      await client.query('DELETE FROM device_inspections WHERE inventory_unit_id = $1', [id]);
      await client.query('DELETE FROM device_verifications WHERE inventory_unit_id = $1', [id]);
      await client.query('DELETE FROM reservations WHERE inventory_unit_id = $1', [id]);

      const { rows } = await client.query(
        'DELETE FROM inventory_units WHERE id = $1 RETURNING *',
        [id]
      );
      const { rows: remainingUnits } = await client.query(
        'SELECT 1 FROM inventory_units WHERE product_id = $1 LIMIT 1',
        [unit.product_id]
      );
      if (remainingUnits.length === 0) {
        await client.query('DELETE FROM products WHERE id = $1', [unit.product_id]);
      }
      await createAuditLog(req, 'INVENTORY_DELETED', 'inventory_unit', id, {
        stockTag: unit.stock_tag, status: unit.status,
      }, client);
      return rows[0];
    });
    res.json({ message: 'Inventory unit deleted.', id: result.id });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Inventory unit not found.' });
    if (err.message === 'UNIT_HAS_SALE') return res.status(409).json({ error: 'Sold stock cannot be deleted. Restore or retain the sale record instead.' });
    console.error('Inventory deactivate error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
