import { apiRequest } from './apiClient';

export function getOwnerReviews({ branchId = null, rating = null } = {}) {
  const params = new URLSearchParams();
  if (branchId) params.set('branchId', branchId);
  if (rating) params.set('rating', rating);
  const query = params.toString();
  return apiRequest(`/api/owner/reviews${query ? `?${query}` : ''}`);
}