import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { academyLessons, academyProgressKey, readAcademyProgress } from './academy.js';
const catalog = JSON.parse(readFileSync(new URL('../data/gods_academy.json', import.meta.url)));
test('web academy is limited to owner and administrator', () => {
  for (const role of ['CLIENT', 'BARBER', 'CASHIER', 'SUPER_ADMIN', '']) assert.deepEqual(academyLessons(catalog.lessons, role), []);
  assert(academyLessons(catalog.lessons, 'OWNER').some((lesson) => lesson.id === 'setup'));
});
test('administrator only sees lessons covered by assigned permissions', () => {
  assert.deepEqual(academyLessons(catalog.lessons, 'ADMIN').map((lesson) => lesson.id), ['welcome']);
  const ids = academyLessons(catalog.lessons, 'ADMIN', ['CASH_ACCESS']).map((lesson) => lesson.id);
  assert.deepEqual(ids, ['welcome', 'sale', 'close']);
  assert(!ids.includes('reports'));
});
test('progress is isolated by business, user and role', () => {
  const session = { tenantId: 1, userId: 2, role: 'OWNER' };
  for (const patch of [{ tenantId: 2 }, { userId: 3 }, { role: 'ADMIN' }]) assert.notEqual(academyProgressKey(session), academyProgressKey({ ...session, ...patch }));
});
test('invalid or blocked storage cannot break academy', () => {
  globalThis.localStorage = { getItem: () => '{broken' };
  assert.deepEqual(readAcademyProgress('key'), []);
  globalThis.localStorage = { getItem: () => { throw new Error('blocked'); } };
  assert.deepEqual(readAcademyProgress('key'), []);
});
test('catalog has unique lessons and only HTTPS published media', () => {
  assert.equal(new Set(catalog.lessons.map((lesson) => lesson.id)).size, catalog.lessons.length);
  for (const lesson of catalog.lessons) {
    assert(lesson.steps.length >= 3);
    for (const url of [lesson.videoUrl, lesson.captionUrl]) if (url) assert.equal(new URL(url).protocol, 'https:');
  }
});