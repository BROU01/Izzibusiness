// Applique les migrations SQL de db/migrations dans l'ordre, une seule fois.
// Usage : npm run db:migrate  (lit DATABASE_URL dans l'environnement ou .env.local)
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const url = process.env.DATABASE_URL;
if (!url) {
  console.error('DATABASE_URL manquante. Ajoute-la dans .env.local (voir docs/neon.md).');
  process.exit(1);
}

const dir = path.join(process.cwd(), 'db', 'migrations');
const files = (await readdir(dir)).filter((f) => /^\d{3}_[a-z0-9_]+\.sql$/.test(f)).sort();

const client = new pg.Client({ connectionString: url });
await client.connect();

try {
  await client.query(`create table if not exists schema_migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )`);
  const { rows } = await client.query('select name from schema_migrations');
  const applied = new Set(rows.map((r) => r.name));

  let count = 0;
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = await readFile(path.join(dir, file), 'utf8');
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query('insert into schema_migrations (name) values ($1)', [file]);
      await client.query('commit');
    } catch (error) {
      await client.query('rollback');
      console.error(`Échec de ${file} : ${error.message}`);
      process.exitCode = 1;
      break;
    }
    console.log(`Appliquée : ${file}`);
    count += 1;
  }
  if (process.exitCode !== 1) {
    console.log(count ? `${count} migration(s) appliquée(s).` : 'Base déjà à jour.');
  }
} finally {
  await client.end();
}
