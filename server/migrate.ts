import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pool } from './db';
import { verifySchema } from './schemaVerification';

const client = await pool.connect();
try {
	await client.query('BEGIN');
	await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
		version TEXT PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
	)`);
	await client.query('COMMIT');

	const migrations = (await fs.readdir(path.resolve('db/migrations')))
		.filter(file => /^\d+_.+\.sql$/.test(file))
		.sort();
	const appliedResult = await client.query('SELECT version FROM schema_migrations');
	const applied = new Set(appliedResult.rows.map(row => row.version));

	for (const file of migrations) {
		const version = file.replace(/\.sql$/, '');
		if (applied.has(version)) continue;
		const migration = await fs.readFile(path.resolve('db/migrations', file), 'utf8');
		await client.query('BEGIN');
		await client.query(migration);
		await verifySchema(client);
		await client.query('INSERT INTO schema_migrations (version) VALUES ($1)', [version]);
		await client.query('COMMIT');
		console.log(`Database migration ${version} applied and schema verified.`);
	}
	await verifySchema(client);
} catch (error) {
	try {
		await client.query('ROLLBACK');
	} catch {
		// Preserve the original migration or verification error.
	}
	const message = error instanceof Error ? error.message : String(error);
	console.error(`Database migration failed: ${message}`);
	console.error('No changes were committed.');
	process.exitCode = 1;
} finally {
	client.release();
	await pool.end();
}
