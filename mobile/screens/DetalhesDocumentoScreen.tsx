import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { documentosAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

export default function DetalhesDocumentoScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  
  const { id } = route.params;
  const [documento, setDocumento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApproveReject, setShowApproveReject] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [approveLoading, setApproveLoading] = useState(false);
  const [observacoes, setObservacoes] = useState('');
  const [showSendFinancas, setShowSendFinancas] = useState(false);

  const isAdmin = user && (user.cargo_id === 2 || user.cargo_id === 5 || user.cargo_id === 6);

  useEffect(() => {
    carregarDocumento();
  }, [id]);

  const carregarDocumento = async () => {
    try {
      setLoading(true);
      const response = await documentosAPI.obter(id);
      setDocumento(response.data);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar o documento');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleAprovar = async () => {
    try {
      setApproveLoading(true);
      await documentosAPI.aprovar(id, observacoes);
      Alert.alert('Sucesso', 'Documento aprovado com sucesso');
      setShowApproveReject(false);
      carregarDocumento();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível aprovar o documento');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleRejeitar = async () => {
    if (!motivo) {
      Alert.alert('Erro', 'Informe o motivo da rejeição');
      return;
    }

    try {
      setApproveLoading(true);
      await documentosAPI.rejeitar(id, motivo);
      Alert.alert('Sucesso', 'Documento rejeitado com sucesso');
      setShowApproveReject(false);
      carregarDocumento();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível rejeitar o documento');
    } finally {
      setApproveLoading(false);
    }
  };

  const handleEnviarFinancas = async () => {
    try {
      setApproveLoading(true);
      await documentosAPI.enviar(id, observacoes);
      Alert.alert('Sucesso', 'Documento marcado como enviado para finanças');
      setShowSendFinancas(false);
      carregarDocumento();
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível marcar como enviado');
    } finally {
      setApproveLoading(false);
    }
  };

  const downloadDocumento = () => {
    // Implementar download/visualização do documento
    Alert.alert('Download', 'Abrir o documento no visualizador');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>{documento.titulo}</Text>
        <View style={[
          styles.statusBadge,
          documento.status === 'aprovado' ? styles.statusAprovado :
          documento.status === 'rejeitado' ? styles.statusRejeitado :
          styles.statusPendente
        ]}>
          <Text style={styles.statusText}>
            {documento.status === 'aprovado' ? 'Aprovado' :
             documento.status === 'rejeitado' ? 'Rejeitado' :
             'Pendente'}
          </Text>
        </View>
      </View>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Tipo:</Text>
          <Text style={styles.infoValue}>
            {documento.tipo_documento === 'recibo' ? 'Recibo' :
             documento.tipo_documento === 'fatura' ? 'Fatura' :
             documento.tipo_documento === 'nota_fiscal' ? 'Nota Fiscal' :
             'Outro'}
          </Text>
        </View>

        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Data:</Text>
          <Text style={styles.infoValue}>
            {format(new Date(documento.data_documento), 'dd/MM/yyyy')}
          </Text>
        </View>

        {documento.valor > 0 && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Valor:</Text>
            <Text style={styles.infoValue}>
              R$ {documento.valor.toFixed(2).replace('.', ',')}
            </Text>
          </View>
        )}

        {documento.descricao && (
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Descrição:</Text>
            <Text style={styles.infoDescription}>{documento.descricao}</Text>
          </View>
        )}

        {documento.status === 'aprovado' && documento.aprovado_por && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Aprovado por:</Text>
            <Text style={styles.infoValue}>ID: {documento.aprovado_por}</Text>
          </View>
        )}

        {documento.status === 'rejeitado' && documento.data_aprovacao && (
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Rejeitado em:</Text>
            <Text style={styles.infoValue}>
              {format(new Date(documento.data_aprovacao), 'dd/MM/yyyy HH:mm')}
            </Text>
          </View>
        )}

        {documento.enviado_para_financas && (
          <View style={styles.enviado}>
            <MaterialIcons name="check-circle" size={20} color="#4CAF50" />
            <Text style={styles.enviadoText}>Enviado para finanças</Text>
          </View>
        )}
      </View>

      <View style={styles.previewContainer}>
        <Text style={styles.previewTitle}>Documento</Text>
        
        {documento.mime_type.startsWith('image/') ? (
          <Image
            source={{ uri: `https://seu-servidor-api.tailscale.net/api/documentos/${documento.id}/arquivo` }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
        ) : (
          <TouchableOpacity
            style={styles.pdfPreview}
            onPress={downloadDocumento}
          >
            <MaterialIcons name="picture-as-pdf" size={64} color="#F44336" />
            <Text style={styles.pdfText}>Visualizar PDF</Text>
          </TouchableOpacity>
        )}
      </View>

      {isAdmin && documento.status === 'pendente' && (
        <View style={styles.adminContainer}>
          {!showApproveReject ? (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => setShowApproveReject(true)}
            >
              <MaterialIcons name="thumbs-up-down" size={20} color="#fff" />
              <Text style={styles.adminButtonText}>Aprovar / Rejeitar</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.approveRejectContainer}>
              <Text style={styles.approveRejectTitle}>Revisar Documento</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Observações (opcional)"
                value={observacoes}
                onChangeText={setObservacoes}
                multiline
              />
              
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={handleAprovar}
                  disabled={approveLoading}
                >
                  {approveLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="check-circle" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Aprovar</Text>
                    </>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => {
                    // Mostrar campo para motivo da rejeição
                    Alert.prompt(
                      'Rejeitar Documento',
                      'Informe o motivo da rejeição:',
                      [
                        {
                          text: 'Cancelar',
                          style: 'cancel',
                        },
                        {
                          text: 'Rejeitar',
                          onPress: (text) => {
                            if (text) {
                              setMotivo(text);
                              handleRejeitar();
                            } else {
                              Alert.alert('Erro', 'Informe o motivo da rejeição');
                            }
                          },
                        },
                      ],
                      'plain-text'
                    );
                  }}
                  disabled={approveLoading}
                >
                  {approveLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <MaterialIcons name="cancel" size={20} color="#fff" />
                      <Text style={styles.actionButtonText}>Rejeitar</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowApproveReject(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}

      {isAdmin && documento.status === 'aprovado' && !documento.enviado_para_financas && (
        <View style={styles.adminContainer}>
          {!showSendFinancas ? (
            <TouchableOpacity
              style={styles.adminButton}
              onPress={() => setShowSendFinancas(true)}
            >
              <MaterialIcons name="send" size={20} color="#fff" />
              <Text style={styles.adminButtonText}>Enviar para Finanças</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.approveRejectContainer}>
              <Text style={styles.approveRejectTitle}>Enviar para Finanças</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Observações sobre o envio"
                value={observacoes}
                onChangeText={setObservacoes}
                multiline
              />
              
              <TouchableOpacity
                style={[styles.actionButton, styles.sendButton]}
                onPress={handleEnviarFinancas}
                disabled={approveLoading}
              >
                {approveLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <MaterialIcons name="send" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Confirmar Envio</Text>
                  </>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowSendFinancas(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titulo: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    marginLeft: 10,
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
    fontWeight: 'bold',
  },
  infoContainer: {
    backgroundColor: '#fff',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoBlock: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  infoValue: {
    fontSize: 16,
    color: '#666',
  },
  infoDescription: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  enviado: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 4,
    marginTop: 8,
  },
  enviadoText: {
    marginLeft: 8,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  previewContainer: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  imagePreview: {
    width: '100%',
    height: 300,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
  },
  pdfPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    height: 200,
    borderRadius: 4,
  },
  pdfText: {
    marginTop: 8,
    color: '#0066cc',
    fontWeight: 'bold',
  },
  adminContainer: {
    margin: 16,
    marginTop: 0,
    marginBottom: 24,
  },
  adminButton: {
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  adminButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  approveRejectContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  approveRejectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    padding: 12,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: '#F44336',
    marginLeft: 8,
  },
  sendButton: {
    backgroundColor: '#0066cc',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    color: '#666',
  },
});