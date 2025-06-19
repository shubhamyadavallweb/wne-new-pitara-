import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  TouchableOpacity, 
  Image, 
  Alert, 
  Modal, 
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import VideoPlayer from '../../components/VideoPlayer';
import { useSeriesData } from '@pitara/hooks';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { AuthContext } from '../_layout';
import { supabase } from '@pitara/supabase';
import { StatusBar } from 'expo-status-bar';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const FEATURED_HEIGHT = Math.round(screenHeight * 0.55);

// Local assets
const logoImg = require('../../assets/Assets/pitaralogo.png');

interface Episode {
  id: string;
  title: string;
  episode_number: number;
  video_url: string;
  thumbnail_url?: string;
}

interface Series {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  image_url: string;
  genre: string;
  episodes: Episode[];
}

export default function Home() {
  const { 
    featuredSeries, 
    latestSeries, 
    recommendedSeries, 
    popularSeries, 
    loading, 
    error, 
    refreshData 
  } = useSeriesData();
  
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [selectedVideoTitle, setSelectedVideoTitle] = useState<string>('');
  const [activeSlide, setActiveSlide] = useState(0);
  const { session } = useContext(AuthContext);
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(true);

  const playVideo = (videoUrl: string, title: string) => {
    setSelectedVideoUrl(videoUrl);
    setSelectedVideoTitle(title);
  };

  const closeVideo = () => {
    setSelectedVideoUrl(null);
    setSelectedVideoTitle('');
  };

  const navigateToSeries = (seriesId: string) => {
    router.push(`/series/${seriesId}`);
  };

  useEffect(() => {
    async function fetchSubscription() {
      if (session?.user) {
        setLoadingSubscription(true);
        try {
          const { data, error } = await supabase
            .from('subscriptions')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          
          if (error) {
            console.error('Error fetching subscription:', error);
          } else {
            setSubscription(data);
          }
        } catch (error) {
          console.error('Unexpected error:', error);
        } finally {
          setLoadingSubscription(false);
        }
      } else {
        // No signed-in user; skip subscription lookup
        setLoadingSubscription(false);
      }
    }
    
    fetchSubscription();
  }, [session]);

  if (loading || loadingSubscription) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff6b00" />
        <Text style={styles.loadingText}>Loading content...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😞</Text>
        <Text style={styles.errorTitle}>Something went wrong</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={refreshData}>
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Check subscription status
  const hasActiveSubscription = subscription?.status === 'active';

  const renderSeriesCard = (series: Series, onPress: () => void) => (
    <TouchableOpacity key={series.id} style={styles.seriesCard} onPress={onPress}>
      <View style={styles.seriesThumbnail}>
        {series.image_url ? (
          <Image source={{ uri: series.image_url }} style={styles.thumbnailImage} />
        ) : (
          <View style={styles.placeholderThumbnail}>
            <Ionicons name="play-circle" size={40} color="#6B7280" />
          </View>
        )}
      </View>
      <Text style={styles.seriesTitle} numberOfLines={2}>
        {series.title}
      </Text>
      <Text style={styles.seriesGenre} numberOfLines={1}>
        {series.genre}
      </Text>
    </TouchableOpacity>
  );

  const renderFeaturedCarousel = () => {
    if (featuredSeries.length === 0) return null;

    return (
      <View style={styles.featuredSection}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
          style={styles.featuredCarousel}
          onMomentumScrollEnd={e => {
            const index = Math.round(
              e.nativeEvent.contentOffset.x / screenWidth,
            );
            setActiveSlide(index);
          }}
        >
          {featuredSeries.map((series) => (
            <TouchableOpacity
              key={series.id}
              style={styles.featuredCard}
              onPress={() => navigateToSeries(series.id)}
              activeOpacity={0.9}
            >
              <Image source={{ uri: series.image_url }} style={styles.featuredImage} />
              <LinearGradient
                colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.7)"]}
                style={styles.gradientOverlay}
              />
              <View style={styles.featuredOverlay}>
                <Text style={styles.featuredTitle}>{series.title}</Text>
                <Text style={styles.featuredDescription} numberOfLines={3}>
                  {series.description}
                </Text>
                <View style={styles.featuredActions}>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => {
                      if (series.episodes.length > 0) {
                        playVideo(
                          series.episodes[0].video_url,
                          `${series.title} - Episode 1`,
                        );
                      }
                    }}
                    activeOpacity={0.9}
                  >
                    <Ionicons name="play" size={20} color="#fff" />
                    <Text style={styles.playButtonText}>Play</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        {/* Dots */}
        <View style={styles.dotsContainer}>
          {featuredSeries.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                { opacity: activeSlide === idx ? 1 : 0.3 },
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderSeriesSection = (title: string, series: Series[]) => {
    if (series.length === 0) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seriesScroll}>
          {series.map((item) => 
            renderSeriesCard(item, () => navigateToSeries(item.id))
          )}
        </ScrollView>
      </View>
    );
  };

  return (
    <>
      {/* Transparent StatusBar for this screen */}
      <StatusBar translucent backgroundColor="transparent" style="light" />
      <SafeAreaView style={styles.container}>
        {/* Brand Header */}
        <View style={styles.brandHeader}>
          <Image source={logoImg} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandText}>Pitara</Text>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Removed welcome header for cleaner Netflix-style look */}
          {renderFeaturedCarousel()}
          {renderSeriesSection('Latest Releases', latestSeries)}
          {renderSeriesSection('Recommended for You', recommendedSeries)}
          {renderSeriesSection('Popular Series', popularSeries)}
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
  scrollView: {
    flex: 1,
  },
  featuredSection: {
    marginBottom: 30,
  },
  featuredCarousel: {
    height: FEATURED_HEIGHT,
  },
  featuredCard: {
    width: screenWidth,
    height: FEATURED_HEIGHT,
    position: 'relative',
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gradientOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    borderRadius: 0,
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  featuredDescription: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 12,
  },
  featuredActions: {
    flexDirection: 'row',
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  playButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  seriesScroll: {
    paddingLeft: 20,
  },
  seriesCard: {
    width: 160,
    marginRight: 15,
  },
  seriesThumbnail: {
    width: 160,
    height: 240,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderThumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  seriesTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  seriesGenre: {
    color: '#6B7280',
    fontSize: 12,
  },
  brandHeader: {
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    borderBottomWidth: 0.5,
    borderBottomColor: '#1F2937',
    backgroundColor: '#000',
    paddingHorizontal: 12,
  },
  brandText: {
    color: '#FFD700',
    fontSize: 24,
    fontFamily: 'serif',
    fontWeight: '700',
    marginLeft: 10,
  },
  logo: {
    width: 48,
    height: 48,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff6b00',
    marginHorizontal: 4,
  },
}); 