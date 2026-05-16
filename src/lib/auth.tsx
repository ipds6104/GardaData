import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'admin' | 'petugas' | null;

interface AuthContextType {
  user: { username: string; role: UserRole } | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ username: string; role: UserRole } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('navigasi_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = (username: string, password: string): boolean => {
    if (username === 'admin' && password === 'admin6104') {
      const newUser = { username: 'admin', role: 'admin' as UserRole };
      setUser(newUser);
      localStorage.setItem('navigasi_user', JSON.stringify(newUser));
      return true;
    } else if (username === 'petugas' && password === 'petugas6104') {
      const newUser = { username: 'petugas', role: 'petugas' as UserRole };
      setUser(newUser);
      localStorage.setItem('navigasi_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('navigasi_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
