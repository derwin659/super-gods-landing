import { apiRequest, getApiBaseUrl, getToken } from './apiClient';

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
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.results)) return data.results;
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

export function normalizeProduct(raw = {}) {
  const precioVenta = toNumber(raw.precioVenta ?? raw.precio ?? raw.price);
  const stockActual = toNumber(raw.stockActual ?? raw.stock ?? raw.quantity);
  const stockMinimo = toNumber(raw.stockMinimo ?? raw.minimumStock ?? raw.minStock);

  return {
    id: toNumber(raw.id ?? raw.productId),
    nombre: text(raw.nombre ?? raw.name, 'Producto'),
    sku: text(raw.sku ?? ''),
    descripcion: text(raw.descripcion ?? raw.description ?? ''),
    precioCompra: toNumber(raw.precioCompra ?? raw.purchasePrice ?? raw.cost),
    precioVenta,
    precio: raw.precio === null || raw.precio === undefined ? precioVenta : toNumber(raw.precio),
    barberCommissionAmount: toNumber(raw.barberCommissionAmount ?? raw.productCommissionAmount),
    stockActual,
    stockMinimo,
    categoria: text(raw.categoria ?? raw.category ?? ''),
    imageUrl: text(raw.imageUrl ?? raw.imagenUrl ?? raw.photoUrl ?? ''),
    imagePublicId: text(raw.imagePublicId ?? ''),
    activo: raw.activo !== false,
    permiteVentaSinStock: raw.permiteVentaSinStock === true,
    publicVisible: raw.publicVisible === true,
    publicFeatured: raw.publicFeatured === true,
    publicAvailable: raw.publicAvailable === true,
    stockBajo: raw.stockBajo === true || stockActual <= stockMinimo,
    raw,
  };
}

export function normalizeStockMovement(raw = {}) {
  const cantidad = toNumber(raw.cantidad ?? raw.quantity, 0);
  const costoUnitario = toNumber(raw.costoUnitario ?? raw.unitCost, 0);

  return {
    id: toNumber(raw.id ?? raw.stockMovementId),
    productId: toNumber(raw.productId),
    productName: text(raw.productName ?? raw.producto ?? raw.productNombre ?? ''),
    branchId: toNumber(raw.branchId),
    branchName: text(raw.branchName ?? raw.sede ?? ''),
    userId: raw.userId === null || raw.userId === undefined ? null : toNumber(raw.userId),
    userName: text(raw.userName ?? raw.usuario ?? raw.responsable ?? ''),
    tipoMovimiento: text(raw.tipoMovimiento ?? raw.type ?? 'AJUSTE'),
    cantidad,
    stockAnterior: toNumber(raw.stockAnterior ?? raw.previousStock),
    stockNuevo: toNumber(raw.stockNuevo ?? raw.newStock),
    costoUnitario,
    costoTotal: toNumber(raw.costoTotal ?? raw.totalCost, costoUnitario * cantidad),
    precioUnitario: toNumber(raw.precioUnitario ?? raw.unitPrice),
    proveedor: text(raw.proveedor ?? raw.provider ?? ''),
    fechaRecepcion: text(raw.fechaRecepcion ?? raw.receptionDate ?? ''),
    numeroComprobante: text(raw.numeroComprobante ?? raw.receiptNumber ?? ''),
    observacion: text(raw.observacion ?? raw.note ?? ''),
    fechaCreacion: text(raw.fechaCreacion ?? raw.createdAt ?? ''),
    raw,
  };
}

export async function getOwnerBranchesForProducts() {
  const [dashboard, activeBranches] = await Promise.all([
    apiRequest('/api/owner/home/dashboard').catch(() => null),
    apiRequest('/api/owner/branches/active').catch(() => null),
  ]);

  const raw = [
    ...(Array.isArray(dashboard?.branches) ? dashboard.branches : []),
    ...extractList(activeBranches),
  ];
  const map = new Map();

  raw.forEach((item) => {
    const id = Number(item.branchId ?? item.id ?? 0);
    if (!id) return;

    map.set(String(id), {
      id,
      name: String(item.branchName ?? item.name ?? item.nombre ?? 'Sede'),
    });
  });

  return Array.from(map.values());
}

