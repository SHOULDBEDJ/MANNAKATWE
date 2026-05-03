import api from './client.js';
export const getInstallments = (bookingId) => api.get(`/api/bookings/${bookingId}/installments`);
export const createInstallment = (bookingId, data) => api.post(`/api/bookings/${bookingId}/installments`, data);
export const deleteInstallment = (bookingId, installmentId) => api.delete(`/api/bookings/${bookingId}/installments/${installmentId}`);
