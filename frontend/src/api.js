import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getProfile: () => api.get('/users/me'),
};

// Group APIs
export const groupAPI = {
  getAll: () => api.get('/groups'),
  getOne: (id) => api.get(`/groups/${id}`),
  create: (data) => api.post('/groups', data),
  join: (id) => api.post(`/groups/${id}/join`),
  leave: (id) => api.post(`/groups/${id}/leave`),
  delete: (id) => api.delete(`/groups/${id}`),
};

// Event APIs
export const eventAPI = {
  getGroupEvents: (groupId) => api.get(`/groups/${groupId}/events`),
  create: (groupId, data) => api.post(`/groups/${groupId}/events`, data),
  toggleAttendance: (eventId) => api.post(`/events/${eventId}/attend`),
};

// Message APIs
export const messageAPI = {
  getMessages: (groupId) => api.get(`/groups/${groupId}/messages`),
  send: (groupId, content) => api.post(`/groups/${groupId}/messages`, { content }),
};

export default api;