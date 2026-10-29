import { Router, Request, Response } from 'express';
import { pool, withTransaction } from '../db';
import { authenticate, authorize, getUser } from '../middleware/authenticate';
import { validate } from '../middleware/validate';
import { createAuditLog } from '../middleware/audit';
import { createInspectionSchema } from '../schemas';

const router = Router();

// GET /api/inspections - List inspections
router.get('/', authenticate, authorize('admin', 'sales'), async (req: Request, res: Response) => {
  try {
    const { unitId } = req.query;
    let query = `
      SELECT di.*, u.name as inspector_name, iu.stock_tag, p.brand, p.model
      FROM device_inspections di
      LEFT JOIN users u ON u.id = di.inspected_by
      JOIN inventory_units iu ON iu.id = di.inventory_unit_id
      JOIN products p ON p.id = iu.product_id
    `;
    const values: unknown[] = [];
    if (unitId) { query += ' WHERE di.inventory_unit_id = $1'; values.push(unitId); }
    query += ' ORDER BY di.created_at DESC LIMIT 100';
    const { rows } = await pool.query(query, values);
    res.json(rows.map(r => ({
      id: r.id, inventoryUnitId: r.inventory_unit_id,
      stockTag: r.stock_tag, brand: r.brand, model: r.model,
      inspectorName: r.inspector_name, displayOk: r.display_ok,
      touchOk: r.touch_ok, batteryOk: r.battery_ok, camerasOk: r.cameras_ok,
      speakersOk: r.speakers_ok, microphoneOk: r.microphone_ok,
      chargingOk: r.charging_ok, biometricOk: r.biometric_ok,
      trueToneOk: r.true_tone_ok, sensorsOk: r.sensors_ok,
      buttonsOk: r.buttons_ok, networkOk: r.network_ok,
      wifiOk: r.wifi_ok, bluetoothOk: r.bluetooth_ok,
      physicalCondition: r.physical_condition, replacedParts: r.replaced_parts,
      technicianNotes: r.technician_notes, overallPass: r.overall_pass,
      createdAt: r.created_at,
    })));
  } catch (err) {
    console.error('Inspections list error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/inspections - Create inspection
router.post('/', authenticate, authorize('admin', 'sales'), validate(createInspectionSchema), async (req: Request, res: Response) => {
  try {
    const d = req.body;
    const overallPass = d.displayOk && d.touchOk && d.batteryOk && d.camerasOk &&
      d.speakersOk && d.microphoneOk && d.chargingOk && d.biometricOk &&
      d.sensorsOk && d.buttonsOk && d.networkOk && d.wifiOk && d.bluetoothOk;

    const result = await withTransaction(async (client) => {
      const { rows: units } = await client.query('SELECT id FROM inventory_units WHERE id = $1 FOR UPDATE', [d.inventoryUnitId]);
      if (units.length === 0) throw new Error('UNIT_NOT_FOUND');
      const { rows } = await client.query(
        `INSERT INTO device_inspections
        (inventory_unit_id, inspected_by, display_ok, touch_ok, battery_ok, cameras_ok,
         speakers_ok, microphone_ok, charging_ok, biometric_ok, true_tone_ok,
         sensors_ok, buttons_ok, network_ok, wifi_ok, bluetooth_ok,
         physical_condition, replaced_parts, technician_notes, overall_pass)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
       RETURNING *`,
        [d.inventoryUnitId, getUser(req)!.id, d.displayOk, d.touchOk, d.batteryOk, d.camerasOk,
       d.speakersOk, d.microphoneOk, d.chargingOk, d.biometricOk, d.trueToneOk ?? null,
       d.sensorsOk, d.buttonsOk, d.networkOk, d.wifiOk, d.bluetoothOk,
       d.physicalCondition, d.replacedParts, d.technicianNotes, overallPass]
      );

    // Store summary on inventory unit inspection field
      await client.query(
        `UPDATE inventory_units SET inspection = $1, updated_at = now() WHERE id = $2`,
        [JSON.stringify({
        overallPass,
        checkedAt: new Date().toISOString(),
        checkedBy: getUser(req)!.email,
        display: d.displayOk, touch: d.touchOk, battery: d.batteryOk,
        cameras: d.camerasOk, speakers: d.speakersOk, mic: d.microphoneOk,
        charging: d.chargingOk, biometric: d.biometricOk, sensors: d.sensorsOk,
        buttons: d.buttonsOk, network: d.networkOk, wifi: d.wifiOk, bluetooth: d.bluetoothOk,
        }), d.inventoryUnitId]
      );

      await createAuditLog(req, 'INSPECTION_CREATED', 'inspection', rows[0].id, {
        inventoryUnitId: d.inventoryUnitId, overallPass,
      }, client);
      return rows[0];
    });
    res.status(201).json({ id: result.id, overallPass });
  } catch (err) {
    if (err instanceof Error && err.message === 'UNIT_NOT_FOUND') return res.status(404).json({ error: 'Inventory unit not found.' });
    console.error('Inspection create error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/inspections/:unitId/public - Customer-facing inspection summary
router.get('/:unitId/public', async (req: Request, res: Response) => {
  try {
    const { unitId } = req.params;
    const { rows } = await pool.query(
      `SELECT di.overall_pass, di.physical_condition, di.replaced_parts,
              di.created_at, u.name as inspector_name
       FROM device_inspections di
       LEFT JOIN users u ON u.id = di.inspected_by
       WHERE di.inventory_unit_id = $1
       ORDER BY di.created_at DESC LIMIT 1`,
      [unitId]
    );
    if (rows.length === 0) return res.json(null);
    const r = rows[0];
    // Only show safe info
    res.json({
      overallPass: r.overall_pass,
      physicalCondition: r.physical_condition,
      inspectedAt: r.created_at,
      inspectorInitials: r.inspector_name ? r.inspector_name.charAt(0).toUpperCase() : 'C',
    });
  } catch (err) {
    console.error('Public inspection error:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
