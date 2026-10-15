import { Pool, type PoolClient, type QueryResultRow } from 'pg';

/**
 * Connexion PostgreSQL (Neon en production, n'importe quel Postgres en local).
 * Serveur uniquement : ne jamais importer ce module dans un composant client.
 *
 * DATABASE_URL = chaîne de connexion Neon « pooled » (…-pooler…/neondb?sslmode=require).
 */

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super('Base de données non configurée (DATABASE_URL manquante).');
    this.name = 'DatabaseNotConfiguredError';
  }
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

// Un seul pool par processus (le rechargement à chaud de Next réévalue les modules).
const globalForDb = globalThis as unknown as { izziPool?: Pool };

export function getPool(): Pool {
  const url = process.env.DATABASE_URL;
  if (!url) throw new DatabaseNotConfiguredError();
  if (!globalForDb.izziPool) {
    globalForDb.izziPool = new Pool({
      connectionString: url,
      // Fonctions serverless : peu de connexions, libérées vite.
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
  }
  return globalForDb.izziPool;
}

/** Requête paramétrée ($1, $2…) : jamais de concaténation de valeurs dans le SQL. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T[]> {
  const result = await getPool().query<T>(text, params);
  return result.rows;
}

export async function queryOne<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/**
 * Appel d'une fonction SQL qui renvoie un jsonb `{ success, error?, ... }`
 * (fonctions d'argent des migrations). Le nom est une constante du code,
 * jamais une saisie utilisateur.
 */
export async function callFunction<T = Record<string, unknown>>(
  name: string,
  params: unknown[],
): Promise<T> {
  if (!/^[a-z_][a-z0-9_]*$/.test(name)) throw new Error(`Nom de fonction invalide : ${name}`);
  const placeholders = params.map((_, i) => `$${i + 1}`).join(', ');
  const row = await queryOne<{ result: T }>(`select ${name}(${placeholders}) as result`, params);
  return (row?.result ?? null) as T;
}

/** Transaction : COMMIT si la fonction réussit, ROLLBACK sinon. */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await fn(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}
