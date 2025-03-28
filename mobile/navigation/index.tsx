import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';

// Importação das telas
import HomeScreen from '../screens/HomeScreen';
import DocumentosScreen from '../screens/DocumentosScreen';
import DetalhesDocumentoScreen from '../screens/DetalhesDocumentoScreen';
import RegistroPontoScreen from '../screens/RegistroPontoScreen';
import PerfilScreen from '../screens/PerfilScreen';
import LoginScreen from '../screens/LoginScreen';
import NovoDocumentoScreen from '../screens/NovoDocumentoScreen';

// Tipos para navegação
type AuthStackParamList = {
  Login: undefined;
};

type HomeStackParamList = {
  Home: undefined;
};

type DocumentosStackParamList = {
  Documentos: { filter?: string };
  DetalhesDocumento: { id: number };
  NovoDocumento: undefined;
};

type PontoStackParamList = {
  RegistroPonto: undefined;
};

type PerfilStackParamList = {
  Perfil: undefined;
};

type MainTabParamList = {
  HomeTab: undefined;
  DocumentosTab: undefined;
  PontoTab: undefined;
  PerfilTab: undefined;
};

// Criação dos navegadores
const AuthStack = createStackNavigator<AuthStackParamList>();
const HomeStack = createStackNavigator<HomeStackParamList>();
const DocumentosStack = createStackNavigator<DocumentosStackParamList>();
const PontoStack = createStackNavigator<PontoStackParamList>();
const PerfilStack = createStackNavigator<PerfilStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// Componentes de navegação
const HomeStackNavigator = () => {
  return (
    <HomeStack.Navigator>
      <HomeStack.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ headerShown: false }} 
      />
    </HomeStack.Navigator>
  );
};

const DocumentosStackNavigator = () => {
  return (
    <DocumentosStack.Navigator>
      <DocumentosStack.Screen 
        name="Documentos" 
        component={DocumentosScreen} 
        options={{ headerShown: false }} 
      />
      <DocumentosStack.Screen 
        name="DetalhesDocumento" 
        component={DetalhesDocumentoScreen} 
        options={{ title: 'Detalhes do Documento' }} 
      />
      <DocumentosStack.Screen 
        name="NovoDocumento" 
        component={NovoDocumentoScreen} 
        options={{ title: 'Novo Documento' }} 
      />
    </DocumentosStack.Navigator>
  );
};

const PontoStackNavigator = () => {
  return (
    <PontoStack.Navigator>
      <PontoStack.Screen 
        name="RegistroPonto" 
        component={RegistroPontoScreen} 
        options={{ headerShown: false }} 
      />
    </PontoStack.Navigator>
  );
};

const PerfilStackNavigator = () => {
  return (
    <PerfilStack.Navigator>
      <PerfilStack.Screen 
        name="Perfil" 
        component={PerfilScreen} 
        options={{ headerShown: false }} 
      />
    </PerfilStack.Navigator>
  );
};

const MainTabNavigator = () => {
  return (
    <MainTab.Navigator
      initialRouteName="HomeTab"
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          // Escolher o ícone com base no nome da rota
          let iconName: "home" | "description" | "access-time" | "person" = "home";

          if (route.name === 'HomeTab') {
            iconName = "home";
          } else if (route.name === 'DocumentosTab') {
            iconName = "description";
          } else if (route.name === 'PontoTab') {
            iconName = "access-time";
          } else if (route.name === 'PerfilTab') {
            iconName = "person";
          }

          return <MaterialIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#0066cc',
        tabBarInactiveTintColor: 'gray',
        headerShown: false,
      })}
    >
      <MainTab.Screen 
        name="HomeTab" 
        component={HomeStackNavigator} 
        options={{ title: 'Início' }} 
      />
      <MainTab.Screen 
        name="DocumentosTab" 
        component={DocumentosStackNavigator} 
        options={{ title: 'Documentos' }} 
      />
      <MainTab.Screen 
        name="PontoTab" 
        component={PontoStackNavigator} 
        options={{ title: 'Ponto' }} 
      />
      <MainTab.Screen 
        name="PerfilTab" 
        component={PerfilStackNavigator} 
        options={{ title: 'Perfil' }} 
      />
    </MainTab.Navigator>
  );
};

const AuthStackNavigator = () => {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
    </AuthStack.Navigator>
  );
};

// Componente principal de navegação
const Navigation = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0066cc" />
        <Text style={{ marginTop: 10, color: '#666' }}>Carregando...</Text>
      </View>
    );
  }

  return user ? <MainTabNavigator /> : <AuthStackNavigator />;
};

export default Navigation;