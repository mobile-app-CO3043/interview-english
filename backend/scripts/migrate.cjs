const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Client } = require('pg');

require('dotenv').config({
  path: resolve(__dirname, '../.env'),
  quiet: true,
});

async function migrate() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('MISSING_DATABASE_URL');
  }

  const sql = readFileSync(
    resolve(__dirname, '../sql/001-create-tables.sql'),
    'utf8',
  );

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15000,
    query_timeout: 30000,
    application_name: 'interview-english-migration',
  });

  try {
    await client.connect();
    await client.query(sql);

    const result = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM lessons) AS lessons,
        (SELECT COUNT(*)::int FROM questions) AS questions
    `);

    console.table(result.rows);
    console.log('DATABASE MIGRATION PASSED');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

migrate().catch(error => {
  const code = error.code || 'UNKNOWN';

  console.error(
    error.message === 'MISSING_DATABASE_URL'
      ? 'Thiếu DATABASE_URL trong backend/.env.'
      : `Không hoàn tất migration. Mã lỗi: ${code}`,
  );

  process.exitCode = 1;
});