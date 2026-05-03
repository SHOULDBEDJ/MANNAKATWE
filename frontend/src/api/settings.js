import api from './client.js';

export const getKpiConfig = () => api.get('/api/settings/kpi-config');
export const updateKpiConfig = (data) => api.put('/api/settings/kpi-config', data);

export const backupData = () => api.get('/api/settings/backup', { responseType: 'blob' });
export const restoreData = (file) => {
  const formData = new FormData();
  formData.append('backup', file);
  return api.post('/api/settings/restore', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const deleteAllData = () => api.delete('/api/settings/delete-all');
