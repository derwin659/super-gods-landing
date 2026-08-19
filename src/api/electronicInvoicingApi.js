import { apiRequest } from './apiClient';

export function getElectronicInvoicingAccess() {
  return apiRequest('/api/owner/electronic-invoicing/access');
}

export function getElectronicInvoicingSettings() {
  return apiRequest('/api/owner/electronic-invoicing/settings');
}

export function updateElectronicInvoicingSettings(payload) {
  return apiRequest('/api/owner/electronic-invoicing/settings', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function issueElectronicDocument({ saleId, ...payload }) {
  return apiRequest(`/api/owner/electronic-invoicing/sales/${saleId}/issue`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getSaleElectronicDocuments(saleId) {
  return apiRequest(`/api/owner/electronic-invoicing/sales/${saleId}`);
}

export function refreshElectronicDocument(documentId) {
  return apiRequest(`/api/owner/electronic-invoicing/documents/${documentId}/refresh`, {
    method: 'POST',
  });
}

export function retryElectronicDocument(documentId) {
  return apiRequest(`/api/owner/electronic-invoicing/documents/${documentId}/retry`, {
    method: 'POST',
  });
}

export function getElectronicDocumentFiles(documentId) {
  return apiRequest(`/api/owner/electronic-invoicing/documents/${documentId}/files`);
}

export function downloadBase64File(base64, mimeType, filename) {
  if (!base64) return false;
  const binary = window.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
