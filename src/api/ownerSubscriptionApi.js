import { apiRequest } from './apiClient';

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function toBool(value, fallback = false) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const clean = value.trim().toLowerCase();
    if (clean === 'true') return true;
    if (clean === 'false') return false;
  }
  return fallback;
}

function text(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function normalizeSubscription(raw = {}) {
  return {
    subId: raw.subId === null || raw.subId === undefined ? null : toNumber(raw.subId),
    tenantId: raw.tenantId === null || raw.tenantId === undefined ? null : toNumber(raw.tenantId),
    plan: text(raw.plan, 'STARTER').toUpperCase(),
    estado: text(raw.estado, 'TRIAL').toUpperCase(),
    trial: toBool(raw.trial),
    precioMensual: toNumber(raw.precioMensual),
    billingCycle: text(raw.billingCycle, 'MONTHLY').toUpperCase(),
    currency: text(raw.currency, 'PEN'),
    fechaInicio: text(raw.fechaInicio),
    fechaRenovacion: text(raw.fechaRenovacion),
    fechaFin: text(raw.fechaFin),
    diasGracia: toNumber(raw.diasGracia),
    observaciones: text(raw.observaciones),
    maxBranches: toNumber(raw.maxBranches),
    usedBranches: toNumber(raw.usedBranches),
    maxBarbers: toNumber(raw.maxBarbers),
    usedBarbers: toNumber(raw.usedBarbers),
    maxAdmins: toNumber(raw.maxAdmins),
    usedAdmins: toNumber(raw.usedAdmins),
    aiEnabled: toBool(raw.aiEnabled),
    loyaltyEnabled: toBool(raw.loyaltyEnabled),
    promotionsEnabled: toBool(raw.promotionsEnabled),
    canOperate: toBool(raw.canOperate, true),
    expired: toBool(raw.expired),
    raw,
  };
}

export function planLabel(plan) {
  switch (String(plan || '').toUpperCase()) {
    case 'STARTER':
      return 'Starter';
    case 'PRO':
      return 'Pro';
    case 'GODS_AI':
      return 'Gods AI';
    default:
      return plan || 'Plan';
  }
}

export function statusLabel(status) {
  switch (String(status || '').toUpperCase()) {
    case 'TRIAL':
      return 'Trial';
    case 'ACTIVE':
    case 'ACTIVO':
    case 'ACTIVA':
      return 'Activo';
    case 'EXPIRED':
    case 'VENCIDO':
    case 'EXPIRADO':
      return 'Vencido';
    case 'PAST_DUE':
    case 'PENDING_REVIEW':
      return 'Pago pendiente';
    case 'CANCELLED':
    case 'CANCELADO':
      return 'Cancelado';
    default:
      return status || 'Sin estado';
  }
}

export function billingLabel(billing) {
  switch (String(billing || '').toUpperCase()) {
    case 'MONTHLY':
      return 'Mensual';
    case 'SEMIANNUAL':
      return 'Semestral';
    case 'ANNUAL':
      return 'Anual';
    default:
      return billing || 'Mensual';
  }
}

export function monthlyPrice(plan) {
  switch (String(plan || '').toUpperCase()) {
    case 'STARTER':
      return 39;
    case 'PRO':
      return 79;
    case 'GODS_AI':
      return 149;
    default:
      return 39;
  }
}

export function discountPercent(billing) {
  switch (String(billing || '').toUpperCase()) {
    case 'SEMIANNUAL':
      return 0.10;
    case 'ANNUAL':
      return 0.20;
    case 'MONTHLY':
    default:
      return 0;
  }
}

export function basePrice(plan, billing) {
  const monthly = monthlyPrice(plan);

  switch (String(billing || '').toUpperCase()) {
    case 'SEMIANNUAL':
      return monthly * 6;
    case 'ANNUAL':
      return monthly * 12;
    case 'MONTHLY':
    default:
      return monthly;
  }
}

export function finalPrice(plan, billing) {
  const base = basePrice(plan, billing);
  return base * (1 - discountPercent(billing));
}

export function isSubscriptionActive(subscription) {
  if (!subscription) return false;

  const estado = String(subscription.estado || '').toUpperCase();

  const activeLike =
    estado === 'ACTIVE' ||
    estado === 'ACTIVO' ||
    estado === 'ACTIVA' ||
    estado === 'TRIAL';

  const expired =
    subscription.expired ||
    estado === 'EXPIRED' ||
    estado === 'VENCIDO' ||
    estado === 'EXPIRADO' ||
    estado === 'CANCELLED' ||
    estado === 'CANCELADO' ||
    estado === 'PAST_DUE';

  return subscription.canOperate && activeLike && !expired;
}

export async function getCurrentSubscription() {
  const data = await apiRequest('/api/subscription/current');
  return normalizeSubscription(data);
}

export async function reportSubscriptionPayment({
  plan,
  billingCycle,
  paymentMethod = 'YAPE',
  operationNumber,
  amount,
  payerName = '',
  payerPhone = '',
  notes = '',
}) {
  return apiRequest('/api/subscription/report-payment', {
    method: 'POST',
    body: JSON.stringify({
      plan: String(plan || '').trim().toUpperCase(),
      billingCycle: String(billingCycle || '').trim().toUpperCase(),
      paymentMethod: String(paymentMethod || 'YAPE').trim().toUpperCase(),
      operationNumber: String(operationNumber || '').trim(),
      amount: Number(amount),
      payerName: String(payerName || '').trim(),
      payerPhone: String(payerPhone || '').trim(),
      notes: String(notes || '').trim(),
    }),
  });
}