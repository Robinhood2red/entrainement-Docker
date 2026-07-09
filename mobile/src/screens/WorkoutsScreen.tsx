// ============================================================================
// WorkoutsScreen.tsx — Liste et gestion des séances d'entraînement
//
// Fonctionnalités :
// - Affichage de la liste globale des séances
// - Création d'une séance (modal) avec redirection immédiate vers les détails
// - Édition des métadonnées d'une séance (titre, date, durée, notes)
// - Suppression sécurisée d'une séance
// ============================================================================

import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native'
import { useFocusEffect, useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { Ionicons } from '@expo/vector-icons'
import Toast from 'react-native-toast-message'
import api from '../services/api'
import { Colors } from '../constants/colors'
import { Workout, RootStackParamList } from '../types'

const today = new Date().toISOString().slice(0, 10)

const EMPTY_FORM = {
  title:    '',
  date:     today,
  duration: '',
  notes:    '',
}

function formatDate(d: string) {
  const [y, mo, day] = d.slice(0, 10).split('-').map(Number)
  return new Date(y, mo - 1, day).toLocaleDateString('fr-FR', {
    weekday: 'short', day: 'numeric', month: 'long',
  })
}

export default function WorkoutsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>()

  // ── États ─────────────────────────────────────────────────

  const [workouts, setWorkouts]     = useState<Workout[]>([])
  const [loading, setLoading]       = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const [modalOpen, setModalOpen]   = useState(false)
  const [editTarget, setEditTarget] = useState<Workout | null>(null)
  const [form, setForm]             = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)

  // ? Requêtage : récupération des séances d'entraînement depuis l'API ?
  const loadWorkouts = async () => {
    try {
      const res = await api.get('/workouts')
      setWorkouts(res.data.workouts)
    } catch {
      Toast.show({ type: 'error', text1: 'Impossible de charger les séances' })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // ? Requêtage / Logique : rechargement automatique au focus de l'écran ?
  useFocusEffect(
    useCallback(() => {
      loadWorkouts()
    }, [])
  )

  // ── Gestion de la modal ────────────────────────────────────

  // * Action : réinitialisation du formulaire pour une nouvelle séance *
  const openCreate = () => {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setModalOpen(true)
  }

  // * Action : pré-remplissage du formulaire pour édition d'une séance *
  const openEdit = (w: Workout) => {
    setEditTarget(w)
    setForm({
      title:    w.title,
      date:     w.date.slice(0, 10),
      duration: w.duration ? String(w.duration) : '',
      notes:    w.notes ?? '',
    })
    setModalOpen(true)
  }

  // ! Sécurité / Alerte : confirmation avant suppression définitive de la séance !
  const confirmDelete = (w: Workout) => {
    Alert.alert(
      'Supprimer la séance',
      `Supprimer "${w.title}" ? Cette action est irréversible.`,
      [
        { text: 'Annuler',   style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => handleDelete(w.id) },
      ]
    )
  }

  // ? Requêtage : suppression de la séance via l'API ?
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/workouts/${id}`)
      // * Action : mise à jour optimiste de la liste locale *
      setWorkouts((prev) => prev.filter((w) => w.id !== id))
      Toast.show({ type: 'success', text1: 'Séance supprimée' })
    } catch {
      Toast.show({ type: 'error', text1: 'Impossible de supprimer' })
    }
  }

  // ? Requêtage / Logique : création ou mise à jour de la séance d'entraînement ?
  const handleSubmit = async () => {
    if (!form.title || !form.date) {
      Toast.show({ type: 'error', text1: 'Le titre et la date sont requis' })
      return
    }
    setSubmitting(true)
    try {
      // * Action : formatage du payload pour l'API *
      const payload = {
        title:    form.title,
        date:     form.date,
        duration: form.duration ? Number(form.duration) : undefined,
        notes:    form.notes || undefined,
      }

      if (editTarget) {
        // ? Requêtage : mise à jour complète de la séance (PUT) ?
        const res = await api.put(`/workouts/${editTarget.id}`, payload)
        // * Action : mise à jour locale tout en préservant le nombre d'exercices *
        setWorkouts((prev) =>
          prev.map((w) => w.id === editTarget.id
            ? { ...res.data.workout, exercise_count: editTarget.exercise_count }
            : w
          )
        )
        Toast.show({ type: 'success', text1: 'Séance modifiée' })
      } else {
        // ? Requêtage : création d'une nouvelle séance (POST) ?
        const res = await api.post('/workouts', payload)
        const newWorkout = { ...res.data.workout, exercise_count: 0 }
        
        // * Action : ajout en tête de liste et redirection vers la vue détaillée *
        setWorkouts((prev) => [newWorkout, ...prev])
        Toast.show({ type: 'success', text1: 'Séance créée' })
        setModalOpen(false)
        
        navigation.navigate('WorkoutDetail', {
          workoutId: res.data.workout.id,
          title:     res.data.workout.title,
        })
        return
      }
      setModalOpen(false)
    } catch (err: unknown) {
      const msg =
        err instanceof Error && 'response' in err
          ? (err as { response?: { data?: { error?: string } } }).response?.data?.error
          : undefined
      Toast.show({ type: 'error', text1: msg || 'Erreur' })
    } finally {
      setSubmitting(false)
    }
  }

  // * Action / Logique UI : rendu individuel d'un item de séance *
  const renderItem = ({ item }: { item: Workout }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('WorkoutDetail', { workoutId: item.id, title: item.title })}
      activeOpacity={0.8}
    >
      <View style={styles.cardLeft}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={11} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formatDate(item.date)}</Text>
          </View>
          {item.duration ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.metaText}>{item.duration} min</Text>
            </View>
          ) : null}
          {(item.exercise_count ?? 0) > 0 ? (
            <View style={styles.metaItem}>
              <Ionicons name="barbell-outline" size={11} color={Colors.textMuted} />
              <Text style={styles.metaText}>{item.exercise_count} ex.</Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => openEdit(item)} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="pencil-outline" size={16} color={Colors.textMuted} />
        </TouchableOpacity>
        {/* ! Sécurité : déclenchement de la suppression de la séance ! */}
        <TouchableOpacity onPress={() => confirmDelete(item)} style={styles.iconBtn} hitSlop={8}>
          <Ionicons name="trash-outline" size={16} color={Colors.red} />
        </TouchableOpacity>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
      </View>
    </TouchableOpacity>
  )

  return (
    <View style={styles.root}>
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          refreshControl={
            // ? Requêtage : rafraîchissement manuel de la liste ?
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadWorkouts() }}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Aucune séance pour le moment.</Text>
              <TouchableOpacity onPress={openCreate}>
                <Text style={styles.emptyLink}>Créer ta première séance →</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* ── Floating Action Button (FAB) ── */}
      <TouchableOpacity style={styles.fab} onPress={openCreate} activeOpacity={0.8}>
        <Ionicons name="add" size={24} color={Colors.white} />
      </TouchableOpacity>

      {/* ── Modal Création / Édition ── */}
      <Modal
        visible={modalOpen}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editTarget ? 'Modifier la séance' : 'Nouvelle séance'}
            </Text>
            <TouchableOpacity onPress={() => setModalOpen(false)}>
              <Ionicons name="close" size={22} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Titre *</Text>
            <TextInput
              style={styles.input}
              placeholder="Séance force haut corps"
              placeholderTextColor={Colors.textMuted}
              value={form.title}
              onChangeText={(v) => setForm({ ...form, title: v })}
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Date * (YYYY-MM-DD)</Text>
            <TextInput
              style={styles.input}
              placeholder="2024-01-15"
              placeholderTextColor={Colors.textMuted}
              value={form.date}
              onChangeText={(v) => setForm({ ...form, date: v })}
              keyboardType="numbers-and-punctuation"
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Durée (min)</Text>
            <TextInput
              style={styles.input}
              placeholder="60"
              placeholderTextColor={Colors.textMuted}
              value={form.duration}
              onChangeText={(v) => setForm({ ...form, duration: v })}
              keyboardType="numeric"
            />

            <Text style={[styles.label, { marginTop: 16 }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Super séance !"
              placeholderTextColor={Colors.textMuted}
              value={form.notes}
              onChangeText={(v) => setForm({ ...form, notes: v })}
              multiline
              numberOfLines={3}
            />

            {!editTarget && (
              <Text style={styles.hint}>
                Après création, tu pourras ajouter des exercices depuis le détail de la séance.
              </Text>
            )}

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalOpen(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>{editTarget ? 'Enregistrer' : 'Créer'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

// ── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.dark },
  list: { padding: 16, gap: 12, paddingBottom: 100 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  card: {
    backgroundColor: Colors.surface, borderRadius: 16,
    borderWidth: 1, borderColor: Colors.border,
    padding: 16, flexDirection: 'row', alignItems: 'center',
  },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, marginBottom: 6 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: Colors.textMuted },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 },
  iconBtn: { padding: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', paddingTop: 80 },
  emptyText: { fontSize: 14, color: Colors.textMuted },
  emptyLink: { fontSize: 14, color: Colors.primaryLight, marginTop: 8 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.primary,
    justifyContent: 'center', alignItems: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 8,
  },
  modal: { flex: 1, backgroundColor: Colors.dark },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 20, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary },
  modalBody: { padding: 20 },
  label: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: 'rgba(15,23,42,0.6)',
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: Colors.textPrimary,
  },
  inputMultiline: { height: 80, textAlignVertical: 'top' },
  hint: { fontSize: 12, color: Colors.textMuted, marginTop: 12, lineHeight: 18 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24, marginBottom: 40 },
  cancelBtn: {
    flex: 1, borderWidth: 1, borderColor: Colors.border,
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  cancelBtnText: { color: Colors.textSecondary, fontWeight: '500' },
  submitBtn: {
    flex: 1, backgroundColor: Colors.primary,
    borderRadius: 10, paddingVertical: 13, alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: Colors.white, fontWeight: '600' },
})