import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('placement_dost_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      // Background refresh user stats
      api.getProfile(user.id).then(res => {
        if (res.user) {
          setUser(res.user);
          localStorage.setItem('placement_dost_user', JSON.stringify(res.user));
        }
      }).catch(err => console.warn('User profile sync skipped:', err.message));
    }
  }, [user?.id]);

  const loginUser = async (email) => {
    setLoading(true);
    try {
      const res = await api.login(email);
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('placement_dost_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || 'Login failed' };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async (googleData) => {
    setLoading(true);
    try {
      const res = await api.loginWithGoogle(googleData);
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('placement_dost_user', JSON.stringify(res.user));
        return { success: true, user: res.user, isNewUser: res.isNewUser };
      }
      return { success: false, error: res.error || 'Google login failed' };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (formData) => {
    setLoading(true);
    try {
      const res = await api.register(formData);
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('placement_dost_user', JSON.stringify(res.user));
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || 'Registration failed' };
    } catch (e) {
      return { success: false, error: e.message };
    } finally {
      setLoading(false);
    }
  };

  const switchUser = (newUser) => {
    setUser(newUser);
    localStorage.setItem('placement_dost_user', JSON.stringify(newUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('placement_dost_user');
  };

  const updateLocalPoints = (newPoints) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, points: newPoints };
      localStorage.setItem('placement_dost_user', JSON.stringify(updated));
      return updated;
    });
  };

  const refreshUser = async () => {
    if (user?.id) {
      const res = await api.getProfile(user.id);
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('placement_dost_user', JSON.stringify(res.user));
      }
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      loginUser,
      loginWithGoogle,
      registerUser,
      switchUser,
      logout,
      updateLocalPoints,
      refreshUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
