const { randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Client } = require('pg');

require('dotenv').config({
  path: resolve(__dirname, '../.env'),
  quiet: true,
});

async function createTestDatabase() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('Thiếu cấu hình database cho test.');
  }

  const schema = `test_${randomUUID().replace(/-/g, '')}`;
  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15000,
    query_timeout: 30000,
    application_name: 'interview-english-test-setup',
  });

  let created = false;

  async function cleanup() {
    try {
      if (created) {
        await client.query(`DROP SCHEMA "${schema}" CASCADE`);
        created = false;
      }
    } finally {
      await client.end();
    }
  }

  try {
    await client.connect();
    await client.query(`CREATE SCHEMA "${schema}"`);
    created = true;

    await client.query(
      "SELECT set_config('search_path', $1, false)",
      [schema],
    );

    const sql = readFileSync(
      resolve(__dirname, '../sql/001-create-tables.sql'),
      'utf8',
    );
    await client.query(sql);

    const seed = JSON.parse(
      readFileSync(resolve(__dirname, '../seed.json'), 'utf8'),
    );

    await client.query('BEGIN');

    for (const [index, lesson] of seed.lessons.entries()) {
      await client.query(
        `INSERT INTO lessons
          (id, number, title, subtitle, icon, color, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          lesson.id, lesson.number, lesson.title,
          lesson.subtitle, lesson.icon, lesson.color, index,
        ],
      );
    }

    for (const [index, question] of seed.questions.entries()) {
      await client.query(
        `INSERT INTO questions
          (id, lesson_id, question, vietnamese, phrase,
           meaning, answer, translation, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          question.id, question.lessonId, question.question,
          question.vietnamese, question.phrase, question.meaning,
          question.answer, question.translation, index,
        ],
      );
    }

    await client.query('COMMIT');

    return { schema, connectionString, cleanup };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    await cleanup();
    throw error;
  }
}

module.exports = { createTestDatabase };