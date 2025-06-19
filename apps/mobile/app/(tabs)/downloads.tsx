import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import {
  useSeriesData,
  useDownloads,
} from '@pitara/hooks'
import { getSeriesPoster } from '../../utils/bunnycdn'
import { router } from 'expo-router'
import VideoPlayer from '../../components/VideoPlayer'

export default function DownloadsScreen() {
  const {
    allSeries,
    loading: seriesLoading,
    error: seriesError,
  } = useSeriesData()
  const {
    downloads,
    activeDownloads,
    completedDownloads,
  } = useDownloads()

  const [playerItem, setPlayerItem] = useState<null | { uri: string; title: string }>(null)

  const colors = {
    background: '#000',
    card: '#1F2937',
    text: '#FFFFFF',
    subtext: '#9CA3AF',
    accent: '#3B82F6',
    border: '#374151',
  }

  const renderSeriesItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity
        style={styles(colors).seriesCard}
        onPress={() => router.push(`/series/${item.id}`)}
      >
        <View style={styles(colors).seriesHeader}>
          <Image
            source={{ uri: item.thumbnail_url || getSeriesPoster(item.id) }}
            style={styles(colors).seriesImage}
          />
          <View style={{ flex: 1 }}>
            <Text style={styles(colors).seriesTitle}>{item.title}</Text>
            <Text style={styles(colors).seriesMeta}>{`${item.episodes.length} Episodes`}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  if (seriesLoading) {
    return (
      <SafeAreaView
        style={[styles(colors).container, { alignItems: 'center', justifyContent: 'center' }]}
      >
        <Text style={{ color: colors.text }}>Loading...</Text>
      </SafeAreaView>
    )
  }

  if (seriesError) {
    return (
      <SafeAreaView
        style={[styles(colors).container, { alignItems: 'center', justifyContent: 'center' }]}
      >
        <Text style={{ color: 'red' }}>{seriesError}</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles(colors).container]}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Already Downloaded Section */}
        <View style={{ marginBottom: 24 }}>
          <Text style={styles(colors).sectionTitle}>Already Downloaded</Text>
          {completedDownloads.length > 0 ? (
            <FlatList
              data={completedDownloads}
              keyExtractor={(d) => d.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles(colors).downloadedCard}
                  onPress={() => setPlayerItem({ uri: item.localPath || item.videoUrl, title: item.title })}
                >
                  <Image
                    source={{ uri: item.thumbnailUrl || getSeriesPoster(item.seriesId) }}
                    style={styles(colors).downloadedThumb}
                  />
                  <Text style={styles(colors).downloadedTitle} numberOfLines={2}>{item.title}</Text>
                </TouchableOpacity>
              )}
            />
          ) : (
            <Text style={styles(colors).emptyText}>No downloads available</Text>
          )}
        </View>

        {activeDownloads.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={styles(colors).sectionTitle}>Active Downloads</Text>
            {activeDownloads.map((d) => (
              <View key={d.id} style={styles(colors).activeDownloadRow}>
                <Text style={[styles(colors).episodeTitle, { flex: 1 }]} numberOfLines={1}>
                  {d.title}
                </Text>
                <View style={styles(colors).progressBarContainer}>
                  <View
                    style={[
                      styles(colors).progressFill,
                      { width: `${d.progress}%` },
                    ]}
                  />
                </View>
              </View>
            ))}
          </View>
        )}

        <Text style={styles(colors).sectionTitle}>Download Offline</Text>
        <FlatList
          data={allSeries}
          keyExtractor={(item) => item.id}
          renderItem={renderSeriesItem}
          scrollEnabled={false}
        />
      </ScrollView>

      {/* Offline Player Modal */}
      <Modal
        visible={playerItem !== null}
        presentationStyle="overFullScreen"
        onRequestClose={() => setPlayerItem(null)}
      >
        {playerItem && (
          <VideoPlayer
            uri={playerItem.uri}
            title={playerItem.title}
            isVisible={true}
            onClose={() => setPlayerItem(null)}
          />
        )}
      </Modal>
    </SafeAreaView>
  )
}

// Dynamic styles factory to respect theme
const styles = (c: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.background,
    },
    sectionTitle: {
      fontSize: 22,
      fontWeight: '700',
      color: c.text,
      marginBottom: 12,
    },
    seriesCard: {
      backgroundColor: c.card,
      borderRadius: 12,
      marginBottom: 16,
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
    },
    seriesHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
    },
    seriesImage: {
      width: 64,
      height: 64,
      borderRadius: 8,
      marginRight: 12,
      backgroundColor: '#111827',
    },
    seriesTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: c.text,
    },
    seriesMeta: {
      fontSize: 14,
      color: c.subtext,
      marginTop: 2,
    },
    downloadedCard: {
      width: 140,
      marginRight: 12,
    },
    downloadedThumb: {
      width: '100%',
      height: 80,
      borderRadius: 8,
      backgroundColor: '#111827',
      marginBottom: 6,
    },
    downloadedTitle: {
      fontSize: 13,
      color: c.text,
    },
    activeDownloadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 8,
    },
    progressBarContainer: {
      width: 100,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      backgroundColor: c.accent,
    },
    episodeTitle: {
      fontSize: 15,
      color: c.text,
    },
    qualityText: {
      fontSize: 16,
      color: c.text,
    },
    emptyText: {
      fontSize: 14,
      color: c.subtext,
      marginTop: 4,
    },
  })

// Helper to satisfy TypeScript inference for colors factory
function getColors() {
  return {
    background: '',
    card: '',
    text: '',
    subtext: '',
    accent: '',
    border: '',
  }
} 