export const COUNTRY_PRICE_OPTIONS = [
  { code: 'PE', label: 'Peru', currency: 'PEN' },
  { code: 'US', label: 'Estados Unidos', currency: 'USD' },
  { code: 'CO', label: 'Colombia', currency: 'COP' },
  { code: 'MX', label: 'Mexico', currency: 'MXN' },
  { code: 'CL', label: 'Chile', currency: 'CLP' },
  { code: 'AR', label: 'Argentina', currency: 'ARS' },
  { code: 'BO', label: 'Bolivia', currency: 'USD' },
  { code: 'BR', label: 'Brasil', currency: 'BRL' },
  { code: 'EU', label: 'Europa', currency: 'EUR' },
  { code: 'UY', label: 'Uruguay', currency: 'USD' },
  { code: 'PY', label: 'Paraguay', currency: 'USD' },
  { code: 'CR', label: 'Costa Rica', currency: 'USD' },
  { code: 'DO', label: 'Republica Dominicana', currency: 'USD' },
  { code: 'GT', label: 'Guatemala', currency: 'USD' },
];

const PRICES_BY_COUNTRY = {
  PE: { currency: 'PEN', FREE: 0, BASIC: 39.90, STARTER: 79.90, GROWTH: 139.90, PRO: 229.90, ENTERPRISE: 399.90 },
  US: { currency: 'USD', FREE: 0, BASIC: 12, STARTER: 24, GROWTH: 41, PRO: 68, ENTERPRISE: 118 },
  CO: { currency: 'COP', FREE: 0, BASIC: 39900, STARTER: 79900, GROWTH: 139900, PRO: 229900, ENTERPRISE: 399900 },
  MX: { currency: 'MXN', FREE: 0, BASIC: 199, STARTER: 399, GROWTH: 699, PRO: 1149, ENTERPRISE: 1999 },
  CL: { currency: 'CLP', FREE: 0, BASIC: 10900, STARTER: 21900, GROWTH: 38900, PRO: 63900, ENTERPRISE: 111900 },
  AR: { currency: 'ARS', FREE: 0, BASIC: 11900, STARTER: 23900, GROWTH: 41900, PRO: 68900, ENTERPRISE: 119900 },
  BO: { currency: 'USD', FREE: 0, BASIC: 12, STARTER: 24, GROWTH: 41, PRO: 68, ENTERPRISE: 118 },
  BR: { currency: 'BRL', FREE: 0, BASIC: 59, STARTER: 119, GROWTH: 209, PRO: 339, ENTERPRISE: 599 },
  EU: { currency: 'EUR', FREE: 0, BASIC: 11, STARTER: 22, GROWTH: 37, PRO: 61, ENTERPRISE: 107 },
  UY: { currency: 'USD', FREE: 0, BASIC: 12, STARTER: 24, GROWTH: 41, PRO: 68, ENTERPRISE: 118 },
  PY: { currency: 'USD', FREE: 0, BASIC: 12, STARTER: 24, GROWTH: 41, PRO: 68, ENTERPRISE: 118 },
  CR: { currency: 'USD', FREE: 0, BASIC: 12, STARTER: 24, GROWTH: 41, PRO: 68, ENTERPRISE: 118 },
  DO: { currency: 'USD', FREE: 0, BASIC: 12, STARTER: 24, GROWTH: 41, PRO: 68, ENTERPRISE: 118 },
  GT: { currency: 'USD', FREE: 0, BASIC: 12, STARTER: 24, GROWTH: 41, PRO: 68, ENTERPRISE: 118 },
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
