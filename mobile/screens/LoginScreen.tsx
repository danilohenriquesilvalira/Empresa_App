import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [lembrarUsuario, setLembrarUsuario] = useState(false);
  
  const { signIn } = useAuth();

  // Carregar email salvo na inicialização
  useEffect(() => {
    async function carregarEmailSalvo() {
      try {
        const savedEmail = await AsyncStorage.getItem('@RLSApp:savedEmail');
        const rememberUser = await AsyncStorage.getItem('@RLSApp:rememberUser');
        
        if (savedEmail && rememberUser === 'true') {
          setEmail(savedEmail);
          setLembrarUsuario(true);
        }
      } catch (error) {
        console.error('Erro ao carregar email salvo:', error);
      }
    }
    
    carregarEmailSalvo();
  }, []);

  // Função para realizar login
  const handleLogin = async () => {
    if (!email.trim() || !senha.trim()) {
      Alert.alert('Erro', 'Email e senha são obrigatórios');
      return;
    }
    
    setCarregando(true);
    
    try {
      await signIn(email.trim(), senha);
      
      // Salvar email para próximo login se a opção estiver marcada
      if (lembrarUsuario) {
        await AsyncStorage.setItem('@RLSApp:savedEmail', email.trim());
        await AsyncStorage.setItem('@RLSApp:rememberUser', 'true');
      } else {
        await AsyncStorage.removeItem('@RLSApp:savedEmail');
        await AsyncStorage.removeItem('@RLSApp:rememberUser');
      }
    } catch (error) {
      let mensagem = 'Erro ao fazer login. Tente novamente.';
      Alert.alert('Erro', mensagem);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            
            <Text style={styles.title}>RLS Automação</Text>
            <Text style={styles.subtitle}>Faça login para continuar</Text>
          </View>
          
          <View style={styles.formContainer}>
            {/* Email */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="email" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Seu email corporativo"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
                {email.length > 0 && (
                  <TouchableOpacity onPress={() => setEmail('')} style={styles.clearButton}>
                    <MaterialIcons name="cancel" size={18} color="#999" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
            
            {/* Senha */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Senha</Text>
              <View style={styles.inputWrapper}>
                <MaterialIcons name="lock" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Sua senha"
                  placeholderTextColor="#999"
                  secureTextEntry={!mostrarSenha}
                  value={senha}
                  onChangeText={setSenha}
                />
                <TouchableOpacity onPress={() => setMostrarSenha(!mostrarSenha)} style={styles.visibilityButton}>
                  <MaterialIcons 
                    name={mostrarSenha ? "visibility" : "visibility-off"} 
                    size={20} 
                    color="#999" 
                  />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setLembrarUsuario(!lembrarUsuario)}
              >
                <View style={[
                  styles.checkbox,
                  lembrarUsuario && styles.checkboxChecked
                ]}>
                  {lembrarUsuario && <MaterialIcons name="check" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>Lembrar usuário</Text>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => Alert.alert('Recuperar Senha', 'Entre em contato com o RH para recuperar sua senha.')}>
                <Text style={styles.forgotPassword}>Esqueci a senha</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity
              style={styles.loginButton}
              onPress={handleLogin}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <MaterialIcons name="login" size={20} color="#fff" />
                  <Text style={styles.loginButtonText}>Entrar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.footer}>
            <Text style={styles.footerText}>RLS Automação Industrial © 2025</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  topSection: {
    alignItems: 'center',
    backgroundColor: '#0066cc',
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  logo: {
    width: 70,
    height: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  formContainer: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: 40,
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    height: 50,
  },
  inputIcon: {
    marginHorizontal: 10,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: '#333',
  },
  clearButton: {
    padding: 10,
  },
  visibilityButton: {
    padding: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#0066cc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  checkboxChecked: {
    backgroundColor: '#0066cc',
  },
  checkboxLabel: {
    fontSize: 14,
    color: '#666',
  },
  forgotPassword: {
    fontSize: 14,
    color: '#0066cc',
  },
  loginButton: {
    backgroundColor: '#0066cc',
    paddingVertical: 15,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#999',
    fontSize: 12,
  },
});