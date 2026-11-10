const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');

const base = process.argv[2]?.replace(/\/$/, '');
const adminToken = process.env.ADMIN_API_KEY;

if (!base || !base.startsWith('https://')) {
  throw new Error('Usage: node test/public-smoke.cjs https://your-host');
}
if (!adminToken?.trim()) {
  throw new Error('Cần đặt biến môi trường ADMIN_API_KEY trước khi chạy.');
}

const id = `smoke-${randomUUID()}`;
const qid = `${id}-question`;
const results = [];

async function request(
  path,
  expected,
  method = 'GET',
  body,
  token = method === 'GET' ? null : adminToken,
) {
  const response = await fetch(base + path, {
    method,
    headers: {
      ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(90000),
  });

  results.push(`${method} ${path} -> ${response.status}`);
  assert.ok([].concat(expected).includes(response.status), results.at(-1));
  return response.status === 204 ? undefined : response.json();
}

(async () => {
  try {
    const docs = await fetch(base + '/docs', {
      signal: AbortSignal.timeout(90000),
    });
    assert.equal(docs.status, 200);

    const spec = await request('/openapi.json', 200);
    assert.equal(
      spec.components.securitySchemes['admin-token'].scheme,
      'bearer',
    );

    await request('/api/lessons', 200);
    await request('/api/questions', 200);

    // Thiếu hoặc sai token phải bị chặn trước khi kiểm tra body.
    await request('/api/lessons', 401, 'POST', {}, null);
    await request('/api/lessons', 401, 'POST', {}, 'invalid-test-token');

    // Token đúng nhưng body thiếu trường phải trả 400.
    await request('/api/lessons', 400, 'POST', { id });

    await request('/api/lessons', 201, 'POST', {
      id,
      number: 'DEMO',
      title: 'Public smoke',
      subtitle: 'Temporary test',
      icon: '🎯',
      color: '#4F46E5',
    });

    await request(`/api/lessons/${id}`, 200, 'PATCH', {
      title: 'Updated public test',
    });

    await request('/api/questions', 201, 'POST', {
      id: qid,
      lessonId: id,
      question: 'Test?',
      vietnamese: 'Thử?',
      phrase: 'I learn.',
      meaning: 'Tôi học.',
      answer: 'I learn English.',
      translation: 'Tôi học tiếng Anh.',
    });

    await request(`/api/lessons/${id}`, 409, 'DELETE');
    await request(`/api/questions/${qid}`, 200, 'PATCH', {
      answer: 'Updated.',
    });
    await request(`/api/questions/${qid}`, 200);
    await request(`/api/questions/${qid}`, 204, 'DELETE');
    await request(`/api/lessons/${id}`, 204, 'DELETE');
    await request(`/api/lessons/${id}`, 404);
  } finally {
    // Dọn dữ liệu thử của lần chạy này, kể cả khi test lỗi.
    await request(`/api/questions/${qid}`, [204, 404], 'DELETE')
      .catch(error => console.error('Dọn câu hỏi thử:', error.message));
    await request(`/api/lessons/${id}`, [204, 404], 'DELETE')
      .catch(error => console.error('Dọn bài học thử:', error.message));
  }

  console.log(results.join('\n'));
  console.log('PUBLIC SMOKE PASSED');
})().catch(error => {
  console.error(error.message);
  process.exitCode = 1;
});