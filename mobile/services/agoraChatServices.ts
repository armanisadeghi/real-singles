/**
 * @deprecated This service is being phased out in favor of Supabase Realtime messaging.
 * 
 * Migration status:
 * - Direct chat (1:1): ✅ Migrated to supabaseMessaging.ts
 * - Group chat: ❌ Still uses Agora (pending migration)
 * - Chat list: ❌ Still uses Agora for conversation list (pending migration)
 * - Call signaling: ❌ Still uses Agora custom messages (pending migration to Supabase Broadcast)
 * 
 * For new direct chat implementations, use:
 * - mobile/services/supabaseMessaging.ts
 * - mobile/hooks/useSupabaseMessaging.ts
 * 
 * TODO: Complete migration of group chat, chat list, and call signaling
 */

import { getAgoraChatToken } from "@/lib/api";
import { Platform } from "react-native";

// Conditional import for native-only Agora Chat SDK
let ChatClient: any, ChatConversationType: any, ChatGroupOptions: any, ChatMessageChatType: any, ChatOptions: any, ChatGroupStyle: any, ChatMessage: any;
if (Platform.OS !== 'web') {
  const AgoraChat = require("react-native-agora-chat");
  ChatClient = AgoraChat.ChatClient;
  ChatConversationType = AgoraChat.ChatConversationType;
  ChatGroupOptions = AgoraChat.ChatGroupOptions;
  ChatMessageChatType = AgoraChat.ChatMessageChatType;
  ChatOptions = AgoraChat.ChatOptions;
  ChatGroupStyle = AgoraChat.ChatGroupStyle;
  ChatMessage = AgoraChat.ChatMessage;
}

const appKey = process.env.EXPO_PUBLIC_AGORA_CHAT_APP_KEY!;
export const chatClient = ChatClient.getInstance();

// Track initialization and login state
let isInitialized = false;
let isLoggedIn = false;
let currentUserId: string | null = null;

export const initChat = async () => {
  if (isInitialized) {
    console.log("Chat already initialized");
    return chatClient;
  }

  const options = new ChatOptions({
    appKey,
    autoLogin: false,
  });
  console.log("Initializing Agora Chat with options:", options);

  await chatClient.init(options);
  isInitialized = true;
  console.log("Agora Chat initialized successfully");

  // Add connection listeners
  chatClient.addConnectionListener({
    onTokenWillExpire() {
      console.log("Token will expire");
      // You should refresh the token here
    },
    onTokenDidExpire() {
      console.log("Token expired");
      // You should refresh the token here
    },
    onConnected() {
      console.log("Connected to chat");
    },
    onDisconnected() {
      console.log("Disconnected from chat");
      isLoggedIn = false;
      currentUserId = null;
    },
  });

  return chatClient;
};




export const loginToChat = async (userId: string, token: string) => {
  console.log("userId in loginToChat:", userId);
  console.log("token in loginToChat::", token);

  // If already logged in as the same user, skip
  if (isLoggedIn && currentUserId === userId) {
    console.log("Already logged in as", userId);
    return { success: true };
  }

  try {
    const res = await chatClient.loginWithToken(userId, token);
    console.log("Login successful:", res);
    isLoggedIn = true;
    currentUserId = userId;
    return res;
  } catch (error: any) {
    // Check if error is "already logged in" (code 200) - this is actually success
    if (error?.code === 200 && error?.description?.includes("already logged in")) {
      console.log("User already logged in - treating as success");
      isLoggedIn = true;
      currentUserId = userId;
      return { success: true, code: 200, description: error.description };
    }

    // For other errors, log and return
    console.error("Error in loginToChat:", error);
    isLoggedIn = false;
    currentUserId = null;
    throw error; // Throw actual errors instead of returning them
  }
};

// services/agoraChatServices.ts - Updated

let currentLoginUserId: string | null = null;

