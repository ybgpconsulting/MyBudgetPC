import { Router, Request, Response } from 'express';
import { pool } from '../db';
import { authenticate, authorize } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createAuditLog } from '../middleware/audit';
import { createCustomerSchema, updateCustomerSchema } from '../schemas';

const router = Router();

// GET /api/customers
router.get('/', authenticate, authorize('admin', 'sales'), async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let query = 'SELECT * FROM customers';
    const values: unknown[] = [];
    if (search) {
      query += ' WHERE name ILIKE $1 OR phone ILIKE $1 OR email ILIKE $1';
      values.push(`%${search}%`);
    }
    query += ' ORDER BY created_at DESC LIMIT 100';
    const { rows } = await pool.query(query, values);
    res.json(rows.map(r => ({
      id: r.id, name: r.name, phone: r.phone, email: r.email,
      notes: r.notes, createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('Customers list error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/customers/:id
router.get('/:id', authenticate, authorize('admin', 'sales'), async (req: Request, res: Response) => {
  try {
    const { rows } = await pool.query('SELECT * FROM customers WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found.' });
    const r = rows[0];
    res.json({ id: r.id, name: r.name, phone: r.phone, email: r.email, notes: r.notes, createdAt: r.created_at });
  } catch (err) {
    console.error('Customer detail error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/customers
router.post('/', authenticate, authorize('admin', 'sales'), validate(createCustomerSchema), async (req: Request, res: Response) => {
  try {
    const { name, phone, email, notes } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO customers (name, phone, email, notes) VALUES ($1, $2, $3, $4)
       ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name, email = COALESCE(EXCLUDED.email, customers.email), notes = COALESCE(EXCLUDED.notes, customers.notes)
       RETURNING *`,
      [name, phone, email || null, notes || '']
    );
    await createAuditLog(req, 'CUSTOMER_CREATED', 'customer', rows[0].id, { name, phone });
    res.status(201).json({
      id: rows[0].id, name: rows[0].name, phone: rows[0].phone,
      email: rows[0].email, notes: rows[0].notes,
    });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'A customer with this phone already exists.' });
    console.error('Customer create error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/customers/:id
router.patch('/:id', authenticate, authorize('admin', 'sales'), validate(updateCustomerSchema), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const d = req.body;
    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;
    if (d.name !== undefined) { fields.push(`name = $${idx++}`); values.push(d.name); }
    if (d.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(d.phone); }
    if (d.email !== undefined) { fields.push(`email = $${idx++}`); values.push(d.email); }
    if (d.notes !== undefined) { fields.push(`notes = $${idx++}`); values.push(d.notes); }
    if (fields.length === 0) return res.status(400).json({ error: 'No fields to update.' });
    fields.push('updated_at = now()');
    values.push(id);
    const { rows } = await pool.query(`UPDATE customers SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`, values);
    if (rows.length === 0) return res.status(404).json({ error: 'Customer not found.' });
    await createAuditLog(req, 'CUSTOMER_UPDATED', 'customer', id, { fields: fields.filter(f => !f.includes('updated_at')) });
    res.json({ id: rows[0].id, name: rows[0].name, phone: rows[0].phone, email: rows[0].email });
  } catch (err: any) {
    if (err.code === '23505') return res.status(409).json({ error: 'A customer with this phone already exists.' });
    console.error('Customer update error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
