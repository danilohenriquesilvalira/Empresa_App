import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

// Tipos
interface User {
  id: number;
  uuid: string;
  nome: string;
  email: string;
  cargo_id: number;
  status: string;
  foto_perfil?: string;
  data_admissao?: string;
}

interface AuthContextData {
  user: User | null;
  loading: boolean;
  signIn: (email: string, senha: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

// Contexto
const AuthContext = createContext<AuthContextData>({} as AuthContextData);

// Provider
export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Carregar dados armazenados na inicialização
  useEffect(() => {
    async function loadStoredData() {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem('@RLSApp:user'),
          AsyncStorage.getItem('@RLSApp:token')
        ]);

        if (storedUser && storedToken) {
          api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error('Erro ao carregar dados armazenados', error);
      } finally {
        setLoading(false);
      }
    }

    loadStoredData();
  }, []);

  // Login
  async function signIn(email: string, senha: string) {
    try {
      const response = await api.post('/auth/login', { email, senha });
      const { token, user } = response.data;

      await Promise.all([
        AsyncStorage.setItem('@RLSApp:token', token),
        AsyncStorage.setItem('@RLSApp:user', JSON.stringify(user))
      ]);

      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    } catch (error) {
      console.error('Erro ao fazer login', error);
      throw error;
    }
  }

  // Logout
  async function signOut() {
    try {
      await Promise.all([
        AsyncStorage.removeItem('@RLSApp:token'),
        AsyncStorage.removeItem('@RLSApp:user')
      ]);

      api.defaults.headers.common['Authorization'] = '';
      setUser(null);
    } catch (error) {
      console.error('Erro ao fazer logout', error);
      throw error;
    }
  }

  // Atualizar dados do usuário
  async function updateUser(updatedUser: User) {
    try {
      await AsyncStorage.setItem('@RLSApp:user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (error) {
      console.error('Erro ao atualizar usuário', error);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook personalizado
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}