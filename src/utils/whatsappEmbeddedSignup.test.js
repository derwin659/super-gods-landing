import test from 'node:test';
import assert from 'node:assert/strict';
import { parseSignupEvent } from './whatsappEmbeddedSignup.js';
const event = { type: 'WA_EMBEDDED_SIGNUP', event: 'FINISH', data: { waba_id: '123456', phone_number_id: '987654' } };
test('only exact official Meta origins can finish signup', () => {
  for (const origin of ['https://facebook.com.evil.test', 'https://evilfacebook.com', 'http://www.facebook.com', 'null']) {
    assert.equal(parseSignupEvent({ origin, data: JSON.stringify(event) }), null);
  }
  assert.deepEqual(parseSignupEvent({ origin: 'https://www.facebook.com', data: JSON.stringify(event) }), { event: 'FINISH', wabaId: '123456', phoneNumberId: '987654' });
});
test('malformed payloads and arbitrary ids do not authorize registration', () => {
  assert.equal(parseSignupEvent({ origin: 'https://www.facebook.com', data: '{invalid' }), null);
  assert.equal(parseSignupEvent({ origin: 'https://www.facebook.com', data: { ...event, data: { waba_id: '../other', phone_number_id: '987654' } } }), null);
  assert.equal(parseSignupEvent({ origin: 'https://www.facebook.com', data: { ...event, type: 'OTHER' } }), null);
});
test('cancellation carries no provider details or credentials to the product', () => {
  assert.deepEqual(parseSignupEvent({ origin: 'https://www.facebook.com', data: { type: 'WA_EMBEDDED_SIGNUP', event: 'ERROR', data: { error_message: 'provider detail' } } }), { event: 'ERROR' });
});
