import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { format } from 'date-fns';
import { documentosAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function DocumentosScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = useAuth();
  
  const [documentos, setDocumentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState(route.params?.filter || 'todos');

  const isAdmin = user && (user.cargo_id === 2 || user.cargo_id === 5 || user.cargo_id === 6);

  useEffect(() => {
    carregarDocumentos();
  }, [selectedFilter]);

  const carregarDocumentos = async () => {
    try {
      setLoading(true);
      const params = {};
      
      if (selectedFilter !== 'todos') {
        params.status = selectedFilter;
      }
      
      const response = await documentosAPI.listar(params);
      setDocumentos(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar documentos', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    carregarDocumentos();
  };

  const handleNovoDocumento = () => {
    navigation.navigate('NovoDocumento');
  };

  const handleVerDetalhes = (id) => {
    navigation.navigate('DetalhesDocumento', { id });
  };

  const renderDocumentoItem = ({ item }) => (
    <TouchableOpacity
      style={styles.documentoItem}
      onPress={() => handleVerDetalhes(item.id)}
    >
      <View style={styles.documentoHeader}>
        <View style={styles.documentoIconContainer}>
          <MaterialIcons 
            name={
              item.tipo_documento === 'recibo' ? 'receipt' : 
              item.tipo_documento === 'fatura' ? 'description' :
              item.tipo_documento === 'nota_fiscal' ? 'article' : 'insert-drive-file'
            } 
            size={24} 
            color="#0066cc" 
          />
        </View>
        <View style={styles.documentoInfo}>
          <Text style={styles.documentoTitulo}>{item.titulo}</Text>
          <Text style={styles.documentoData}>
            {format(new Date(item.data_documento), 'dd/MM/yyyy')}
          </Text>
        </View>
        <View style={[
          styles.statusBadge,
          item.status === 'aprovado' ? styles.statusAprovado :
          item.status === 'rejeitado' ? styles.statusRejeitado :
          styles.statusPendente
        ]}>
          <Text style={styles.statusText}>
            {item.status === 'aprovado' ? 'Aprovado' :
             item.status === 'rejeitado' ? 'Rejeitado' :
             'Pendente'}
          </Text>
        </View>
      </View>

      {item.tipo_documento && (
        <View style={styles.documentoTipo}>
          <Text style={styles.documentoTipoText}>
            {item.tipo_documento === 'recibo' ? 'Recibo' :
             item.tipo_documento === 'fatura' ? 'Fatura' :
             item.tipo_documento === 'nota_fiscal' ? 'Nota Fiscal' :
             'Documento'}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Documentos</Text>
      </View>

      {isAdmin && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'todos' && styles.filterButtonSelected
              ]}
              onPress={() => setSelectedFilter('todos')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === 'todos' && styles.filterButtonTextSelected
              ]}>
                Todos
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'pendente' && styles.filterButtonSelected
              ]}
              onPress={() => setSelectedFilter('pendente')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === 'pendente' && styles.filterButtonTextSelected
              ]}>
                Pendentes
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'aprovado' && styles.filterButtonSelected
              ]}
              onPress={() => setSelectedFilter('aprovado')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === 'aprovado' && styles.filterButtonTextSelected
              ]}>
                Aprovados
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.filterButton,
                selectedFilter === 'rejeitado' && styles.filterButtonSelected
              ]}
              onPress={() => setSelectedFilter('rejeitado')}
            >
              <Text style={[
                styles.filterButtonText,
                selectedFilter === 'rejeitado' && styles.filterButtonTextSelected
              ]}>
                Rejeitados
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0066cc" />
        </View>
      ) : (
        <FlatList
          data={documentos}
          renderItem={renderDocumentoItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <MaterialIcons name="description" size={64} color="#ccc" />
              <Text style={styles.emptyText}>Nenhum documento encontrado</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}

      <TouchableOpacity
        style={styles.fabButton}
        onPress={handleNovoDocumento}
      >
        <MaterialIcons name="add" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#0066cc',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonSelected: {
    backgroundColor: '#0066cc',
  },
  filterButtonText: {
    color: '#333',
  },
  filterButtonTextSelected: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContainer: {
    padding: 16,
  },
  documentoItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  documentoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  documentoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  documentoInfo: {
    flex: 1,
  },
  documentoTitulo: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  documentoData: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  documentoTipo: {
    marginTop: 8,
    flexDirection: 'row',
  },
  documentoTipoText: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadge: {
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
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  fabButton: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
});