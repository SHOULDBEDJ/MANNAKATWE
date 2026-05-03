import API from './client.js';

export const getVoiceNotes = (bookingId) => API.get(`/bookings/${bookingId}/voice-notes`);

export const addVoiceNote = (bookingId, audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'voice_note.webm');
  return API.post(`/bookings/${bookingId}/voice-notes`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteVoiceNote = (bookingId, noteId) =>
  API.delete(`/bookings/${bookingId}/voice-notes/${noteId}`);
