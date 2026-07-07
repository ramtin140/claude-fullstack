import { api } from './client.js';

export const h2hApi = {
  listOpen: () => api.get('/h2h'),
  listMine: () => api.get('/h2h/mine'),
  get: (id) => api.get(`/h2h/${id}`),
  create: (payload) => api.post('/h2h', payload),
  join: (id, payload = {}) => api.post(`/h2h/${id}/join`, payload),
  submitLeg: (id, legNumber, payload) => api.post(`/h2h/${id}/legs/${legNumber}/submit`, payload),
  confirmLeg: (id, legNumber) => api.post(`/h2h/${id}/legs/${legNumber}/confirm`),
  disputeLeg: (id, legNumber, payload) => api.post(`/h2h/${id}/legs/${legNumber}/dispute`, payload),
};

export const walletApi = {
  me: () => api.get('/wallet/me'),
};

export const adminEconomyApi = {
  expertQueue: () => api.get('/h2h/admin/expert-queue'),
  expertResolve: (matchId, legNumber, payload) => api.post(`/h2h/${matchId}/legs/${legNumber}/expert-resolve`, payload),
  gradeThresholds: () => api.get('/admin/economy/grade-thresholds'),
  updateGradeThreshold: (grade, payload) => api.put(`/admin/economy/grade-thresholds/${grade}`, payload),
  adjustWallet: (userId, payload) => api.post(`/admin/economy/wallet/${userId}/adjust`, payload),
  resetSeason: (payload) => api.post('/admin/economy/season/reset', payload),
  seasonArchive: () => api.get('/admin/economy/season/archive'),
};
