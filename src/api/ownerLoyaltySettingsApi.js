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
    segmentNewMaxVisits: toNumber(raw.segmentNewMaxVisits, 2),
    segmentFrequentMinVisits: toNumber(raw.segmentFrequentMinVisits, 3),
    segmentVipMinVisits: toNumber(raw.segmentVipMinVisits, 10),
    segmentVipMinPoints: toNumber(raw.segmentVipMinPoints, 500),
    segmentInactiveDays: toNumber(raw.segmentInactiveDays, 60),
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
      segmentNewMaxVisits: Number(settings.segmentNewMaxVisits),
      segmentFrequentMinVisits: Number(settings.segmentFrequentMinVisits),
      segmentVipMinVisits: Number(settings.segmentVipMinVisits),
      segmentVipMinPoints: Number(settings.segmentVipMinPoints),
      segmentInactiveDays: Number(settings.segmentInactiveDays),
      tiers: settings.tiers.map((tier) => ({ ...tier, minPoints: Number(tier.minPoints) })),
    }),
  });
  return normalizeSettings(data);
}