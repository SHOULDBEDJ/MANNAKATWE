import api from './client.js';

export const getProfile = () => api.get('/api/profile');
export const updateProfile = (data) => api.post('/api/profile', data);
export const uploadFile = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/api/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