export const ensureChatLogin = async (userId: string) => {
  // If already logged in as this user
  if (currentLoginUserId === userId && isChatLoggedIn()) {
    console.log(`Already logged in as ${userId}`);
    return true;
  }

  // If logged in as a different user, logout first
  if (currentLoginUserId && currentLoginUserId !== userId) {
    console.log(`Logging out previous user ${currentLoginUserId}`);
    await logoutFromChat();
  }

  // Get new token and login
  const tokenRes = await getAgoraChatToken(userId);
  await initChat(); // This should be idempotent
  await loginToChat(userId, tokenRes.data.userToken);
  currentLoginUserId = userId;
  return true;
};

export const logoutFromChat = async () => {
  try {
    if (chatClient && isChatLoggedIn()) {
      await chatClient.logout();
    }
  } finally {
    currentLoginUserId = null;
    isLoggedIn = false;
  }
};

export const isChatInitialized = () => {
  return isInitialized;
};

export const isChatLoggedIn = () => {
  return isLoggedIn;
};

export const getCurrentChatUserId = () => {
  return currentUserId;
};

export const sendMessage = async (toUserId: string, text: string) => {
  const message = ChatMessage.createTextMessage(
    toUserId,
    text,
    ChatMessageChatType.PeerChat
  );

  console.log("Sending message to:", toUserId, "text:", text);

  const result = await chatClient.chatManager.sendMessage(message);
  console.log("Message sent successfully:", result);

  return result;
};

export const sendCustomMessage = async (
  toUserId: string,
  event: string,
  params: { [key: string]: string }
) => {
  const message = ChatMessage.createCustomMessage(
    toUserId,
    event,
    ChatMessageChatType.PeerChat,
    { params }
  );
  return chatClient.chatManager.sendMessage(message);
};

export const setupMessageListener = (
  callback: (messages: any[]) => void
) => {
  const listener = {
    onMessagesReceived: (messages: any[]) => {
      callback(messages);
    },
  };

  chatClient.chatManager.addMessageListener(listener);

  // Return a function to remove this listener
  return () => {
    chatClient.chatManager.removeMessageListener(listener);
  };
};



export const getAllConversations = async () => {
  try {
    const conversations = await chatClient.chatManager.getAllConversations();
    console.log("conversations:", conversations);
    return conversations;
  } catch (error) {
    console.log("error in getAllConversations", error);
    return error;
  }
};

export const getUserHistoryMessages = async (
  userId: string,
  pageSize: number = 20,
  startMsgId: string = ""
) => {
  // fetchHistoryMessages(convId, convType, pageSize, startMsgId?)
  const result = await (chatClient.chatManager.fetchHistoryMessages as any)(
    userId,
    ChatConversationType.PeerChat,
    pageSize,
    startMsgId || undefined
  );
  return result.list || [];
};

export const getGroupHistoryMessages = async (
  groupId: string,
  pageSize: number = 20,
  startMsgId: string = ""
) => {
  console.log("groupId", groupId);

  const result = await (chatClient.chatManager.fetchHistoryMessages as any)(
    groupId,
    ChatConversationType.GroupChat,
    pageSize,
    startMsgId || undefined
  );
  console.log("result", result);

  return result.list || [];
};

export const sendGroupMessage = async (groupId: string, text: string) => {
  try {
    const message = ChatMessage.createTextMessage(
      groupId,
      text,
      ChatMessageChatType.GroupChat
    );

    console.log("Sending group message to:", groupId, "text:", text);

    const result = await chatClient.chatManager.sendMessage(message);
    console.log("Group message sent successfully:", result);

    return result;
  } catch (error) {
    console.error("Error sending group message:", error);
    throw error;
  }
};



export interface AgoraGroupOptions {
  groupId?: string; // 🆕 Allow custom ID
  groupName: string;
  desc?: string;
  owner: string;
  members?: string[];
  maxCount?: number;
  style?: any;
}

