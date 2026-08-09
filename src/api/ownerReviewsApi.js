import { apiRequest } from './apiClient';

export function getOwnerReviews({ branchId = null, rating = null } = {}) {
  const params = new URLSearchParams();
  if (branchId) params.set('branchId', branchId);
  if (rating) params.set('rating', rating);
  const query = params.toString();
  return apiRequest(`/api/owner/reviews${query ? `?${query}` : ''}`);
}
export function replyOwnerReview(reviewId, reply) {
  return apiRequest(`/api/owner/reviews/${reviewId}/reply`, {
    method: 'PUT',
    body: JSON.stringify({ reply }),
  });
}
export function reportOwnerReview(reviewId, reason, details = '') {
  return apiRequest(`/api/owner/reviews/${reviewId}/report`, {
    method: 'POST',
    body: JSON.stringify({ reason, details }),
  });
}