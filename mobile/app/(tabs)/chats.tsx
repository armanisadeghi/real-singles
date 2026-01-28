import LinearBg from "@/components/LinearBg";
import NotificationBell from "@/components/NotificationBell";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { fetchUserProfile, getAgoraChatToken, getGroupList } from "@/lib/api";
import { chatClient, deleteAllMyGroups, getAllConversations, getAllJoinedGroupsDetailed, getUserHistoryMessages, initChat, loginToChat } from "@/services/agoraChatServices";
import { User } from "@/types";
import { getCurrentUserId, IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { PlatformIcon, LiquidGlassHeader, useLiquidGlass } from "@/components/ui";
import * as Haptics from 'expo-haptics';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  PlatformColor,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { useThemeColors } from "@/context/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { useBottomSpacing } from "@/hooks/useResponsive";
import { TYPOGRAPHY, SPACING, VERTICAL_SPACING, ICON_SIZES, COMPONENT_SIZES, BORDER_RADIUS, SHADOWS } from "@/constants/designTokens";

interface MessageItem {
  id: string;
  name: string;
  message: string;
  time: string;
  unread: number;
  online: boolean;
  image: any; // Consider using ImageSourcePropType from react-native if you're using TypeScript
}

interface GroupItem {
  GroupID: string;
  GroupName: string;
  message: string;
  time: string;
  Members: User[];
  Image: any;
  CreatedDate?: string;
  _sortTime?: number;
}

const userData = [
  {
    id: "1",
    name: "User A",
    image: images.chatImage,
    location: "New York",
  },
  {
    id: "2",
    name: "User B",
    image: images.chatImage,
    location: "Los Angeles",
  },
  {
    id: "3",
    name: "User C",
    image: images.chatImage,
    location: "Chicago",
  },
  {
    id: "4",
    name: "User D",
    image: images.chatImage,
    location: "Houston",
  },
  {
    id: "5",
    name: "User E",
    image: images.chatImage,
    location: "Phoenix",
  },
  {
    id: "6",
    name: "User F",
    image: images.chatImage,
    location: "Philadelphia",
  },
  {
    id: "7",
    name: "User G",
    image: images.chatImage,
    location: "San Antonio",
  },
  {
    id: "8",
    name: "User H",
    image: images.chatImage,
    location: "San Diego",
  },
  {
    id: "9",
    name: "User I",
    image: images.chatImage,
    location: "Dallas",
  },
];

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

const renderMessageItem = ({ item }: { item: MessageItem }) => (
  console.log("item.name in renderMessageItem", item?.name),
  <Link
    href={{ pathname: "/chat/[userid]", params: { userid: item.id, name: item.name, image: item.image?.uri, online: item.online.toString(), time: item.time } }}
    asChild
  >
    <TouchableOpacity
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
      className="flex-row items-center border border-border rounded-input"
      style={{
        marginHorizontal: SPACING.screenPadding,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        marginBottom: SPACING.md
      }}
    >
      <View className="relative">
        {item?.image?.uri && item.image.uri !== "profile_img_url" ? (
          <Image
            source={{
              uri: item.image.uri.startsWith("http")
                ? item.image.uri
                : (item.image.uri.startsWith("uploads/")
                    ? IMAGE_URL + item.image.uri
                    : VIDEO_URL + item.image.uri)
            }}
            className="rounded-input"
            style={{ width: COMPONENT_SIZES.avatar.lg, height: COMPONENT_SIZES.avatar.lg }}
            resizeMode="cover"
          />
        ) : (
          <View
            className="rounded-input justify-center items-center"
            style={{
              width: COMPONENT_SIZES.avatar.lg,
              height: COMPONENT_SIZES.avatar.lg,
              backgroundColor: BACKGROUND_COLORS[
                Math.abs(
                  (item.name || "User")
                    .split("")
                    .reduce((acc, char) => acc + char.charCodeAt(0), 0) %
                  BACKGROUND_COLORS.length
                )
              ],
            }}
          >
            <Text className="text-white font-bold text-sm">
              {(item.name || "User")
                .split(" ")
                .map((part) => part.charAt(0))
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </Text>
          </View>
        )}
        {item.online && (
          <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></View>
        )}
      </View>
      <View className="flex-1 ml-3">
        <View className="flex-row justify-between items-center">
          <Text className="font-medium text-base text-label">{item.name}</Text>
          <Text className="text-label-secondary text-xs">{item.time}</Text>
        </View>
        <View className="flex-row justify-between items-center mt-1">
          <Text numberOfLines={1} className="text-label-secondary text-sm flex-1 pr-4">
            {item.message === "[Unsupported message]" ? "No messages yet" : item.message}
          </Text>
          {item.unread > 0 && (
            <View className="bg-[#FF3131] rounded-full h-5 w-5 items-center justify-center">
              <Text className="text-white text-xs">{item.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  </Link>
);

const getGroupColor = (groupId: string) => {
  const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];
  const index = Number(groupId) % colors.length;
  return colors[index];
};

const formatChatDate = (dateString: string) => {
  // Convert "YYYY-MM-DD HH:mm:ss" → Date
  const date = new Date(dateString.replace(" ", "T"));

  const now = new Date();

  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) {
    return `Today ${time}`;
  }

  if (isYesterday) {
    return `Yesterday ${time}`;
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }) + `, ${time}`;
};


const renderGroupItem = ({ item }: { item: GroupItem }) => (
  <Link href={{
    pathname: "/group/[groupid]", params: {
      groupid: item?.GroupID.toString(),
      name: item.GroupName,
      image: item.Image || "",
      members: encodeURIComponent(JSON.stringify(item.Members)),
    }
  }} asChild>
    <TouchableOpacity
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
      className="flex-row items-center border border-border rounded-input"
      style={{
        marginHorizontal: SPACING.screenPadding,
        paddingVertical: SPACING.sm,
        paddingHorizontal: SPACING.sm,
        marginBottom: SPACING.md
      }}
    >{item?.Image ? (
      <Image
        source={{ uri: item?.Image.startsWith('http') ? item?.Image : (item?.Image.startsWith('uploads/') ? IMAGE_URL + item?.Image : VIDEO_URL + item?.Image) }}
        className="rounded-input"
        style={{ width: COMPONENT_SIZES.avatar.lg, height: COMPONENT_SIZES.avatar.lg }}
        resizeMode="cover"
      />) : (
      <View
        className="rounded-input justify-center items-center"
        style={{
          width: COMPONENT_SIZES.avatar.lg,
          height: COMPONENT_SIZES.avatar.lg,
          backgroundColor: getGroupColor(item.GroupID)
        }}
      >
        <Text className="text-white font-bold" style={TYPOGRAPHY.h3}>{item.GroupName.charAt(0).toUpperCase()}</Text>
      </View>
    )
      }
      <View className="flex-1" style={{ marginLeft: SPACING.sm }}>
        <View className="flex-row items-center">
          {/* LEFT: Group name */}
          <Text
            className="font-medium text-base text-label flex-1 pr-2"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.GroupName}
          </Text>

          {/* RIGHT: Time */}
          <Text className="text-label-secondary text-xs flex-shrink-0">
            {formatChatDate(item.CreatedDate || "")}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text numberOfLines={1} className="text-label-secondary text-sm flex-1">
            {item.message === "[Unsupported message]" ? "No messages yet" : item.message}
          </Text>
          <View className="bg-gray-100 rounded-full px-2 py-0.5">
            <Text className="text-label-secondary text-xs">{item.Members.length - 1} members</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  </Link>
);

const renderUserItem = ({
  item,
  handleSelectFriend,
  selectedUsers,
}: {
  item: any;
  handleSelectFriend: (id: string) => void;
  selectedUsers: any;
}) => (
  <TouchableOpacity
    activeOpacity={0.7}
    onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      handleSelectFriend(item?.id);
    }}
    className={`flex-row items-center mx-6 py-3 px-3 border mb-4 rounded-[10px] ${selectedUsers.includes(item.id)
      ? "bg-[#F3961D1F] border-primary"
      : "bg-surface-secondary border-border"
      }`}
  >
    <Image
      source={item.image}
      className="w-[50px] h-[50px] rounded-[12px]"
      resizeMode="cover"
    />
    <View className="flex-1 ml-3">
      <View className="flex-row justify-between items-center">
        <Text className="font-medium text-base">{item.name}</Text>
        {selectedUsers.includes(item.id) && (
          <PlatformIcon name="check-circle" size={24} color="#4CAF50" />
        )}
        {/* <Text className="text-gray-500 text-xs">{item.time}</Text> */}
      </View>
      <View className="flex-row justify-between items-center mt-1">
        <Text className="text-label-secondary text-sm flex-1 pr-4">{item.location}</Text>
      </View>
    </View>
  </TouchableOpacity>
);

