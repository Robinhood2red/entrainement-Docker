// ============================================================================
// RegisterScreen.tsx — Écran d'inscription
//
// Formulaire complet : nom d'utilisateur, email, mot de passe,
// objectif fitness (boutons radio custom) et poids optionnel.
// Après inscription réussie, le token est sauvegardé et l'app
// bascule vers les onglets exactement comme après une connexion.
// ============================================================================

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import { useAuth } from '../context/AuthContext'
import { Colors } from '../constants/colors'
import { RootStackParamList } from '../types'

type Props = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Register'>
}

// Correspondance entre les valeurs BDD et les labels affichés — doit rester
// synchronisé avec le ENUM goal de la table User.
// "as const" rend les types exacts ('lose' au lieu de string)
const GOALS = [
  { value: 'lose'     as const, label: 'Perte de poids' },
  { value: 'maintain' as const, label: 'Maintien' },
  { value: 'gain'     as const, label: 'Prise de masse' },
]

export default function RegisterScreen({ navigation }: Props) {
  // ? Consommation de la méthode d'inscription exposée par le contexte d'authentification ?
  const { register } = useAuth()

  // Un state par champ — pattern standard pour les formulaires contrôlés en React
  const [username, setUsername] = useState('')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [goal, setGoal]         = useState<'lose' | 'maintain' | 'gain'>('maintain')
  const [weight, setWeight]     = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async () => {
    // ! Contrôle de sécurité et de conformité : validation des données obligatoires avant émission !
    if (!username || !email || !password) {
      Toast.show({ type: 'error', text1: 'Champs requis', text2: 'Nom, email et mot de passe sont obligatoires' })
      return
    }
    setLoading(true)
    try {
      // * Action : exécution du flux d'inscription et formatage des données saisies *
      await register({
        username,
        email,
        password,
        goal,
        // parseFloat convertit la string '75.5' en nombre 75.5
        weight: weight ? parseFloat(weight) : undefined,
      })
      // Pas besoin de navigate() — AuthContext met user à jour, RootNavigator redirige automatiquement
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      // ! Alerte : interception de l'erreur réseau ou validation API avec notification utilisateur !
      Toast.show({ type: 'error', text1: msg || 'Erreur lors de l\'inscription' })
    } finally {
      // * Action : réinitialisation de l'indicateur de chargement *
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Logo ── */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoIcon}>
            <Ionicons name="barbell" size={28} color={Colors.white} />
          </View>
          <Text style={styles.logoTitle}>FitTrack</Text>
          <Text style={styles.logoSub}>Crée ton compte</Text>
        </View>

        <View style={styles.card}>

          {/* ── Nom d'utilisateur ── */}
          <View style={styles.field}>
            <Text style={styles.label}>Nom d'utilisateur *</Text>
            <TextInput
              style={styles.input}
              placeholder="johndoe"
              placeholderTextColor={Colors.textMuted}
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          {/* ── Email ── */}
          <View style={styles.field}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="ton@email.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* ── Mot de passe ── */}
          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe *</Text>
            <TextInput
              style={styles.input}
              placeholder="8 caractères minimum"
              placeholderTextColor={Colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* ── Objectif (boutons radio personnalisés) ── */}
          <View style={styles.field}>
            <Text style={styles.label}>Objectif *</Text>
            <View style={styles.goalRow}>
              {GOALS.map((g) => (
                <TouchableOpacity
                  key={g.value}
                  style={[styles.goalBtn, goal === g.value && styles.goalBtnActive]}
                  // * Action : modification de la valeur d'objectif sélectionnée dans le state *
                  onPress={() => setGoal(g.value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.goalBtnText, goal === g.value && styles.goalBtnTextActive]}>
                    {g.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Poids (optionnel) ── */}
          <View style={styles.field}>
            <Text style={styles.label}>Poids (kg)</Text>
            <TextInput
              style={styles.input}
              placeholder="75"
              placeholderTextColor={Colors.textMuted}
              value={weight}
              onChangeText={setWeight}
              keyboardType="decimal-pad"
            />
          </View>

          {/* ── Bouton de soumission ── */}
          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            // * Action : déclenchement de la soumission du formulaire d'inscription *
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.btnText}>Créer mon compte</Text>
            )}
          </TouchableOpacity>

          {/* ── Lien retour connexion ── */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Déjà un compte ? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              {/* * Action : navigation manuelle vers l'écran de connexion * */}
              <Text style={styles.footerLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logoWrapper: { alignItems: 'center', marginBottom: 32 },
  logoIcon: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 12,
  },
  logoTitle: { fontSize: 24, fontWeight: '700', color: Colors.textPrimary },
  logoSub: { fontSize: 14, color: Colors.textSecondary, marginTop: 4 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 24,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: Colors.textPrimary,
  },
  goalRow: { flexDirection: 'row', gap: 8 },
  goalBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    backgroundColor: 'rgba(15,23,42,0.4)',
    alignItems: 'center',
  },
  goalBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  goalBtnText: { fontSize: 11, color: Colors.textSecondary, fontWeight: '500', textAlign: 'center' },
  goalBtnTextActive: { color: Colors.white },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 13, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { backgroundColor: '#3730a3' },
  btnText: { color: Colors.white, fontWeight: '600', fontSize: 15 },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: Colors.textMuted, fontSize: 13 },
  footerLink: { color: Colors.primaryLight, fontSize: 13, fontWeight: '500' },
})