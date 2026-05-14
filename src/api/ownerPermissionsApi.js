import { apiRequest } from './apiClient';

function normalizePermissions(raw = {}) {
  const permissions = Array.isArray(raw.permissions)
    ? raw.permissions
        .map((item) => String(item || '').trim().toUpperCase())
        .filter(Boolean)
    : [];

  return {
    tenantId: raw.tenantId ?? null,
    userId: raw.userId ?? null,
    role: String(raw.role || '').toUpperCase(),
    owner: raw.owner === true,
    permissions,
    raw,
  };
}

export async function getMyOwnerPermissions() {
  const data = await apiRequest('/api/owner/admin-permissions/me');
  return normalizePermissions(data);
}