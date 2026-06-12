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
    source: text(raw.source ?? raw.orderSource ?? 'PRODUCT_ORDER'),
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

function normalizeLocalConsumptionOrder(raw = {}) {
  return normalizeProductOrder({
    ...raw,
    source: 'LOCAL_CONSUMPTION',
    productId: raw.productId ?? raw.productoId,
    productName:
      raw.productName ??
      raw.nombreProducto ??
      raw.producto ??
      raw.itemName ??
      raw.nombre,
    customerName: raw.customerName ?? raw.cliente ?? raw.clientName,
    customerPhone: raw.customerPhone ?? raw.telefono ?? raw.phone,
    quantity: raw.quantity ?? raw.cantidad ?? raw.units,
    unitPrice: raw.unitPrice ?? raw.precioUnitario ?? raw.price,
    total: raw.total ?? raw.totalAmount ?? raw.amount ?? raw.montoTotal,
    paymentMethod: raw.paymentMethod ?? raw.metodoPago ?? raw.paymentMethodCode,
    paymentOperationNumber:
      raw.paymentOperationNumber ?? raw.operationNumber ?? raw.numeroOperacion,
    paymentCaptureUrl:
      raw.paymentCaptureUrl ?? raw.captureUrl ?? raw.evidenceUrl ?? raw.comprobanteUrl,
    status: raw.status ?? raw.estado,
  });
}

export async function getOwnerProductOrders({ branchId, status = 'PENDING' } = {}) {
  const [productOrders, localOrders] = await Promise.all([
    apiRequest(`/api/owner/product-orders${toQuery({ branchId, status })}`)
      .then((data) => extractList(data).map((item) => normalizeProductOrder(item)))
      .catch(() => []),
    apiRequest(`/api/owner/local-consumption-orders${toQuery({ branchId, status })}`)
      .then((data) => extractList(data).map((item) => normalizeLocalConsumptionOrder(item)))
      .catch(() => []),
  ]);

  return [...productOrders, ...localOrders];
}

async function postOrderAction({ branchId, orderId, action, payload = {} }) {
  const source = String(payload.source || '').toUpperCase();
  const basePath =
    source === 'LOCAL_CONSUMPTION'
      ? '/api/owner/local-consumption-orders'
      : '/api/owner/product-orders';
  const cleanPayload = { ...payload };
  delete cleanPayload.source;

  const data = await apiRequest(
    `${basePath}/${orderId}/${action}${toQuery({ branchId })}`,
    {
      method: 'POST',
      body: JSON.stringify(cleanPayload),
    }
  );

  return source === 'LOCAL_CONSUMPTION'
    ? normalizeLocalConsumptionOrder(data)
    : normalizeProductOrder(data);
}

export function approveOwnerProductOrder({ branchId, orderId, note, source = null }) {
  return postOrderAction({ branchId, orderId, action: 'approve', payload: { note, source } });
}

export function rejectOwnerProductOrder({ branchId, orderId, note, source = null }) {
  return postOrderAction({ branchId, orderId, action: 'reject', payload: { note, source } });
}

export function cancelOwnerProductOrder({ branchId, orderId, note, source = null }) {
  return postOrderAction({ branchId, orderId, action: 'cancel', payload: { note, source } });
}

export function deliverOwnerProductOrder({ branchId, orderId, note, source = null }) {
  return postOrderAction({ branchId, orderId, action: 'deliver', payload: { note, source } });
}
