import ChatInput from "@/components/chat/ChatInput";
import Conversation from "@/components/chat/Conversation";
import { ScreenHeader, HeaderBackButton } from "@/components/ui/ScreenHeader";
import { icons } from "@/constants/icons";
import { SPACING, TYPOGRAPHY, ICON_SIZES } from "@/constants/designTokens";
import { useCall } from "@/context/CallContext";
import { getAgoraCallToken, blockUser, unblockUser, reportUser } from "@/lib/api";
import { useChat } from "@/hooks/useSupabaseMessaging";
import { getOrCreateDirectConversation, Message } from "@/services/supabaseMessaging";
import { getCurrentUserId, IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { PlatformIcon } from "@/components/ui";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActionSheetIOS, ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ChatDetail() {
  const { userid: peerId, name, image, online, time } = useLocalSearchParams<{ userid: string, name: string, image: string, online: string, time: string }>();
  const router = useRouter();
  const [callerId, setCallerId] = useState<string | null>(null);
  const { sendInvitation } = useCall();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [visible, setVisible] = useState(false);

  const [isBlocked, setIsBlocked] = useState(false); // track block state
  const [reportReason, setReportReason] = useState(""); // reason typed by user

  // Use Supabase messaging hooks when conversation is ready
  const {
    messages: chatMessages,
    loading: messagesLoading,
    sendMessage: sendChatMessage,
    typingUsers,
    setTyping,
    isAnyoneTyping,
    typingText,
  } = useChat({
    conversationId: conversationId || '',
    currentUserId: callerId || '',
    displayName: name || 'User',
    initialLimit: 50,
    autoMarkAsRead: true,
  });

  // Format messages for the Conversation component
  const messages = chatMessages.map((msg: Message) => ({
    id: msg.id,
    senderId: msg.sender_id,
    content: msg.content,
    timestamp: new Date(msg.created_at).getTime(),
  }));

  const loading = initializing || messagesLoading;


  const handleUnBlockUser = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const res = await unblockUser(peerId);

      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setIsBlocked(false);
        Alert.alert("Success", "User unblocked");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", res.msg || "Failed to unblock user");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const handleBlockUser = async (targetPeerId: string, setBlockedState: Function, currentlyBlocked: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const res = await blockUser(targetPeerId);

      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setBlockedState(true);
        Alert.alert("Success", "User blocked");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", res.msg || "Failed to block user");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const blankReport = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Error", "Please enter a reason for reporting");
    return;
  };

  const handleReportUser = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    try {
      const res = await reportUser(peerId, reportReason);

      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setReportReason("");
        setVisible(false);
        Alert.alert("Success", "User reported successfully");
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", res.msg || "Failed to report user");
      }
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  // Native iOS ActionSheet for user options
  const showUserOptionsActionSheet = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Cancel", isBlocked ? "Unblock User" : "Block User", "Report User"],
          destructiveButtonIndex: 1,
          cancelButtonIndex: 0,
          title: "User Options",
          message: "Choose an action for this user",
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            // Block/Unblock
            if (isBlocked) {
              handleUnBlockUser();
            } else {
              handleBlockUser(peerId, setIsBlocked, isBlocked);
            }
          } else if (buttonIndex === 2) {
            // Report - show modal for reason input
            setVisible(true);
          }
        }
      );
    } else {
      // Show modal for Android
      setVisible(true);
    }
  };


  // Initialize conversation with Supabase
  useEffect(() => {
    if (!peerId) return;

    let mounted = true;

    const initConversation = async () => {
      try {
        setInitializing(true);

        // Get current user ID
        const id: any = await getCurrentUserId();
        if (!id) {
          console.error("No user ID found");
          return;
        }

        if (!mounted) return;
        setCallerId(id);

        // Get or create conversation with this user
        const convId = await getOrCreateDirectConversation(id, peerId);

        if (!mounted) return;
        setConversationId(convId);
        console.log(`[Chat] Conversation initialized: ${convId}`);
      } catch (error) {
        console.error("Error initializing conversation:", error);
        Alert.alert("Error", "Failed to load conversation");
      } finally {
        if (mounted) {
          setInitializing(false);
        }
      }
    };

    initConversation();

    return () => {
      mounted = false;
    };
  }, [peerId]);

  // Send message handler
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!conversationId || !callerId || !text.trim()) return;
      try {
        // Stop typing indicator when sending
        setTyping(false);
        // Send via Supabase - the hook handles optimistic updates
        await sendChatMessage(text);
      } catch (e) {
        console.error("Failed to send message:", e);
        Alert.alert("Error", "Failed to send message");
      }
    },
    [conversationId, callerId, sendChatMessage, setTyping]
  );

  const handleVideoCall = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!callerId || !peerId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Could not identify caller or callee.");
      return;
    }
    try {
      const res = await getAgoraCallToken(callerId);
      if (!res?.success || !res?.data?.token || !res?.data?.channelName || !res?.data?.uid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", "Could not create video call. Please try again.");
        return;
      }
      const { channelName, token, uid } = res.data;
      await sendInvitation(peerId, channelName);
      router.push({
        pathname: "/videocall",
        params: {
          channel: channelName,
          token: token,
          uid: uid,
          calleeId: peerId,
        },
      });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Failed to start video call:", error);
      Alert.alert("Error", "An unexpected error occurred while starting the call.");
    }
  };

  const handleVoiceCall = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!callerId || !peerId) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", "Could not identify caller or callee.");
      return;
    }
    try {
      const res = await getAgoraCallToken(callerId);
      if (!res?.success || !res?.data?.token || !res?.data?.channelName || !res?.data?.uid) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", "Could not create voice call. Please try again.");
        return;
      }
      const { channelName, token, uid } = res.data;
      await sendInvitation(peerId, channelName, { type: "voice" });
      router.push({
        pathname: "/voicecall",
        params: {
          channel: channelName,
          token: token,
          uid: uid,
          calleeId: peerId,
        },
      });
    } catch (error) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.error("Failed to start voice call:", error);
      Alert.alert("Error", "An unexpected error occurred while starting the call.");
    }
  };

  const contact = {
    id: peerId as string,
    name: name,
    online: online === "true",
    lastSeen: time,
    image: image,
  };

  const BACKGROUND_COLORS = [
    "#F44336", // Red
    "#E91E63", // Pink
    "#9C27B0", // Purple
    "#673AB7", // Deep Purple
    "#3F51B5", // Indigo
    "#2196F3", // Blue
    "#03A9F4", // Light Blue
    "#00BCD4", // Cyan
    "#009688", // Teal
    "#4CAF50", // Green
    "#8BC34A", // Light Green
    "#FF9800", // Orange
    "#FF5722", // Deep Orange
    "#795548", // Brown
    "#607D8B", // Blue Grey
  ];

  return (
    <>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#ffffff" /> */}
      <KeyboardAvoidingView
        enabled={true}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >


        {/* Modal - iOS: Report only (Block handled by ActionSheet), Android: Full options */}
        <Modal
          transparent
          visible={visible}
          animationType="fade"
          onRequestClose={() => setVisible(false)}
          statusBarTranslucent={Platform.OS === 'android'}
        >
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setVisible(false);
                }}
                style={styles.closeButton}
              >
                <PlatformIcon name="close" size={22} color="#000" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>
                {Platform.OS === "ios" ? "Report User" : "Manage User"}
              </Text>

              {/* Block button - only show on Android (iOS uses ActionSheet) */}
              {Platform.OS !== "ios" && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => {
                  isBlocked ? handleUnBlockUser() : handleBlockUser(peerId, setIsBlocked, isBlocked)
                }}>
                  <LinearGradient
                    colors={["#B06D1E", "#F99F2D", "#B06D1E", "#F99F2D", "#B06D1E"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.actionText}>{isBlocked ? "Unblock User" : "Block User"}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              <View style={{ width: "100%", marginTop: Platform.OS === "ios" ? 0 : 10 }}>
                <TextInput
                  placeholder="Enter reason for reporting"
                  value={reportReason}
                  onChangeText={setReportReason}
                  style={{
                    borderWidth: 1,
                    borderColor: "#ccc",
                    borderRadius: 8,
                    paddingHorizontal: 10,
                    height: 40,
                    marginBottom: 10,
                    fontSize: 16, // iOS requires 16px+ to prevent zoom
                  }}
                />

                <TouchableOpacity style={styles.actionBtn}
                  onPress={() => {
                    if (reportReason) handleReportUser()
                    else blankReport()
                  }}>
                  <LinearGradient
                    colors={["#B06D1E", "#F99F2D", "#B06D1E", "#F99F2D", "#B06D1E"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBtn}
                  >
                    <Text style={styles.actionText}>Report User</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </Modal>

        <View className="flex-1 bg-background">
          <ScreenHeader
            leftContent={
              <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
                <HeaderBackButton onPress={router.back} />
                <TouchableOpacity 
                  onPress={() => router.push(`/profiles/${contact.id}`)} 
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  {contact.image ? (
                    <Image
                      source={{
                        uri: contact.image.startsWith('http')
                          ? contact.image
                          : (contact.image.startsWith('uploads/')
                              ? IMAGE_URL + contact.image
                              : VIDEO_URL + contact.image)
                      }}
                      style={{ width: ICON_SIZES.xl, height: ICON_SIZES.xl, borderRadius: 8, marginRight: SPACING.xs }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={{
                        width: ICON_SIZES.xl,
                        height: ICON_SIZES.xl,
                        borderRadius: 8,
                        marginRight: SPACING.xs,
                        justifyContent: "center",
                        alignItems: "center",
                        backgroundColor: BACKGROUND_COLORS[
                          Math.abs(
                            (contact.name || "User")
                              .split("")
                              .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                            BACKGROUND_COLORS.length
                          )
                        ],
                      }}
                    >
                      <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 10 }}>
                        {(contact.name || "User")
                          .split(" ")
                          .map((part) => part.charAt(0))
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <View>
                    <Text style={[TYPOGRAPHY.subheadline, { color: "#000" }]}>{contact.name}</Text>
                    <Text style={[TYPOGRAPHY.caption1, { color: contact.online ? "#22C55E" : "#6B7280" }]}>
                      {contact.online ? "Online" : `Last seen ${contact.lastSeen ? contact.lastSeen : 'Few sec ago'}`}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            }
            rightContent={
              <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.xs }}>
                <TouchableOpacity
                  onPress={handleVoiceCall}
                  style={{ width: ICON_SIZES.xl, height: ICON_SIZES.xl, borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#C07618" }}
                >
                  <LinearGradient
                    colors={["#B06D1E", "#F99F2D", "#B06D1E", "#F99F2D", "#B06D1E"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <PlatformIcon name="call" size={16} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleVideoCall}
                  style={{ width: ICON_SIZES.xl, height: ICON_SIZES.xl, borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#C07618" }}
                >
                  <LinearGradient
                    colors={["#B06D1E", "#F99F2D", "#B06D1E", "#F99F2D", "#B06D1E"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <PlatformIcon name="videocam" size={16} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={showUserOptionsActionSheet}
                  style={{ width: ICON_SIZES.xl, height: ICON_SIZES.xl, borderRadius: 8, overflow: "hidden", borderWidth: 1, borderColor: "#C07618" }}
                >
                  <LinearGradient
                    colors={["#B06D1E", "#F99F2D", "#B06D1E", "#F99F2D", "#B06D1E"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
                  >
                    <PlatformIcon name="more-vert" size={16} color="#ffffff" />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            }
          />

          {loading ? (
            <View className="flex-1 justify-center items-center">
              <ActivityIndicator size="large" color="#C07618" />
            </View>
          ) : callerId && (
            <Conversation
              messages={messages}
              currentUserId={callerId}
              chatUserId={peerId}
              contact={contact}
            />
          )}
          <ChatInput onSend={handleSendMessage} />

        </View>
      </KeyboardAvoidingView>
    </>
  );
}



const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // dim background
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 30,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    padding: 6,
  },
  actionBtn: {
    width: "100%",
    height: 45,
    marginVertical: 8,
    borderRadius: 10,
    overflow: "hidden",
  },
  actionText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  gradientBtn: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 20,
  },
});

