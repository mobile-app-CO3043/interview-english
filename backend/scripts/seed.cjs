const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { Client } = require('pg');

require('dotenv').config({
  path: resolve(__dirname, '../.env'),
  quiet: true,
});

async function seed() {
  const connectionString =
    process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('MISSING_DATABASE_URL');
  }

  const data = JSON.parse(
    readFileSync(resolve(__dirname, '../seed.json'), 'utf8'),
  );

  const client = new Client({
    connectionString,
    connectionTimeoutMillis: 15000,
    query_timeout: 30000,
    application_name: 'interview-english-seed',
  });

  try {
    await client.connect();
    await client.query('BEGIN');

    for (const [index, lesson] of data.lessons.entries()) {
      await client.query(
        `INSERT INTO lessons
          (id, number, title, subtitle, icon, color, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO NOTHING`,
        [
          lesson.id,
          lesson.number,
          lesson.title,
          lesson.subtitle,
          lesson.icon,
          lesson.color,
          index,
        ],
      );
    }

    for (const [index, question] of data.questions.entries()) {
      await client.query(
        `INSERT INTO questions
          (id, lesson_id, question, vietnamese, phrase,
           meaning, answer, translation, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (id) DO NOTHING`,
        [
          question.id,
          question.lessonId,
          question.question,
          question.vietnamese,
          question.phrase,
          question.meaning,
          question.answer,
          question.translation,
          index,
        ],
      );
    }

    await client.query('COMMIT');

    const result = await client.query(`
      SELECT
        (SELECT COUNT(*)::int FROM lessons) AS lessons,
        (SELECT COUNT(*)::int FROM questions) AS questions
    `);

    console.table(result.rows);
    console.log('DATABASE SEED PASSED');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await client.end();
  }
}

seed().catch(error => {
  console.error(
    error.message === 'MISSING_DATABASE_URL'
      ? 'Thiếu DATABASE_URL trong backend/.env.'
      : `Không hoàn tất seed. Mã lỗi: ${error.code || 'UNKNOWN'}`,
  );
  process.exitCode = 1;
});