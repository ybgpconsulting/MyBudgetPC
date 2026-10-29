import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../db';
import { authenticate, authorize, getUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createAuditLog } from '../middleware/audit';
import { createReservationSchema, cancelReservationSchema } from '../schemas';

const router = Router();

// GET /api/reservations
router.get('/', authenticate, authorize('admin', 'sales'), async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT r.*, c.name as customer_name, c.phone as customer_phone,
        iu.stock_tag, p.brand, p.model, p.storage
      FROM reservations r
      JOIN customers c ON c.id = r.customer_id
      JOIN inventory_units iu ON iu.id = r.inventory_unit_id
      JOIN products p ON p.id = iu.product_id
    `;
    const values: unknown[] = [];
    if (status) { query += ' WHERE r.status = $1'; values.push(status); }
    query += ' ORDER BY r.created_at DESC LIMIT 100';
    const { rows } = await pool.query(query, values);
    res.json(rows.map(r => ({
      id: r.id, inventoryUnitId: r.inventory_unit_id, customerId: r.customer_id,
      customerName: r.customer_name, customerPhone: r.customer_phone,
      stockTag: r.stock_tag, brand: r.brand, model: r.model, storage: r.storage,
      status: r.status, expiresAt: r.expires_at, notes: r.notes, createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('Reservations list error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/reservations - Create reservation
router.post('/', authenticate, authorize('admin', 'sales'), validate(createReservationSchema), async (req: Request, res: Response) => {
  try {
    const result = await withTransaction(async (client) => {
      const { inventoryUnitId, customerId, customerName, customerPhone, customerEmail, durationMinutes, notes } = req.body;

      // Find or create customer
      let actualCustomerId = customerId;
      if (!actualCustomerId) {
        const contactKey = customerPhone || `walk-in-${inventoryUnitId}`;
        const { rows: customer } = await client.query(
          `INSERT INTO customers (name, phone, email) VALUES ($1, $2, $3)
           ON CONFLICT (phone) DO UPDATE SET email = COALESCE(EXCLUDED.email, customers.email)
           RETURNING id`,
          [customerName || 'Walk-in', contactKey, customerEmail || null]
        );
        actualCustomerId = customer[0].id;
      }

      // Lock inventory unit
      const { rows: units } = await client.query(
        'SELECT * FROM inventory_units WHERE id = $1 FOR UPDATE',
        [inventoryUnitId]
      );
      if (units.length === 0) throw new Error('UNIT_NOT_FOUND');
      if (units[0].status !== 'available') throw new Error('UNIT_NOT_AVAILABLE');

      // Cancel any existing active reservations for this unit
      await client.query(
        `UPDATE reservations SET status = 'cancelled', updated_at = now()
         WHERE inventory_unit_id = $1 AND status IN ('pending', 'active')`,
        [inventoryUnitId]
      );

      // Create reservation
      const expiresAt = new Date(Date.now() + (durationMinutes || 120) * 60 * 1000);
      const { rows: resRows } = await client.query(
        `INSERT INTO reservations (inventory_unit_id, customer_id, status, expires_at, created_by, notes)
         VALUES ($1, $2, 'active', $3, $4, $5) RETURNING *`,
        [inventoryUnitId, actualCustomerId, expiresAt, getUser(req)!.id, notes || null]
      );

      // Mark unit as reserved
      await client.query(
        `UPDATE inventory_units SET status = 'reserved', updated_at = now() WHERE id = $1`,
        [inventoryUnitId]
      );

      await createAuditLog(req, 'RESERVATION_CREATED', 'reservation', resRows[0].id, {
        inventoryUnitId,
      }, client);

      return { reservation: resRows[0], customerId: actualCustomerId };
    });
    res.status(201).json({
      id: result.reservation.id,
      inventoryUnitId: result.reservation.inventory_unit_id,
      customerId: result.customerId,
      status: result.reservation.status,
      expiresAt: result.reservation.expires_at,
    });
  } catch (err: any) {
    if (err.message === 'UNIT_NOT_FOUND') return res.status(404).json({ error: 'Inventory unit not found.' });
    if (err.message === 'UNIT_NOT_AVAILABLE') return res.status(409).json({ error: 'Unit is not available for reservation.' });
    if (err.message === 'CUSTOMER_REQUIRED') return res.status(400).json({ error: 'Customer information required.' });
    console.error('Reservation create error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/reservations/cancel
router.post('/cancel', authenticate, authorize('admin', 'sales'), validate(cancelReservationSchema), async (req: Request, res: Response) => {
  try {
    const { reservationId, reason } = req.body;
    await withTransaction(async (client) => {
      const { rows } = await client.query(
        'SELECT * FROM reservations WHERE id = $1 FOR UPDATE',
        [reservationId]
      );
      if (rows.length === 0) throw new Error('NOT_FOUND');
      const r = rows[0];
      if (r.status === 'cancelled' || r.status === 'expired' || r.status === 'converted') {
        throw new Error('ALREADY_CLOSED');
      }

      await client.query(
        `UPDATE reservations SET status = 'cancelled', updated_at = now() WHERE id = $1`,
        [reservationId]
      );
      await client.query(
        `UPDATE inventory_units SET status = 'available', updated_at = now() WHERE id = $1 AND status = 'reserved'`,
        [r.inventory_unit_id]
      );
      await createAuditLog(req, 'RESERVATION_CANCELLED', 'reservation', reservationId, { reason }, client);
    });
    res.json({ message: 'Reservation cancelled.' });
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') return res.status(404).json({ error: 'Reservation not found.' });
    if (err.message === 'ALREADY_CLOSED') return res.status(400).json({ error: 'Reservation already closed.' });
    console.error('Reservation cancel error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/reservations/expire - Expire overdue reservations
router.post('/expire', authenticate, authorize('admin'), async (req: Request, res: Response) => {
  try {
    const expiredCount = await withTransaction(async (client) => {
      const { rows: expired } = await client.query(
        `UPDATE reservations SET status = 'expired', updated_at = now()
         WHERE status IN ('pending', 'active') AND expires_at < now()
         RETURNING id, inventory_unit_id`
      );
      for (const r of expired) {
        await client.query(
          `UPDATE inventory_units SET status = 'available', updated_at = now()
           WHERE id = $1 AND status = 'reserved'`,
          [r.inventory_unit_id]
        );
        await createAuditLog(req, 'RESERVATION_EXPIRED', 'reservation', r.id, { inventoryUnitId: r.inventory_unit_id }, client);
      }
      return expired.length;
    });
    res.json({ expired: expiredCount });
  } catch (err) {
    console.error('Reservation expire error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
