import { apiRequest, getApiBaseUrl, getToken } from './apiClient';
export const getAcademyCatalog = () => apiRequest('/api/academy?platform=web');
export const getAcademyAdmin = () => apiRequest('/api/super-admin/academy');
export const saveAcademyDraft = (id, draft) => apiRequest(`/api/super-admin/academy${id ? `/${encodeURIComponent(id)}` : ''}`, { method: id ? 'PUT' : 'POST', body: JSON.stringify(draft) });
export const publishAcademyLesson = (id, version, published) => apiRequest(`/api/super-admin/academy/${encodeURIComponent(id)}/${published ? 'publish' : 'unpublish'}`, { method: 'POST', body: JSON.stringify({ version }) });
export function uploadAcademyVideo(id, version, file, onProgress) {
  if (file.size > 35 * 1024 * 1024 || !/\.mp4$/i.test(file.name) || file.type !== 'video/mp4') return Promise.reject(new Error('Selecciona un MP4 de hasta 35 MB.'));
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${getApiBaseUrl()}/api/super-admin/academy/${encodeURIComponent(id)}/video`);
    xhr.setRequestHeader('Authorization', `Bearer ${getToken()}`);
    xhr.timeout = 600000;
    xhr.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round(event.loaded / event.total * 100)); };
    xhr.onload = () => {
      let data;
      try { data = JSON.parse(xhr.responseText); } catch { reject(new Error('No se pudo confirmar la subida. Recarga la lección antes de reintentar.')); return; }
      if (xhr.status >= 200 && xhr.status < 300) resolve(data);
      else reject(new Error(data.message || data.detail || data.error || 'No se pudo subir el video.'));
    };
    xhr.onerror = xhr.ontimeout = () => reject(new Error('Se perdió la conexión. Recarga la lección para comprobar si el video se guardó antes de volver a subirlo.'));
    const form = new FormData(); form.append('version', String(version)); form.append('video', file); xhr.send(form);
  });
}