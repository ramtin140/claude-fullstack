import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('fifasoul_token');
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .get('/auth/me')
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('fifasoul_token'))
      .finally(() => setLoading(false));
  }, []);

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('fifasoul_token', data.token);
    setUser(data.user);
    return data.user;
  }

  async function register(name, email, password, consoleIds = {}) {
    const { data } = await api.post('/auth/register', { name, email, password, ...consoleIds });
    localStorage.setItem('fifasoul_token', data.token);
    setUser(data.user);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('fifasoul_token');
    setUser(null);
  }

  // Wallet-affecting actions (join/submit/confirm/dispute a match, admin
  // wallet adjustments, ...) change the user's balance/grade server-side;
  // this re-syncs the cached user object so things like the navbar's ticket
  // count don't go stale after those actions.
  async function refreshUser() {
    if (!localStorage.getItem('fifasoul_token')) return;
    const { data } = await api.get('/auth/me');
    setUser(data.user);
    return data.user;
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
