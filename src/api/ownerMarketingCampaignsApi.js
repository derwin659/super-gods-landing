import { apiRequest } from './apiClient';

export const getCampaignPreview = () =>
  apiRequest('/api/owner/marketing-campaigns/preview');

export const runConfirmedCampaigns = () =>
  apiRequest('/api/owner/marketing-campaigns/run-confirmed', {
    method: 'POST',
    body: JSON.stringify({ confirmed: true }),
  });

export const getCampaignHistory = () =>
  apiRequest('/api/owner/marketing-campaigns/history');
export const runSegmentCampaign = ({ title, message, customerIds, filterSnapshot, channelWhatsapp = true }) =>
  apiRequest('/api/owner/marketing-campaigns/segment/run-confirmed', {
    method: 'POST',
    body: JSON.stringify({
      confirmed: true,
      title,
      message,
      customerIds,
      filterSnapshot,
      channelWhatsapp,
    }),
  });
