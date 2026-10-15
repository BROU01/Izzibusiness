// Donne le rôle admin à un compte existant.
// Usage : npm run admin:promote -- <pseudo>
import pg from 'pg';

const username = (process.argv[2] ?? '').trim().toLowerCase();
if (!/^[a-z0-9_]{3,20}$/.test(username)) {
  console.error('Usage : npm run admin:promote -- <pseudo>');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL manquante. Ajoute-la dans .env.local (voir docs/neon.md).');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  const { rowCount } = await client.query(
    `update profiles set role = 'admin'
     where id = (select id from "user" where username = $1)`,
    [username],
  );
  if (rowCount === 0) {
    console.error(`Aucun compte avec le pseudo « ${username} ». Inscris-toi d'abord sur le site.`);
    process.exitCode = 1;
  } else {
    console.log(`« ${username} » est maintenant administrateur.`);
  }
} finally {
  await client.end();
}
