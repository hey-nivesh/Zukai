/**
 * ZUKAI — Library Screen
 * Connected to live Supabase data layer via TanStack Query.
 * Supports keyword search, MIME-type and status filtering, rename/delete modals,
 * sort controls, favorites, downloads filter, and direct audio player navigation.
 */

import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  FileText,
  ChevronRight,
  Search,
  RefreshCw,
  MoreVertical,
  Edit2,
  Trash2,
  Star,
} from 'lucide-react-native';
import { MeshBackground } from '../../components/MeshBackground';
import { GlassCard } from '../../components/GlassCard';
import { Text } from '../../components/Text';
import { ShinyButton } from '../../components/ShinyButton';
import { EmptyState } from '../../components/EmptyState';
import { useLibrary } from '@/features/library/hooks/useLibrary';
import { useSoftDeleteDocument } from '@/features/documents/hooks/useDocuments';
import { updateDocumentTitle } from '@/features/documents/api/documentsApi';
import { useQueryClient } from '@tanstack/react-query';
import { DocumentRow } from '@/features/documents/api/documentsApi';
import { usePlaybackStore } from '@/features/playback/playbackStore';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/authStore';
import { getDownloadsIndex } from '@/features/playback/downloadManager';

const C = {
  brandHero: '#92F702',
  canvasSurfaceRaised: '#132830',
  canvasSurfaceHighlight: '#18333D',
  textPrimary: '#F8F9FA',
  textSecondary: '#B5C4CC',
  textTertiary: '#6B828F',
  textInverse: '#09161B',
  glassBorder: 'rgba(255,255,255,0.14)',
  success: '#00E676',
  warning: '#FFD600',
  error: '#FF5252',
};

const FILTERS = ['All', 'PDF', 'Word', 'Audio Ready', 'Processing'];

type SortBy = 'newest' | 'oldest' | 'name' | 'duration';
const SORT_OPTIONS: { key: SortBy; label: string }[] = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'name', label: 'Name' },
  { key: 'duration', label: 'Duration' },
];

