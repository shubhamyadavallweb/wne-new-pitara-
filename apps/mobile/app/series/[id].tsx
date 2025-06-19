import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Modal,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@pitara/supabase';
import VideoPlayer from '../../components/VideoPlayer';
import { useDownloads, useAuth } from '@pitara/hooks';
import { VIDEO_QUALITIES } from '../../constants';
import { getEpisodeVideo } from '../../utils/bunnycdn';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Episode {
  id: string;
  title: string;
  episode_number: number;
  video_url: string;
  thumbnail_url?: string;
  description?: string;
  duration?: number;
}

interface Series {
  id: string;
  title: string;
  description: string;
  genre: string;
  image_url: string;
  status: string;
  episodes: Episode[];
  created_at: string;
}

export default function SeriesDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { addDownload, startDownload } = useDownloads();
  const insets = useSafeAreaInsets();
  
  const [series, setSeries] = useState<Series | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState<string>('');
  const [qualityModal, setQualityModal] = useState<{
    mode: 'single' | 'all';
    episode?: Episode;
  } | null>(null);

  useEffect(() => {
    if (id) {
      fetchSeriesDetail();
    }
  }, [id]);

  const fetchSeriesDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: seriesData, error: seriesError } = await supabase
        .from('series_meta')
        .select(`
          *,
          episodes (
            id,
            title,
            episode_number,
            video_url,
            thumbnail_url,
            description,
            duration
          )
        `)
        .eq('id', id)
        .single();

      if (seriesError) throw seriesError;

      const formattedSeries: Series = {
        id: seriesData.id,
        title: seriesData.title,
        description: seriesData.description,
        genre: seriesData.genre,
        image_url: seriesData.image_url,
        status: seriesData.status,
        episodes: (seriesData.episodes || []).sort((a: any, b: any) => a.episode_number - b.episode_number),
        created_at: seriesData.created_at
      };

      setSeries(formattedSeries);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch series details');
      console.error('Error fetching series details:', err);
    } finally {
      setLoading(false);
    }
  };

  const playEpisode = (episode: Episode) => {
    setSelectedVideoUrl(episode.video_url);
    setSelectedVideoTitle(`${series?.title} - Episode ${episode.episode_number}`);
  };

  const closeVideo = () => {
    setSelectedVideoUrl(null);
    setSelectedVideoTitle('');
  };

  const openQualityPicker = (episode?: Episode) => {
    setQualityModal({ mode: episode ? 'single' : 'all', episode });
  };

  const handleQualitySelect = async (quality: string) => {
    if (!series || !user) {
      Alert.alert('Error', 'Please login to download');
      return;
    }

    try {
      if (qualityModal?.mode === 'single' && qualityModal.episode) {
        const ep = qualityModal.episode;
        const url = getEpisodeVideo(series.id, ep.episode_number, quality);
        const dl = await addDownload({
          title: `${ep.title} (${quality})`,
          seriesId: series.id,
          seriesTitle: series.title,
          episodeId: ep.id,
          episodeNumber: ep.episode_number,
          videoUrl: url,
          thumbnailUrl: ep.thumbnail_url,
          quality,
        });
        await startDownload(dl.id);
      } else if (qualityModal?.mode === 'all') {
        for (const ep of series.episodes) {
          const url = getEpisodeVideo(series.id, ep.episode_number, quality);
          const dl = await addDownload({
            title: `${ep.title} (${quality})`,
            seriesId: series.id,
            seriesTitle: series.title,
            episodeId: ep.id,
            episodeNumber: ep.episode_number,
            videoUrl: url,
            thumbnailUrl: ep.thumbnail_url,
            quality,
          });
          await startDownload(dl.id);
        }
      }

      Alert.alert('Download Started', 'Your episodes are being downloaded');
    } catch (error) {
      Alert.alert('Error', 'Failed to start download');
    } finally {
      setQualityModal(null);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading series details...</Text>
      </SafeAreaView>
    );
  }

  if (error || !series) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😞</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error || 'Series not found'}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchSeriesDetail}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <>
      <SafeAreaView style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* HERO BANNER */}
          <View style={styles.heroContainer}>
            <ImageBackground
              source={{ uri: series.image_url }}
              style={styles.heroImage}
              imageStyle={styles.heroImageStyle}
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.0)", "rgba(0,0,0,0.85)"]}
                style={styles.heroGradient}
              >
                <View style={styles.heroContent}>
                  <Text style={styles.heroTitle}>{series.title}</Text>
                  <Text style={styles.heroGenre}>{series.genre}</Text>
                  <Text style={styles.heroEpisodeCount}>{series.episodes.length} Episodes</Text>
                  <Text style={styles.heroDescription} numberOfLines={3}>
                    {series.description}
                  </Text>
                  <View style={styles.heroButtons}>
                    {series.episodes.length > 0 && (
                      <TouchableOpacity
                        style={styles.playButton}
                        onPress={() => playEpisode(series.episodes[0])}
                      >
                        <Ionicons name="play" size={18} color="#fff" />
                        <Text style={styles.playButtonText}>Play</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.downloadAllButtonHero}
                      onPress={() => openQualityPicker()}
                    >
                      <Ionicons name="download" size={18} color="#fff" />
                      <Text style={styles.downloadAllText}>Download All</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </ImageBackground>
          </View>

          {/* Episodes List */}
          <View style={styles.episodesSection}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Episodes</Text>
              <TouchableOpacity style={styles.downloadAllButton} onPress={() => openQualityPicker()}>
                <Ionicons name="download" size={18} color="#fff" />
                <Text style={styles.downloadAllText}>Download All</Text>
              </TouchableOpacity>
            </View>
            {series.episodes.map((episode) => (
              <TouchableOpacity
                key={episode.id}
                style={styles.episodeCard}
                onPress={() => playEpisode(episode)}
              >
                <View style={styles.episodeNumber}>
                  <Text style={styles.episodeNumberText}>{episode.episode_number}</Text>
                </View>
                
                <View style={styles.episodeThumbnail}>
                  {episode.thumbnail_url ? (
                    <Image source={{ uri: episode.thumbnail_url }} style={styles.thumbnailImage} />
                  ) : (
                    <View style={styles.placeholderThumbnail}>
                      <Ionicons name="play" size={24} color="#6B7280" />
                    </View>
                  )}
                </View>

                <View style={styles.episodeInfo}>
                  <Text style={styles.episodeTitle} numberOfLines={2}>
                    {episode.title}
                  </Text>
                  {episode.description && (
                    <Text style={styles.episodeDescription} numberOfLines={2}>
                      {episode.description}
                    </Text>
                  )}
                  {episode.duration && (
                    <Text style={styles.episodeDuration}>
                      {Math.floor(episode.duration / 60)}min
                    </Text>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.downloadButton}
                  onPress={() => openQualityPicker(episode)}
                >
                  <Ionicons name="download-outline" size={20} color="#3B82F6" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Video Player Modal */}
      <Modal
        visible={selectedVideoUrl !== null}
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={closeVideo}
      >
        {selectedVideoUrl && (
          <VideoPlayer
            uri={selectedVideoUrl}
            title={selectedVideoTitle}
            isVisible={true}
            onClose={closeVideo}
          />
        )}
      </Modal>

      {/* Quality Selection Modal */}
      <Modal
        visible={qualityModal !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setQualityModal(null)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPressOut={() => setQualityModal(null)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Quality</Text>
            {VIDEO_QUALITIES.map((q) => (
              <TouchableOpacity
                key={q.value}
                style={styles.qualityOption}
                onPress={() => handleQualitySelect(q.value)}
              >
                <Text style={styles.qualityText}>{q.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  heroContainer: {
    width: '100%',
    height: 340,
  },
  heroImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  heroImageStyle: {
    resizeMode: 'cover',
  },
  heroGradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  heroContent: {
    width: '100%',
  },
  heroTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  heroGenre: {
    color: '#93C5FD',
    fontSize: 16,
    marginBottom: 2,
  },
  heroEpisodeCount: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 8,
  },
  heroDescription: {
    color: '#D1D5DB',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  heroButtons: {
    flexDirection: 'row',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 12,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  downloadAllButtonHero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  downloadAllText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  episodesSection: {
    padding: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  episodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  episodeNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  episodeNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  episodeThumbnail: {
    width: 80,
    height: 45,
    borderRadius: 4,
    marginRight: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  episodeInfo: {
    flex: 1,
  },
  episodeTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  episodeDescription: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 4,
  },
  episodeDuration: {
    color: '#6B7280',
    fontSize: 12,
  },
  downloadButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  qualityOption: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  qualityText: {
    fontSize: 16,
    color: '#fff',
  },
}); 