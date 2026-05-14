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

function extractList(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.users)) return data.users;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function normalizeUser(raw = {}) {
  const nombre = text(raw.nombre ?? raw.firstName ?? raw.name ?? '');
  const apellido = text(raw.apellido ?? raw.lastName ?? '');
  const fullName = text(
    raw.fullName ??
      raw.nombreCompleto ??
      [nombre, apellido].filter(Boolean).join(' '),
    'Usuario'
  ).trim();

  return {
    id: toNumber(raw.id ?? raw.userId),
    nombre,
    apellido,
    fullName: fullName || 'Usuario',
    email: text(raw.email ?? raw.correo ?? ''),
    phone: text(raw.phone ?? raw.telefono ?? ''),
    rol: text(raw.rol ?? raw.role ?? '').toUpperCase(),
    activo: raw.activo !== false && raw.enabled !== false,
    branchId:
      raw.branchId === null || raw.branchId === undefined
        ? null
        : toNumber(raw.branchId),
    branchName: text(
      raw.branchName ??
        raw.sede ??
        raw.branch?.nombre ??
        raw.branch?.name ??
        ''
    ),
    photoUrl: text(raw.photoUrl ?? raw.fotoUrl ?? raw.imageUrl ?? ''),
    raw,
  };
}

function normalizeBranch(raw = {}) {
  return {
    id: toNumber(raw.branchId ?? raw.id),
    nombre: text(raw.branchName ?? raw.nombre ?? raw.name ?? 'Sede'),
    raw,
  };
}

function normalizePermissions(raw = {}) {
  return {
    tenantId:
      raw.tenantId === null || raw.tenantId === undefined
        ? null
        : toNumber(raw.tenantId),
    userId:
      raw.userId === null || raw.userId === undefined
        ? null
        : toNumber(raw.userId),
    role: text(raw.role ?? ''),
    owner: raw.owner === true,
    permissions: extractList(raw.permissions)
      .map((item) => String(item || '').trim().toUpperCase())
      .filter(Boolean),
    raw,
  };
}

export const ADMIN_PERMISSION_GROUPS = [
  {
    title: 'Configuración',
    subtitle: 'Controla qué opciones del negocio puede administrar.',
    permissions: [
      ['Acceder a configuración', 'CONFIG_ACCESS'],
      ['Gestionar barberos', 'CONFIG_BARBERS'],
      ['Gestionar servicios', 'CONFIG_SERVICES'],
      ['Gestionar productos', 'CONFIG_PRODUCTS'],
      ['Gestionar sedes', 'CONFIG_BRANCHES'],
      ['Métodos de pago', 'CONFIG_PAYMENT_METHODS'],
      ['Recompensas', 'CONFIG_REWARDS'],
      ['Promociones', 'CONFIG_PROMOTIONS'],
    ],
  },
  {
    title: 'Caja',
    subtitle: 'Define si puede operar caja y registrar movimientos.',
    permissions: [
      ['Ver / operar caja', 'CASH_ACCESS'],
      ['Registrar ingresos', 'CASH_REGISTER_INCOME'],
      ['Registrar gastos', 'CASH_REGISTER_EXPENSE'],
      ['Cerrar caja', 'CASH_CLOSE'],
    ],
  },
  {
    title: 'Reportes',
    subtitle: 'Controla el acceso a números sensibles del negocio.',
    permissions: [
      ['Ver reportes', 'REPORTS_ACCESS'],
      ['Ver rentabilidad', 'REPORTS_PROFITABILITY'],
      ['Ver pagos de barberos', 'REPORTS_BARBER_PAYMENTS'],
    ],
  },
  {
    title: 'Agenda y clientes',
    subtitle: 'Permisos operativos del día a día.',
    permissions: [
      ['Ver agenda', 'AGENDA_ACCESS'],
      ['Ver clientes', 'CUSTOMERS_ACCESS'],
    ],
  },
];

export const CONFIG_CHILD_PERMISSIONS = new Set([
  'CONFIG_BARBERS',
  'CONFIG_SERVICES',
  'CONFIG_PRODUCTS',
  'CONFIG_BRANCHES',
  'CONFIG_PAYMENT_METHODS',
  'CONFIG_REWARDS',
  'CONFIG_PROMOTIONS',
]);

export async function getOwnerInternalUsers() {
  const data = await apiRequest('/api/internal/users');
  return extractList(data).map(normalizeUser);
}

export async function getOwnerBranchesForAdmins() {
  const data = await apiRequest('/api/owner/home/dashboard');
  return extractList(data?.branches).map(normalizeBranch);
}

export async function createOwnerAdmin({
  nombre,
  apellido = '',
  email,
  phone = '',
  password,
  branchId,
}) {
  const data = await apiRequest('/api/internal/users', {
    method: 'POST',
    body: JSON.stringify({
      nombre: String(nombre || '').trim(),
      apellido: String(apellido || '').trim(),
      email: String(email || '').trim(),
      phone: String(phone || '').trim(),
      password: String(password || '').trim(),
      branchId: Number(branchId),
      rol: 'ADMIN',
    }),
  });

  return normalizeUser(data);
}

export async function updateOwnerAdmin({
  userId,
  nombre,
  apellido = '',
  phone = '',
  branchId,
}) {
  const data = await apiRequest(`/api/internal/users/${userId}`, {
    method: 'PUT',
    body: JSON.stringify({
      nombre: String(nombre || '').trim(),
      apellido: String(apellido || '').trim(),
      phone: String(phone || '').trim(),
      branchId: Number(branchId),
      rol: 'ADMIN',
    }),
  });

  return normalizeUser(data);
}

export async function changeOwnerUserRole({ userId, targetRole, branchId }) {
  const data = await apiRequest(`/api/internal/users/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({
      targetRole: String(targetRole || '').trim().toUpperCase(),
      branchId: Number(branchId),
    }),
  });

  return normalizeUser(data);
}

export async function changeOwnerUserStatus({ userId, activo }) {
  await apiRequest(`/api/internal/users/${userId}/estado`, {
    method: 'PUT',
    body: JSON.stringify({ activo: Boolean(activo) }),
  });
}

export async function changeOwnerUserPassword({ userId, newPassword }) {
  await apiRequest(`/api/internal/users/${userId}/password`, {
    method: 'PUT',
    body: JSON.stringify({ newPassword: String(newPassword || '').trim() }),
  });
}

export async function getAdminPermissions(adminUserId) {
  const data = await apiRequest(`/api/owner/admin-permissions/${adminUserId}`);
  return normalizePermissions(data);
}

export async function updateAdminPermissions({ adminUserId, permissions }) {
  const clean = Array.from(
    new Set(
      (permissions || [])
        .map((item) => String(item || '').trim().toUpperCase())
        .filter(Boolean)
    )
  );

  const hasAnyConfigChild = clean.some((key) =>
    CONFIG_CHILD_PERMISSIONS.has(key)
  );

  if (hasAnyConfigChild && !clean.includes('CONFIG_ACCESS')) {
    clean.push('CONFIG_ACCESS');
  }

  const data = await apiRequest(`/api/owner/admin-permissions/${adminUserId}`, {
    method: 'PUT',
    body: JSON.stringify({
      permissions: clean.sort(),
    }),
  });

  return normalizePermissions(data);
}

export async function getMyAdminPermissions() {
  const data = await apiRequest('/api/owner/admin-permissions/me');
  return normalizePermissions(data);
}