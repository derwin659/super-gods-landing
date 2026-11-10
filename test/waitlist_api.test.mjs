import test from 'node:test';
import assert from 'node:assert/strict';
import { waitlistRequest } from '../src/api/waitlistApi.js';

test('uses only the explicit client token and serializes the request', async () => {
  globalThis.fetch = async (url, options) => {
    assert.ok(url.endsWith('/api/clients/booking/waitlist'));
    assert.equal(options.headers.Authorization, 'Bearer client-token');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), { branchId: 2 });
    return { ok: true, json: async () => ({ id: 7 }) };
  };
  assert.deepEqual(await waitlistRequest('/api/clients/booking/waitlist', { method: 'POST', token: 'client-token', body: { branchId: 2 } }), { id: 7 });
});
test('public verification does not attach an owner session', async () => {
  globalThis.fetch = async (_url, options) => {
    assert.equal(options.headers.Authorization, undefined);
    return { ok: true, json: async () => ({ otpId: 1 }) };
  };
  await waitlistRequest('/api/public/booking/GODS/waitlist/access', { method: 'POST', body: { phone: '+51999999999' } });
});
test('does not expose SQL exceptions', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 500, json: async () => ({ message: 'JDBC SQL exception secret' }) });
  await assert.rejects(waitlistRequest('/test'), error => !error.message.includes('SQL') && error.message.includes('conexión'));
});
test('disabled feature explains availability and supports empty withdrawal responses', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 503, json: async () => ({}) });
  await assert.rejects(waitlistRequest('/test'), /aún no está habilitada/);
  globalThis.fetch = async () => ({ ok: true, json: async () => { throw new SyntaxError(); } });
  assert.equal(await waitlistRequest('/test', { method: 'DELETE', token: 'client' }), null);
});
