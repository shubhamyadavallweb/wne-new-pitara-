import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth, useSubscription, useDownloads } from '@pitara/hooks';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { supabase } from '@pitara/supabase';
import { Animated } from 'react-native';

export default function Profile() {
  const { user, signOut } = useAuth();
  const { subscription, isSubscribed, subscriptionTier } = useSubscription();
  const { downloads, clearAllDownloads } = useDownloads();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [userName, setUserName] = useState(user?.user_metadata?.full_name || 'User');
  const [userEmail, setUserEmail] = useState(user?.email || '');
  const [downloadQuality, setDownloadQuality] = useState('1080p');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2000);
  };

  const handleSaveProfile = async () => {
    try {
      if (user) {
        await supabase.auth.updateUser({ data: { full_name: userName } });
      }
      await AsyncStorage.setItem('@pitara_user_name', userName);
      await AsyncStorage.setItem('@pitara_download_quality', downloadQuality);
      setIsEditingProfile(false);
      showToast('Profile saved');
    } catch (error) {
      console.error('handleSaveProfile error', error);
      showToast('Failed to save profile');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // Logout successful, navigate to login screen
      router.replace('/(auth)/google');
      showToast('Signed out');
    } catch (error) {
      showToast('Failed to sign out');
    }
  };

  const cycleDownloadQuality = () => {
    const qualities = ['360p', '480p', '720p', '1080p', '4K'];
    const currentIndex = qualities.indexOf(downloadQuality);
    const nextIndex = (currentIndex + 1) % qualities.length;
    const newQuality = qualities[nextIndex];
    setDownloadQuality(newQuality);
    AsyncStorage.setItem('@pitara_download_quality', newQuality);
    showToast(`Download quality: ${newQuality}`);
  };

  const navigateToSubscription = () => {
    router.push('/subscription');
  };

  const navigateToSubscriptionHistory = () => {
    router.push('/purchase-history');
  };

  const settingsOptions = [
    {
      id: 'account',
      title: 'Account Settings',
      description: 'Manage your account details',
      icon: 'person-outline' as const,
      action: () => setIsEditingProfile(true)
    },
    {
      id: 'subscription',
      title: 'Subscription',
      description: isSubscribed ? `${subscriptionTier} Plan` : 'No active subscription',
      icon: 'card-outline' as const,
      action: navigateToSubscription
    },
    {
      id: 'history',
      title: 'Purchase History',
      description: 'View your past transactions',
      icon: 'time-outline' as const,
      action: navigateToSubscriptionHistory
    },
    {
      id: 'downloads',
      title: 'Download Quality',
      description: `${downloadQuality} (Current)`,
      icon: 'download-outline' as const,
      action: cycleDownloadQuality
    },
    {
      id: 'clearDownloads',
      title: 'Clear Downloads',
      description: `${downloads.length} downloaded episodes`,
      icon: 'trash-outline' as const,
      action: () =>
        setConfirmDialog({
          title: 'Clear Downloads',
          message: 'Delete all downloaded episodes?',
          onConfirm: async () => {
            await clearAllDownloads();
            showToast('Downloads cleared');
          },
        }),
    },
    {
      id: 'logout',
      title: 'Sign Out',
      description: 'Sign out of your account',
      icon: 'log-out-outline' as const,
      action: () =>
        setConfirmDialog({
          title: 'Sign Out',
          message: 'Are you sure you want to sign out?',
          onConfirm: handleLogout,
        }),
      danger: true
    }
  ];

  if (isEditingProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setIsEditingProfile(false)}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>
        
        <ScrollView style={styles.content}>
          <View style={styles.profileImageSection}>
            <View style={styles.profileImageContainer}>
              <Image
                source={{ 
                  uri: user?.user_metadata?.avatar_url || 
                       'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
                }}
                style={styles.profileImage}
              />
              <TouchableOpacity style={styles.cameraButton}>
                <Ionicons name="camera" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                value={userName}
                onChangeText={setUserName}
                style={styles.textInput}
                placeholder="Enter your name"
                placeholderTextColor="#6B7280"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={userEmail}
                onChangeText={setUserEmail}
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                editable={false}
              />
            </View>

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Confirm Dialog */}
      {confirmDialog && (
        <Modal
          transparent
          animationType="fade"
          visible={true}
          onRequestClose={() => setConfirmDialog(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{confirmDialog.title}</Text>
              <Text style={styles.modalMessage}>{confirmDialog.message}</Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#374151' }]}
                  onPress={() => setConfirmDialog(null)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: '#EF4444' }]}
                  onPress={() => {
                    confirmDialog.onConfirm();
                    setConfirmDialog(null);
                  }}
                >
                  <Text style={styles.modalButtonText}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
      {/* Toast */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Image
            source={{ 
              uri: user?.user_metadata?.avatar_url || 
                   'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
            }}
            style={styles.profileImage}
          />
          <Text style={styles.profileName}>{userName}</Text>
          <Text style={styles.profileEmail}>{userEmail}</Text>
          
          {isSubscribed && (
            <View style={styles.subscriptionBadge}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.subscriptionText}>{subscriptionTier} Member</Text>
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{downloads.length}</Text>
            <Text style={styles.statLabel}>Downloads</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Watchlist</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Hours Watched</Text>
          </View>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsSection}>
          {settingsOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[styles.settingItem, option.danger && styles.dangerItem]}
              onPress={option.action}
            >
              <View style={styles.settingIcon}>
                <Ionicons 
                  name={option.icon as any} 
                  size={24} 
                  color={option.danger ? "#EF4444" : "#3B82F6"} 
                />
              </View>
              <View style={styles.settingContent}>
                <Text style={[styles.settingTitle, option.danger && styles.dangerText]}>
                  {option.title}
                </Text>
                <Text style={styles.settingDescription}>
                  {option.description}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6B7280" />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 20,
  },
  profileImageSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileImageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#3B82F6',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  profileEmail: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 12,
  },
  subscriptionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  subscriptionText: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  statsSection: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    marginHorizontal: 20,
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 14,
  },
  settingsSection: {
    paddingHorizontal: 20,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  dangerItem: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  dangerText: {
    color: '#EF4444',
  },
  settingDescription: {
    color: '#6B7280',
    fontSize: 14,
  },
  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 16,
    color: '#fff',
    fontSize: 16,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  toastContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    backgroundColor: '#111827',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  toastText: {
    color: '#fff',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#1F2937',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  modalMessage: {
    color: '#9CA3AF',
    fontSize: 14,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 12,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
}); 