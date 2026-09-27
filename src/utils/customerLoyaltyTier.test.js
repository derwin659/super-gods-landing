import test from 'node:test';
import assert from 'node:assert/strict';
import { customerLoyaltyTier } from './customerLoyaltyTier.js';
test('commercial VIP never overrides the configured points tier', () => {
  assert.deepEqual(customerLoyaltyTier({status: 'VIP', points: 550, loyaltyTierName: 'Especial', loyaltyTierColor: '#009966'}), {name: 'Especial', color: '#009966'});
  assert.equal(customerLoyaltyTier({status: 'NEW', loyaltyTierName: 'VIP'}).name, 'VIP');
});
test('missing tier is explicit rather than guessed from commercial status', () => {
  assert.equal(customerLoyaltyTier({status: 'VIP'}).name, 'Sin categoría configurada');
  assert.equal(customerLoyaltyTier({loyaltyTierColor: 'invalid'}).color, '#64748b');
});
