import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
  Dimensions,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigation } from '@react-navigation/native';
import { documentosAPI } from '../services/api';

const { width, height } = Dimensions.get('window');

interface FormErrors {
  titulo?: string;
  tipo_documento?: string;
  data_documento?: string;
  valor?: string;
  arquivo?: string;
}

export default function NovoDocumentoScreen() {
  const navigation = useNavigation();
  
  // States para os campos do formulário
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('');
  const [dataDocumento, setDataDocumento] = useState(new Date());
  const [valor, setValor] = useState('');
  const [arquivo, setArquivo] = useState<any>(null);
  
  // States auxiliares
  const [mostrarDataPicker, setMostrarDataPicker] = useState(false);
  const [mostrarModalTipo, setMostrarModalTipo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  
  // Opções de tipos de documento
  const tiposDocumento = [
    { id: 'recibo', nome: 'Recibo' },
    { id: 'fatura', nome: 'Fatura' },
    { id: 'nota_fiscal', nome: 'Nota Fiscal' },
    { id: 'contrato', nome: 'Contrato' },
    { id: 'outro', nome: 'Outro' },
  ];
  
  // Solicitar permissões na inicialização
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
      const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
        Alert.alert(
          'Permissões necessárias',
          'Precisamos das permissões de câmera e galeria para funcionar corretamente.'
        );
      }
    })();
  }, []);
  
  // Formatação do valor para moeda
  const formatarValor = (valor: string) => {
    // Remove todos os caracteres não numéricos
    const numeroLimpo = valor.replace(/[^0-9]/g, '');
    
    // Se não houver números, retorna valor vazio
    if (numeroLimpo === '') {
      return '';
    }
    
    // Converte para centavos e formata
    const valorEmCentavos = parseInt(numeroLimpo, 10);
    const valorReal = valorEmCentavos / 100;
    
    return valorReal.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };
  
  // Handlers para atualização de estados
  const handleMudarValor = (text: string) => {
    const valorFormatado = formatarValor(text);
    setValor(valorFormatado);
    
    if (errors.valor) {
      setErrors(prev => ({ ...prev, valor: undefined }));
    }
  };
  
  const handleSelecionarTipo = (tipo: string) => {
    setTipoDocumento(tipo);
    setMostrarModalTipo(false);
    
    if (errors.tipo_documento) {
      setErrors(prev => ({ ...prev, tipo_documento: undefined }));
    }
  };
  
  const handleMudarData = (event: any, selectedDate?: Date) => {
    setMostrarDataPicker(Platform.OS === 'ios');
    
    if (selectedDate) {
      setDataDocumento(selectedDate);
      
      if (errors.data_documento) {
        setErrors(prev => ({ ...prev, data_documento: undefined }));
      }
    }
  };
  
  // Funções para seleção de arquivo
  const selecionarImagem = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setArquivo(result.assets[0]);
        
        if (errors.arquivo) {
          setErrors(prev => ({ ...prev, arquivo: undefined }));
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar a imagem');
    }
  };
  
  const tirarFoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setArquivo(result.assets[0]);
        
        if (errors.arquivo) {
          setErrors(prev => ({ ...prev, arquivo: undefined }));
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível tirar a foto');
    }
  };
  
  const selecionarDocumento = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf'],
        copyToCacheDirectory: true,
      });
      
      if (result.assets && result.assets.length > 0) {
        setArquivo({
          ...result.assets[0],
          type: 'application/pdf'
        });
        
        if (errors.arquivo) {
          setErrors(prev => ({ ...prev, arquivo: undefined }));
        }
      }
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível selecionar o documento');
    }
  };
  
  // Função para visualizar arquivo
  const visualizarArquivo = () => {
    if (arquivo) {
      setPreviewVisible(true);
    }
  };
  
  // Validação do formulário
  const validarFormulario = () => {
    const novosErros: FormErrors = {};
    
    if (!titulo.trim()) {
      novosErros.titulo = 'Título é obrigatório';
    }
    
    if (!tipoDocumento) {
      novosErros.tipo_documento = 'Tipo de documento é obrigatório';
    }
    
    if (!dataDocumento) {
      novosErros.data_documento = 'Data do documento é obrigatória';
    } else {
      const dataAtual = new Date();
      if (dataDocumento > dataAtual) {
        novosErros.data_documento = 'Data não pode ser futura';
      }
    }
    
    if (valor.trim() && isNaN(parseFloat(valor.replace(/[^0-9,-]/g, '').replace(',', '.')))) {
      novosErros.valor = 'Valor inválido';
    }
    
    if (!arquivo) {
      novosErros.arquivo = 'Arquivo é obrigatório';
    }
    
    setErrors(novosErros);
    return Object.keys(novosErros).length === 0;
  };
  
  // Envio do formulário
  const handleEnviar = async () => {
    if (!validarFormulario()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Criar FormData para envio
      const formData = new FormData();
      formData.append('titulo', titulo);
      
      if (descricao) {
        formData.append('descricao', descricao);
      }
      
      formData.append('tipo_documento', tipoDocumento);
      formData.append('data_documento', format(dataDocumento, 'yyyy-MM-dd'));
      
      if (valor) {
        // Converter para número
        const valorNumerico = parseFloat(
          valor.replace(/[^0-9,-]/g, '').replace(',', '.')
        );
        formData.append('valor', valorNumerico.toString());
      }
      
      // Adicionar arquivo ao FormData
      const extensao = arquivo.uri.split('.').pop();
      const tipo = arquivo.type || (extensao === 'pdf' ? 'application/pdf' : 'image/jpeg');
      
      formData.append('arquivo', {
        uri: arquivo.uri,
        name: `documento.${extensao}`,
        type: tipo,
      } as any);
      
      await documentosAPI.upload(formData);
      
      Alert.alert(
        'Sucesso',
        'Documento enviado com sucesso!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      let mensagem = 'Erro ao enviar documento';
      
      if (error?.response) {
        mensagem = error.response.data?.error || mensagem;
      } else if (error?.request) {
        mensagem = 'Não foi possível conectar ao servidor';
      }
      
      Alert.alert('Erro', mensagem);
    } finally {
      setLoading(false);
    }
  };
  
  // Renderização
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Novo Documento</Text>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.formContainer}>
            {/* Título */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Título <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.titulo && styles.inputError]}
                placeholder="Nome do documento"
                value={titulo}
                onChangeText={(text) => {
                  setTitulo(text);
                  if (errors.titulo) {
                    setErrors(prev => ({ ...prev, titulo: undefined }));
                  }
                }}
              />
              {errors.titulo && <Text style={styles.errorText}>{errors.titulo}</Text>}
            </View>
            
            {/* Descrição */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Descrição</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descrição (opcional)"
                value={descricao}
                onChangeText={setDescricao}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
            
            {/* Tipo de Documento */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Tipo de Documento <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.pickerButton,
                  errors.tipo_documento && styles.inputError,
                ]}
                onPress={() => setMostrarModalTipo(true)}
              >
                <Text style={tipoDocumento ? styles.pickerText : styles.placeholderText}>
                  {tipoDocumento ? 
                    tiposDocumento.find(t => t.id === tipoDocumento)?.nome : 
                    'Selecione o tipo de documento'}
                </Text>
                <MaterialIcons name="arrow-drop-down" size={24} color="#666" />
              </TouchableOpacity>
              {errors.tipo_documento && <Text style={styles.errorText}>{errors.tipo_documento}</Text>}
            </View>
            
            {/* Data do Documento */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Data do Documento <Text style={styles.required}>*</Text></Text>
              <TouchableOpacity
                style={[
                  styles.input,
                  styles.pickerButton,
                  errors.data_documento && styles.inputError,
                ]}
                onPress={() => setMostrarDataPicker(true)}
              >
                <Text style={styles.pickerText}>
                  {format(dataDocumento, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </Text>
                <MaterialIcons name="date-range" size={24} color="#666" />
              </TouchableOpacity>
              {errors.data_documento && <Text style={styles.errorText}>{errors.data_documento}</Text>}
            </View>
            
            {/* Valor */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Valor</Text>
              <TextInput
                style={[styles.input, errors.valor && styles.inputError]}
                placeholder="R$ 0,00"
                value={valor}
                onChangeText={handleMudarValor}
                keyboardType="numeric"
              />
              {errors.valor && <Text style={styles.errorText}>{errors.valor}</Text>}
            </View>
            
            {/* Arquivo */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Arquivo <Text style={styles.required}>*</Text></Text>
              
              {arquivo ? (
                <View style={styles.filePreviewContainer}>
                  {arquivo.type === 'application/pdf' ? (
                    <View style={styles.pdfPreview}>
                      <MaterialIcons name="picture-as-pdf" size={48} color="#F44336" />
                      <Text style={styles.fileNameText} numberOfLines={1} ellipsizeMode="middle">
                        {arquivo.name || 'Documento PDF'}
                      </Text>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: arquivo.uri }}
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                  )}
                  
                  <View style={styles.fileActions}>
                    <TouchableOpacity style={styles.fileButton} onPress={visualizarArquivo}>
                      <MaterialIcons name="visibility" size={20} color="#0066cc" />
                      <Text style={styles.fileButtonText}>Visualizar</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[styles.fileButton, styles.fileDeleteButton]} 
                      onPress={() => setArquivo(null)}
                    >
                      <MaterialIcons name="delete" size={20} color="#F44336" />
                      <Text style={[styles.fileButtonText, styles.fileDeleteText]}>Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.uploadOptions}>
                  <TouchableOpacity style={styles.uploadButton} onPress={tirarFoto}>
                    <MaterialIcons name="photo-camera" size={22} color="#fff" />
                    <Text style={styles.uploadButtonText}>Câmera</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.uploadButton} onPress={selecionarImagem}>
                    <MaterialIcons name="photo-library" size={22} color="#fff" />
                    <Text style={styles.uploadButtonText}>Galeria</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.uploadButton} onPress={selecionarDocumento}>
                    <MaterialIcons name="upload-file" size={22} color="#fff" />
                    <Text style={styles.uploadButtonText}>PDF</Text>
                  </TouchableOpacity>
                </View>
              )}
              
              {errors.arquivo && <Text style={styles.errorText}>{errors.arquivo}</Text>}
            </View>
          </View>
        </ScrollView>
        
        {/* Botões de ação */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.submitButton}
            onPress={handleEnviar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="send" size={20} color="#fff" />
                <Text style={styles.submitButtonText}>Enviar</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        {/* Modal de seleção de tipo */}
        <Modal
          visible={mostrarModalTipo}
          transparent
          animationType="slide"
          onRequestClose={() => setMostrarModalTipo(false)}
        >
          <TouchableWithoutFeedback onPress={() => setMostrarModalTipo(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.modalContainer}>
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Selecione o tipo de documento</Text>
                    <TouchableOpacity onPress={() => setMostrarModalTipo(false)}>
                      <MaterialIcons name="close" size={24} color="#666" />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView style={styles.modalContent}>
                    {tiposDocumento.map((tipo) => (
                      <TouchableOpacity
                        key={tipo.id}
                        style={[
                          styles.tipoDocumentoItem,
                          tipoDocumento === tipo.id && styles.tipoDocumentoSelected,
                        ]}
                        onPress={() => handleSelecionarTipo(tipo.id)}
                      >
                        <Text
                          style={[
                            styles.tipoDocumentoText,
                            tipoDocumento === tipo.id && styles.tipoDocumentoTextSelected,
                          ]}
                        >
                          {tipo.nome}
                        </Text>
                        {tipoDocumento === tipo.id && (
                          <MaterialIcons name="check" size={20} color="#0066cc" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
        
        {/* DatePicker */}
        {mostrarDataPicker && (
          <DateTimePicker
            value={dataDocumento}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleMudarData}
            maximumDate={new Date()}
          />
        )}
        
        {/* Modal de Preview */}
        <Modal
          visible={previewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setPreviewVisible(false)}
        >
          <View style={styles.previewModalOverlay}>
            <View style={styles.previewModalContainer}>
              <View style={styles.previewModalHeader}>
                <Text style={styles.previewModalTitle}>Visualização</Text>
                <TouchableOpacity onPress={() => setPreviewVisible(false)}>
                  <MaterialIcons name="close" size={24} color="#fff" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.previewContent}>
                {arquivo?.type === 'application/pdf' ? (
                  <View style={styles.pdfPreviewLarge}>
                    <MaterialIcons name="picture-as-pdf" size={80} color="#F44336" />
                    <Text style={styles.pdfPreviewText}>
                      Arquivo PDF não pode ser visualizado aqui.
                    </Text>
                  </View>
                ) : (
                  <Image
                    source={{ uri: arquivo?.uri }}
                    style={styles.imagePreviewLarge}
                    resizeMode="contain"
                  />
                )}
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
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
  content: {
    flex: 1,
  },
  formContainer: {
    padding: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  required: {
    color: '#F44336',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  inputError: {
    borderColor: '#F44336',
  },
  errorText: {
    color: '#F44336',
    fontSize: 12,
    marginTop: 4,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    fontSize: 16,
    color: '#999',
  },
  filePreviewContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#fff',
  },
  pdfPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    padding: 20,
  },
  imagePreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
  },
  fileNameText: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    maxWidth: '80%',
  },
  fileActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  fileButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  fileDeleteButton: {
    borderLeftWidth: 1,
    borderLeftColor: '#eee',
  },
  fileButtonText: {
    marginLeft: 6,
    color: '#0066cc',
    fontWeight: '500',
  },
  fileDeleteText: {
    color: '#F44336',
  },
  uploadOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  uploadButton: {
    flex: 1,
    backgroundColor: '#0066cc',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    flexDirection: 'row',
  },
  uploadButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  submitButton: {
    flex: 2,
    backgroundColor: '#0066cc',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  submitButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalContent: {
    padding: 16,
    maxHeight: height * 0.6,
  },
  tipoDocumentoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tipoDocumentoSelected: {
    backgroundColor: '#f0f7ff',
  },
  tipoDocumentoText: {
    fontSize: 16,
    color: '#333',
  },
  tipoDocumentoTextSelected: {
    fontWeight: 'bold',
    color: '#0066cc',
  },
  previewModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewModalContainer: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
  },
  previewModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#0066cc',
  },
  previewModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  previewContent: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  imagePreviewLarge: {
    width: '100%',
    height: height * 0.6,
  },
  pdfPreviewLarge: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  pdfPreviewText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#666',
  },
});