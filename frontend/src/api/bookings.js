import api from './client.js';

export const getBookings = (params) => api.get('/api/bookings', { params });
export const getBooking = (id) => api.get(`/api/bookings/${id}`);
export const createBooking = (data) => api.post('/api/bookings', data);
export const updateBooking = (id, data) => api.put(`/api/bookings/${id}`, data);
export const deleteBooking = (id) => api.delete(`/api/bookings/${id}`);
export const updateBookingStatus = (id, data) => api.put(`/api/bookings/${id}/status`, data);
export const updateReturnStatus = (id, data) => api.put(`/api/bookings/${id}/return-status`, data);
export const updatePaymentStatus = (id, data) => api.put(`/api/bookings/${id}/payment-status`, data);
export const getBookingInstallments = (id) => api.get(`/api/bookings/${id}/installments`);
export const addBookingInstallment = (id, data) => api.post(`/api/bookings/${id}/installments`, data);
export const deleteBookingInstallment = (id, installmentId) => api.delete(`/api/bookings/${id}/installments/${installmentId}`);

export const uploadPhotos = (id, files) => {
  const formData = new FormData();
  for (let i = 0; i < files.length; i++) {
    formData.append('photos', files[i]);
  }
  return api.post(`/api/bookings/${id}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deletePhoto = (id, photoId) => api.delete(`/api/bookings/${id}/photos/${photoId}`);
