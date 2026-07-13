import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Use an isolated SQLite file so the test run never touches the dev database.
process.env.DB_PATH = join(tmpdir(), `vsa-test-${Date.now()}.db`);

const { default: app } = await import('../src/server.js');

function request(base, path, options = {}) {
  return fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
}

test('API integration: full voice->list loop', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    // Health
    const health = await request(base, '/api/health');
    assert.equal(health.status, 200);
    assert.equal((await health.json()).ok, true);

    // Voice command: add
    const addRes = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'add 2 bottles of water', lang: 'en' }),
    });
    const addJson = await addRes.json();
    assert.equal(addRes.status, 200);
    assert.equal(addJson.ok, true);
    assert.equal(addJson.item.name, 'water');
    assert.equal(addJson.item.quantity, 2);

    // Voice command: add another
    await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'I need 3 apples', lang: 'en' }),
    });

    // List should have 2 items
    const listRes = await request(base, '/api/items');
    const listJson = await listRes.json();
    assert.equal(listJson.items.length, 2);

    // Voice command: remove water
    const rmRes = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'remove water', lang: 'en' }),
    });
    const rmJson = await rmRes.json();
    assert.equal(rmJson.ok, true);
    assert.equal(rmJson.list.length, 1);

    // Suggestions endpoint returns shape
    const sugRes = await request(base, '/api/suggestions');
    const sugJson = await sugRes.json();
    assert.equal(sugJson.ok, true);
    assert.ok(Array.isArray(sugJson.recommendations));
    assert.ok(Array.isArray(sugJson.seasonal));

    // Empty input rejected with 422
    const bad = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: '   ', lang: 'en' }),
    });
    assert.equal(bad.status, 422);
  } finally {
    server.close();
  }
});

test('API: remove is exact-match and clear is a distinct intent', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    await request(base, '/api/items', { method: 'DELETE' }); // isolate from prior test's data
    await request(base, '/api/items', { method: 'POST', body: JSON.stringify({ name: 'pineapple' }) });
    await request(base, '/api/items', { method: 'POST', body: JSON.stringify({ name: 'apple' }) });

    // "remove app" must NOT substring-delete "apple"/"pineapple".
    const rm = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'remove app', lang: 'en' }),
    });
    const rmJson = await rm.json();
    assert.equal(rmJson.ok, false);
    assert.equal(rmJson.error, 'not_found');

    // Exact "remove apple" deletes only apple.
    const rmExact = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'remove apple', lang: 'en' }),
    });
    const rmExactJson = await rmExact.json();
    assert.equal(rmExactJson.ok, true);
    assert.deepEqual(rmExactJson.list.map((i) => i.name), ['pineapple']);

    // Plain "remove all" must NOT wipe the list (distinct clear intent only).
    const rmAll = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'remove all', lang: 'en' }),
    });
    const rmAllJson = await rmAll.json();
    assert.equal(rmAllJson.ok, false, 'remove all should be rejected, not clear');
    assert.equal(rmAllJson.list.length, 1);

    // Distinct clear intent DOES wipe the list.
    const clr = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'clear my list', lang: 'en' }),
    });
    const clrJson = await clr.json();
    assert.equal(clrJson.ok, true);
    assert.equal(clrJson.intent, 'clear');
    assert.equal(clrJson.list.length, 0);
  } finally {
    server.close();
  }
});
