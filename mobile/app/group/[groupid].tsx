import ChatInput from "@/components/chat/ChatInput";
import GroupConversation from "@/components/chat/GroupConversation";
import { ScreenHeader, HeaderBackButton } from "@/components/ui/ScreenHeader";
import { icons } from "@/constants/icons";
import { SPACING, TYPOGRAPHY, ICON_SIZES } from "@/constants/designTokens";
import { fetchUserProfile } from "@/lib/api";
import {
  chatClient,
  ensureChatLogin,
  getGroupHistoryMessages,
  sendGroupMessage,
  setupMessageListener
} from "@/services/agoraChatServices";
import { getCurrentUserId, IMAGE_URL, MEDIA_BASE_URL, VIDEO_URL } from "@/utils/token";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, Text, TouchableOpacity, View } from "react-native";

export default function GroupChat() {
  const { groupid, name, image, members, createdBy } = useLocalSearchParams<{
    groupid: string,
    name?: string,
    image?: string,
    members?: string,
    createdBy?: string
  }>();

  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMembers, setShowMembers] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [chatReady, setChatReady] = useState(false);
  // ✅ NEW: Store the actual Agora group ID (different from backend ID)
  const [agoraGroupId, setAgoraGroupId] = useState<string | null>(null);

  // Parse members from params
  useEffect(() => {
    if (!members) return;
    try {
      const decoded = decodeURIComponent(members);
      const parsedMembers = JSON.parse(decoded);
      const validMembers = Array.isArray(parsedMembers)
        ? parsedMembers.filter((m) => m?.ID || m?.id || m)
        : [];

      // If members are just strings (IDs), convert to objects
      const formattedMembers = validMembers.map(member => {
        if (typeof member === 'string') {
          return { ID: member, Username: member, Email: '' };
        }
        return member;
      });

      // ✅ Remove duplicates based on ID
      const uniqueMembers = formattedMembers.filter((member, index, self) => {
        const memberId = member.ID || member.id;
        return index === self.findIndex((m) => (m.ID || m.id) === memberId);
      });

      setGroupMembers(uniqueMembers);
      console.log("✅ Group members parsed (unique):", uniqueMembers.length);

    } catch (e) {
      console.log("❌ Error parsing members", e);
      setGroupMembers([]);
    }
  }, [members]);

  // ✅ FIXED: Main chat setup useEffect
  useEffect(() => {
    let isMounted = true;
    let removeListener: (() => void) | undefined;
    const idToName: Record<string, string> = {};
    // ✅ Local variable to track actual Agora group ID within this effect
    let effectiveGroupId: string = groupid;

    const setupGroupChat = async () => {
      try {
        const id = await getCurrentUserId();
        console.log("🔄 Setting up group chat...");
        console.log("Group ID:", groupid);
        console.log("Current User ID:", id);

        if (!id || !groupid || typeof groupid !== 'string') {
          console.log("❌ Invalid group ID or user ID");
          setLoading(false);
          return;
        }

        setUserId(id);

        // ✅ 1. Ensure user is logged in to Agora
        console.log("Step 1: Logging in to Agora...");
        await ensureChatLogin(id);
        console.log("✅ Agora login successful");

        // ✅ 2. Check if group exists in Agora
        console.log("Step 2: Checking group status...");
        let isMember = false;
        let groupExists = false;

        try {
          // Try to fetch group info
          const groupInfo = await chatClient.groupManager.fetchGroupInfoFromServer(groupid);
          if (groupInfo) {
            groupExists = true;
            effectiveGroupId = groupInfo.groupId; // ✅ Use Agora's actual group ID
            console.log("✅ Group found in Agora:", groupInfo.groupName, "ID:", effectiveGroupId);

            // ✅ Store the actual Agora group ID
            setAgoraGroupId(effectiveGroupId);

            // Check if user is already a member
            const joinedGroups = await chatClient.groupManager.getJoinedGroups();
            isMember = joinedGroups.some(g => g.groupId === effectiveGroupId);
            console.log("User is member:", isMember);
          }

        } catch (error: any) {
          // Group not found in Agora (code 600)
          if (error?.code === 600) {
            console.log("❌ Group NOT FOUND in Agora by ID:", groupid);

            // ✅ FALLBACK: Check if we are already in a group with this NAME
            // (Since backend ID != Agora ID, we might be in it but lookup failed)
            let foundViaFallback = false;
            try {
              const joined = await chatClient.groupManager.getJoinedGroups();
              const targetName = (name || `Group ${groupid}`).trim();
              const match = joined.find((g: any) => g.groupName === targetName);

              if (match) {
                console.log("✅ Found group via Name Fallback:", match.groupId);
                effectiveGroupId = match.groupId;
                setAgoraGroupId(effectiveGroupId);
                groupExists = true;
                isMember = true;
                foundViaFallback = true;
              }
            } catch (fbErr) { console.warn("Fallback check failed", fbErr); }

            if (!foundViaFallback) {
              console.log("❌ Group not found in joined list, creating it...");
              // ✅ CREATE GROUP IN AGORA
              try {
                // Prepare member IDs from groupMembers state
                const memberIds = groupMembers
                  .map((m: any) => (m.ID || m.id)?.toString())
                  .filter(Boolean);

                // Make sure current user is included
                if (!memberIds.includes(id)) {
                  memberIds.push(id);
                }

                // Remove duplicates
                const uniqueMemberIds = [...new Set(memberIds)];

                // Filter out owner from members (owner is added automatically)
                const membersWithoutOwner = uniqueMemberIds.filter((mId: string) => mId !== id);

                console.log("Creating group with:", {
                  groupId: groupid,
                  groupName: name || `Group ${groupid}`,
                  owner: id,
                  members: membersWithoutOwner
                });

                // ✅ FIXED: Use correct SDK method signature
                // createGroup(options, groupName, desc, inviteMembers, inviteReason)
                const { ChatGroupOptions, ChatGroupStyle } = require("react-native-agora-chat");

                const groupOptions = new ChatGroupOptions({
                  style: ChatGroupStyle.PublicOpenJoin,
                  maxCount: 200,
                  inviteNeedConfirm: false,
                });

                const result = await chatClient.groupManager.createGroup(
                  groupOptions,
                  (name || `Group ${groupid}`).trim(),
                  `Group chat: ${name || groupid}`,
                  membersWithoutOwner,
                  "Welcome to the group"
                );
                console.log("✅ Group created in Agora:", result.groupId);

                // ✅ Use Agora's actual group ID  
                effectiveGroupId = result.groupId;
                setAgoraGroupId(effectiveGroupId);

                groupExists = true;
                isMember = true; // Creator is automatically a member

                // Add other members
                if (membersWithoutOwner.length > 0) {
                  try {
                    await chatClient.groupManager.addMembers(
                      result.groupId || groupid,
                      membersWithoutOwner
                    );
                    console.log(`✅ Added ${membersWithoutOwner.length} members`);
                  } catch (addError) {
                    console.warn("⚠️ Could not add some members:", addError);
                  }
                }

              } catch (createError: any) {
                // If group already exists (race condition)
                if (createError?.code === 602) {
                  console.log("ℹ️ Group already exists, joining...");
                  try {
                    await chatClient.groupManager.joinPublicGroup(groupid);
                    groupExists = true;
                    isMember = true;
                  } catch (joinErr) {
                    console.log("Could not join:", joinErr);
                  }
                } else {
                  console.error("❌ Failed to create group:", createError);
                  if (isMounted) {
                    Alert.alert(
                      "Error",
                      "Failed to set up group chat. Please try again.",
                      [{ text: "OK" }]
                    );
                    setLoading(false);
                    return;
                  }
                }
              }
            } // Close if (!foundViaFallback)
          } else {
            console.error("Error checking group:", error);
          }
        }

        // ✅ 3. If group exists but user is not member, try to join
        if (groupExists && !isMember) {
          console.log("Step 3: User not in group, trying to join...");

          try {
            // First check if user is the creator (from params)
            const isCreator = createdBy === id;

            if (isCreator) {
              console.log("👑 User is creator, adding to group...");
              // Creator should be added automatically when group was created
              // Try to join as normal user
              // Try to join as normal user
              await chatClient.groupManager.joinPublicGroup(effectiveGroupId);
              console.log("✅ Creator joined group");
              isMember = true;
            } else {
              // For regular users, try to join public group
              // For regular users, try to join public group
              await chatClient.groupManager.joinPublicGroup(effectiveGroupId);
              console.log("✅ User joined group");
              isMember = true;
            }
          } catch (joinError: any) {
            console.warn("⚠️ Could not join group:", joinError);

            // If group is private, show message
            if (joinError?.code === 606) {
              Alert.alert(
                "Private Group",
                "This is a private group. Ask the admin to invite you.",
                [{ text: "OK" }]
              );
              setLoading(false);
              return;
            }
          }
        }

        // ✅ 4. If still not member, show error
        if (!isMember) {
          console.log("❌ User could not join group");
          Alert.alert(
            "Cannot Join Group",
            "You are not a member of this group. Ask admin to add you.",
            [{ text: "OK" }]
          );
          setLoading(false);
          return;
        }

        // ✅ 5. Fetch message history using actual Agora group ID
        console.log("Step 4: Fetching messages for Agora group:", effectiveGroupId);
        const history = await getGroupHistoryMessages(effectiveGroupId, 50, "");
        console.log("✅ Messages fetched:", history.length);

        // ✅ 6. Fetch sender display names
        const senderIds = Array.from(
          new Set(history.filter((msg: any) => msg.body.type === "txt")
            .map((msg: any) => msg.from))
        );

        console.log("Fetching profiles for:", senderIds.length, "senders");
        await Promise.all(senderIds.map(async (senderId: any) => {
          try {
            const res = await fetchUserProfile(senderId);
            idToName[senderId] = res?.data?.DisplayName || senderId;
          } catch {
            idToName[senderId] = senderId;
          }
        }));

        if (!isMounted) return;

        // ✅ 7. Set messages in state
        const formattedMessages = history
          .filter((msg: any) => msg.body.type === "txt")
          .map((msg: any) => ({
            id: msg.msgId || `local_${msg.localMsgId}`,
            senderId: msg.from,
            senderName: idToName[msg.from] || msg.from,
            content: (msg.body as any)?.content ?? "",
            timestamp: msg.serverTime || Date.now(),
          }))
          .sort((a: any, b: any) => a.timestamp - b.timestamp); // Sort chronologically

        setMessages(formattedMessages);
        setChatReady(true);
        setLoading(false);

        console.log("✅ Chat setup completed successfully");

        // ✅ 8. Setup real-time message listener using actual Agora group ID
        removeListener = setupMessageListener(async (newMsgs) => {
          const groupMessages = newMsgs
            .filter((msg) => msg.to === effectiveGroupId && msg.body.type === "txt");

          if (groupMessages.length === 0) return;

          console.log("📨 New messages received:", groupMessages.length);

          // Fetch sender names for new messages
          const newSenderIds = Array.from(new Set(groupMessages.map((msg) => msg.from)));
          await Promise.all(newSenderIds.map(async (senderId) => {
            if (!idToName[senderId]) {
              try {
                const res = await fetchUserProfile(senderId);
                idToName[senderId] = res?.data?.DisplayName || senderId;
              } catch {
                idToName[senderId] = senderId;
              }
            }
          }));

          const formattedNewMessages = groupMessages.map(msg => ({
            id: msg.msgId || msg.localMsgId,
            senderId: msg.from,
            senderName: idToName[msg.from] || msg.from,
            content: (msg.body as any)?.content ?? "",
            timestamp: msg.serverTime || Date.now(),
          }));

          if (isMounted) {
            setMessages((prev) => {
              const allMsgs = [...prev, ...formattedNewMessages];
              // Remove duplicates and sort
              const uniqueMsgs = Array.from(
                new Map(allMsgs.map((m) => [m.id, m])).values()
              );
              uniqueMsgs.sort((a, b) => a.timestamp - b.timestamp);
              return uniqueMsgs;
            });
          }
        });

      } catch (error) {
        console.error("❌ Setup error:", error);
        if (isMounted) {
          Alert.alert(
            "Error",
            "Failed to setup chat. Please try again.",
            [{ text: "OK" }]
          );
          setLoading(false);
        }
      }
    };

    setupGroupChat();

    // Cleanup
    return () => {
      isMounted = false;
      if (removeListener) {
        removeListener();
      }
    };
  }, [groupid, createdBy]);

  // ✅ FIXED: Send message handler
  const handleSendMessage = useCallback(
    async (text: string) => {
      if (!groupid || typeof groupid !== 'string' || !userId || !text.trim() || !chatReady) {
        console.log("Cannot send message:", { groupid, agoraGroupId, userId, chatReady, text: text.trim() });
        return;
      }

      // ✅ Use actual Agora group ID for sending messages
      const targetGroupId = agoraGroupId || groupid;

      try {
        console.log("📤 Sending message to Agora group:", targetGroupId, "text:", text);

        // Add optimistic update
        const tempId = `temp_${Date.now()}`;
        const tempMessage = {
          id: tempId,
          senderId: userId,
          senderName: userId,
          content: text,
          timestamp: Date.now(),
          isTemp: true,
        };

        setMessages((prev) => [...prev, tempMessage]);

        // Send actual message using Agora group ID
        await sendGroupMessage(targetGroupId, text);
        console.log("✅ Message sent successfully");

        // The real message will replace temp via listener

      } catch (error: any) {
        console.error("❌ Send error:", error);

        // Remove failed temp message
        setMessages(prev => prev.filter(m => !m.isTemp));

        Alert.alert(
          "Failed to Send",
          error?.message || "Please check your connection and try again",
          [{ text: "OK" }]
        );
      }
    },
    [groupid, agoraGroupId, userId, chatReady]
  );

  // Background colors for avatar
  const BACKGROUND_COLORS = [
    "#F44336", "#E91E63", "#9C27B0", "#673AB7", "#3F51B5",
    "#2196F3", "#03A9F4", "#00BCD4", "#009688", "#4CAF50",
    "#8BC34A", "#FF9800", "#FF5722", "#795548", "#607D8B",
  ];

  return (
    <KeyboardAvoidingView enabled={true} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      {/* Members Modal */}
      <Modal
        visible={showMembers}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMembers(false)}
        statusBarTranslucent={Platform.OS === 'android'}
      >
        <View className="flex-1 bg-black/40 justify-end">
          <View className="bg-white rounded-t-2xl p-5 max-h-[60%]">
            {/* Header */}
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-base font-medium text-black">
                Members ({groupMembers.length})
              </Text>
              <TouchableOpacity onPress={() => setShowMembers(false)}>
                <MaterialIcons name="close" size={24} color={'black'} />
              </TouchableOpacity>
            </View>

            {/* List */}
            <FlatList
              data={groupMembers}
              keyExtractor={(item, index) => `${index}`}
              renderItem={({ item }) => (
                <View className="flex-row items-center py-3 border-b border-gray-100">
                  {/* Profile Image / Icon */}
                  {item.Image ? (
                    <Image
                      source={{ uri: item.Image.startsWith('http') ? item.Image : MEDIA_BASE_URL + item.Image }}
                      className="w-9 h-9 rounded-full mr-3"
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="w-9 h-9 rounded-full mr-3 justify-center items-center"
                      style={{
                        backgroundColor: BACKGROUND_COLORS[
                          Math.abs(
                            (item.Username || "U")
                              .split("")
                              .reduce((acc: any, char: any) => acc + char.charCodeAt(0), 0) %
                            BACKGROUND_COLORS.length
                          )
                        ],
                      }}
                    >
                      <Text className="text-white font-bold text-xs">
                        {(item.Username || "U")
                          .split(" ")
                          .map((part: any) => part?.charAt(0) || "")
                          .slice(0, 2)
                          .join("")
                          .toUpperCase()}
                      </Text>
                    </View>
                  )}

                  {/* Name & Email */}
                  <View>
                    <Text className="text-sm font-medium text-black">
                      {item.Username || item.ID || "Unknown User"}
                    </Text>
                    {item.Email && (
                      <Text className="text-xs text-gray">
                        {item.Email}
                      </Text>
                    )}
                  </View>
                </View>
              )}
            />
          </View>
        </View>
      </Modal>

      {/* Header */}
      <ScreenHeader
        leftContent={
          <View style={{ flexDirection: "row", alignItems: "center", gap: SPACING.sm }}>
            <HeaderBackButton onPress={() => router.back()} />
            {image ? (
              <Image
                source={{
                  uri: image.startsWith("http")
                    ? image
                    : (image.startsWith("uploads/")
                        ? IMAGE_URL + image
                        : VIDEO_URL + image)
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
                      (name || "U")
                        .split("")
                        .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                      BACKGROUND_COLORS.length
                    )
                  ],
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "bold", fontSize: 10 }}>
                  {(name || "U")
                    .split(" ")
                    .map((part) => part?.charAt(0) || "")
                    .slice(0, 2)
                    .join("")
                    .toUpperCase()}
                </Text>
              </View>
            )}
            <View>
              <Text style={[TYPOGRAPHY.subheadline, { color: "#000" }]}>
                {name || groupid}
              </Text>
              <Text style={[TYPOGRAPHY.caption1, { color: "#6B7280" }]}>
                {chatReady ? "Connected" : "Connecting..."}
              </Text>
            </View>
          </View>
        }
        rightContent={
          <TouchableOpacity
            onPress={() => {
              console.log("Group members:", groupMembers);
              setShowMembers(true);
            }}
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              borderWidth: 1,
              borderColor: "#D1D5DB",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <MaterialIcons name="group" size={22} color="#000" />
          </TouchableOpacity>
        }
      />

      {/* Loading or Messages */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#C07618" />
          <Text className="mt-4 text-gray">Setting up chat...</Text>
        </View>
      ) : messages.length === 0 ? (
        <View className="flex-1 justify-center items-center">
          <Text className="text-gray">No messages yet</Text>
          <Text className="text-xs text-gray mt-2">Start the conversation!</Text>
        </View>
      ) : (
        <GroupConversation messages={messages} currentUserId={userId} />
      )}

      {/* Chat Input */}
      <ChatInput onSend={handleSendMessage} />
    </KeyboardAvoidingView>
  );
}