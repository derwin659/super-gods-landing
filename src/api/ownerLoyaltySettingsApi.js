import { apiRequest } from './apiClient';

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function normalizeSettings(raw = {}) {
  return {
    pointsPerCurrencyUnit: toNumber(raw.pointsPerCurrencyUnit ?? raw.puntosPorUnidadMonetaria, 5),
    currency: String(raw.currency ?? raw.moneda ?? 'PEN'),
    currencySymbol: String(raw.currencySymbol ?? raw.simboloMoneda ?? 'S/'),
    welcomeBonusEnabled: raw.welcomeBonusEnabled !== false,
    welcomeBonusPoints: toNumber(raw.welcomeBonusPoints, 100),
    activationBonusEnabled: raw.activationBonusEnabled !== false,
    activationBonusPoints: toNumber(raw.activationBonusPoints, 50),
    tiers: Array.isArray(raw.tiers)
      ? raw.tiers.map((tier, index) => ({
          id: String(tier.id || `tier-${index}`),
          name: String(tier.name || '').trim(),
          minPoints: toNumber(tier.minPoints),
          colorHex: String(tier.colorHex || '#D4A017'),
          iconName: String(tier.iconName || 'star'),
          description: String(tier.description || ''),
          active: tier.active !== false,
        }))
      : [],
  };
}

export async function getOwnerLoyaltySettings() {
  return normalizeSettings(await apiRequest('/api/owner/loyalty-settings'));
}

export async function updateOwnerLoyaltySettings(settings) {
  const data = await apiRequest('/api/owner/loyalty-settings', {
    method: 'PUT',
    body: JSON.stringify({
      ...settings,
      pointsPerCurrencyUnit: Number(settings.pointsPerCurrencyUnit),
      welcomeBonusPoints: Number(settings.welcomeBonusPoints),
      activationBonusPoints: Number(settings.activationBonusPoints),
      tiers: settings.tiers.map((tier) => ({ ...tier, minPoints: Number(tier.minPoints) })),
    }),
  });
  return normalizeSettings(data);
}