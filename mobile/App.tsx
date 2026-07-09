// ============================================================================
// App.tsx — Point d'entrée principal et configuration de la navigation
//
// Ce fichier configure le conteneur de navigation racine (NavigationContainer),
// aiguille l'utilisateur entre la stack d'authentification et les onglets (Bottom Tabs),
// et initialise le fournisseur de contexte d'authentification (AuthProvider).
// ============================================================================

import 'react-native-url-polyfill/auto'
import React from 'react'
import { registerRootComponent } from 'expo'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'

import { AuthProvider, useAuth } from './src/context/AuthContext'
import LoadingSpinner from './src/components/LoadingSpinner'
import { Colors } from './src/constants/colors'
import { RootStackParamList, TabParamList } from './src/types'

// Écrans Auth
import LoginScreen from './src/screens/LoginScreen'
import RegisterScreen from './src/screens/RegisterScreen'

// Écrans principaux
import DashboardScreen from './src/screens/DashboardScreen'
import ExercisesScreen from './src/screens/ExercisesScreen'
import WorkoutsScreen from './src/screens/WorkoutsScreen'
import WorkoutDetailScreen from './src/screens/WorkoutDetailScreen'
import ProfileScreen from './src/screens/ProfileScreen'

const Stack = createNativeStackNavigator<RootStackParamList>()
const Tab = createBottomTabNavigator<TabParamList>()

// * Logique métier : dictionnaire de correspondance des icônes active/inactive pour la barre d'onglets *
const TAB_ICONS: Record<
  string,
  { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }
> = {
  Dashboard: { active: 'home', inactive: 'home-outline' },
  Exercises: { active: 'barbell', inactive: 'barbell-outline' },
  Workouts:  { active: 'calendar', inactive: 'calendar-outline' },
  Profile:   { active: 'person', inactive: 'person-outline' },
}

// * Action : composant de navigation par onglets (Bottom Tabs) accessible une fois connecté *
function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name]
          const iconName = focused ? icons.active : icons.inactive
          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          paddingBottom: 4,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '500', paddingBottom: 2 },
        headerStyle: { backgroundColor: Colors.surface },
        headerTintColor: Colors.textPrimary,
        headerShadowVisible: false,
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard', tabBarLabel: 'Accueil' }} />
      <Tab.Screen name="Exercises" component={ExercisesScreen} options={{ title: 'Exercices', tabBarLabel: 'Exercices' }} />
      <Tab.Screen name="Workouts"  component={WorkoutsScreen}  options={{ title: 'Séances',   tabBarLabel: 'Séances' }} />
      <Tab.Screen name="Profile"   component={ProfileScreen}   options={{ title: 'Profil',    tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  )
}

// * Action : aiguillage global selon la présence ou l'absence du token JWT *
function RootNavigator() {
  // ? Requêtage : extraction de l'état d'authentification et de chargement depuis le contexte global ?
  const { user, loading } = useAuth()

  // ! Sécurité / Alerte : affichage d'un spinner pendant la vérification du token pour éviter tout flash d'écran !
  if (loading) return <LoadingSpinner />

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <>
            <Stack.Screen name="AppTabs" component={AppTabs} />
            {/* * Action : écran de détail de séance hors des onglets avec header natif * */}
            <Stack.Screen
              name="WorkoutDetail"
              component={WorkoutDetailScreen}
              options={({ route }) => ({
                headerShown: true,
                title: route.params?.title ?? 'Séance',
                headerStyle: { backgroundColor: Colors.surface },
                headerTintColor: Colors.textPrimary,
                headerShadowVisible: false,
                headerTitleStyle: { fontWeight: '700' },
              })}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="Login"    component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}

// * Action : composant racine enveloppant l'application avec les providers et le Toast global *
function App() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <RootNavigator />
      {/* ! Alerte : composant Toast placé à la racine du Provider pour survoler toute l'interface ! */}
      <Toast topOffset={52} />
    </AuthProvider>
  )
}

// ! Alerte / Sécurité : enregistrement explicite du composant racine pour le bundler Expo !
registerRootComponent(App)