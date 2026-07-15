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
    assert.ok(Array.isArray(sugJson.frequentlyBought));
    assert.ok(Array.isArray(sugJson.seasonal));
    assert.ok(Array.isArray(sugJson.runningLow));
    assert.ok(Array.isArray(sugJson.substitutes));

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

test('API: item name deduplication merges singular/plural', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    await request(base, '/api/items', { method: 'DELETE' });

    // Add "apple" first.
    const add1 = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'add apple', lang: 'en' }),
    });
    assert.equal(add1.status, 200);
    assert.equal((await add1.json()).item.quantity, 1);

    // Add "apples" — should merge into existing "apple" row, quantity becomes 2.
    const add2 = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'add 2 apples', lang: 'en' }),
    });
    const add2Json = await add2.json();
    assert.equal(add2.status, 200);
    assert.equal(add2Json.ok, true);
    assert.equal(add2Json.item.quantity, 3);

    // List should have exactly 1 item.
    const listRes = await request(base, '/api/items');
    const listJson = await listRes.json();
    assert.equal(listJson.items.length, 1);
    assert.equal(listJson.items[0].name, 'apple');
  } finally {
    server.close();
  }
});

test('API: add includes substitute suggestions in response', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    await request(base, '/api/items', { method: 'DELETE' });

    const addRes = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'add milk', lang: 'en' }),
    });
    const addJson = await addRes.json();
    assert.equal(addRes.status, 200);
    assert.equal(addJson.ok, true);
    assert.ok(
      addJson.message.includes('almond milk') || addJson.message.includes('Try'),
      'response should mention substitutes: ' + addJson.message
    );
  } finally {
    server.close();
  }
});

test('API: price field is stored and returned', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    await request(base, '/api/items', { method: 'DELETE' });

    const addRes = await request(base, '/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: 'milk', price: 3.49 }),
    });
    const addJson = await addRes.json();
    assert.equal(addRes.status, 201);
    assert.equal(addJson.item.price, 3.49);

    const listRes = await request(base, '/api/items');
    const listJson = await listRes.json();
    assert.equal(listJson.items[0].price, 3.49);
  } finally {
    server.close();
  }
});

test('API: voice command extracts item price via "for $X"', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    await request(base, '/api/items', { method: 'DELETE' });

    const addRes = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'add milk for $3', lang: 'en' }),
    });
    const addJson = await addRes.json();
    assert.equal(addRes.status, 200);
    assert.equal(addJson.ok, true);
    assert.equal(addJson.item.price, 3);
  } finally {
    server.close();
  }
});

test('API: search returns results and full list in response', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    await request(base, '/api/items', { method: 'DELETE' });
    await request(base, '/api/command', { method: 'POST', body: JSON.stringify({ text: 'add apple', lang: 'en' }) });
    await request(base, '/api/command', { method: 'POST', body: JSON.stringify({ text: 'add banana', lang: 'en' }) });
    await request(base, '/api/command', { method: 'POST', body: JSON.stringify({ text: 'add carrot', lang: 'en' }) });

    const searchRes = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'search for apple', lang: 'en' }),
    });
    const searchJson = await searchRes.json();
    assert.equal(searchRes.status, 200);
    assert.equal(searchJson.intent, 'search');
    assert.ok(Array.isArray(searchJson.results));
    assert.equal(searchJson.results.length, 1);
    assert.equal(searchJson.results[0].name, 'apple');
    assert.equal(searchJson.list.length, 3);
  } finally {
    server.close();
  }
});

test('API: remove after search returns updated list in response', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    await request(base, '/api/items', { method: 'DELETE' });
    const addRes = await request(base, '/api/command', { method: 'POST', body: JSON.stringify({ text: 'add apple', lang: 'en' }) });
    const addJson = await addRes.json();
    const appleId = addJson.item.id;

    const rmRes = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: `remove apple`, lang: 'en' }),
    });
    const rmJson = await rmRes.json();
    assert.equal(rmRes.status, 200);
    assert.equal(rmJson.ok, true);
    assert.equal(rmJson.list.length, 0);
    assert.equal(rmJson.intent, 'remove');
  } finally {
    server.close();
  }
});

test('API: image service returns curated URL for common items', async () => {
  const { resolveImageUrl } = await import('../src/services/image.js');
  const milkUrl = await resolveImageUrl('milk');
  assert.ok(milkUrl, 'milk should have a curated image URL');
  assert.ok(milkUrl.includes('pexels'), 'should be a Pexels URL');

  const unknownUrl = await resolveImageUrl('xyzzy-uncommon-item-123');
  assert.ok(unknownUrl === null || typeof unknownUrl === 'string', 'unknown item should return null or URL');
});

test('API: curated images cover common grocery items', async () => {
  const { resolveImageUrl } = await import('../src/services/image.js');
  const curated = await resolveImageUrl('milk');
  assert.ok(curated, 'milk should have a curated image');
  assert.ok(curated.includes('pexels'), 'curated image should be a Pexels URL');
});

test('API: ask intent returns info without modifying list', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    await request(base, '/api/items', { method: 'DELETE' });

    const askRes = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'what are the seasonal fruits', lang: 'en' }),
    });
    const askJson = await askRes.json();
    assert.equal(askRes.status, 200);
    assert.equal(askJson.intent, 'ask');
    assert.ok(askJson.message.length > 0, 'should return a message');
    assert.equal(askJson.list.length, 0, 'list should remain empty');

    const listRes = await request(base, '/api/items');
    const listJson = await listRes.json();
    assert.equal(listJson.items.length, 0, 'DB should not have been modified');
  } finally {
    server.close();
  }
});

test('API: search applies price and brand filters', async () => {
  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    await request(base, '/api/items', { method: 'DELETE' });
    await request(base, '/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: 'toothpaste', brand: 'Colgate', maxPrice: 5 }),
    });
    await request(base, '/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: 'toothpaste', brand: 'Sensodyne', maxPrice: 8 }),
    });
    await request(base, '/api/items', {
      method: 'POST',
      body: JSON.stringify({ name: 'milk', brand: 'Maple Hills', maxPrice: 3 }),
    });

    // Brand filter: Colgate toothpaste
    const brandRes = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'find Colgate toothpaste', lang: 'en' }),
    });
    const brandJson = await brandRes.json();
    assert.equal(brandRes.status, 200);
    assert.equal(brandJson.ok, true);
    assert.equal(brandJson.results.length, 1);
    assert.equal(brandJson.results[0].brand, 'Colgate');
    assert.equal(brandJson.appliedFilters.brand, 'Colgate');

    // Max price filter: under $5
    const priceRes = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'find toothpaste under 5 dollars', lang: 'en' }),
    });
    const priceJson = await priceRes.json();
    assert.equal(priceRes.status, 200);
    assert.equal(priceJson.ok, true);
    assert.equal(priceJson.results.length, 1);
    assert.equal(priceJson.results[0].brand, 'Colgate');
    assert.equal(priceJson.appliedFilters.maxPrice, 5);

    // Min price filter: over $2
    const minRes = await request(base, '/api/command', {
      method: 'POST',
      body: JSON.stringify({ text: 'find milk over $2', lang: 'en' }),
    });
    const minJson = await minRes.json();
    assert.equal(minRes.status, 200);
    assert.equal(minJson.ok, true);
    assert.equal(minJson.results.length, 1);
    assert.equal(minJson.results[0].name, 'milk');
    assert.equal(minJson.appliedFilters.minPrice, 2);
  } finally {
    server.close();
  }
});
