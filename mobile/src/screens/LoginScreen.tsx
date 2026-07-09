// ============================================================================
// LoginScreen.tsx — Écran de connexion
//
// Ce composant gère l'authentification de l'utilisateur (email + mot de passe).
// Il illustre plusieurs concepts clés de React Native :
// - La gestion des états locaux avec useState pour les formulaires (composants contrôlés).
// - L'adaptation de l'interface au clavier virtuel via KeyboardAvoidingView.
// - La communication avec un contexte global (AuthContext) pour maintenir la session.
// - L'affichage de retours visuels (Toast, ActivityIndicator) pour l'expérience utilisateur.
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
  navigation: NativeStackNavigationProp<RootStackParamList, 'Login'>
}

export default function LoginScreen({ navigation }: Props) {
  // ? Requêtage / Récupération de données : On extrait la fonction 'login' de notre contexte global.
  // ? C'est cette fonction qui encapsule la requête HTTP vers notre backend et la sauvegarde du token. ?
  const { login } = useAuth()

  // * Action / Logique : Initialisation des états locaux (states) pour lier nos champs de saisie.
  // * 'email' et 'password' stockent la valeur tapée en temps réel.
  // * 'loading' permet de gérer l'état de l'interface (désactiver le bouton, afficher un spinner) pendant l'appel réseau. *
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)

  // * Action : Fonction déclenchée lors du clic sur "Se connecter". Elle est asynchrone car elle attend la réponse de l'API. *
  const handleSubmit = async () => {
    
    // ! Sécurité / Alerte : Barrière de validation front-end. On empêche l'envoi de requêtes inutiles
    // ! vers le serveur si les champs sont vides, ce qui économise des ressources et prévient des erreurs 400 évitables. !
    if (!email || !password) {
      Toast.show({ type: 'error', text1: 'Champs requis', text2: 'Remplis l\'email et le mot de passe' })
      return // Stoppe l'exécution de la fonction ici
    }

    // * Action : On passe l'état de chargement à true juste avant l'appel API. *
    setLoading(true)
    
    try {
      // ? Requêtage : Transmission des identifiants à la méthode login du AuthContext.
      // ? Si l'API répond un succès (200 OK), le contexte mettra à jour l'utilisateur global,
      // ? ce qui déclenchera un changement de route automatique au niveau du RootNavigator. ?
      await login(email, password)
    } catch (err: unknown) {
      // ! Alerte / Sécurité : Interception des erreurs (ex: identifiants invalides).
      // ! On vérifie si l'erreur possède une structure de réponse Axios/API classique pour extraire le message exact
      // ! renvoyé par le backend (ex: "Utilisateur introuvable"). Sinon, on affiche un message générique. !
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      Toast.show({ type: 'error', text1: msg || 'Email ou mot de passe incorrect' })
    } finally {
      // * Action : Qu'il y ait eu un succès ou une erreur, le bloc finally s'exécute toujours.
      // * Il est crucial pour réinitialiser le state loading et rendre le bouton à nouveau cliquable. *
      setLoading(false)
    }
  }

  return (
    // KeyboardAvoidingView est essentiel en React Native pour que le clavier virtuel 
    // ne cache pas les champs de saisie de l'utilisateur. Le comportement diffère selon l'OS.
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        // keyboardShouldPersistTaps="handled" permet à l'utilisateur de cliquer sur le bouton
        // "Se connecter" même si le clavier est ouvert, sans que le premier clic serve uniquement à fermer le clavier.
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Logo ── */}
        <View style={styles.logoWrapper}>
          <View style={styles.logoIcon}>
            <Ionicons name="barbell" size={28} color={Colors.white} />
          </View>
          <Text style={styles.logoTitle}>FitTrack</Text>
          <Text style={styles.logoSub}>Connecte-toi à ton espace</Text>
        </View>

        {/* ── Carte formulaire ── */}
        <View style={styles.card}>

          {/* Champ Email */}
          <View style={styles.field}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="ton@email.com"
              placeholderTextColor={Colors.textMuted}
              value={email}
              // * Action : Mise à jour du state 'email' à chaque caractère tapé par l'utilisateur. *
              onChangeText={setEmail}
              keyboardType="email-address" // Affiche un clavier optimisé avec le symbole '@'
              autoCapitalize="none"        // Évite de mettre la première lettre en majuscule (agaçant pour les emails)
              autoComplete="email"
            />
          </View>

          {/* Champ Mot de passe */}
          <View style={styles.field}>
            <Text style={styles.label}>Mot de passe</Text>
            {/* ! Sécurité : Utilisation de secureTextEntry pour oblusquer la saisie. 
                Ceci remplace les caractères par des points pour protéger la confidentialité du mot de passe. ! */}
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              value={password}
              // * Action : Mise à jour du state 'password' *
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          {/* Bouton de connexion */}
          <TouchableOpacity
            // Application d'un style conditionnel : si loading est true, on ajoute le style btnDisabled
            style={[styles.btn, loading && styles.btnDisabled]}
            // * Action : Déclenche la fonction handleSubmit détaillée plus haut. *
            onPress={handleSubmit}
            // ! Sécurité : Désactivation matérielle du bouton si l'état est en chargement pour bloquer le multi-clic. !
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              // Affichage du spinner natif (tournevis d'attente) quand loading est vrai
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Text style={styles.btnText}>Se connecter</Text>
            )}
          </TouchableOpacity>

          {/* Lien vers l'inscription */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas de compte ? </Text>
            {/* * Action / Logique métier : Redirection vers l'écran "Register" de la stack de navigation.
                L'utilisateur pourra créer son compte et revenir ici ensuite. * */}
            <TouchableOpacity onPress={() => navigation.navigate('Register')}>
              <Text style={styles.footerLink}>S'inscrire</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.dark,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoWrapper: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  logoSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  btn: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    backgroundColor: '#3730a3',
  },
  btnText: {
    color: Colors.white,
    fontWeight: '600',
    fontSize: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  footerText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  footerLink: {
    color: Colors.primaryLight,
    fontSize: 13,
    fontWeight: '500',
  },
})