import axios from 'axios';

// In production (two-service deployment) the frontend and backend live on
// different Railway URLs, so the API base must be absolute — set via
// VITE_API_URL at build time. Locally, VITE_API_URL is left unset and the
// relative '/api' path is used unchanged, which Vite's dev-server proxy
// forwards to the backend (see vite.config.js).
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL.replace(/\/+$/, '')}/api`
  : '/api';

export const api = axios.create({
  baseURL,
});

// Absolute origin for static /uploads files (avatars, dispute evidence),
// which are served by the backend, not the frontend dev server. In dev,
// VITE_API_URL is unset but the backend is always on :4000; in production
// (two-service deploy) VITE_API_URL already points at the backend origin.
export const apiOrigin = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace(/\/+$/, '')
  : import.meta.env.DEV
    ? 'http://localhost:4000'
    : '';

export function assetUrl(path) {
  if (!path) return null;
  return `${apiOrigin}${path}`;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fifasoul_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