export default function Chats() {
  const router = useRouter();
  const { productId, fromProduct, productPoints } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState("messages");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredMessages, setFilteredMessages] = useState<MessageItem[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<GroupItem[]>([]);
  const [selectMode, setSelectMode] = useState(!!fromProduct);
  const [selectedUsers, setSelectedUsers] = useState<any>([]);
  const [filteredAllFriends, setFilteredAllFriends] = useState<any>([]);
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [currUserId, setCurrUserId] = useState<string | null>(null);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [deletingGroups, setDeletingGroups] = useState(false);

  // Responsive hooks
  const { contentPadding: bottomTabPadding } = useBottomSpacing(true);
  const insets = useSafeAreaInsets();
  
  // Native header height: iOS 44pt, Android 56dp
  const headerHeight = Platform.OS === 'ios' ? 44 : 56;

  // Dark mode support
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();

  // Theme-aware colors - using PlatformColor for native iOS adaptation
  const themedColors = {
    background: Platform.OS === 'ios' ? (PlatformColor('systemBackground') as unknown as string) : colors.background,
    secondaryBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : colors.surfaceContainer,
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    border: Platform.OS === 'ios' ? (PlatformColor('separator') as unknown as string) : colors.outline,
  };

  // 🗑️ TEMPORARY: Delete all Agora groups function
  const handleDeleteAllAgoraGroups = async () => {
    setDeletingGroups(true);
    try {
      const userId = await getCurrentUserId();
      if (!userId) {
        Toast.show({ type: "error", text1: "User not found" });
        return;
      }

      // Login to Agora first
      await initChat();
      const tokenRes = await getAgoraChatToken(userId);
      await loginToChat(userId.toString(), tokenRes.data.userToken);

      // First see all groups
      console.log("📋 Fetching all joined groups...");
      const agoraGroups = await getAllJoinedGroupsDetailed();
      console.log(`Found ${agoraGroups.length} groups`);

      if (agoraGroups.length === 0) {
        Toast.show({
          type: "info",
          text1: "No groups found",
          text2: "There are no Agora groups to delete",
        });
        return;
      }

      // Delete all groups I own
      const results = await deleteAllMyGroups(userId.toString());
      console.log("Delete results:", results);

      const deleted = results.filter((r: any) => r.success).length;
      const skipped = results.filter((r: any) => !r.success).length;

      Toast.show({
        type: "success",
        text1: `Deleted ${deleted} groups`,
        text2: skipped > 0 ? `Skipped ${skipped} (not owner)` : "All your groups deleted!",
      });

    } catch (error: any) {
      console.error("Error deleting groups:", error);
      Toast.show({
        type: "error",
        text1: "Failed to delete groups",
        text2: error?.message || "Please try again",
      });
    } finally {
      setDeletingGroups(false);
    }
  };


  const fetchConversationsWithProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const currUserId = await getCurrentUserId();

      const convs = (await getAllConversations()) as any[];

      const results = await Promise.all(
        convs.map(async (conv) => {
          let lastMsg = conv.lastMsg;

          if (!lastMsg) {
            try {
              const history = await getUserHistoryMessages(conv.convId, 10, "");
              if (history?.length) {
                history.sort((a: { serverTime: number }, b: { serverTime: number }) => b.serverTime - a.serverTime);
                lastMsg = history[0];
              }
            } catch {
              return null;
            }
          }

          if (!lastMsg) return null;

          // ❌ Filter: current user must be in chat
          if (lastMsg.from !== currUserId && lastMsg.to !== currUserId) return null;

          // ✅ Correct peer user
          const peerUserId = lastMsg.from === currUserId ? lastMsg.to : lastMsg.from;

          let profile = null;
          try {
            const res = await fetchUserProfile(peerUserId);
            console.log("Fetched profile for", peerUserId, res);

            if (res?.success) profile = res.data;
          } catch { }

          return {
            ...conv,
            peerUserId,
            profile, // peer profile
            lastMsg,
            unread: conv.unreadCount || 0,
          };
        })
      );

      setConversations(results.filter(Boolean));

    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    getCurrentUserId().then(setCurrUserId);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setConversations([]); //clear previous conversations
      fetchConversationsWithProfiles();
    }, [])
  );


  const chatList = useMemo(() =>
    conversations.map((conv) => {
      console.log("Mapping conv:", conv.convId, "profile:", conv.profile, "DisplayName:", conv.profile?.DisplayName);

      const lastMsg = conv.lastMsg;
      if (!lastMsg) return null;

      let message = "";
      let time = "";
      if (lastMsg.body) {
        switch (lastMsg.body.type) {
          case "txt":
            message = lastMsg.body.content;
            break;
          case "img":
            message = "[Image]";
            break;
          case "video":
            message = "[Video]";
            break;
          default:
            message = "[Unsupported message]";
        }
      }

      time = new Date(lastMsg.serverTime || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // peer profile
      const peerName = conv.profile?.DisplayName || conv.profile?.FirstName || "Unknown";


      return {
        id: conv.peerUserId, // ⚠️ convId nahi, peerUserId
        name: peerName,
        // Pass null if no image - renderMessageItem will show colored initials fallback
        image: conv.profile?.Image ? { uri: conv.profile.Image } : null,
        message,
        time,
        unread: conv.unread || 0,
        online: conv.profile?.IsOnline === 1,
      };
    }).filter((item): item is NonNullable<typeof item> => item !== null),
    [conversations]);


  console.log("chatList", chatList);


  useEffect(() => {
    const filteredMsgs = allConversations.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.message.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredMessages(filteredMsgs);

    const filteredUsers = userData.filter(
      (item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredAllFriends(filteredUsers);
  }, [searchQuery, allConversations]);

  useEffect(() => {
    setSearchQuery("");
  }, [activeTab]);

  const handleSelectFriend = (id: string) => {
    setSelectedUsers((prev: string[]) => {
      if (prev.includes(id)) {
        return prev.filter((userId: string) => userId !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleNavigateShippingInfo = () => {
    router.push({
      pathname: "/shipping",
      params: {
        productId: productId,
        productPoints: productPoints,
        selectedUsers: selectedUsers,
        redeemForYou: "false",
      }
    })
  }

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (activeTab === "messages") {
      console.log("Create new message");
    } else {
      console.log("Create new group");
      router.push('/group/create');
    }
  }

  useEffect(() => {
    const fetchGroups = async () => {
      setLoadingGroups(true);
      try {
        // ✅ Parallel fetch: Backend Groups + Agora Joined Groups + Agora Conversations
        const [res, agoraGroups, conversations] = await Promise.all([
          getGroupList(),
          chatClient.groupManager.getJoinedGroups(),
          chatClient.chatManager.getAllConversations()
        ]);

        console.log("res for group fetch", JSON.stringify(res));

        if (res?.success) {
          const backendGroups: GroupItem[] = res?.Groups || [];

          // ✅ Merge Backend Data with Agora Data
          const mergedGroups = backendGroups.map((bg) => {
            // 1. Find Agora Group (Match by Name)
            const matchedAgoraGroup = agoraGroups.find(
              (ag: any) => ag.groupName === bg.GroupName
            );

            let lastMsgText = bg.message || "";
            let sortTime = 0;

            // 2. If Agora Group found, find Conversation
            if (matchedAgoraGroup) {
              const conv = conversations.find(
                (c: any) => c.conversationId === matchedAgoraGroup.groupId
              );

              if (conv) {
                // 3. Get Last Message
                const msg = (conv as any).latestMessage;
                if (msg) {
                  sortTime = msg.serverTime;
                  // Format message content
                  const body = msg.body as any; // Cast for easier access
                  if (body.type === 'txt') {
                    lastMsgText = body.content;
                  } else if (body.type === 'img') {
                    lastMsgText = '[Image]';
                  } else if (body.type === 'video') {
                    lastMsgText = '[Video]';
                  } else {
                    lastMsgText = `[${body.type}]`;
                  }
                }
              }
            }

            // 4. Fallback Sort Time: CreatedDate or existing time
            if (!sortTime && bg.CreatedDate) {
              // Try parsing CreatedDate
              const parsed = new Date(bg.CreatedDate).getTime();
              if (!isNaN(parsed)) {
                sortTime = parsed;
              }
            }

            // Format time string for UI (optional, relying on existing logic or component)
            // Existing 'time' field seems to be a string. We update 'message'.

            return {
              ...bg,
              message: lastMsgText,
              _sortTime: sortTime
            };
          });

          // ✅ Sort by Time (Descending) - Newest Top
          mergedGroups.sort((a, b) => (b._sortTime || 0) - (a._sortTime || 0));

          setGroups(mergedGroups);
        } else {
          console.log("res failed for group fetch", res);
          setGroups([]);
          Toast.show({
            type: "error",
            text1: "Error",
            text2: "Failed to fetch groups",
            position: "bottom",
            visibilityTime: 2000,
          });
        }
      } catch (error) {
        console.log("error fetching groups", error);

        setGroups([]);
        Toast.show({
          type: "error",
          text1: "Error",
          text2: "Failed to fetch groups",
          position: "bottom",
          visibilityTime: 2000,
        });
      } finally {
        setLoadingGroups(false);
      }
    }
    if (activeTab === "groups") {
      fetchGroups();
    }
  }, [activeTab]);

  return (
    <>
      <View className="relative flex-1" style={{ backgroundColor: themedColors.background }}>
        <TouchableOpacity
          activeOpacity={0.7}
          className={`absolute z-50 shadow-lg shadow-primary/20 rounded-full overflow-hidden ${selectMode ? "hidden" : ""
            } ${activeTab === "messages" ? "hidden" : ""}`}
          style={{
            right: SPACING.screenPadding,
            bottom: bottomTabPadding + VERTICAL_SPACING['2xl']
          }}
          onPress={handleCreate}
        >
          <View
            className="rounded-full justify-center items-center bg-primary/20"
            style={{ padding: SPACING.xs }}
          >
            <LinearBg
              className="rounded-full justify-center items-center"
              style={{
                width: ICON_SIZES['3xl'] * 1.33,
                height: ICON_SIZES['3xl'] * 1.33,
                borderRadius: BORDER_RADIUS.full
              }}
            >
              <PlatformIcon name="add" size={ICON_SIZES.lg} color="white" />
            </LinearBg>
          </View>
        </TouchableOpacity>
        {/* Native-style header for tab screen with Liquid Glass on iOS */}
        <LiquidGlassHeader
          style={{ 
            paddingTop: insets.top,
          }}
          transparent={Platform.OS === 'ios'}
        >
          <View 
            style={{ 
              height: headerHeight,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
            }}
          >
            {selectMode ? (
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  router.back();
                }} 
                style={{ width: 40 }}
              >
                <PlatformIcon name="arrow-back" size={24} color="#E91E63" />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 40 }} />
            )}
            <Text style={{ fontSize: 17, fontWeight: '600', color: themedColors.text }}>
              {selectMode ? "Select Friends" : "Chats"}
            </Text>
            {selectMode ? (
              selectedUsers.length > 0 ? (
                <TouchableOpacity 
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    handleNavigateShippingInfo();
                  }} 
                  style={{ width: 40 }}
                >
                  <Text className="text-primary font-medium" style={TYPOGRAPHY.body}>Send</Text>
                </TouchableOpacity>
              ) : (
                <View style={{ width: 40 }} />
              )
            ) : (
              <NotificationBell />
            )}
          </View>
        </LiquidGlassHeader>

        <View style={{ marginTop: VERTICAL_SPACING.sm }}>
          {Platform.OS === 'ios' ? (
            // Native iOS segmented control
            <SegmentedControl
              values={['Messages', 'Groups']}
              selectedIndex={activeTab === 'messages' ? 0 : 1}
              onChange={(event) => {
                Haptics.selectionAsync();
                const index = event.nativeEvent.selectedSegmentIndex;
                setActiveTab(index === 0 ? 'messages' : 'groups');
              }}
              enabled={!selectMode}
              style={{
                marginHorizontal: SPACING.screenPadding,
                marginBottom: VERTICAL_SPACING.md,
                height: 36,
              }}
              tintColor="#E91E63"
              fontStyle={{ fontSize: 14, fontWeight: '500' }}
              activeFontStyle={{ fontSize: 14, fontWeight: '600' }}
            />
          ) : (
            // Android custom tab switcher
            <View
              className="flex-row border border-border rounded-card"
              style={{
                backgroundColor: themedColors.background,
                marginHorizontal: SPACING.screenPadding,
                gap: SPACING.xs,
                padding: SPACING.xs,
                marginBottom: VERTICAL_SPACING.md
              }}
            >
              <TouchableOpacity
                disabled={selectMode}
                className={`flex-1 items-center rounded-input ${activeTab === "messages"
                  ? "border border-primary"
                  : ""
                  }`}
                style={{ 
                  paddingVertical: SPACING.sm,
                  backgroundColor: activeTab === "messages" ? themedColors.background : themedColors.secondaryBackground,
                }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab("messages");
                }}
              >
                <Text
                  style={[TYPOGRAPHY.body, { color: activeTab === "messages" ? colors.primary : themedColors.text }]}
                >
                  Messages
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={selectMode}
                className={`flex-1 items-center rounded-input ${activeTab === "groups"
                  ? "border border-primary"
                  : ""
                  }`}
                style={{ 
                  paddingVertical: SPACING.sm,
                  backgroundColor: activeTab === "groups" ? themedColors.background : themedColors.secondaryBackground,
                }}
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab("groups");
                }}
              >
                <Text
                  style={[TYPOGRAPHY.body, { color: activeTab === "groups" ? colors.primary : themedColors.text }]}
                >
                  Groups
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View className="rounded-t-[30px] h-full"
            style={{
              backgroundColor: themedColors.background,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.8,
              shadowRadius: 16,
              elevation: 5,
            }}>
            {selectMode ? (
              <FlatList
                data={filteredAllFriends}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) =>
                  renderUserItem({ item, handleSelectFriend, selectedUsers })
                }
                className="rounded-t-[30px] h-full"
                style={{
                  backgroundColor: themedColors.background,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 16,
                  elevation: 5,
                }}
                contentContainerStyle={{ paddingBottom: 260 }}
                ListHeaderComponent={
                  <View className="px-6 py-5" >
                    <View className="flex-row items-center border border-border rounded-[10px]" style={{ backgroundColor: themedColors.secondaryBackground }}>
                      <TextInput
                        className="flex-1 text-sm"
                        style={{ color: themedColors.text }}
                        placeholder="Search Chat"
                        placeholderTextColor={themedColors.secondaryText}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                      <Image
                        source={icons.search}
                        className="w-5 h-5 mr-2"
                        resizeMode="contain"
                      />
                    </View>
                  </View>
                }
                ListEmptyComponent={
                  !loading ? (
                    <View className="items-center justify-center py-10">
                      <Text style={{ color: themedColors.secondaryText }}>No friend found</Text>
                    </View>
                  ) : null
                }
              />
            ) : activeTab === "messages" ? (
              loading ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#C07618" />
                </View>
              ) : (
                <FlatList
                  data={chatList}
                  renderItem={({ item }: { item: MessageItem }) => (
                    renderMessageItem({ item })
                  )}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ paddingBottom: 400 }}
                  ListHeaderComponent={
                    <View className="px-6 py-5">
                      <View className="flex-row items-center border border-border rounded-[10px]" style={{ backgroundColor: themedColors.secondaryBackground }}>
                        <TextInput
                          className="flex-1 text-sm"
                          placeholder="Search Chat"
                          placeholderTextColor={themedColors.secondaryText}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          style={{ paddingVertical: 8, paddingHorizontal: 8, color: themedColors.text }}
                        />
                        <Image
                          source={icons.search}
                          className="w-5 h-5 mr-2"
                          resizeMode="contain"
                        />
                      </View>
                    </View>
                  }
                  ListEmptyComponent={
                    !loading ? (
                      <View className="items-center justify-center py-10">
                        <Text style={{ color: themedColors.secondaryText }}>No chats found</Text>
                      </View>
                    ) : null
                  }
                />
              )
            ) : (
              loadingGroups ? (
                <View className="flex-1 justify-center items-center">
                  <ActivityIndicator size="large" color="#C07618" />
                </View>
              ) : (
                <FlatList
                  data={groups}
                  renderItem={renderGroupItem}
                  keyExtractor={(item) => item?.GroupID.toString()}
                  contentContainerStyle={{ paddingBottom: 500 }}
                  className="rounded-t-[30px] h-full"
                  style={{
                    backgroundColor: themedColors.background,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 16,
                    elevation: 5,
                  }}
                  ListHeaderComponent={
                    <View className="px-6 py-5">
                      <View className="flex-row items-center border border-border rounded-[10px]" style={{ backgroundColor: themedColors.secondaryBackground }}>
                        <TextInput
                          className="flex-1 text-sm"
                          placeholder="Search Group"
                          placeholderTextColor={themedColors.secondaryText}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          style={{ paddingVertical: 8, paddingHorizontal: 8, color: themedColors.text }}
                        />
                        <Image
                          source={icons.search}
                          className="w-5 h-5 mr-2"
                          resizeMode="contain"
                        />
                      </View>
                      {/* 🗑️ TEMPORARY: Delete All Agora Groups Button */}
                      {/*  <TouchableOpacity
                        onPress={handleDeleteAllAgoraGroups}
                        disabled={deletingGroups}
                        className="mt-3 bg-red-500 py-3 rounded-lg items-center"
                        style={{ backgroundColor: '#FF3B30' }}
                      >
                        {deletingGroups ? (
                          <ActivityIndicator color="white" />
                        ) : (
                          <Text style={{ color: 'white', fontWeight: 'bold' }}>🗑️ Delete All Agora Groups</Text>
                        )}
                      </TouchableOpacity> */}
                    </View>
                  }
                  ListEmptyComponent={
                    !loadingGroups ? (
                      <View className="items-center justify-center py-10">
                        <Text style={{ color: themedColors.secondaryText }}>No Groups found</Text>
                      </View>
                    ) : null
                  }
                />
              )
            )}
          </View>
        </View>
      </View>
    </>
  );
}
