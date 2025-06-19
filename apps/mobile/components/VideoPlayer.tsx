import React, { useState, useRef } from 'react';
import { Dimensions, StyleSheet, View, TouchableOpacity, Text, Pressable, Platform } from 'react-native';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Brightness from 'expo-brightness';
import { setStatusBarHidden } from 'expo-status-bar';
import * as NavigationBar from 'expo-navigation-bar';

interface VideoPlayerProps {
  uri: string;
  title?: string;
  thumbnail?: string; 
  isVisible?: boolean;
  onClose?: () => void;
  onProgress?: (progress: number) => void;
  startPosition?: number;
}

const { width, height } = Dimensions.get('window');

export default function CustomVideoPlayer({
  uri,
  title,
  isVisible = true,
  onClose,
  onProgress,
  startPosition = 0,
}: VideoPlayerProps) {
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});
  const [resizeMode, setResizeMode] = useState<ResizeMode>(ResizeMode.CONTAIN);
  const [volume, setVolume] = useState(1);
  const [brightness, setBrightness] = useState(1);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showBrightnessSlider, setShowBrightnessSlider] = useState(false);
  const sliderHideTimer = useRef<NodeJS.Timeout | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const controlsHideTimer = useRef<NodeJS.Timeout | null>(null);
  const [isSeeking, setIsSeeking] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);
  const wasPlayingRef = useRef(false); // remember playback state while seeking
  // Playback speed & quality states
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState<'360p' | '480p' | '720p' | '1080p'>('720p');
  const [sourceUri, setSourceUri] = useState(uri);
  const pendingSeek = useRef<number | null>(null);
  const pendingPlay = useRef<boolean>(false);

  // Initialize brightness once
  React.useEffect(() => {
    (async () => {
      try {
        const { status } = await Brightness.requestPermissionsAsync();
        if (status === 'granted') {
          const current = await Brightness.getBrightnessAsync();
          setBrightness(current);
        }
      } catch (e) {
        console.warn('Brightness permission error:', e);
      }
    })();
  }, []);

  const handleBrightnessChange = async (val: number) => {
    setBrightness(val);
    try {
      await Brightness.setBrightnessAsync(val);
    } catch (e) {
      console.warn('Failed to set brightness:', e);
    }
  };

  const handleBrightnessChangeCommit = async (val: number) => {
    try {
      await Brightness.setBrightnessAsync(val);
    } catch (e) {
      console.warn('Failed to set brightness:', e);
    }
  };

  const handleVolumeChange = async (val: number) => {
    setVolume(val);
    if (videoRef.current) {
      await videoRef.current.setStatusAsync({ volume: val, isMuted: val === 0 });
    }
  };

  const handleVolumeChangeCommit = async (val: number) => {
    if (videoRef.current) {
      await videoRef.current.setStatusAsync({ volume: val, isMuted: val === 0 });
    }
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    
    if (status.isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
    }
  };

  const cycleResizeMode = () => {
    setResizeMode((prev) => {
      switch (prev) {
        case ResizeMode.CONTAIN:
          return ResizeMode.STRETCH;
        case ResizeMode.STRETCH:
          return ResizeMode.COVER;
        default:
          return ResizeMode.CONTAIN; // COVER -> CONTAIN
      }
    });
  };

  const handlePlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    setStatus(status);
    
    // Handle resume after source change
    if (status.isLoaded && pendingSeek.current !== null && videoRef.current) {
      const seekTo = pendingSeek.current;
      pendingSeek.current = null;
      videoRef.current.setPositionAsync(seekTo).then(() => {
        if (pendingPlay.current) {
          videoRef.current?.playAsync();
        }
        pendingPlay.current = false;
      });
    }

    if (status.isLoaded && !isSeeking) {
      const value = status.durationMillis ? status.positionMillis / status.durationMillis : 0;
      setSliderValue(value);
    }

    if (status.isLoaded && onProgress) {
      const progress = status.positionMillis / status.durationMillis;
      onProgress(progress);
    }
  };

  const handleClose = async () => {
    // Revert orientation back to portrait when closing
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    if (onClose) onClose();
  };

  const hideSliders = () => {
    setShowBrightnessSlider(false);
    setShowVolumeSlider(false);
  };

  const scheduleHideSliders = () => {
    if (sliderHideTimer.current) {
      clearTimeout(sliderHideTimer.current);
    }
    sliderHideTimer.current = setTimeout(hideSliders, 1800);
  };

  const clearControlsTimer = () => {
    if (controlsHideTimer.current) {
      clearTimeout(controlsHideTimer.current);
      controlsHideTimer.current = null;
    }
  };

  const hideNavigationBar = async () => {
    if (Platform.OS === 'android') {
      try {
        await NavigationBar.setVisibilityAsync('hidden');
      } catch {}
    }
  };

  const showNavigationBar = async () => {
    if (Platform.OS === 'android') {
      try {
        await NavigationBar.setBackgroundColorAsync('#000000');
        await NavigationBar.setButtonStyleAsync('light');
        await NavigationBar.setVisibilityAsync('visible');
      } catch {}
    }
  };

  const hideControls = () => {
    setControlsVisible(false);
    hideSliders();
    setShowSettingsMenu(false);
    hideNavigationBar();
  };

  const showControls = () => {
    setControlsVisible(true);
    clearControlsTimer();
    controlsHideTimer.current = setTimeout(hideControls, 3000);
    showNavigationBar();
  };

  const skipBy = async (ms: number) => {
    if (!videoRef.current || !status.isLoaded) return;
    const newPos = Math.max(0, Math.min(status.positionMillis + ms, status.durationMillis || status.positionMillis + ms));
    await videoRef.current.setPositionAsync(newPos, status.isPlaying);
  };

  const skipForward = () => skipBy(10000);
  const skipBackward = () => skipBy(-10000);

  const handleSeekComplete = async (value: number) => {
    if (!videoRef.current || !status.isLoaded) return;
    const newPos = value * status.durationMillis;
    await videoRef.current.setPositionAsync(newPos, status.isPlaying);
    setIsSeeking(false);
  };

  React.useEffect(() => {
    return () => {
      if (sliderHideTimer.current) clearTimeout(sliderHideTimer.current);
      clearControlsTimer();
    };
  }, []);

  // Lock to landscape on mount, unlock on unmount (already handled by handleClose but backup)
  React.useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE_RIGHT);

    // Make Android navigation bar transparent & hidden while in video player
    if (Platform.OS === 'android') {
      (async () => {
        try {
          await NavigationBar.setPositionAsync('absolute');
          await NavigationBar.setBackgroundColorAsync('#000000'); // black to blend with player
          await NavigationBar.setButtonStyleAsync('light');
          await NavigationBar.setBehaviorAsync('overlay-swipe'); // allow swipe to temporarily show
          await NavigationBar.setVisibilityAsync('hidden');
        } catch (e) {
          console.warn('NavigationBar config error:', e);
        }
      })();
    }

    return () => {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

      // Reset navigation bar on Android
      if (Platform.OS === 'android') {
        (async () => {
          try {
            await NavigationBar.setVisibilityAsync('visible');
            await NavigationBar.setPositionAsync('relative');
            await NavigationBar.setBackgroundColorAsync('#000000');
          } catch (e) {}
        })();
      }
    };
  }, []);

  // Hide system status bar on mount; restore on unmount
  React.useEffect(() => {
    setStatusBarHidden(true, 'fade');

    return () => {
      setStatusBarHidden(false, 'fade');
    };
  }, []);

  // Utility to build a URI with desired quality (very naive, works for HLS or *_QUALITY.mp4 conventions)
  const buildQualityUri = React.useCallback((base: string, quality: string) => {
    // 1) If URL already has ?quality= param -> update
    if (/quality=\d+p/.test(base)) {
      return base.replace(/quality=\d+p/, `quality=${quality}`);
    }

    // 2) HLS playlist (.m3u8) → append/replace quality param
    if (base.includes('.m3u8')) {
      const [clean, query = ''] = base.split('?');
      const params = new URLSearchParams(query);
      params.set('quality', quality);
      return `${clean}?${params.toString()}`;
    }

    // 3) File-name suffix pattern: video_720p.mp4 → video_360p.mp4
    const underscoredPattern = /_(\d{3,4}p)(?=\.)/;
    if (underscoredPattern.test(base)) {
      return base.replace(underscoredPattern, quality);
    }

    // 4) Path segment pattern: /720p/ → /360p/
    const segmentPattern = /\/(\d{3,4}p)\//;
    if (segmentPattern.test(base)) {
      return base.replace(segmentPattern, `/${quality}/`);
    }

    // 5) Fallback: insert _quality before extension (video.mp4 → video_360p.mp4)
    return base.replace(/\.(\w+)$/, `_${quality}.$1`);
  }, []);

  const changePlaybackRate = async (rate: number) => {
    setPlaybackRate(rate);
    try {
      if (videoRef.current) {
        // @ts-ignore - method available in expo-av
        await videoRef.current.setRateAsync(rate, true);
      }
    } catch {
      // Fallback
      if (videoRef.current) {
        await videoRef.current.setStatusAsync({ rate, shouldCorrectPitch: true });
      }
    }
  };

  const changeResolution = async (quality: '360p' | '480p' | '720p' | '1080p') => {
    setSelectedQuality(quality);
    if (status.isLoaded) {
      pendingSeek.current = status.positionMillis;
      pendingPlay.current = status.isPlaying;
    }
    const newUri = buildQualityUri(uri, quality);
    setSourceUri(newUri);
  };

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <View style={styles.container}>
      {/* Video Player */}
      <Video
        key={sourceUri}
        ref={videoRef}
        style={styles.video}
        source={{ uri: sourceUri }}
        resizeMode={resizeMode}
        shouldPlay={true}
        isLooping={false}
        rate={playbackRate}
        positionMillis={startPosition * 1000}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={() => {
          console.warn('Failed to load selected quality, reverting');
          setSourceUri(uri);
        }}
        useNativeControls={false}
      />

      {/* Tap Overlay to toggle controls */}
      <Pressable style={StyleSheet.absoluteFill} onPress={() => (controlsVisible ? hideControls() : showControls())} />

      {/* Custom Controls Overlay */}
      {controlsVisible && (
        <>
          {/* Resize Mode Cycle Button */}
          <TouchableOpacity style={styles.resizeButton} onPress={cycleResizeMode}>
            <Ionicons
              name={
                resizeMode === ResizeMode.CONTAIN
                  ? 'resize'
                  : resizeMode === ResizeMode.STRETCH
                  ? 'resize-outline'
                  : 'crop'
              }
              size={24}
              color="#fff"
            />
          </TouchableOpacity>

          {/* Brightness Button */}
          <TouchableOpacity
            style={styles.brightnessButton}
            onPress={() => {
              setShowBrightnessSlider((prev) => !prev);
              setShowVolumeSlider(false);
              setShowSettingsMenu(false);
              showControls();
              scheduleHideSliders();
            }}
          >
            <Ionicons name="sunny" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Volume Button */}
          <TouchableOpacity
            style={styles.volumeButton}
            onPress={() => {
              setShowVolumeSlider((prev) => !prev);
              setShowBrightnessSlider(false);
              setShowSettingsMenu(false);
              showControls();
              scheduleHideSliders();
            }}
          >
            <Ionicons name="volume-high" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Settings Button */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => {
              setShowSettingsMenu((prev) => !prev);
              setShowBrightnessSlider(false);
              setShowVolumeSlider(false);
              showControls();
            }}
          >
            <Ionicons name="settings-outline" size={24} color="#fff" />
          </TouchableOpacity>

          {/* Central Play/Pause & Skip */}
          <View style={styles.playbackControls}>
            <TouchableOpacity onPress={skipBackward} style={styles.skipButton}>
              <Ionicons name="play-back" size={32} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseButton}>
              <Ionicons name={status.isPlaying ? 'pause' : 'play'} size={40} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={skipForward} style={styles.skipButton}>
              <Ionicons name="play-forward" size={32} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Progress Slider */}
          <View style={styles.progressContainer} pointerEvents="box-none">
            <Slider
              style={{ flex: 1 }}
              minimumValue={0}
              maximumValue={1}
              value={sliderValue}
              onSlidingStart={async () => {
                setIsSeeking(true);
                wasPlayingRef.current = status.isPlaying;
                if (status.isPlaying && videoRef.current) {
                  await videoRef.current.pauseAsync();
                }
                clearControlsTimer();
              }}
              onValueChange={(val) => setSliderValue(val)}
              onSlidingComplete={async (val) => {
                await handleSeekComplete(val);
                if (wasPlayingRef.current && videoRef.current) {
                  await videoRef.current.playAsync();
                }
                setIsSeeking(false);
                showControls();
              }}
              minimumTrackTintColor="#3B82F6" // brand blue
              maximumTrackTintColor="#555"
              thumbTintColor="#fff"
            />
          </View>
        </>
      )}

      {/* Brightness Slider */}
      {showBrightnessSlider && (
        <View style={styles.brightnessSliderContainer} pointerEvents="box-none">
          <Slider
            style={styles.verticalSlider}
            minimumValue={0}
            maximumValue={1}
            value={brightness}
            onValueChange={setBrightness}
            onSlidingComplete={(val) => {
              handleBrightnessChangeCommit(val);
              scheduleHideSliders();
            }}
            minimumTrackTintColor="#3B82F6"
            maximumTrackTintColor="#555"
            thumbTintColor="#fff"
          />
        </View>
      )}

      {/* Volume Slider */}
      {showVolumeSlider && (
        <View style={styles.volumeSliderContainer} pointerEvents="box-none">
          <Slider
            style={styles.verticalSlider}
            minimumValue={0}
            maximumValue={1}
            value={volume}
            onValueChange={setVolume}
            onSlidingComplete={(val) => {
              handleVolumeChangeCommit(val);
              scheduleHideSliders();
            }}
            minimumTrackTintColor="#3B82F6"
            maximumTrackTintColor="#555"
            thumbTintColor="#fff"
          />
        </View>
      )}

      {/* Settings Menu */}
      {showSettingsMenu && (
        <View style={styles.settingsMenu} pointerEvents="box-none">
          <View style={styles.menuSection}>
            <Text style={styles.menuHeading}>Speed</Text>
            <View style={styles.optionsRow}>
              {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                <TouchableOpacity
                  key={rate}
                  style={[styles.optionButton, playbackRate === rate && styles.optionSelected]}
                  onPress={() => changePlaybackRate(rate)}
                >
                  <Text style={styles.optionText}>{rate}x</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.menuSection}>
            <Text style={styles.menuHeading}>Quality</Text>
            <View style={styles.optionsRow}>
              {(['360p', '480p', '720p', '1080p'] as const).map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.optionButton, selectedQuality === q && styles.optionSelected]}
                  onPress={() => changeResolution(q)}
                >
                  <Text style={styles.optionText}>{q}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  resizeButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brightnessButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  volumeButton: {
    position: 'absolute',
    bottom: 20,
    right: 70,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsButton: {
    position: 'absolute',
    bottom: 20,
    right: 120,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brightnessSliderContainer: {
    position: 'absolute',
    left: 20,
    top: '30%',
    height: 150,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  volumeSliderContainer: {
    position: 'absolute',
    right: 20,
    top: '30%',
    height: 150,
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  verticalSlider: {
    width: 150,
    height: 40,
    transform: [{ rotate: '-90deg' }],
  },
  playbackControls: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 15,
  },
  playPauseButton: {
    marginHorizontal: 20,
  },
  skipButton: {
    marginHorizontal: 10,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 60,
    left: 40,
    right: 40,
    height: 30,
    justifyContent: 'center',
    zIndex: 15,
  },
  settingsMenu: {
    position: 'absolute',
    bottom: 120,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: 10,
    borderRadius: 8,
    zIndex: 30,
  },
  menuSection: {
    marginBottom: 8,
  },
  menuHeading: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  optionButton: {
    paddingHorizontal: 6,
    paddingVertical: 4,
    margin: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  optionSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  optionText: {
    color: '#fff',
    fontSize: 12,
  },
}); 