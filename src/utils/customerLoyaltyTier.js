export function customerLoyaltyTier(customer) {
  const name = String(customer?.loyaltyTierName || '').trim();
  const rawColor = String(customer?.loyaltyTierColor || '');
  return {
    name: name || 'Sin categoría configurada',
    color: /^#[0-9a-f]{6}$/i.test(rawColor) ? rawColor : '#64748b',
  };
}