export async function getOwnerProducts({ branchId, activeOnly = null }) {
  const data = await apiRequest(
    `/api/owner/products${toQuery({ branchId, activeOnly })}`
  );

  return extractList(data).map((item) => normalizeProduct(item));
}

export async function createOwnerProduct({ branchId, payload }) {
  const data = await apiRequest(
    `/api/owner/products${toQuery({ branchId })}`,
    {
      method: 'POST',
      body: JSON.stringify(normalizeProductPayload(payload)),
    }
  );

  return normalizeProduct(data);
}

export async function updateOwnerProduct({ branchId, productId, payload }) {
  const data = await apiRequest(
    `/api/owner/products/${productId}${toQuery({ branchId })}`,
    {
      method: 'PUT',
      body: JSON.stringify(normalizeProductPayload(payload)),
    }
  );

  return normalizeProduct(data);
}

export async function toggleOwnerProductActive({ branchId, productId }) {
  const data = await apiRequest(
    `/api/owner/products/${productId}/toggle-active${toQuery({ branchId })}`,
    { method: 'PATCH' }
  );

  return normalizeProduct(data);
}

export async function adjustOwnerProductStock({ branchId, productId, payload }) {
  const data = await apiRequest(
    `/api/owner/products/${productId}/stock${toQuery({ branchId })}`,
    {
      method: 'PATCH',
      body: JSON.stringify({
        quantityDelta: Number(payload.quantityDelta || 0),
        tipoMovimiento: payload.tipoMovimiento || 'AJUSTE',
        proveedor: payload.proveedor || null,
        fechaRecepcion: payload.fechaRecepcion || null,
        costoUnitario:
          payload.costoUnitario === null || payload.costoUnitario === undefined || payload.costoUnitario === ''
            ? null
            : Number(payload.costoUnitario),
        numeroComprobante: payload.numeroComprobante || null,
        observacion: payload.observacion || null,
      }),
    }
  );

  return normalizeProduct(data);
}

export async function getOwnerProductStockMovements({ branchId, productId, limit = 20 }) {
  const data = await apiRequest(
    `/api/owner/products/${productId}/stock-movements${toQuery({ branchId, limit })}`
  );

  return extractList(data).map((item) => normalizeStockMovement(item));
}

export async function uploadOwnerProductImage({ branchId, productId, file }) {
  if (!file) return null;

  const token = getToken();
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(
    `${getApiBaseUrl()}/api/owner/products/${productId}/image${toQuery({ branchId })}`,
    {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    }
  );

  const textBody = await response.text();
  let data = null;

  try {
    data = textBody ? JSON.parse(textBody) : null;
  } catch {
    data = textBody;
  }

  if (!response.ok) {
    const message = data?.message || data?.error || `Error HTTP ${response.status}`;
    throw new Error(message);
  }

  return normalizeProduct(data);
}

function normalizeProductPayload(payload = {}) {
  const precioVenta = Number(payload.precioVenta || payload.precio || 0);

  return {
    nombre: String(payload.nombre || '').trim(),
    sku: String(payload.sku || '').trim() || null,
    descripcion: String(payload.descripcion || '').trim() || null,
    precioCompra: Number(payload.precioCompra || 0),
    precioVenta,
    precio: precioVenta,
    barberCommissionAmount: Number(payload.barberCommissionAmount || 0),
    stockActual: Number(payload.stockActual || 0),
    stockMinimo: Number(payload.stockMinimo || 0),
    categoria: String(payload.categoria || '').trim() || null,
    activo: payload.activo !== false,
    permiteVentaSinStock: payload.permiteVentaSinStock === true,
    publicVisible: payload.publicVisible === true,
    publicFeatured: payload.publicFeatured === true,
  };
}
