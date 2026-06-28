import { apiRequest } from './apiClient';

function toQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') query.set(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : '';
}

export async function getGeneralAuditLogs({ branchId, actorUserId, entityType, action, from, to }) {
  const data = await apiRequest(`/api/owner/audit-logs${toQuery({
    branchId,
    actorUserId,
    entityType,
    action,
    from,
    to,
  })}`);
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  return [];
}
