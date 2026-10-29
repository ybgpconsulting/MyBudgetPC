import { pool } from '../db';
import { PoolClient } from 'pg';
import { Request } from 'express';

export async function createAuditLog(
  req: Request,
  action: string,
  entityType: string,
  entityId?: string,
  details: Record<string, unknown> = {},
  client?: PoolClient
) {
  const executor = client || pool;
  await executor.query(
      `INSERT INTO audit_logs (actor_id, actor_email, actor_role, action, entity_type, entity_id, details, request_id, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        req.user?.id || null,
        req.user?.email || 'system',
        req.user?.role || 'system',
        action,
        entityType,
        entityId || null,
        JSON.stringify(details),
        req.header('x-request-id') || null,
        req.ip || null,
        req.header('user-agent') || null,
      ]
    );
}