export const createAgoraGroup = async ({
  groupId,
  groupName,
  desc = "",
  owner,
  members = [],
  maxCount = 200,
  style = ChatGroupStyle.PublicOpenJoin,
}: AgoraGroupOptions) => {
  try {
    console.log(`🔄 Creating Agora group:`);
    console.log(`   ID: ${groupId}`);
    console.log(`   Name: ${groupName}`);
    console.log(`   Owner: ${owner}`);
    console.log(`   All Members:`, members);
    console.log(`   Total Members: ${members.length}`);

    const membersWithoutOwner = members
      .filter(id => id !== owner)
      .filter((value, index, self) => self.indexOf(value) === index); // Remove duplicates

    console.log(`   Members to add (excluding owner):`, membersWithoutOwner);

    const groupOptions = new ChatGroupOptions({
      style: style,
      maxCount: maxCount,
      inviteNeedConfirm: false,
    });

    const result = await chatClient.groupManager.createGroup(
      groupOptions,
      groupName.trim(),
      desc || `Chat group: ${groupName}`,
      membersWithoutOwner,
      "Welcome to the group"
    );

    console.log("✅ Agora group created:", {
      id: result.groupId,
      name: result.groupName,
      owner: result.owner,
      memberCount: result.memberCount
    });

    return result;

  } catch (e: any) {
    console.error("❌ Failed to create Agora group:", e);

    if (e?.code === 602) {
      console.log("ℹ️ Group already exists in Agora");
      throw e;
    }

    throw new Error(
      e?.description || e?.message || "Failed to create Agora group"
    );
  }
};

export const checkGroupInfo = async (groupId: string) => {
  try {
    const groupInfo = await chatClient.groupManager.fetchGroupInfoFromServer(groupId);
    console.log("Group Info:", groupInfo);
    return groupInfo;
  } catch (error) {
    console.error("Error fetching group info:", error);
    return null;
  }
};

export const listJoinedGroups = async () => {
  try {
    const groups = await chatClient.groupManager.getJoinedGroups();
    console.log("Joined groups:", groups);
    return groups;
  } catch (error) {
    console.error("Error listing joined groups:", error);
    return [];
  }
};
export const ensureGroupExists = async (groupId: string, groupName: string, ownerId: string, members: string[] = []) => {
  try {
    console.log(`🔍 Checking if Agora group ${groupId} exists...`);

    // Try to fetch group info
    const groupInfo = await chatClient.groupManager.fetchGroupInfoFromServer(groupId);
    console.log(`✅ Group ${groupId} exists in Agora`);
    console.log(`   Name: ${groupInfo?.groupName}, Owner: ${groupInfo?.owner}`);

    return { exists: true, groupInfo };

  } catch (error: any) {
    // If error code is 600 (group not found)
    if (error?.code === 600) {
      console.log(`❌ Group ${groupId} NOT FOUND in Agora`);
      console.log(`   Possible reasons:`);
      console.log(`   1. Group was created with different ID`);
      console.log(`   2. Group was not created in Agora`);
      console.log(`   3. Network issue`);

      // 🚨 DON'T CREATE NEW GROUP HERE!
      // Let the original creator handle group creation
      console.log(`⚠️ Returning null, group should be created by owner`);
      return { exists: false, groupInfo: null };
    }

    console.error(`❌ Error checking group ${groupId}:`, error);
    throw error;
  }
};


