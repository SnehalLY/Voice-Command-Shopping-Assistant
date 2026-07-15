import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.DB_PATH = join(tmpdir(), `vsa-rec-${Date.now()}.db`);
process.env.STALE_DAYS = '5';

const { default: app } = await import('../src/server.js');

function request(base, path, options = {}) {
  return fetch(`${base}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
}

test('recommendations: stale items trigger with short STALE_DAYS', async () => {
  const { getRecommendations } = await import('../src/services/recommendations.js');
  const dbModule = await import('../src/db.js');

  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    await request(base, '/api/items', { method: 'DELETE' });

    const now = Date.now();
    const DAY_MS = 86400000;
    const insertHistory = dbModule.default.prepare(
      'INSERT INTO history (name, category, created_at) VALUES (?, ?, ?)'
    );

    const historyItems = [
      { name: 'bread', daysAgo: 10 },
      { name: 'milk', daysAgo: 3 },
      { name: 'apples', daysAgo: 8 },
      { name: 'coffee', daysAgo: 1 },
    ];

    for (const h of historyItems) {
      const ts = new Date(now - h.daysAgo * DAY_MS).toISOString();
      insertHistory.run(h.name, 'Other', ts);
    }

    const currentItems = [{ name: 'coffee' }];
    const recs = getRecommendations(currentItems, dbModule.getHistory());

    const staleRecs = recs.filter((r) => r.source === 'stale');
    assert.ok(staleRecs.length >= 2, 'should have at least 2 stale recommendations');
    const staleNames = staleRecs.map((r) => r.name);
    assert.ok(staleNames.includes('bread'), 'bread should be stale');
    assert.ok(staleNames.includes('apples'), 'apples should be stale');
    assert.ok(!staleNames.includes('milk'), 'milk should not be stale (3 days < 5)');
    assert.ok(!staleNames.includes('coffee'), 'coffee is on current list');
  } finally {
    server.close();
  }
});

test('recommendations: frequent items surface from history', async () => {
  const { getRecommendations } = await import('../src/services/recommendations.js');
  const dbModule = await import('../src/db.js');

  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    await request(base, '/api/items', { method: 'DELETE' });

    const insertHistory = dbModule.default.prepare(
      'INSERT INTO history (name, category, created_at) VALUES (?, ?, ?)'
    );

    for (let i = 0; i < 5; i++) {
      insertHistory.run('butter', 'Dairy', new Date(Date.now() - i * 86400000).toISOString());
    }
    for (let i = 0; i < 3; i++) {
      insertHistory.run('yogurt', 'Dairy', new Date(Date.now() - i * 86400000).toISOString());
    }

    const recs = getRecommendations([], dbModule.getHistory());
    const freqRecs = recs.filter((r) => r.source === 'frequent');
    assert.ok(freqRecs.length >= 1, 'should have frequent recommendations');
    const freqNames = freqRecs.map((r) => r.name);
    assert.ok(freqNames.includes('butter'), 'butter should be frequent');
  } finally {
    server.close();
  }
});

test('recommendations: running low detects overdue reorder', async () => {
  const { getRunningLow } = await import('../src/services/recommendations.js');
  const dbModule = await import('../src/db.js');

  const server = app.listen(0);
  const { port } = server.address();
  const base = `http://localhost:${port}`;

  try {
    await request(base, '/api/items', { method: 'DELETE' });

    const now = Date.now();
    const DAY_MS = 86400000;
    const insertHistory = dbModule.default.prepare(
      'INSERT INTO history (name, category, created_at) VALUES (?, ?, ?)'
    );

    // "milk" added every 2 days, last added 6 days ago (overdue: avg 2 days * 0.9 = 1.8)
    insertHistory.run('milk', 'Dairy', new Date(now - 6 * DAY_MS).toISOString());
    insertHistory.run('milk', 'Dairy', new Date(now - 4 * DAY_MS).toISOString());
    insertHistory.run('milk', 'Dairy', new Date(now - 2 * DAY_MS).toISOString());

    // "bread" added once, not enough history
    insertHistory.run('bread', 'Bakery', new Date(now - 10 * DAY_MS).toISOString());

    const history = dbModule.getHistory();
    const runningLow = getRunningLow(history);

    const names = runningLow.map((r) => r.name);
    assert.ok(names.includes('milk'), 'milk should be running low');
    assert.ok(!names.includes('bread'), 'bread has too few events');
  } finally {
    server.close();
  }
});