import { apiRequest } from './apiClient';

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function text(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function normalizeCustomerLoyalty(raw = {}) {
  return {
    customerId: toNumber(raw.customerId ?? raw.id),
    nombres: text(raw.nombres ?? raw.nombre ?? raw.firstName ?? ''),
    apellidos: text(raw.apellidos ?? raw.apellido ?? raw.lastName ?? ''),
    telefono: text(raw.telefono ?? raw.phone ?? ''),
    email: text(raw.email ?? raw.correo ?? ''),
    puntosDisponibles: toNumber(
      raw.puntosDisponibles ??
        raw.pointsAvailable ??
        raw.availablePoints ??
        raw.puntos ??
        raw.points
    ),
    puntosAcumulados: toNumber(
      raw.puntosAcumulados ??
        raw.pointsEarned ??
        raw.totalPoints ??
        raw.accumulatedPoints
    ),
    migrated: raw.migrated === true,
    appActivated: raw.appActivated === true,
    raw,
  };
}

function normalizeAdjustment(raw = {}) {
  return {
    message: text(raw.message ?? raw.mensaje ?? 'Ajuste realizado correctamente.'),
    newPoints: toNumber(
      raw.newPoints ??
        raw.puntosDisponibles ??
        raw.pointsAvailable ??
        raw.availablePoints
    ),
    pointsDelta: toNumber(raw.pointsDelta ?? raw.delta ?? raw.points),
    raw,
  };
}

export async function findOwnerLoyaltyCustomerByPhone(phone) {
  const cleanPhone = String(phone || '').trim();

  const data = await apiRequest(
    `/api/owner/loyalty/customer-by-phone?phone=${encodeURIComponent(cleanPhone)}`
  );

  return normalizeCustomerLoyalty(data);
}

export async function createManualPointsAdjustment({
  customerId,
  pointsDelta,
  reason,
}) {
  const data = await apiRequest('/api/owner/loyalty/manual-adjustment', {
    method: 'POST',
    body: JSON.stringify({
      customerId: Number(customerId),
      pointsDelta: Number(pointsDelta),
      reason: String(reason || '').trim(),
    }),
  });

  return normalizeAdjustment(data);
}