export const createAgoraGroupDirectly = async (
  groupId: string,
  groupName: string,
  ownerId: string,
  allMembers: string[]
) => {
  try {
    console.log(`🔄 Creating Agora group directly:`);
    console.log(`   ID: ${groupId}`);
    console.log(`   Name: ${groupName}`);
    console.log(`   Owner: ${ownerId}`);
    console.log(`   All Members: ${allMembers.length}`);

    // Filter out owner from members list for Agora
    const membersToAdd = allMembers.filter(member => member !== ownerId);
    console.log(`   Members to add: ${membersToAdd.length}`);

    const groupOptions = new ChatGroupOptions({
      style: ChatGroupStyle.PublicOpenJoin, // style 3 = public open join
      maxCount: 200,
      inviteNeedConfirm: false,
    });

    console.log("📦 Agora Group Options:", JSON.stringify(groupOptions, null, 2));

    const result = await chatClient.groupManager.createGroup(
      groupOptions,
      groupName.trim(),
      `Group chat for ${groupName}`,
      membersToAdd,
      "Welcome to the group"
    );

    console.log("✅ Agora group creation response:", {
      id: result.groupId,
      name: result.groupName,
      owner: result.owner,
      memberCount: result.memberCount
    });

    return result;
  } catch (error: any) {
    console.error("❌ Failed to create Agora group:", error);
    console.error("Error code:", error?.code);
    console.error("Error message:", error?.message);
    console.error("Error description:", error?.description);

    // If group already exists
    if (error?.code === 602) {
      console.log(`ℹ️ Agora group ${groupId} already exists`);

      // Still try to add members
      try {
        const otherMembers = allMembers.filter(member => member !== ownerId);
        if (otherMembers.length > 0) {
          await chatClient.groupManager.addMembers(groupId, otherMembers);
          console.log(`✅ Added ${otherMembers.length} members to existing group`);
        }
      } catch (addError) {
        console.warn("⚠️ Could not add members:", addError);
      }

      return null;
    }

    throw error;
  }
};

// Delete a single Agora group (only owner can delete)
export const deleteAgoraGroup = async (groupId: string) => {
  try {
    console.log(`🗑️ Deleting Agora group: ${groupId}`);
    await chatClient.groupManager.destroyGroup(groupId);
    console.log(`✅ Group ${groupId} deleted successfully`);
    return { success: true, groupId };
  } catch (error: any) {
    console.error(`❌ Failed to delete group ${groupId}:`, error);
    return { success: false, groupId, error: error?.message || error };
  }
};

// Get all joined groups with their details
export const getAllJoinedGroupsDetailed = async () => {
  try {
    const groups = await chatClient.groupManager.getJoinedGroups();
    console.log(`📋 Found ${groups.length} joined groups:`);
    groups.forEach((g: any, i: number) => {
      console.log(`  ${i + 1}. ID: ${g.groupId}, Name: ${g.groupName}, Owner: ${g.owner}`);
    });
    return groups;
  } catch (error) {
    console.error("❌ Failed to get joined groups:", error);
    return [];
  }
};

// Delete ALL groups (that you own)
export const deleteAllMyGroups = async (myUserId: string) => {
  try {
    console.log("🔄 Fetching all joined groups...");
    const groups = await chatClient.groupManager.getJoinedGroups();

    console.log(`📋 Found ${groups.length} groups`);

    const results = [];
    for (const group of groups) {
      // Only delete if I am the owner
      if (group.owner === myUserId) {
        console.log(`🗑️ Deleting group: ${group.groupId} (${group.groupName})`);
        const result = await deleteAgoraGroup(group.groupId);
        results.push(result);
      } else {
        console.log(`⏭️ Skipping group ${group.groupId} - not owner (owner: ${group.owner})`);
        results.push({ success: false, groupId: group.groupId, reason: "not owner" });
      }
    }

    console.log("✅ Delete operation completed");
    return results;
  } catch (error) {
    console.error("❌ Failed to delete groups:", error);
    throw error;
  }
};

// Leave a group (if not owner)
export const leaveAgoraGroup = async (groupId: string) => {
  try {
    console.log(`🚪 Leaving Agora group: ${groupId}`);
    await chatClient.groupManager.leaveGroup(groupId);
    console.log(`✅ Left group ${groupId} successfully`);
    return { success: true, groupId };
  } catch (error: any) {
    console.error(`❌ Failed to leave group ${groupId}:`, error);
    return { success: false, groupId, error: error?.message || error };
  }
};