// ============================================================================
// LoadingSpinner.tsx — Indicateur de chargement plein écran
//
// Utilisé pendant la récupération initiale des données
// (ex: vérification du token au démarrage, chargement d'un écran).
// ============================================================================

import React from 'react'
import {
  View,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'
import { Colors } from '../constants/colors'

export default function LoadingSpinner() {
  return (
    // * Action : affichage du conteneur plein écran centré pour le blocage visuel pendant le chargement *
    <View style={styles.container}>
      {/* ? Rendu de l'indicateur d'activité natif animé aux couleurs de la charte ? */}
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark,
  },
})