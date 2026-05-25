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
  PE: { currency: 'PEN', STARTER: 39, PRO: 79, GODS_AI: 149 },
  US: { currency: 'USD', STARTER: 19, PRO: 39, GODS_AI: 79 },
  CO: { currency: 'COP', STARTER: 79000, PRO: 159000, GODS_AI: 319000 },
  MX: { currency: 'MXN', STARTER: 369, PRO: 759, GODS_AI: 1529 },
  CL: { currency: 'CLP', STARTER: 18900, PRO: 38900, GODS_AI: 78900 },
  AR: { currency: 'ARS', STARTER: 22000, PRO: 44900, GODS_AI: 89900 },
  BO: { currency: 'USD', STARTER: 19, PRO: 39, GODS_AI: 79 },
  BR: { currency: 'BRL', STARTER: 99, PRO: 199, GODS_AI: 399 },
  EU: { currency: 'EUR', STARTER: 17, PRO: 35, GODS_AI: 69 },
  UY: { currency: 'USD', STARTER: 19, PRO: 39, GODS_AI: 79 },
  PY: { currency: 'USD', STARTER: 19, PRO: 39, GODS_AI: 79 },
  CR: { currency: 'USD', STARTER: 19, PRO: 39, GODS_AI: 79 },
  DO: { currency: 'USD', STARTER: 19, PRO: 39, GODS_AI: 79 },
  GT: { currency: 'USD', STARTER: 19, PRO: 39, GODS_AI: 79 },
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
