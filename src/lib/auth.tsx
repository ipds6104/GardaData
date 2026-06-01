import React, { createContext, useContext, useState, useEffect } from 'react';

type UserRole = 'admin' | 'petugas' | null;

interface AuthContextType {
  user: { username: string; role: UserRole; name?: string } | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<{ username: string; role: UserRole; name?: string } | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('navigasi_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newUser = { 
          username: data.user.username, 
          role: data.user.role as UserRole,
          name: data.user.name 
        };
        setUser(newUser);
        localStorage.setItem('navigasi_user', JSON.stringify(newUser));
        localStorage.setItem('navigasi_token', data.token);
        return true;
      }
    } catch (error) {
      console.warn('Backend API connection failed, falling back to local simulation:', error);
    }

    // FALLBACK SIMULATION: If backend is offline/not started yet
    if (username === 'admin' && password === 'admin6104') {
      const newUser = { username: 'admin', role: 'admin' as UserRole, name: 'Administrator BPS' };
      setUser(newUser);
      localStorage.setItem('navigasi_user', JSON.stringify(newUser));
      return true;
    } else if (username === 'petugas' && password === 'petugas6104') {
      const newUser = { username: 'petugas', role: 'petugas' as UserRole, name: 'Petugas BPS' };
      setUser(newUser);
      localStorage.setItem('navigasi_user', JSON.stringify(newUser));
      return true;
    }
    return false;
  };


  const logout = () => {
    setUser(null);
    localStorage.removeItem('navigasi_user');
    localStorage.removeItem('navigasi_token');
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
