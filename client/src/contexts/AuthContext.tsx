import { createContext, useState, type ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

function decodeToken(token: string): User | null {
  try {
    const base64url = token.split('.')[1];
    const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - base64.length % 4) % 4);
    const payload = JSON.parse(atob(padded));
    return {
      id: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ?? '',
      name: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ?? '',
      email: payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ?? '',
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [user, setUser] = useState<User | null>(() => {
    const t = localStorage.getItem('token');
    return t ? decodeToken(t) : null;
  });

  const login = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(decodeToken(newToken));
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  const updateUser = (partial: Partial<User>) => {
    setUser(prev => prev ? { ...prev, ...partial } : prev);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, updateUser, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

