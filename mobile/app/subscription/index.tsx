import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  PlatformColor,
  useColorScheme,
  Modal,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView } from "react-native-gesture-handler";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import Toast from "react-native-toast-message";
import WebView from "react-native-webview";
import { PlatformIcon } from "@/components/ui";
import { useThemeColors } from "@/context/ThemeContext";
import { getSubscriptionPlans, createSubscriptionCheckout, createCustomerPortalSession } from "@/lib/api";
import LinearBg from "@/components/LinearBg";

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string | null;
  price_monthly: number;
  price_yearly: number;
  features: Record<string, boolean | number | string> | null;
  is_popular: boolean;
}

interface UserSubscription {
  tier: string;
  plan_id: string | null;
  expires_at: string | null;
  status: string | null;
}

export default function SubscriptionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [selectedInterval, setSelectedInterval] = useState<"monthly" | "yearly">("monthly");
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [showWebView, setShowWebView] = useState(false);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);

  const themedColors = useMemo(() => ({
    background: Platform.OS === 'ios' ? (PlatformColor('systemBackground') as unknown as string) : colors.background,
    secondaryBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : colors.surfaceContainer,
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    border: Platform.OS === 'ios' ? (PlatformColor('separator') as unknown as string) : colors.outline,
    cardBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : (isDark ? '#1C1C1E' : '#FFFFFF'),
  }), [isDark, colors]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getSubscriptionPlans();
      if (res?.success) {
        setPlans(res.data?.plans || []);
        setCurrentSubscription(res.data?.currentSubscription || null);
      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to load subscription plans",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
        });
      }
    } catch (error) {
      console.error("Error fetching subscription plans:", error);
      Toast.show({
        type: "error",
        text1: "Failed to load subscription plans",
        position: "bottom",
        visibilityTime: 2000,
        bottomOffset: 100,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setProcessingPlan(planId);
    
    try {
      const res = await createSubscriptionCheckout(planId, selectedInterval);
      if (res?.success && res.data?.url) {
        setCheckoutUrl(res.data.url);
        setShowWebView(true);
      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to create checkout session",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
        });
      }
    } catch (error) {
      console.error("Error creating checkout:", error);
      Toast.show({
        type: "error",
        text1: "Failed to create checkout session",
        position: "bottom",
        visibilityTime: 2000,
        bottomOffset: 100,
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleManageSubscription = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const res = await createCustomerPortalSession();
      if (res?.success && res.data?.url) {
        // Open in external browser for better UX
        Linking.openURL(res.data.url);
      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to open subscription management",
          position: "bottom",
          visibilityTime: 2000,
          bottomOffset: 100,
        });
      }
    } catch (error) {
      console.error("Error opening customer portal:", error);
      Toast.show({
        type: "error",
        text1: "Failed to open subscription management",
        position: "bottom",
        visibilityTime: 2000,
        bottomOffset: 100,
      });
    }
  };

  const handleWebViewNavigationStateChange = (navState: { url: string }) => {
    // Check if we've been redirected to success or cancel URL
    if (navState.url.includes("/subscription?success=true") || navState.url.includes("success=true")) {
      setShowWebView(false);
      setCheckoutUrl(null);
      Toast.show({
        type: "success",
        text1: "Subscription activated!",
        text2: "Welcome to Premium",
        position: "bottom",
        visibilityTime: 3000,
        bottomOffset: 100,
      });
      fetchData(); // Refresh subscription status
    } else if (navState.url.includes("/subscription?canceled=true") || navState.url.includes("canceled=true")) {
      setShowWebView(false);
      setCheckoutUrl(null);
      Toast.show({
        type: "info",
        text1: "Checkout canceled",
        position: "bottom",
        visibilityTime: 2000,
        bottomOffset: 100,
      });
    }
  };

  const getFeaturesList = (features: Record<string, boolean | number | string> | null) => {
    if (!features) return [];
    
    const featureLabels: Record<string, string> = {
      unlimited_likes: "Unlimited Likes",
      unlimited_rewinds: "Unlimited Rewinds",
      superlikes_per_day: "Super Likes/day",
      see_who_likes_you: "See Who Likes You",
      priority_likes: "Priority Likes",
      read_receipts: "Read Receipts",
      boost_per_month: "Monthly Boosts",
      hide_ads: "Ad-Free Experience",
      advanced_filters: "Advanced Filters",
      incognito_mode: "Incognito Mode",
    };

    return Object.entries(features)
      .filter(([, value]) => value !== false && value !== 0)
      .map(([key, value]) => ({
        label: featureLabels[key] || key.replace(/_/g, " "),
        value: typeof value === "number" ? value : true,
      }));
  };

  const isCurrentPlan = (planId: string) => {
    return currentSubscription?.plan_id === planId;
  };

  const isPremiumUser = currentSubscription?.tier && currentSubscription.tier !== "free";

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: themedColors.background }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: themedColors.background }} edges={['top']}>
      <Toast />
      
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: themedColors.border }}>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={{ padding: 4 }}
        >
          <PlatformIcon name="arrow-back" size={24} color={themedColors.text} />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 18, fontWeight: '600', color: themedColors.text, marginLeft: 12 }}>
          Subscription
        </Text>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {/* Current Status */}
        {isPremiumUser && (
          <View style={{ 
            backgroundColor: '#FEF3C7', 
            borderRadius: 12, 
            padding: 16, 
            marginBottom: 20,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#F59E0B', justifyContent: 'center', alignItems: 'center' }}>
              <PlatformIcon name="star" size={20} color="#FFFFFF" />
            </View>
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ fontWeight: '600', color: '#92400E', fontSize: 16 }}>
                {currentSubscription?.tier} Member
              </Text>
              {currentSubscription?.expires_at && (
                <Text style={{ color: '#B45309', fontSize: 12 }}>
                  Renews {new Date(currentSubscription.expires_at).toLocaleDateString()}
                </Text>
              )}
            </View>
            <TouchableOpacity
              onPress={handleManageSubscription}
              style={{ paddingVertical: 8, paddingHorizontal: 12, backgroundColor: '#F59E0B', borderRadius: 8 }}
            >
              <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Manage</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Interval Toggle */}
        <View style={{ flexDirection: 'row', backgroundColor: themedColors.cardBackground, borderRadius: 12, padding: 4, marginBottom: 20 }}>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedInterval("monthly");
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: selectedInterval === "monthly" ? '#F59E0B' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ 
              fontWeight: '600', 
              color: selectedInterval === "monthly" ? '#FFFFFF' : themedColors.secondaryText 
            }}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              setSelectedInterval("yearly");
            }}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 10,
              backgroundColor: selectedInterval === "yearly" ? '#F59E0B' : 'transparent',
              alignItems: 'center',
            }}
          >
            <Text style={{ 
              fontWeight: '600', 
              color: selectedInterval === "yearly" ? '#FFFFFF' : themedColors.secondaryText 
            }}>
              Yearly (Save 20%)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Plans */}
        {plans.map((plan) => {
          const features = getFeaturesList(plan.features);
          const price = selectedInterval === "monthly" ? plan.price_monthly : plan.price_yearly;
          const isCurrent = isCurrentPlan(plan.id);

          return (
            <View
              key={plan.id}
              style={{
                backgroundColor: themedColors.cardBackground,
                borderRadius: 16,
                padding: 20,
                marginBottom: 16,
                borderWidth: plan.is_popular ? 2 : 1,
                borderColor: plan.is_popular ? '#F59E0B' : themedColors.border,
              }}
            >
              {/* Popular Badge */}
              {plan.is_popular && (
                <View style={{ 
                  position: 'absolute', 
                  top: -12, 
                  alignSelf: 'center',
                  backgroundColor: '#F59E0B',
                  paddingHorizontal: 16,
                  paddingVertical: 4,
                  borderRadius: 12,
                }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: '600', fontSize: 12 }}>Most Popular</Text>
                </View>
              )}

              <Text style={{ fontSize: 20, fontWeight: '700', color: themedColors.text, marginTop: plan.is_popular ? 8 : 0 }}>
                {plan.name}
              </Text>
              
              {plan.description && (
                <Text style={{ color: themedColors.secondaryText, marginTop: 4 }}>
                  {plan.description}
                </Text>
              )}

              {/* Price */}
              <View style={{ flexDirection: 'row', alignItems: 'baseline', marginTop: 16 }}>
                <Text style={{ fontSize: 36, fontWeight: '700', color: themedColors.text }}>
                  ${price.toFixed(2)}
                </Text>
                <Text style={{ color: themedColors.secondaryText, marginLeft: 4 }}>
                  /{selectedInterval === "monthly" ? "month" : "year"}
                </Text>
              </View>

              {/* Features */}
              <View style={{ marginTop: 16 }}>
                {features.map((feature, index) => (
                  <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <PlatformIcon name="check-circle" size={18} color="#10B981" />
                    <Text style={{ marginLeft: 8, color: themedColors.text }}>
                      {typeof feature.value === "number" ? `${feature.value} ${feature.label}` : feature.label}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Action Button */}
              {isCurrent ? (
                <View style={{ 
                  marginTop: 16, 
                  paddingVertical: 14, 
                  backgroundColor: '#E5E7EB', 
                  borderRadius: 12, 
                  alignItems: 'center' 
                }}>
                  <Text style={{ fontWeight: '600', color: '#6B7280' }}>Current Plan</Text>
                </View>
              ) : (
                <TouchableOpacity
                  onPress={() => handleSubscribe(plan.id)}
                  disabled={processingPlan === plan.id}
                  style={{ marginTop: 16, borderRadius: 12, overflow: 'hidden' }}
                >
                  <LinearBg style={{ paddingVertical: 14, alignItems: 'center' }}>
                    {processingPlan === plan.id ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text style={{ fontWeight: '600', color: '#FFFFFF', fontSize: 16 }}>
                        {isPremiumUser ? "Switch Plan" : "Subscribe Now"}
                      </Text>
                    )}
                  </LinearBg>
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        {/* Free Tier Info */}
        {!isPremiumUser && (
          <View style={{ padding: 16, backgroundColor: themedColors.cardBackground, borderRadius: 12, marginTop: 8 }}>
            <Text style={{ color: themedColors.secondaryText, textAlign: 'center', fontSize: 13 }}>
              You're currently on the free plan. Upgrade to unlock premium features!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Stripe Checkout WebView Modal */}
      <Modal
        visible={showWebView}
        animationType="slide"
        onRequestClose={() => {
          setShowWebView(false);
          setCheckoutUrl(null);
        }}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: themedColors.background }}>
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            paddingHorizontal: 16, 
            paddingVertical: 12, 
            borderBottomWidth: 1, 
            borderBottomColor: themedColors.border 
          }}>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowWebView(false);
                setCheckoutUrl(null);
              }}
              style={{ padding: 4 }}
            >
              <PlatformIcon name="close" size={24} color={themedColors.text} />
            </TouchableOpacity>
            <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: themedColors.text, marginLeft: 12 }}>
              Complete Your Purchase
            </Text>
          </View>
          
          {checkoutUrl && (
            <WebView
              source={{ uri: checkoutUrl }}
              onNavigationStateChange={handleWebViewNavigationStateChange}
              startInLoadingState
              renderLoading={() => (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#F59E0B" />
                </View>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
