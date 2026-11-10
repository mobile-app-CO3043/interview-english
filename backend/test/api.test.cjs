const { test } = require('node:test');
const assert = require('node:assert/strict');
const { mkdtempSync, rmSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { join } = require('node:path');

test('Swagger, two CRUD collections, validation, relations and persistence', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'interview-api-'));
  process.env.DATA_FILE = join(directory, 'database.json');
  process.env.NODE_ENV = 'test';
  // Token riêng cho test, không sử dụng token quản trị thật.
  const previousAdminApiKey = process.env.ADMIN_API_KEY;
  const adminToken = require('node:crypto')
    .randomBytes(32)
    .toString('hex');

  process.env.ADMIN_API_KEY = adminToken;
  const { createApp } = require('../dist/app');
  let app;
  let assertions = 0;
  try {
    app = await createApp();
    await app.listen(0, '127.0.0.1');
    let base = await app.getUrl();
    const request = async (
      path,
      status = 200,
      method = 'GET',
      body,
      token = ['GET', 'HEAD', 'OPTIONS'].includes(method)
        ? null
        : adminToken,
    ) => {
      const response = await fetch(base + path, {
        method,
        headers: {
          ...(body === undefined
            ? {}
            : { 'Content-Type': 'application/json' }),
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });

      assert.equal(
        response.status,
        status,
        `${method} ${path}: ${await response.clone().text()}`,
      );

      assertions++;
      return response.status === 204 ? null : response.json();
    };
    const docs = await fetch(base + '/docs');
    assert.equal(docs.status, 200);
    assert.match(await docs.text(), /swagger-ui/);
    const asset = await fetch(base + '/docs/swagger-ui-bundle.js');
    assert.equal(asset.status, 200);
    const spec = await request('/openapi.json');
    assert.equal(Object.keys(spec.paths).length, 5);
    assert.ok(spec.paths['/api/lessons'].post);
    assert.ok(spec.paths['/api/questions/{questionId}'].delete);
    assert.ok(spec.components.schemas.UpdateQuestionDto);
    // Swagger có khai báo cách gửi token.
    assert.equal(
      spec.components.securitySchemes['admin-token'].scheme,
      'bearer',
    );

    // Đọc bài học không cần token.
    await request('/api/lessons', 200, 'GET', undefined, null);

    // Thiếu hoặc sai token đều bị chặn ở cả hai nhóm API.
    for (const [method, path] of [
      ['POST', '/api/lessons'],
      ['PATCH', '/api/lessons/intro'],
      ['DELETE', '/api/lessons/missing'],
      ['POST', '/api/questions'],
      ['PATCH', '/api/questions/yourself'],
      ['DELETE', '/api/questions/missing'],
    ]) {
      const body = method === 'DELETE' ? undefined : {};

      await request(path, 401, method, body, null);
      await request(path, 401, method, body, 'invalid-test-token');
    }

    // Thiếu cấu hình quản trị vẫn cho đọc nhưng không cho ghi.
    delete process.env.ADMIN_API_KEY;

    try {
      await request('/api/lessons', 200, 'GET', undefined, null);
      await request('/api/lessons', 503, 'POST', {});
    } finally {
      process.env.ADMIN_API_KEY = adminToken;
    }
    assert.equal((await request('/api/lessons')).length, 3);
    assert.equal((await request('/api/questions')).length, 9);
    assert.equal((await request('/api/lessons/intro/questions')).length, 3);
    assert.equal((await request('/api/questions?lessonId=projects')).length, 3);
    assert.equal((await request('/api/lessons/intro')).questionCount, 3);
    assert.equal((await request('/api/questions/yourself')).lessonId, 'intro');
    await request('/api/lessons/missing', 404);
    await request('/api/questions/missing', 404);
    await request('/api/questions?lessonId=missing', 404);
    await request('/api/lessons', 400, 'POST', {});
    const lesson = { id: 'test-lesson', number: 'BÀI 04', title: 'Bài kiểm thử', subtitle: 'Demo', icon: '🎯', color: '#4F46E5' };
    await request('/api/lessons', 400, 'POST', { ...lesson, unknown: true });
    await request('/api/lessons', 400, 'POST', { ...lesson, color: 'bad' });
    await request('/api/lessons', 201, 'POST', lesson);
    await request('/api/lessons', 409, 'POST', lesson);
    assert.equal((await request('/api/lessons/test-lesson', 200, 'PATCH', { title: 'Đã sửa' })).title, 'Đã sửa');
    await request('/api/lessons/test-lesson', 400, 'PATCH', { title: null });
    await request('/api/lessons/test-lesson', 400, 'PATCH', { title: '   ' });
    await request('/api/lessons/test-lesson', 409, 'PATCH', { id: 'new-id' });
    const question = { id: 'test-question', lessonId: lesson.id, question: 'Test?', vietnamese: 'Thử?', phrase: 'I learn.', meaning: 'Tôi học.', answer: 'I learn English.', translation: 'Tôi học tiếng Anh.' };
    await request('/api/questions', 404, 'POST', { ...question, lessonId: 'missing' });
    await request('/api/questions', 201, 'POST', question);
    await request('/api/questions', 409, 'POST', question);
    assert.equal((await request('/api/lessons/test-lesson')).questionCount, 1);
    await request('/api/lessons/test-lesson', 409, 'DELETE');
    await request('/api/questions/test-question', 400, 'PATCH', { answer: null });
    await request('/api/questions/test-question', 409, 'PATCH', { id: 'renamed' });
    await request('/api/questions/test-question', 404, 'PATCH', { lessonId: 'missing' });
    await request('/api/questions/test-question', 200, 'PATCH', { answer: 'Updated answer.' });
    await app.close();
    app = await createApp();
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
    assert.equal((await request('/api/questions/test-question')).answer, 'Updated answer.');
    assert.equal((await request('/api/lessons/test-lesson')).title, 'Đã sửa');
    await request('/api/questions/test-question', 204, 'DELETE');
    await request('/api/questions/test-question', 404);
    await request('/api/lessons/test-lesson', 204, 'DELETE');
    await request('/api/lessons/test-lesson', 404);
    assert.equal((await request('/api/lessons')).length, 3);
    assert.equal((await request('/api/questions')).length, 9);
    console.log(`${assertions} HTTP checks passed; Swagger assets, validation, CRUD and restart persistence verified.`);
  } finally {
        // Khôi phục cấu hình trước khi chạy test.
    if (previousAdminApiKey === undefined) {
      delete process.env.ADMIN_API_KEY;
    } else {
      process.env.ADMIN_API_KEY = previousAdminApiKey;
    }
    if (app) await app.close();
    rmSync(directory, { recursive: true, force: true });
  }
});
