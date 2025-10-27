import React, { useState, useEffect, useContext, ReactNode } from 'react';
import { setCookie, getCookie, deleteCookie } from 'cookies-next';

// ===== Tipagem =====
interface User {
  id_usuario: string;
  nome: string;
  email: string;
  cpf: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, senha: string) => void;
  load: () => void;
  sign: (email: string, senha: string, cpf: string, nome: string) => void;
  logout: () => void;
  isLoading: boolean;
}

interface AuthProviderProps {
  children: ReactNode;
}

const SERVER = process.env.NEXT_PUBLIC_SERVER_URL;

// ===== Contexto =====
const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Carrega usuário do cookie
  useEffect(() => {
    const userCookie = getCookie('user');
    if (userCookie) {
      try {
        setUser(JSON.parse(userCookie as string));
      } catch (err) {
        console.error('Erro ao ler cookie de usuário:', err);
        deleteCookie('user');
      }
    }
  }, []);

  const sign = async (
    nome: string,
    cpf: string,
    email: string,
    senha: string
  ) => {
    setIsLoading(true);

    const data = {
      nome,
      cpf,
      email,
      senha,
    };
    console.log(data);

    try {
      const response = await fetch(`${SERVER}/cadastro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Erro ao cadastrar');
      }

      login(email, senha);
    } finally {
      setIsLoading(false);
    }
  };
  // ===== Funções =====
  const login = async (email: string, senha: string) => {
    setIsLoading(true);
    if (!email || !senha) return;

    const data = {
      email,
      senha,
    };

    try {
      const response = await fetch(`${SERVER}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Erro ao entrar');
      }
      const { usuario } = await response.json();
      setCookie('user', JSON.stringify(usuario), { maxAge: 60 * 60 * 24 * 7 }); // 7 dias
      setUser(user);
      window.location.href = '/terapeutas';
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const load = async () => {
    setIsLoading(true);
    if (!user?.email) return;

    const data = {
      email: user.email,
    };

    try {
      const response = await fetch(`${SERVER}/load-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(err || 'Erro ao entrar');
      }
      const { usuario } = await response.json();
      setCookie('user', JSON.stringify(usuario), { maxAge: 60 * 60 * 24 * 7 }); // 7 dias
      setUser(user);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    deleteCookie('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, load, sign, logout, isLoading }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ===== Hook personalizado =====
const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export { AuthProvider, useAuth };
