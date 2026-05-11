import { apiRequest } from './apiClient';

function buildQuery(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      query.append(key, value);
    }
  });

  const text = query.toString();
  return text ? `?${text}` : '';
}

export async function getOwnerBarberAvailability({ branchId, barberUserId }) {
  return apiRequest(
    `/api/owner/barber-availability${buildQuery({
      branchId,
      barberUserId,
    })}`
  );
}

export async function saveOwnerBarberAvailability({ branchId, barberUserId, days }) {
  return apiRequest(
    `/api/owner/barber-availability${buildQuery({
      branchId,
    })}`,
    {
      method: 'POST',
      body: JSON.stringify({
        barberUserId,
        days,
      }),
    }
  );
}

export async function getOwnerBarberTimeBlocks({ branchId, barberUserId }) {
  return apiRequest(
    `/api/owner/barber-time-blocks${buildQuery({
      branchId,
      barberUserId,
    })}`
  );
}

export async function createOwnerBarberTimeBlock({
  branchId,
  barberUserId,
  blockDate,
  startTime,
  endTime,
  allDay,
  reason,
}) {
  return apiRequest(
    `/api/owner/barber-time-blocks${buildQuery({
      branchId,
    })}`,
    {
      method: 'POST',
      body: JSON.stringify({
        barberUserId,
        blockDate,
        startTime,
        endTime,
        allDay,
        reason,
      }),
    }
  );
}

export async function deleteOwnerBarberTimeBlock({ branchId, blockId }) {
  return apiRequest(
    `/api/owner/barber-time-blocks/${blockId}${buildQuery({
      branchId,
    })}`,
    {
      method: 'DELETE',
    }
  );
}