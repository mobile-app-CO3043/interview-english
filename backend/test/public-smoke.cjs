const assert = require('node:assert/strict');
const base = process.argv[2];
if (!base || !base.startsWith('https://')) throw new Error('Usage: node test/public-smoke.cjs https://your-host');
const id = `smoke-${Date.now()}`;
const qid = `${id}-question`;
const results = [];
async function request(path, expected, method = 'GET', body) {
  const r = await fetch(base + path, { method, headers: body ? { 'Content-Type': 'application/json' } : {}, body: body ? JSON.stringify(body) : undefined });
  results.push(`${method} ${path} -> ${r.status}`);
  assert.equal(r.status, expected, results.at(-1));
  return expected === 204 ? undefined : r.json();
}
(async () => {
  try {
    const docs = await fetch(base + '/docs');
    assert.equal(docs.status, 200);
    const spec = await request('/openapi.json', 200);
    assert.ok(spec.paths['/api/lessons'].post && spec.paths['/api/questions'].post);
    await request('/api/lessons', 200);
    await request('/api/questions', 200);
    await request('/api/lessons/intro/questions', 200);
    await request('/api/lessons', 400, 'POST', { id });
    await request('/api/lessons', 201, 'POST', { id, number: 'DEMO', title: 'Public smoke', subtitle: 'Temporary test', icon: '🎯', color: '#4F46E5' });
    await request(`/api/lessons/${id}`, 200, 'PATCH', { title: 'Updated public test' });
    await request('/api/questions', 201, 'POST', { id: qid, lessonId: id, question: 'Test?', vietnamese: 'Thử?', phrase: 'I learn.', meaning: 'Tôi học.', answer: 'I learn English.', translation: 'Tôi học tiếng Anh.' });
    await request(`/api/lessons/${id}`, 409, 'DELETE');
    await request(`/api/questions/${qid}`, 200, 'PATCH', { answer: 'Updated.' });
    await request(`/api/questions/${qid}`, 200);
    await request(`/api/questions/${qid}`, 204, 'DELETE');
    await request(`/api/lessons/${id}`, 204, 'DELETE');
    await request(`/api/lessons/${id}`, 404);
    console.log(results.join('\n'));
    console.log('PUBLIC SMOKE PASSED');
  } finally {
    await fetch(base + `/api/questions/${qid}`, { method: 'DELETE' }).catch(() => {});
    await fetch(base + `/api/lessons/${id}`, { method: 'DELETE' }).catch(() => {});
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
