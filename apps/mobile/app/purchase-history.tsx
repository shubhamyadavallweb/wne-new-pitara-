import React, { useMemo, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useNavigation } from 'expo-router';
import { useAuth, usePaymentMonitor, useSubscription, usePlans } from '@pitara/hooks';

export default function PurchaseHistoryScreen() {
  const { user } = useAuth();
  const { payments, loading, error } = usePaymentMonitor();

  // Current subscription data
  const { subscription, loading: subLoading, isSubscribed, subscriptionTier, subscriptionEnd } = useSubscription();
  const { data: plans } = usePlans();

  // Set up native header once (only one back arrow)
  const navigation = useNavigation();
  useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Purchase History',
      headerStyle: { backgroundColor: '#000' },
      headerTintColor: '#fff',
    });
  }, [navigation]);

  const userPayments = useMemo(() => {
    if (!user) return [];
    return payments.filter(
      (p) => p.user_email?.toLowerCase() === user?.email?.toLowerCase()
    );
  }, [payments, user]);

  const renderItem = ({ item }: { item: any }) => (
    <View style={styles.itemContainer}>
      <Ionicons name="card" size={24} color="#3B82F6" style={{ marginRight: 12 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.itemTitle}>{item.plan_id}</Text>
        <Text style={styles.itemSubtitle}>{
          new Date(item.created_at).toLocaleDateString()
        }</Text>
      </View>
      <Text style={styles.itemAmount}>₹{item.amount}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        ListHeaderComponent={() => (
          <>
            {/* Current Plan Section */}
            <Text style={styles.sectionTitle}>Current Plan</Text>
            {subLoading ? (
              <View style={styles.center}>
                <ActivityIndicator size="small" color="#ff6b00" />
              </View>
            ) : isSubscribed ? (
              <View style={styles.currentPlanCard}>
                <Text style={styles.planName}>{
                  plans.find((p) => p.id === subscriptionTier)?.name || subscriptionTier
                }</Text>
                <Text style={styles.planExpiry}>Expires on {new Date(subscriptionEnd!).toLocaleDateString()}</Text>
              </View>
            ) : (
              <View style={styles.currentPlanCard}>
                <Text style={styles.noPlanText}>No active subscription</Text>
              </View>
            )}

            {/* Purchase History Section Header */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Purchase History</Text>
          </>
        )}
        data={userPayments}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
        ListEmptyComponent={loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>Loading payments...</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.center}>
            <Ionicons name="time" size={48} color="#6B7280" />
            <Text style={styles.emptyText}>No purchase history found.</Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  currentPlanCard: {
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  planName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  planExpiry: {
    color: '#ccc',
    fontSize: 14,
  },
  noPlanText: {
    color: '#6B7280',
    fontSize: 14,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#6B7280',
    marginTop: 8,
  },
  errorText: {
    color: '#EF4444',
  },
  emptyText: {
    color: '#6B7280',
    marginTop: 8,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  itemTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  itemSubtitle: {
    color: '#6B7280',
    fontSize: 14,
  },
  itemAmount: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: '600',
  },
}); 