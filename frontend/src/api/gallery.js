import api from './client.js';

export const getAlbums = () => api.get('/api/gallery/albums');
export const createAlbum = (data) => api.post('/api/gallery/albums', data);
export const updateAlbum = (id, data) => api.put(`/api/gallery/albums/${id}`, data);
export const deleteAlbum = (id) => api.delete(`/api/gallery/albums/${id}`);

export const getAlbumMedia = (id) => api.get(`/api/gallery/albums/${id}/media`);
export const uploadMedia = (id, files) => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('media', files[i]);
  }
  return api.post(`/api/gallery/albums/${id}/media`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};
export const deleteMedia = (id) => api.delete(`/api/gallery/media/${id}`);
