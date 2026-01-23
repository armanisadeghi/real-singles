import ChatInput from "@/components/chat/ChatInput";
import Conversation from "@/components/chat/Conversation";
import { icons } from "@/constants/icons";
import { useCall } from "@/context/CallContext";
import { getAgoraCallToken, getAgoraChatToken } from "@/lib/api";
import { getUserHistoryMessages, initChat, isChatInitialized, isChatLoggedIn, loginToChat, sendMessage as sendAgoraMessage, setupMessageListener } from "@/services/agoraChatServices";
import { getCurrentUserId, getToken, IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { Ionicons } from "@expo/vector-icons";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, Platform, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";

export default function ChatDetail() {
  const { userid: peerId, name, image, online, time } = useLocalSearchParams<{ userid: string, name: string, image: string, online: string, time: string }>();
  const router = useRouter();
  const [callerId, setCallerId] = useState<string | null>(null);
  const { sendInvitation } = useCall();
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  // const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [isBlocked, setIsBlocked] = useState(false); // track block state
  const [reportReason, setReportReason] = useState(""); // reason typed by user


  const handleUnBlockUser = async () => {
    const formData = new FormData();
    formData.append("BlockedUserID", peerId);

    try {
      const token = await getToken(); // get token from AsyncStorage
      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        return;
      }


      const res = await axios.post(
        "https://itinfonity.io/datingAPI/webservice/UnblockUser.php",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.status === 200) {
        setIsBlocked(false); // user is now unblocked
        Alert.alert("Success", "User unblocked");

      } else {
        Alert.alert("Error", "Failed to unblock user");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    }
  }

  const handleBlockUser = async (peerId: string, setIsBlocked: Function, isBlocked: boolean) => {


    const formData = new FormData();
    formData.append("BlockedUserID", peerId);

    try {
      const token = await getToken(); // get token from AsyncStorage
      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        return;
      }

      const res = await axios.post(
        "https://itinfonity.io/datingAPI/webservice/BlockUser.php",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("response in block user", res);

      if (res.status === 200) {
        setIsBlocked(true); // user is now blocked
        Alert.alert("Success", "User blocked");
      } else {
        Alert.alert("Error", "Failed to block user");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    }
  };

  const blankReport = () => {
    Alert.alert("Error", "Please enter a reason for reporting");
    return;
  }


  const handleReportUser = async () => {
    const formData = new FormData();
    formData.append("ReportedUserID", peerId);
    formData.append("Reason", reportReason);

    try {
      const token = await getToken(); // get token from AsyncStorage
      if (!token) {
        Alert.alert("Error", "Authentication token not found");
        return;
      }

      const res = await axios.post(
        "https://itinfonity.io/datingAPI/webservice/ReportUser.php",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.status === 200) {
        setReportReason(""); // clear input
        setVisible(false); // close modal
        Alert.alert("Success", "User reported successfully");

      } else {
        Alert.alert("Error", "Failed to report user");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong");
    }
  };


  // Use refs to store stable values for message listener
  const peerIdRef = useRef<string | null>(null);
  const callerIdRef = useRef<string | null>(null);
  const listenerCleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!peerId) return;

    let unsubscribed = false;
    peerIdRef.current = peerId;

    // 🔑 helper: merge new messages into state without duplicates
    const mergeMessages = (prev: any[], incoming: any[]) => {
      const result = [...prev];
      for (const msg of incoming) {
        const existingIndex = result.findIndex(
          (m) =>
            m.id === msg.id || // exact match
            (m.senderId === msg.senderId &&
              m.content === msg.content &&
              Math.abs(m.timestamp - msg.timestamp) < 10000) // same text within 10s
        );
        if (existingIndex !== -1) {
          // Replace local copy with server one
          result[existingIndex] = msg;
        } else {
          result.push(msg);
        }
      }
      result.sort((a, b) => a.timestamp - b.timestamp);
      return result;
    };

    const setup = async () => {
      try {
        setLoading(true);

        const id: any = await getCurrentUserId();
        if (!id) {
          console.error("No user ID found");
          return;
        }

        callerIdRef.current = id;
        setCallerId(id);

        // Only initialize and login if not already done
        if (!isChatInitialized()) {
          await initChat();
        }

        if (!isChatLoggedIn()) {
          const tokenRes = await getAgoraChatToken(id);
          await loginToChat(id, tokenRes.data.userToken);
        }

        // ---- Clean up previous listener if exists ----
        if (listenerCleanupRef.current) {
          listenerCleanupRef.current();
          listenerCleanupRef.current = null;
        }

        // ---- load history ----
        const history = await getUserHistoryMessages(peerId, 30, "");
        console.log("history==>>>>", history);

        const formattedHistory = history
          .filter((msg: any) => msg.body.type === "txt")
          .map((msg: any) => ({
            id: msg.msgId, // use server msgId
            senderId: msg.from,
            content: msg.body.content,
            timestamp: msg.serverTime || Date.now(),
          }));

        if (!unsubscribed) {
          setMessages((prev) => mergeMessages(prev, formattedHistory));
        }

        // ---- setup listener with proper cleanup ----
        const cleanup = setupMessageListener((msgs) => {
          // Use refs to get current values, avoiding stale closures
          const currentPeerId = peerIdRef.current;
          const currentCallerId = callerIdRef.current;

          if (!currentPeerId || !currentCallerId) {
            return;
          }

          const newMsgs = msgs
            .filter((msg: any) => {
              // Filter messages that belong to this conversation
              // Check both directions: incoming and outgoing
              const isIncoming = msg.from === currentPeerId && msg.to === currentCallerId;
              const isOutgoing = msg.from === currentCallerId && msg.to === currentPeerId;
              return (isIncoming || isOutgoing) && msg.body.type === "txt";
            })
            .map((msg: any) => ({
              id: msg.msgId || msg.localMsgId, // prefer server msgId
              senderId: msg.from,
              content: msg.body.content,
              timestamp: msg.serverTime || Date.now(),
            }));

          if (!unsubscribed && newMsgs.length > 0) {
            setMessages((prev) => mergeMessages(prev, newMsgs));
          }
        });

        listenerCleanupRef.current = cleanup;
      } catch (error) {
        console.error("Error in chat setup:", error);
      } finally {
        if (!unsubscribed) setLoading(false);
      }
    };

    setup();
    return () => {
      unsubscribed = true;
      // Clean up listener when component unmounts or peerId changes
      if (listenerCleanupRef.current) {
        listenerCleanupRef.current();
        listenerCleanupRef.current = null;
      }
      peerIdRef.current = null;
    };
  }, [peerId]);



  // Send message handler
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!peerId || !callerId || !text.trim()) return;
      try {
        // Send message - the listener will receive it and add it to state
        // We don't add it locally to avoid duplicates
        await sendAgoraMessage(peerId, text);
        // Optionally add optimistic update with a temporary ID
        // The listener will replace it with the actual server message
        const tempId = `temp_${Date.now()}_${Math.random()}`;
        setMessages((prev) => [
          ...prev,
          {
            id: tempId,
            senderId: callerId,
            content: text,
            timestamp: Date.now(),
          },
        ]);
      } catch (e) {
        console.error("Failed to send message:", e);
        Alert.alert("Error", "Failed to send message");
      }
    },
    [peerId, callerId]
  );

  const handleVideoCall = async () => {
    if (!callerId || !peerId) {
      Alert.alert("Error", "Could not identify caller or callee.");
      return;
    }
    try {
      const res = await getAgoraCallToken(callerId);
      if (!res?.success || !res?.data?.token || !res?.data?.channelName || !res?.data?.uid) {
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
      console.error("Failed to start video call:", error);
      Alert.alert("Error", "An unexpected error occurred while starting the call.");
    }
  };

  const handleVoiceCall = async () => {
    if (!callerId || !peerId) {
      Alert.alert("Error", "Could not identify caller or callee.");
      return;
    }
    try {
      const res = await getAgoraCallToken(callerId);
      if (!res?.success || !res?.data?.token || !res?.data?.channelName || !res?.data?.uid) {
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
        behavior={"padding"}
        style={{ flex: 1 }}
      >


        {/* Modal */}
        <Modal
          transparent
          visible={visible}
          animationType="fade"
          onRequestClose={() => setVisible(false)}
        >
          <View style={styles.overlay}>
            <View style={styles.modalContainer}>
              <TouchableOpacity
                onPress={() => setVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={22} color="#000" />
              </TouchableOpacity>

              <Text style={styles.modalTitle}>Manage User</Text>

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


              <View style={{ width: "100%", marginTop: 10 }}>
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

        <View className="flex-1 bg-backgground">
          <View
            className="bg-white flex-row justify-between items-center px-4 pt-10 pb-6 rounded-b-xl z-30"
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.1,
              shadowRadius: 16,
              elevation: 5,
              paddingTop:
                Platform.OS === "android"
                  ? (StatusBar.currentHeight || 0) + 6
                  : 60,
            }}
          >
            <View className="flex-row items-center gap-3">
              <TouchableOpacity
                onPress={router.back}
                className="border border-gray rounded-lg flex justify-center items-center w-8 h-8"
              >
                <Image
                  source={icons.back}
                  className="size-4"
                  resizeMode="contain"
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push(`/profiles/${contact.id}`)} className="flex-row items-center">
                {/* <Image
                  source={contact.image ? { uri: contact.image.startsWith('uploads/') ? IMAGE_URL + contact.image : VIDEO_URL + contact.image } : icons.ic_user}
                  className="w-8 h-8 rounded-lg mr-2"
                /> */}
                {contact.image ? (
                  <Image
                    source={{
                      uri: contact.image.startsWith('uploads/')
                        ? IMAGE_URL + contact.image
                        : VIDEO_URL + contact.image
                    }}
                    className="w-8 h-8 rounded-lg mr-2"
                    resizeMode="cover"
                  />
                ) : (
                  <View
                    className="w-8 h-8 rounded-lg mr-2 justify-center items-center"
                    style={{
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
                    <Text className="text-white font-bold text-xs">
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
                  <Text className="font-normal text-[13px] tracking-[-0.41px] text-dark">{contact.name}</Text>
                  <Text className={`text-xs ${contact.online ? 'text-green-500' : 'text-gray-500'}`}>
                    {contact.online ? "Online" : `Last seen ${contact.lastSeen ? contact.lastSeen : 'Few sec ago'}`}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
            <View className="flex-row items-center gap-2">


              <TouchableOpacity
                onPress={handleVoiceCall}
                className="border border-[#C07618] rounded-lg flex justify-center items-center w-8 h-8 overflow-hidden"
              >
                <LinearGradient
                  colors={["#B06D1E", "#F99F2D", "#B06D1E", "#F99F2D", "#B06D1E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}
                >
                  <Ionicons name="call" size={16} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleVideoCall}
                className="border border-[#C07618] rounded-lg flex justify-center items-center w-8 h-8 overflow-hidden"
              >
                <LinearGradient
                  colors={["#B06D1E", "#F99F2D", "#B06D1E", "#F99F2D", "#B06D1E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}
                >
                  <Ionicons name="videocam" size={16} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setVisible(true)}
                className="border border-[#C07618] rounded-lg flex justify-center items-center w-8 h-8 overflow-hidden"
              >
                <LinearGradient
                  colors={["#B06D1E", "#F99F2D", "#B06D1E", "#F99F2D", "#B06D1E"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1, justifyContent: "center", alignItems: "center", width: "100%", height: "100%" }}
                >
                  <Ionicons name="ellipsis-vertical" size={16} color="#ffffff" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

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

