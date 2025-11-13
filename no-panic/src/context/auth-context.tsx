'use client';

import React, { useState, useEffect, useContext, ReactNode } from 'react';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';
import { redirect } from 'next/navigation';
import { Terapeuta } from '@/app/terapeutas/page';

export interface User {
  id: number;
  nome: string;
  email: string;
  cpf: string;
  terapeuta: Terapeuta;
  primeiro_login: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, senha: string) => Promise<void>;
  sign: (
    nome: string,
    cpf: string,
    email: string,
    senha: string
  ) => Promise<void>;
  load: () => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
  initialUser?: User | null;
}

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL!;
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // 🔹 Carrega cookie no cliente
  useEffect(() => {
    if (!user) {
      const userCookie = getCookie('user');
      if (userCookie) {
        try {
          setUser(JSON.parse(userCookie as string));
        } catch {
          deleteCookie('user');
        }
      }
    }
  }, []);

  // 🔹 Cadastro
  const sign = async (
    nome: string,
    cpf: string,
    email: string,
    senha: string
  ) => {
    setIsLoading(true);
    try {
      const res = await fetch(`${SERVER}/cadastro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome, cpf, email, senha }),
      });
      if (!res.ok) throw new Error(await res.text());

      const usuario: User = await res.json();
      setCookie('user', JSON.stringify(usuario), { maxAge: 60 * 60 * 24 * 7 });
      setUser(usuario);
      window.location.href = '/terapeutas';
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Login
  const login = async (email: string, senha: string) => {
    if (!email || !senha) return;
    setIsLoading(true);
    try {
      const res = await fetch(`${SERVER}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      if (!res.ok) throw new Error(await res.text());

      const usuario: User = await res.json();
      setCookie('user', JSON.stringify(usuario), { maxAge: 60 * 60 * 24 * 7 });
      setUser(usuario);
      window.location.href = '/terapeutas';
    } finally {
      setIsLoading(false);
    }
  };

  // 🔹 Recarregar user atualizado
  const load = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${SERVER}/load-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      if (!res.ok) throw new Error(await res.text());

      const usuario: User = await res.json();
      setCookie('user', JSON.stringify(usuario), { maxAge: 60 * 60 * 24 * 7 });
      setUser(usuario);
    } catch (err) {
      console.error('Erro ao atualizar usuário:', err);
    }
  };

  // 🔹 Logout
  const logout = () => {
    deleteCookie('user');
    setUser(null);
    redirect('/');
  };

  return (
    <AuthContext.Provider
      value={{ user, login, sign, load, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook customizado
export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  return ctx;
};
