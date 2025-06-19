import React, { useContext, useState } from 'react';
import { View, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import { Text, Button, Card, Title, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { AuthContext } from './_layout';
import { supabase } from '@pitara/supabase';
import { usePlans } from '@pitara/hooks';

// Helper to derive interval label from period_days
const getIntervalLabel = (days: number) => {
  if (days === 30) return 'month';
  if (days === 365) return 'year';
  return `${days} days`;
};

export default function SubscriptionScreen() {
  const { session } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const router = useRouter();

  const { data: plans, loading: plansLoading, error: plansError } = usePlans();

  const handleSubscribe = async () => {
    if (!selectedPlan) {
      Alert.alert('Select Plan', 'Please select a subscription plan first.');
      return;
    }

    if (!session?.user) {
      Alert.alert('Authentication Required', 'Please login before subscribing.');
      return;
    }

    try {
      setLoading(true);
      const plan = plans.find(p => p.id === selectedPlan);
      
      // Call our subscription-create edge function to handle the subscription
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/subscription-create`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            user_id: session.user.id,
            price_id: (plan as any)?.stripe_price_id || (plan as any)?.price_id || plan?.id,
          }),
        }
      );

      const result = await response.json();
      
      if (response.ok && result.subscription) {
        Alert.alert(
          'Subscription Created',
          'Your subscription has been successfully created! You now have access to all content.',
          [{ text: 'Start Watching', onPress: () => router.replace('/(tabs)') }]
        );
      } else {
        throw new Error(result.error || 'Failed to create subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      Alert.alert('Error', 'Failed to create subscription. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Image
          source={require('../assets/Assets/pitaralogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.title}>Subscribe to Pitara</Text>
        <Text style={styles.subtitle}>Get unlimited access to all content</Text>
      </View>

      {/* Loading state */}
      {plansLoading && (
        <View style={{ paddingVertical: 40 }}>
          <ActivityIndicator size="large" color="#ff6b00" />
        </View>
      )}

      {/* Error state */}
      {plansError && (
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 16 }}>
          {plansError}
        </Text>
      )}

      {/* Plans list */}
      {plans.map((plan: any) => (
        <Card
          key={plan.id}
          style={[
            styles.planCard,
            selectedPlan === plan.id && styles.selectedPlan,
            plan.popular && styles.popularPlan,
          ]}
          onPress={() => setSelectedPlan(plan.id)}
        >
          {plan.popular && (
            <View style={styles.popularTag}>
              <Text style={styles.popularTagText}>BEST VALUE</Text>
            </View>
          )}
          <Card.Content>
            <Title style={styles.planName}>{plan.name}</Title>
            <View style={styles.priceContainer}>
              <Text style={styles.planPrice}>₹{plan.price}</Text>
              <Text style={styles.planInterval}>/{getIntervalLabel(plan.period_days)}</Text>
            </View>
            
            <View style={styles.featuresContainer}>
              {(plan.features || []).map((feature: string, index: number) => (
                <View key={index} style={styles.featureRow}>
                  <Text style={styles.featureText}>✓ {feature}</Text>
                </View>
              ))}
            </View>
          </Card.Content>
        </Card>
      ))}

      <Button
        mode="contained"
        onPress={handleSubscribe}
        loading={loading}
        disabled={loading || !selectedPlan}
        style={styles.subscribeButton}
      >
        {loading ? 'Processing...' : 'Subscribe Now'}
      </Button>

      <Text style={styles.termsText}>
        By subscribing, you agree to our Terms of Service and Privacy Policy.
        You can cancel your subscription anytime.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 24,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#fff',
  },
  subtitle: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
    color: '#ccc',
  },
  planCard: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    backgroundColor: '#111',
  },
  selectedPlan: {
    borderWidth: 2,
    borderColor: '#ff6b00',
  },
  popularPlan: {
    borderWidth: 2,
    borderColor: '#ff6b00',
  },
  popularTag: {
    backgroundColor: '#ff6b00',
    padding: 6,
    alignItems: 'center',
  },
  popularTagText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginVertical: 8,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b00',
  },
  planInterval: {
    fontSize: 16,
    opacity: 0.8,
    marginLeft: 4,
    color: '#ccc',
  },
  featuresContainer: {
    marginTop: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  featureText: {
    fontSize: 14,
    color: '#fff',
  },
  subscribeButton: {
    paddingVertical: 8,
    marginVertical: 24,
    backgroundColor: '#ff6b00',
  },
  termsText: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.8,
    marginBottom: 32,
    color: '#ccc',
  },
}); 