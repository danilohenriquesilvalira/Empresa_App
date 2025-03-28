import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Configuração base do Axios
const api = axios.create({
  baseURL: 'https://seu-servidor-api.tailscale.net/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token em todas requisições
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('@RLSApp:token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      await AsyncStorage.removeItem('@RLSApp:token');
      await AsyncStorage.removeItem('@RLSApp:user');
    }
    return Promise.reject(error);
  }
);

// APIs específicas
export const authAPI = {
  login: async (email: string, senha: string) => {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  }
};

export const colaboradorAPI = {
  obterPerfil: async () => {
    const response = await api.get('/me');
    return response.data;
  },
  
  atualizarPerfil: async (dados: any) => {
    const response = await api.put('/me', dados);
    return response.data;
  },
  
  alterarSenha: async (senhaAtual: string, novaSenha: string) => {
    const response = await api.put('/me/senha', { senha_atual: senhaAtual, nova_senha: novaSenha });
    return response.data;
  }
};

export const pontosAPI = {
  registrar: async (tipo: string, observacao: string = '') => {
    const response = await api.post('/pontos', { 
      tipo, data_hora: new Date().toISOString(), observacao 
    });
    return response.data;
  },
  
  listar: async (data?: string) => {
    const params = data ? { data } : {};
    const response = await api.get('/pontos', { params });
    return response.data;
  }
};

export const documentosAPI = {
  upload: async (formData: FormData) => {
    const response = await api.post('/documentos', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  listar: async (params = {}) => {
    const response = await api.get('/documentos', { params });
    return response;
  },
  
  obter: async (id: number) => {
    const response = await api.get(`/documentos/${id}`);
    return response;
  },
  
  aprovar: async (id: number, observacoes: string = '') => {
    const response = await api.put(`/documentos/${id}/aprovar`, { observacoes });
    return response.data;
  },
  
  rejeitar: async (id: number, motivo: string) => {
    const response = await api.put(`/documentos/${id}/rejeitar`, { motivo });
    return response.data;
  },
  
  enviar: async (id: number, observacoes: string = '') => {
    const response = await api.put(`/documentos/${id}/enviar`, { observacoes });
    return response.data;
  },
  
  downloadUrl: (id: number) => `${api.defaults.baseURL}/documentos/${id}/arquivo`
};

export default api;