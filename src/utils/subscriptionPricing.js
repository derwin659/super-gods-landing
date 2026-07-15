export const COUNTRY_PRICE_OPTIONS = [
  { code: 'PE', label: 'Peru', currency: 'PEN' },
  { code: 'US', label: 'Estados Unidos', currency: 'USD' },
  { code: 'CO', label: 'Colombia', currency: 'COP' },
  { code: 'MX', label: 'Mexico', currency: 'MXN' },
  { code: 'CL', label: 'Chile', currency: 'CLP' },
  { code: 'AR', label: 'Argentina', currency: 'ARS' },
  { code: 'BO', label: 'Bolivia', currency: 'USD' },
  { code: 'BR', label: 'Brasil', currency: 'BRL' },
  { code: 'VE', label: 'Venezuela', currency: 'USD' },
  { code: 'EU', label: 'Europa', currency: 'EUR' },
  { code: 'UY', label: 'Uruguay', currency: 'USD' },
  { code: 'PY', label: 'Paraguay', currency: 'USD' },
  { code: 'CR', label: 'Costa Rica', currency: 'USD' },
  { code: 'DO', label: 'Republica Dominicana', currency: 'USD' },
  { code: 'GT', label: 'Guatemala', currency: 'USD' },
];

const PRICES_BY_COUNTRY = {
  PE: { currency: 'PEN', FREE: 0, STARTER: 49.90, GROWTH: 99.90, PRO: 149.90, ENTERPRISE: 299.90 },
  US: { currency: 'USD', FREE: 0, STARTER: 14.90, GROWTH: 29.90, PRO: 44.90, ENTERPRISE: 89.90 },
  VE: { currency: 'USD', FREE: 0, STARTER: 14.90, GROWTH: 29.90, PRO: 44.90, ENTERPRISE: 89.90 },
  CO: { currency: 'COP', FREE: 0, STARTER: 59900, GROWTH: 119900, PRO: 179900, ENTERPRISE: 359900 },
  MX: { currency: 'MXN', FREE: 0, STARTER: 299, GROWTH: 599, PRO: 899, ENTERPRISE: 1799 },
  CL: { currency: 'CLP', FREE: 0, STARTER: 13900, GROWTH: 27900, PRO: 41900, ENTERPRISE: 83900 },
  AR: { currency: 'ARS', FREE: 0, STARTER: 19900, GROWTH: 39900, PRO: 59900, ENTERPRISE: 119900 },
  BO: { currency: 'USD', FREE: 0, STARTER: 14.90, GROWTH: 29.90, PRO: 44.90, ENTERPRISE: 89.90 },
  BR: { currency: 'BRL', FREE: 0, STARTER: 79, GROWTH: 159, PRO: 239, ENTERPRISE: 479 },
  EU: { currency: 'EUR', FREE: 0, STARTER: 13.90, GROWTH: 27.90, PRO: 41.90, ENTERPRISE: 83.90 },
  UY: { currency: 'USD', FREE: 0, STARTER: 14.90, GROWTH: 29.90, PRO: 44.90, ENTERPRISE: 89.90 },
  PY: { currency: 'USD', FREE: 0, STARTER: 14.90, GROWTH: 29.90, PRO: 44.90, ENTERPRISE: 89.90 },
  CR: { currency: 'USD', FREE: 0, STARTER: 14.90, GROWTH: 29.90, PRO: 44.90, ENTERPRISE: 89.90 },
  DO: { currency: 'USD', FREE: 0, STARTER: 14.90, GROWTH: 29.90, PRO: 44.90, ENTERPRISE: 89.90 },
  GT: { currency: 'USD', FREE: 0, STARTER: 14.90, GROWTH: 29.90, PRO: 44.90, ENTERPRISE: 89.90 },
};

export function getPublicPlanPrice(plan, countryCode = 'PE') {
  const country = PRICES_BY_COUNTRY[String(countryCode || 'PE').toUpperCase()] || PRICES_BY_COUNTRY.PE;
  const planCode = String(plan || 'STARTER').toUpperCase();

  return {
    amount: country[planCode] || country.STARTER,
    currency: country.currency,
  };
}

export function getInitialPricingCountry() {
  try {
    const params = new URLSearchParams(window.location.search);
    const fromQuery = params.get('country') || params.get('pais');
    const normalizedQuery = String(fromQuery || '').trim().toUpperCase();
    if (COUNTRY_PRICE_OPTIONS.some((option) => option.code === normalizedQuery)) {
      return normalizedQuery;
    }

    const timeZoneCountry = countryFromTimeZone();
    if (timeZoneCountry) return timeZoneCountry;

    const locale = String(navigator.language || '').toUpperCase();
    const localeCountry = locale.includes('-') ? locale.split('-').pop() : '';
    if (COUNTRY_PRICE_OPTIONS.some((option) => option.code === localeCountry)) {
      return localeCountry;
    }
  } catch {
    return 'PE';
  }

  return 'PE';
}

function countryFromTimeZone() {
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || '';

  const map = {
    'America/Lima': 'PE',
    'America/Santiago': 'CL',
    'America/Bogota': 'CO',
    'America/Mexico_City': 'MX',
    'America/Monterrey': 'MX',
    'America/Tijuana': 'MX',
    'America/Cancun': 'MX',
    'America/Argentina/Buenos_Aires': 'AR',
    'America/La_Paz': 'BO',
    'America/Caracas': 'VE',
    'America/Sao_Paulo': 'BR',
    'America/Montevideo': 'UY',
    'America/Asuncion': 'PY',
    'America/Costa_Rica': 'CR',
    'America/Santo_Domingo': 'DO',
    'America/Guatemala': 'GT',
    'America/New_York': 'US',
    'America/Chicago': 'US',
    'America/Denver': 'US',
    'America/Los_Angeles': 'US',
  };

  if (map[timeZone]) return map[timeZone];
  if (timeZone.startsWith('Europe/')) return 'EU';

  return '';
}

export function buildPriceMap(planPrices = []) {
  return Array.isArray(planPrices)
    ? planPrices.reduce((acc, item) => {
        const plan = String(item.plan || '').trim().toUpperCase();
        if (!plan) return acc;
        acc[plan] = {
          amount: Number(item.monthlyAmount || 0),
          currency: String(item.currency || 'PEN').trim().toUpperCase(),
        };
        return acc;
      }, {})
    : {};
}

export function getPlanPriceFromMap(plan, countryCode, priceMap = {}) {
  const planCode = String(plan || '').trim().toUpperCase();
  return priceMap[planCode] || getPublicPlanPrice(planCode, countryCode);
}

export function formatSubscriptionPrice({ amount, currency }) {
  try {
    return new Intl.NumberFormat('es-PE', {
      style: 'currency',
      currency: currency || 'PEN',
      maximumFractionDigits: ['CLP', 'COP', 'PYG'].includes(currency) ? 0 : 2,
    }).format(Number(amount || 0));
  } catch {
    return `${currency || 'PEN'} ${Number(amount || 0).toFixed(2)}`;
  }
}