export default function LibraryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { playTrack } = usePlaybackStore();
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Sort state
  const [sortBy, setSortBy] = useState<SortBy>('newest');

  // Favorites state
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // Downloads state
  const [showDownloadsOnly, setShowDownloadsOnly] = useState(false);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());

  const { data: libraryItems = [], isLoading, error, refetch } = useLibrary();
  const softDeleteMutation = useSoftDeleteDocument();

  // Document actions modal state
  const [selectedDoc, setSelectedDoc] = useState<DocumentRow | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const [renameText, setRenameText] = useState('');
  const [isSubmittingRename, setIsSubmittingRename] = useState(false);

  // Load favorites on mount
  useEffect(() => {
    const userId = useAuthStore.getState().user?.id;
    if (userId) {
      supabase
        .from('document_favorites')
        .select('document_id')
        .eq('user_id', userId)
        .then(({ data }) => {
          if (data) setFavoriteIds(new Set(data.map((r: { document_id: string }) => r.document_id)));
        });
    }
  }, []);

  // Load downloaded track IDs on mount
  useEffect(() => {
    getDownloadsIndex().then((index) => {
      setDownloadedIds(new Set(Object.keys(index)));
    });
  }, []);

  async function toggleFavorite(documentId: string) {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;
    if (favoriteIds.has(documentId)) {
      await supabase
        .from('document_favorites')
        .delete()
        .eq('document_id', documentId)
        .eq('user_id', userId);
      setFavoriteIds((prev) => {
        const n = new Set(prev);
        n.delete(documentId);
        return n;
      });
    } else {
      await supabase
        .from('document_favorites')
        .insert({ document_id: documentId, user_id: userId });
      setFavoriteIds((prev) => new Set([...prev, documentId]));
    }
  }

  const filteredItems = useMemo(() => {
    let items = libraryItems.filter((item) => {
      // 1. Search Query Filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = item.document.title.toLowerCase().includes(query);
        const matchesFilename = item.document.original_filename.toLowerCase().includes(query);
        if (!matchesTitle && !matchesFilename) return false;
      }

      // 2. Chip Filter
      if (activeFilter === 'PDF') {
        return item.document.mime_type.includes('pdf');
      }
      if (activeFilter === 'Word') {
        return (
          item.document.mime_type.includes('word') ||
          item.document.original_filename.endsWith('.docx')
        );
      }
      if (activeFilter === 'Audio Ready') {
        return item.document.status === 'ready' && Boolean(item.track);
      }
      if (activeFilter === 'Processing') {
        return item.document.status === 'uploaded' || item.document.status === 'uploading';
      }

      return true;
    });

    // 3. Favorites filter
    if (showFavoritesOnly) {
      items = items.filter((item) => favoriteIds.has(item.document.id));
    }

    // 4. Downloads filter
    if (showDownloadsOnly) {
      items = items.filter((item) => item.track && downloadedIds.has(item.track.id));
    }

    // 5. Sort
    items = [...items].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.document.created_at).getTime() - new Date(a.document.created_at).getTime();
      }
      if (sortBy === 'oldest') {
        return new Date(a.document.created_at).getTime() - new Date(b.document.created_at).getTime();
      }
      if (sortBy === 'name') {
        return a.document.title.localeCompare(b.document.title);
      }
      if (sortBy === 'duration') {
        return (b.track?.duration_seconds ?? 0) - (a.track?.duration_seconds ?? 0);
      }
      return 0;
    });

    return items;
  }, [libraryItems, searchQuery, activeFilter, showFavoritesOnly, favoriteIds, showDownloadsOnly, downloadedIds, sortBy]);

  // Rename Handler
  const handleSaveRename = async () => {
    if (!selectedDoc || !renameText.trim()) return;
    try {
      setIsSubmittingRename(true);
      await updateDocumentTitle(selectedDoc.id, renameText.trim());
      setIsRenameOpen(false);
      setSelectedDoc(null);
      queryClient.invalidateQueries({ queryKey: ['library'] });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to update document title';
      Alert.alert('Rename Error', msg);
    } finally {
      setIsSubmittingRename(false);
    }
  };

  // Delete Handler
  const handleDeleteDocument = (doc: DocumentRow) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete "${doc.title}"? The document and any generated audio will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await softDeleteMutation.mutateAsync(doc.id);
              setSelectedDoc(null);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Unable to delete document';
              Alert.alert('Delete Error', msg);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <MeshBackground variant="library" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 16, paddingBottom: 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <Text variant="title2" rawColor={C.textPrimary} style={styles.headerTitle}>
            My Library
          </Text>
          <Pressable style={styles.filterIconBtn} onPress={() => refetch()}>
            <RefreshCw size={18} color={C.textSecondary} strokeWidth={2} />
          </Pressable>
        </View>

        {/* ── Search Bar ── */}
        <View style={styles.searchBar}>
          <Search size={18} color={C.textTertiary} strokeWidth={2} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search documents by title..."
            placeholderTextColor={C.textTertiary}
            style={styles.searchInput}
          />
        </View>

        {/* ── Filter Chips ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          style={styles.chipsScroll}
        >
          {FILTERS.map((f) => {
            const active = activeFilter === f;
            return (
              <Pressable
                key={f}
                onPress={() => setActiveFilter(f)}
                style={[
                  styles.chip,
                  active ? styles.chipActive : styles.chipInactive,
                ]}
              >
                <Text
                  variant="footnote"
                  rawColor={active ? C.textInverse : C.textSecondary}
                  style={styles.chipText}
                >
                  {f}
                </Text>
              </Pressable>
            );
          })}

          {/* Favorites pill */}
          <Pressable
            onPress={() => setShowFavoritesOnly((v) => !v)}
            style={[
              styles.chip,
              showFavoritesOnly ? styles.chipSpecialActive : styles.chipInactive,
            ]}
          >
            <Text
              variant="footnote"
              rawColor={showFavoritesOnly ? C.brandHero : C.textSecondary}
              style={styles.chipText}
            >
              ⭐ Favorites
            </Text>
          </Pressable>

          {/* Downloads pill */}
          <Pressable
            onPress={() => setShowDownloadsOnly((v) => !v)}
            style={[
              styles.chip,
              showDownloadsOnly ? styles.chipSpecialActive : styles.chipInactive,
            ]}
          >
            <Text
              variant="footnote"
              rawColor={showDownloadsOnly ? C.brandHero : C.textSecondary}
              style={styles.chipText}
            >
              ⬇ Downloaded
            </Text>
          </Pressable>
        </ScrollView>

        {/* ── Sort Pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortRow}
          style={styles.sortScroll}
        >
          {SORT_OPTIONS.map(({ key, label }) => {
            const active = sortBy === key;
            return (
              <Pressable
                key={key}
                onPress={() => setSortBy(key)}
                style={[
                  styles.sortChip,
                  active ? styles.sortChipActive : styles.sortChipInactive,
                ]}
              >
                <Text
                  variant="footnote"
                  rawColor={active ? C.brandHero : C.textTertiary}
                  style={styles.chipText}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Loading Indicator ── */}
        {isLoading && (
          <GlassCard style={styles.loadingCard}>
            <ActivityIndicator size="small" color={C.brandHero} />
            <Text variant="footnote" rawColor={C.textSecondary} style={{ marginTop: 8 }}>
              Loading your documents...
            </Text>
          </GlassCard>
        )}

        {/* ── Error Banner ── */}
        {error && (
          <GlassCard style={styles.errorCard}>
            <Text variant="headline" rawColor={C.error}>Unable to load library</Text>
            <Text variant="footnote" rawColor={C.textTertiary} style={{ marginTop: 4, marginBottom: 12 }}>
              {error.message || 'An error occurred fetching your documents.'}
            </Text>
            <Pressable onPress={() => refetch()} style={styles.retryBtn}>
              <RefreshCw size={14} color={C.brandHero} />
              <Text variant="caption" rawColor={C.brandHero}>Retry</Text>
            </Pressable>
          </GlassCard>
        )}

        {/* ── List of Documents ── */}
        {!isLoading && filteredItems.length > 0 && (
          filteredItems.map((item) => {
            const isReady = item.document.status === 'ready';
            const isFailed = item.document.status === 'failed';
            const isUploading = item.document.status === 'uploading';
            const statusLabel = isReady
              ? 'READY'
              : isFailed
              ? 'FAILED'
              : isUploading
              ? 'UPLOADING'
              : 'QUEUED';
            const statusColor = isReady ? C.success : isFailed ? C.error : C.warning;
            const fileSizeMb = (item.document.file_size_bytes / (1024 * 1024)).toFixed(1);
            const docType = item.document.mime_type.includes('pdf') ? 'PDF' : 'DOCX';
            const durationLabel = item.track
              ? `${Math.round(item.track.duration_seconds / 60)} min audio`
              : `${item.document.page_count ?? 1} pages`;
            const isFavorited = favoriteIds.has(item.document.id);

            return (
              <Pressable
                key={item.document.id}
                onPress={() => {
                  if (isReady && item.track) {
                    playTrack(item.track, item.document.title);
                    router.push('/player' as Parameters<typeof router.push>[0]);
                  } else if (isFailed) {
                    router.push('/(tabs)/upload');
                  }
                }}
                style={styles.docPressable}
              >
                <GlassCard style={styles.docCard}>
                  <View style={styles.docIcon}>
                    <FileText size={20} color={C.brandHero} strokeWidth={2} />
                  </View>
                  <View style={styles.docCenter}>
                    <Text variant="headline" rawColor={C.textPrimary} numberOfLines={1} ellipsizeMode="tail">
                      {item.document.title}
                    </Text>
                    <Text variant="footnote" rawColor={C.textTertiary}>
                      {docType} • {fileSizeMb} MB • {durationLabel}
                    </Text>
                  </View>
                  <View style={styles.docRight}>
                    <View
                      style={[
                        styles.statusChip,
                        { borderColor: statusColor + '55', backgroundColor: statusColor + '20' },
                      ]}
                    >
                      <Text variant="caption" rawColor={statusColor} style={styles.statusText}>
                        {statusLabel}
                      </Text>
                    </View>
                    {/* Star / Favorite button */}
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        void toggleFavorite(item.document.id);
                      }}
                      hitSlop={8}
                      style={{ padding: 4 }}
                    >
                      <Star
                        size={16}
                        color={isFavorited ? C.brandHero : C.textTertiary}
                        fill={isFavorited ? C.brandHero : 'none'}
                        strokeWidth={2}
                      />
                    </Pressable>
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setSelectedDoc(item.document);
                      }}
                      hitSlop={8}
                      style={{ padding: 4 }}
                    >
                      <MoreVertical size={16} color={C.textTertiary} />
                    </Pressable>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })
        )}

        {/* ── Empty State ── */}
        {!isLoading && filteredItems.length === 0 && !error && (
          <EmptyState
            pose="empty"
            title={searchQuery ? 'No matching documents' : 'No documents in this view'}
            message={
              searchQuery
                ? `No results found for "${searchQuery}". Try a different keyword.`
                : 'Upload documents or adjust your filters to view audio explanations.'
            }
            actionLabel="Upload New Document"
            onAction={() => router.push('/(tabs)/upload')}
          />
        )}
      </ScrollView>

      {/* ── Document Actions Modal ── */}
      <Modal
        visible={Boolean(selectedDoc) && !isRenameOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDoc(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSelectedDoc(null)}>
          <GlassCard style={styles.actionSheetCard}>
            <Text variant="headline" rawColor={C.textPrimary} numberOfLines={1} style={{ marginBottom: 12 }}>
              {selectedDoc?.title}
            </Text>

            <Pressable
              style={styles.sheetActionRow}
              onPress={() => {
                setRenameText(selectedDoc?.title || '');
                setIsRenameOpen(true);
              }}
            >
              <Edit2 size={18} color={C.textSecondary} />
              <Text variant="subhead" rawColor={C.textPrimary}>Rename Title</Text>
            </Pressable>

            <Pressable
              style={styles.sheetActionRow}
              onPress={() => {
                if (selectedDoc) handleDeleteDocument(selectedDoc);
              }}
            >
              <Trash2 size={18} color={C.error} />
              <Text variant="subhead" rawColor={C.error}>Delete Document</Text>
            </Pressable>
          </GlassCard>
        </Pressable>
      </Modal>

      {/* ── Rename Modal ── */}
      <Modal
        visible={isRenameOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsRenameOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.renameCard}>
            <Text variant="title3" rawColor={C.textPrimary} style={{ marginBottom: 12 }}>
              Rename Document
            </Text>
            <TextInput
              value={renameText}
              onChangeText={setRenameText}
              placeholder="Enter new title"
              placeholderTextColor={C.textTertiary}
              style={styles.renameInput}
              autoFocus
            />
            <View style={styles.renameBtnRow}>
              <Pressable
                onPress={() => setIsRenameOpen(false)}
                style={styles.renameCancelBtn}
              >
                <Text variant="headline" rawColor={C.textSecondary}>Cancel</Text>
              </Pressable>
              <ShinyButton
                label="Save Title"
                variant="primary"
                size="md"
                loading={isSubmittingRename}
                onPress={handleSaveRename}
              />
            </View>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#09161B' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontWeight: '700' },
  filterIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: C.canvasSurfaceRaised,
    borderWidth: 1,
    borderColor: C.glassBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.canvasSurfaceRaised,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: C.glassBorder,
    marginBottom: 16,
  },
  searchInput: { flex: 1, color: C.textPrimary, fontSize: 14 },
  chipsScroll: { marginBottom: 10 },
  chipsRow: { gap: 8 },
  sortScroll: { marginBottom: 16 },
  sortRow: { gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipActive: { backgroundColor: C.brandHero, borderColor: C.brandHero },
  chipInactive: { backgroundColor: C.canvasSurfaceRaised, borderColor: C.glassBorder },
  chipSpecialActive: {
    backgroundColor: 'rgba(146,247,2,0.12)',
    borderColor: C.brandHero,
  },
  chipText: { fontWeight: '600', fontSize: 12 },
  sortChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  sortChipActive: {
    backgroundColor: 'rgba(146,247,2,0.12)',
    borderColor: C.brandHero,
  },
  sortChipInactive: { backgroundColor: C.canvasSurfaceRaised, borderColor: C.glassBorder },
  loadingCard: { padding: 24, borderRadius: 16, alignItems: 'center', marginBottom: 20 },
  errorCard: { padding: 16, borderRadius: 16, marginBottom: 20, borderColor: 'rgba(255,82,82,0.3)' },
  retryBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  docPressable: { marginBottom: 8 },
  docCard: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 16, gap: 12, minHeight: 56 },
  docIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: C.canvasSurfaceRaised, alignItems: 'center', justifyContent: 'center' },
  docCenter: { flex: 1, gap: 2 },
  docRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  statusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  actionSheetCard: { width: '100%', padding: 20, borderRadius: 20, gap: 16 },
  sheetActionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10 },
  renameCard: { width: '100%', padding: 24, borderRadius: 20, gap: 16 },
  renameInput: {
    backgroundColor: C.canvasSurfaceRaised,
    borderRadius: 12,
    padding: 12,
    color: C.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: C.glassBorder,
  },
  renameBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 16 },
  renameCancelBtn: { paddingVertical: 10, paddingHorizontal: 14 },
});
