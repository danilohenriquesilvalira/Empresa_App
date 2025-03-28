import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { pontosAPI, documentosAPI } from '../services/api';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Definindo interfaces
interface RegistroPonto {
  id: number;
  tipo: string;
  data_hora: string;
}

interface Documento {
  id: number;
  titulo: string;
  tipo_documento: string;
  data_documento: string;
  status: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation<any>();
  const [pontos, setPontos] = useState<RegistroPonto[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setRefreshing(true);
      
      // Carregar pontos de hoje
      const hoje = format(new Date(), 'yyyy-MM-dd');
      const pontosResponse = await pontosAPI.listar(hoje);
      setPontos(pontosResponse.data || []);
      
      // Carregar documentos recentes
      const documentosResponse = await documentosAPI.listar({ limit: 5 });
      setDocumentos(documentosResponse.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    loadData();
  };

  const formatarHora = (dataHora: string) => {
    return format(new Date(dataHora), 'HH:mm');
  };

  const formatarTipoPonto = (tipo: string) => {
    switch (tipo) {
      case 'entrada': return 'Entrada';
      case 'saida': return 'Saída';
      case 'intervalo_inicio': return 'Início Intervalo';
      case 'intervalo_fim': return 'Fim Intervalo';
      default: return tipo;
    }
  };

  const getNomeCargo = (cargoId: number) => {
    switch (cargoId) {
      case 1: return 'Segurança do Trabalho';
      case 2: return 'Gente e Gestão';
      case 3: return 'Elétrica';
      case 4: return 'TI';
      case 5: return 'Gerente';
      case 6: return 'Sócio';
      case 7: return 'Estagiário';
      default: return 'Colaborador';
    }
  };

  const isAdmin = user && (user.cargo_id === 2 || user.cargo_id === 5 || user.cargo_id === 6);

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Olá, {user?.nome}!</Text>
          <Text style={styles.subGreeting}>{user?.cargo_id ? getNomeCargo(user.cargo_id) : 'Colaborador'}</Text>
        </View>
      </View>

      <View style={styles.dateContainer}>
        <Text style={styles.date}>
          {format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}
        </Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('RegistroPonto')}
        >
          <MaterialIcons name="access-time" size={24} color="#0066cc" />
          <Text style={styles.actionButtonText}>Registrar Ponto</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => navigation.navigate('NovoDocumento')}
        >
          <MaterialIcons name="upload-file" size={24} color="#0066cc" />
          <Text style={styles.actionButtonText}>Enviar Documento</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Registros de Hoje</Text>
        {pontos.length > 0 ? (
          pontos.map((ponto, index) => (
            <View key={index} style={styles.pontoItem}>
              <View style={styles.pontoIcon}>
                <MaterialIcons 
                  name={
                    ponto.tipo === 'entrada' ? 'login' : 
                    ponto.tipo === 'saida' ? 'logout' :
                    ponto.tipo === 'intervalo_inicio' ? 'free-breakfast' : 'work'
                  } 
                  size={20} 
                  color="#FFF" 
                />
              </View>
              <View style={styles.pontoInfo}>
                <Text style={styles.pontoTipo}>{formatarTipoPonto(ponto.tipo)}</Text>
                <Text style={styles.pontoHora}>{formatarHora(ponto.data_hora)}</Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhum registro hoje</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Documentos Recentes</Text>
        {documentos.length > 0 ? (
          documentos.map((doc, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.documentoItem}
              onPress={() => navigation.navigate('DetalhesDocumento', { id: doc.id })}
            >
              <View style={styles.documentoIcon}>
                <MaterialIcons 
                  name={
                    doc.tipo_documento === 'recibo' ? 'receipt' : 
                    doc.tipo_documento === 'fatura' ? 'description' :
                    doc.tipo_documento === 'nota_fiscal' ? 'article' : 'insert-drive-file'
                  } 
                  size={20} 
                  color="#FFF" 
                />
              </View>
              <View style={styles.documentoInfo}>
                <Text style={styles.documentoTitulo}>{doc.titulo}</Text>
                <Text style={styles.documentoData}>
                  {format(new Date(doc.data_documento), 'dd/MM/yyyy')}
                </Text>
              </View>
              <View style={[
                styles.documentoStatus, 
                doc.status === 'aprovado' ? styles.statusAprovado : 
                doc.status === 'rejeitado' ? styles.statusRejeitado : 
                styles.statusPendente
              ]}>
                <Text style={styles.documentoStatusText}>
                  {doc.status === 'aprovado' ? 'Aprovado' : 
                   doc.status === 'rejeitado' ? 'Rejeitado' : 'Pendente'}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyText}>Nenhum documento encontrado</Text>
        )}
      </View>

      {isAdmin && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Administração</Text>
          <TouchableOpacity 
            style={styles.adminButton}
            onPress={() => navigation.navigate('DocumentosTab', { screen: 'Documentos', params: { filter: 'pendente' } })}
          >
            <MaterialIcons name="approval" size={24} color="#FFF" />
            <Text style={styles.adminButtonText}>Documentos Pendentes</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#0066cc',
  },
  greeting: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 14,
    color: '#e6e6e6',
    marginTop: 4,
  },
  dateContainer: {
    padding: 16,
    backgroundColor: '#0066cc',
    paddingTop: 0,
  },
  date: {
    fontSize: 16,
    color: '#fff',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    marginTop: -20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  actionButtonText: {
    marginTop: 4,
    color: '#333',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    marginTop: 0,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  pontoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  pontoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066cc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  pontoInfo: {
    flex: 1,
  },
  pontoTipo: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  pontoHora: {
    fontSize: 14,
    color: '#666',
  },
  documentoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 12,
  },
  documentoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#0066cc',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentoInfo: {
    flex: 1,
  },
  documentoTitulo: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  documentoData: {
    fontSize: 14,
    color: '#666',
  },
  documentoStatus: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusPendente: {
    backgroundColor: '#FFC107',
  },
  statusAprovado: {
    backgroundColor: '#4CAF50',
  },
  statusRejeitado: {
    backgroundColor: '#F44336',
  },
  documentoStatusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontStyle: 'italic',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 4,
  },
  adminButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
    marginLeft: 8,
  }
});