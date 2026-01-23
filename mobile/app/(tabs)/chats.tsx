import LinearBg from "@/components/LinearBg";
import NotificationBell from "@/components/NotificationBell";
import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { fetchUserProfile, getAgoraChatToken, getGroupList } from "@/lib/api";
import { chatClient, deleteAllMyGroups, getAllConversations, getAllJoinedGroupsDetailed, getUserHistoryMessages, initChat, loginToChat } from "@/services/agoraChatServices";
import { User } from "@/types";
import { getCurrentUserId, IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { Ionicons } from "@expo/vector-icons";
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import Toast from "react-native-toast-message";

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
    <TouchableOpacity className="flex-row items-center mx-6 py-3 px-3 border mb-4 rounded-[10px] border-border">
      <View className="relative">
        {(item?.image?.uri && item.image.uri !== "profile_img_url") || (item.image.uri && item.image.uri.startsWith("uploads/")) ? (
          <Image
            source={
              item.image.uri.startsWith("uploads/")
                ? { uri: IMAGE_URL + item.image.uri }
                : { uri: VIDEO_URL + item.image.uri }
            }
            className="w-[50px] h-[50px] rounded-[12px]"
            resizeMode="cover"
          />
        ) : (
          <View
            className="w-[50px] h-[50px] rounded-[12px] justify-center items-center"
            style={{
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
          <Text className="font-medium text-base text-black">{item.name}</Text>
          <Text className="text-gray text-xs">{item.time}</Text>
        </View>
        <View className="flex-row justify-between items-center mt-1">
          <Text numberOfLines={1} className="text-gray text-sm flex-1 pr-4">
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
      className="flex-row items-center mx-6 py-3 px-3 border mb-4 rounded-[10px] border-border"
    >{item?.Image ? (
      <Image
        source={{ uri: item?.Image.startsWith('uploads/') ? IMAGE_URL + item?.Image : VIDEO_URL + item?.Image }}
        className="w-[50px] h-[50px] rounded-[12px]"
        resizeMode="cover"
      />) : (
      <View className={`w-[50px] h-[50px] rounded-[12px] justify-center items-center`} style={{ backgroundColor: getGroupColor(item.GroupID) }}>
        <Text className="text-white text-xl font-bold text-black">{item.GroupName.charAt(0).toUpperCase()}</Text>
      </View>
    )
      }
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          {/* LEFT: Group name */}
          <Text
            className="font-medium text-base text-black flex-1 pr-2"
            numberOfLines={2}
            ellipsizeMode="tail"
          >
            {item.GroupName}
          </Text>

          {/* RIGHT: Time */}
          <Text className="text-gray-500 text-xs text-gray flex-shrink-0">
            {formatChatDate(item.CreatedDate || "")}
          </Text>
        </View>

        <View className="flex-row justify-between items-center mt-1">
          <Text numberOfLines={1} className="text-gray text-sm flex-1">
            {item.message === "[Unsupported message]" ? "No messages yet" : item.message}
          </Text>
          <View className="bg-gray-100 rounded-full px-2 py-0.5">
            <Text className="text-gray-500 text-xs text-gray">{item.Members.length - 1} members</Text>
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
    onPress={() => handleSelectFriend(item?.id)}
    className={`flex-row items-center mx-6 py-3 px-3 border mb-4 rounded-[10px] ${selectedUsers.includes(item.id)
      ? "bg-[#F3961D1F] border-primary"
      : "bg-light-100 border-border"
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
          <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
        )}
        {/* <Text className="text-gray-500 text-xs">{item.time}</Text> */}
      </View>
      <View className="flex-row justify-between items-center mt-1">
        <Text className="text-gray text-sm flex-1 pr-4">{item.location}</Text>
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
                history.sort((a, b) => b.serverTime - a.serverTime);
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
        image: conv.profile?.Image ? { uri: conv.profile.Image } : icons.ic_user,
        message,
        time,
        unread: conv.unread || 0,
        online: conv.profile?.IsOnline === 1,
      };
    }).filter(Boolean),
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
      {/* <StatusBar barStyle="dark-content" backgroundColor="#ffffff" /> */}
      <View className="relative flex-1 bg-backgground">
        <TouchableOpacity
          activeOpacity={0.7}
          className={`absolute right-6 bottom-40 z-50 shadow-lg shadow-primary/20 rounded-full overflow-hidden ${selectMode ? "hidden" : ""
            } ${activeTab === "messages" ? "hidden" : ""}`}
          onPress={handleCreate}
        >
          <View className="p-2 rounded-full justify-center items-center bg-primary/20">
            <LinearBg
              className="w-16 h-16 rounded-full justify-center items-center"
              style={{ borderRadius: 99 }}
            >
              <Ionicons name="add-sharp" size={30} color="white" />
            </LinearBg>
          </View>
        </TouchableOpacity>
        <View
          className="bg-white flex-row justify-between items-center px-4 pt-10 pb-6 rounded-b-xl z-30"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.1,
            shadowRadius: 16,
            elevation: 5,
          }}
        >
          <View className="flex-row items-center gap-2">
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
            <Text className="leading-[22px] text-base font-medium tracking-[-0.41px] text-black">
              {selectMode ? "Select Friends" : "Chats"}
            </Text>
          </View>

          {selectMode ? (
            selectedUsers.length && (
              <TouchableOpacity onPress={handleNavigateShippingInfo}>
                <Text className="text-primary font-medium text-base tracking-[-0.41px] leading-[22px]">Send</Text>
              </TouchableOpacity>
            )
          ) : (
            <NotificationBell />
          )}
        </View>

        <View className="mt-8">
          <View className="mx-3 flex-row gap-2 p-2 mb-6 bg-white border rounded-xl border-border">
            <TouchableOpacity
              disabled={selectMode}
              className={`flex-1 items-center py-3 rounded-[10px] ${activeTab === "messages"
                ? "border border-primary bg-white"
                : "bg-light-100"
                }`}
              onPress={() => setActiveTab("messages")}
            >
              <Text style={{ color: 'black' }}
                className={`text-base ${activeTab === "messages" ? "text-primary" : ""
                  }`}
              >
                Messages
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              disabled={selectMode}
              className={`flex-1 items-center py-3 rounded-[10px] ${activeTab === "groups"
                ? "border border-primary bg-white"
                : "bg-light-100"
                }`}
              onPress={() => setActiveTab("groups")}
            >
              <Text style={{ color: 'black' }}
                className={`text-base ${activeTab === "groups" ? "text-primary" : ""
                  }`}
              >
                Groups
              </Text>
            </TouchableOpacity>
          </View>
          <View className="bg-white rounded-t-[30px] h-full"
            style={{
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
                className="bg-white rounded-t-[30px] h-full"
                style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: -4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 16,
                  elevation: 5,
                }}
                contentContainerStyle={{ paddingBottom: 260 }}
                ListHeaderComponent={
                  <View className="px-6 py-5" >
                    <View className="flex-row items-center border border-border rounded-[10px] bg-light-100" >
                      <TextInput
                        className="flex-1 text-sm text-black"
                        placeholder="Search Chat"
                        placeholderTextColor={"#B0B0B0"}
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
                      <Text className="text-gray">No friend found</Text>
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
                      <View className="flex-row items-center border border-border rounded-[10px] bg-light-100">
                        <TextInput
                          className="flex-1 text-sm"
                          placeholder="Search Chat"
                          placeholderTextColor={"#B0B0B0"}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          style={{ paddingVertical: 8, paddingHorizontal: 8 }}
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
                        <Text className="text-gray">No chats found</Text>
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
                  className="bg-white rounded-t-[30px] h-full"
                  style={{
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: -4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 16,
                    elevation: 5,
                  }}
                  ListHeaderComponent={
                    <View className="px-6 py-5">
                      <View className="flex-row items-center border border-border rounded-[10px] bg-light-100">
                        <TextInput
                          className="flex-1 text-sm"
                          placeholder="Search Group"
                          placeholderTextColor={"#B0B0B0"}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          style={{ paddingVertical: 8, paddingHorizontal: 8, color: 'black' }}
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
                        <Text className="text-gray">No Groups found</Text>
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
