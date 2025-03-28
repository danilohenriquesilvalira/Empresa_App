import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { pontosAPI } from '../services/api';

// Definição de interfaces
interface RegistroPonto {
  id: number;
  tipo: string;
  data_hora: string;
  localizacao?: any;
  observacao?: string;
}

export default function RegistroPontoScreen() {
  const [registros, setRegistros] = useState<RegistroPonto[]>([]);
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  useEffect(() => {
    carregarRegistros();
    obterPermissaoLocalizacao();
  }, []);

  const obterPermissaoLocalizacao = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert(
          'Permissão necessária',
          'Precisamos da sua localização para registrar o ponto'
        );
        return;
      }
      
      // Obter localização atual
      const locationData = await Location.getCurrentPositionAsync({});
      setLocation(locationData);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível obter sua localização');
    } finally {
      setLocationLoading(false);
    }
  };

  const carregarRegistros = async () => {
    try {
      setLoading(true);
      const hoje = format(new Date(), 'yyyy-MM-dd');
      const response = await pontosAPI.listar(hoje);
      setRegistros(response.data || []);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar os registros');
    } finally {
      setLoading(false);
    }
  };

  const registrarPonto = async (tipo: string) => {
    if (!location) {
      Alert.alert('Localização necessária', 'Aguarde enquanto obtemos sua localização');
      await obterPermissaoLocalizacao();
      return;
    }

    try {
      setLoading(true);
      await pontosAPI.registrar(tipo);
      Alert.alert('Sucesso', 'Ponto registrado com sucesso');
      carregarRegistros();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível registrar o ponto');
    } finally {
      setLoading(false);
    }
  };

  const formatarHora = (dataHora: string) => {
    return format(new Date(dataHora), 'HH:mm:ss');
  };

  const formatarTipo = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'intervalo_inicio': return 'Início Intervalo';
      case 'intervalo_fim': return 'Fim Intervalo';
      default: return tipo;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Registro de Ponto</Text>
        <Text style={styles.headerDate}>
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </Text>
      </View>

      <View style={styles.botoesContainer}>
        <TouchableOpacity
          style={[styles.botao, styles.botaoEntrada]}
          onPress={() => registrarPonto('entrada')}
          disabled={loading}
        >
          <MaterialIcons name="login" size={24} color="#fff" />
          <Text style={styles.botaoTexto}>Entrada</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botao, styles.botaoIntervaloInicio]}
          onPress={() => registrarPonto('intervalo_inicio')}
          disabled={loading}
        >
          <MaterialIcons name="free-breakfast" size={24} color="#fff" />
          <Text style={styles.botaoTexto}>Iniciar Intervalo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botao, styles.botaoIntervaloFim]}
          onPress={() => registrarPonto('intervalo_fim')}
          disabled={loading}
        >
          <MaterialIcons name="work" size={24} color="#fff" />
          <Text style={styles.botaoTexto}>Finalizar Intervalo</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.botao, styles.botaoSaida]}
          onPress={() => registrarPonto('saida')}
          disabled={loading}
        >
          <MaterialIcons name="logout" size={24} color="#fff" />
          <Text style={styles.botaoTexto}>Saída</Text>
        </TouchableOpacity>
      </View>

      {locationLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#0066cc" />
          <Text style={styles.loadingText}>Obtendo localização...</Text>
        </View>
      )}

      <View style={styles.registrosContainer}>
        <Text style={styles.registrosTitle}>Registros de Hoje</Text>
        
        {loading ? (
          <ActivityIndicator size="large" color="#0066cc" style={styles.loading} />
        ) : (
          <ScrollView>
            {registros.length === 0 ? (
              <Text style={styles.semRegistros}>Nenhum registro hoje</Text>
            ) : (
              registros.map((registro, index) => (
                <View key={index} style={styles.registroItem}>
                  <View style={[
                    styles.registroIcon,
                    registro.tipo === 'entrada' ? styles.iconEntrada :
                    registro.tipo === 'saida' ? styles.iconSaida :
                    registro.tipo === 'intervalo_inicio' ? styles.iconIntervaloInicio :
                    styles.iconIntervaloFim
                  ]}>
                    <MaterialIcons 
                      name={
                        registro.tipo === 'entrada' ? 'login' : 
                        registro.tipo === 'saida' ? 'logout' :
                        registro.tipo === 'intervalo_inicio' ? 'free-breakfast' : 'work'
                      } 
                      size={20} 
                      color="#FFF" 
                    />
                  </View>
                  <View style={styles.registroInfo}>
                    <Text style={styles.registroTipo}>{formatarTipo(registro.tipo)}</Text>
                    <Text style={styles.registroHora}>{formatarHora(registro.data_hora)}</Text>
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

// Estilos não modificados
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0066cc',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerDate: {
    fontSize: 16,
    color: '#e6e6e6',
    marginTop: 4,
  },
  botoesContainer: {
    padding: 16,
  },
  botao: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  botaoEntrada: {
    backgroundColor: '#4CAF50',
  },
  botaoIntervaloInicio: {
    backgroundColor: '#FF9800',
  },
  botaoIntervaloFim: {
    backgroundColor: '#2196F3',
  },
  botaoSaida: {
    backgroundColor: '#F44336',
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  loadingText: {
    marginLeft: 8,
    color: '#0066cc',
  },
  registrosContainer: {
    flex: 1,
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  registrosTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  semRegistros: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
    marginTop: 20,
  },
  registroItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  registroIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconEntrada: {
    backgroundColor: '#4CAF50',
  },
  iconSaida: {
    backgroundColor: '#F44336',
  },
  iconIntervaloInicio: {
    backgroundColor: '#FF9800',
  },
  iconIntervaloFim: {
    backgroundColor: '#2196F3',
  },
  registroInfo: {
    flex: 1,
  },
  registroTipo: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  registroHora: {
    fontSize: 14,
    color: '#666',
  },
  loading: {
    marginTop: 20,
  },
});