import { apiRequest } from './apiClient';

function toQuery(params = {}) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      search.append(key, String(value));
    }
  });

  const query = search.toString();
  return query ? `?${query}` : '';
}

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}

function toNumber(value, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function text(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export function normalizeProductOrder(raw = {}) {
  return {
    id: toNumber(raw.id ?? raw.orderId),
    branchId: toNumber(raw.branchId),
    branchName: text(raw.branchName ?? raw.sede),
    productId: toNumber(raw.productId),
    productName: text(raw.productName ?? raw.nombreProducto ?? raw.producto, 'Producto'),
    productImageUrl: text(raw.productImageUrl ?? raw.imageUrl ?? raw.imagenUrl),
    customerName: text(raw.customerName ?? raw.cliente, 'Cliente'),
    customerPhone: text(raw.customerPhone ?? raw.telefono),
    quantity: toNumber(raw.quantity ?? raw.cantidad, 1),
    unitPrice: toNumber(raw.unitPrice ?? raw.precioUnitario),
    total: toNumber(raw.total),
    paymentMethod: text(raw.paymentMethod ?? raw.metodoPago, 'PAY_AT_SHOP'),
    paymentOperationNumber: text(raw.paymentOperationNumber ?? raw.operationNumber),
    paymentCaptureUrl: text(raw.paymentCaptureUrl ?? raw.captureUrl),
    status: text(raw.status ?? raw.estado, 'PENDING').toUpperCase(),
    notes: text(raw.notes ?? raw.note),
    adminNote: text(raw.adminNote),
    saleId: raw.saleId === null || raw.saleId === undefined ? null : toNumber(raw.saleId),
    createdAt: text(raw.createdAt ?? raw.fechaCreacion),
    expiresAt: text(raw.expiresAt),
    raw,
  };
}

export async function getOwnerProductOrders({ branchId, status = 'PENDING' } = {}) {
  const data = await apiRequest(
    `/api/owner/product-orders${toQuery({ branchId, status })}`
  );

  return extractList(data).map(normalizeProductOrder);
}

async function postOrderAction({ branchId, orderId, action, payload = {} }) {
  const data = await apiRequest(
    `/api/owner/product-orders/${orderId}/${action}${toQuery({ branchId })}`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    }
  );

  return normalizeProductOrder(data);
}

export function approveOwnerProductOrder({ branchId, orderId, note }) {
  return postOrderAction({ branchId, orderId, action: 'approve', payload: { note } });
}

export function rejectOwnerProductOrder({ branchId, orderId, note }) {
  return postOrderAction({ branchId, orderId, action: 'reject', payload: { note } });
}

export function cancelOwnerProductOrder({ branchId, orderId, note }) {
  return postOrderAction({ branchId, orderId, action: 'cancel', payload: { note } });
}

export function deliverOwnerProductOrder({ branchId, orderId, note }) {
  return postOrderAction({ branchId, orderId, action: 'deliver', payload: { note } });
}
