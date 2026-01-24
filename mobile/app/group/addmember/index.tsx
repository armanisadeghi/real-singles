import { styles } from "@/components/forms/ContactForm";
import { icons } from "@/constants/icons";
import { fetchUserProfile, getAgoraChatToken } from "@/lib/api";
import { chatClient, getAllConversations, initChat, loginToChat } from "@/services/agoraChatServices";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

import { getCurrentUserId, MEDIA_BASE_URL } from "@/utils/token";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ChatConversationType, ChatGroupOptions, ChatGroupStyle } from "react-native-agora-chat";

export default function Addmember() {
  const { GroupName, GroupImage } = useLocalSearchParams();
  console.log("Group data in Addmember:", { GroupName, GroupImage });
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [chatUsers, setChatUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    const fetchChatUsers = async () => {
      setLoadingUsers(true);
      try {
        const convs = (await getAllConversations()) as any[];
        // Only 1:1 chats (PeerChat type is 0)
        const peerConvs = convs.filter((c: any) => c.convType === ChatConversationType.PeerChat);
        const profiles = await Promise.all(
          peerConvs.map(async (conv: any) => {
            let profile = null;
            try {
              const res = await fetchUserProfile(conv.convId);
              if (res?.success) {
                profile = res.data;
              }
            } catch { }
            return {
              id: conv.convId,
              name: profile?.DisplayName || conv.convId,
              image: profile?.Image ? { uri: profile.Image } : icons.ic_user,
              location: profile?.Location || "",
            };
          })
        );
        setChatUsers(profiles.filter((u) => u.id));
      } catch {
        setChatUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchChatUsers();
  }, []);

  const handleSelectUser = (id: string) => {
    setMembers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

  const safeAgoraLogin = async (agoraUserId: string, backendUserId: string) => {
    try {
      const tokenRes = await getAgoraChatToken(backendUserId);
      const agoraToken = tokenRes?.data?.userToken || tokenRes?.userToken || tokenRes;

      await loginToChat(agoraUserId, agoraToken);
      console.log("✅ Agora login success:", agoraUserId);
    } catch (e: any) {
      if (e?.code === 218) {
        console.log("ℹ️ Agora already logged in, skipping login");
        return;
      }
      throw e;
    }
  };

  // ✅ FIXED: New function to create Agora group with correct SDK signature
  const createAgoraGroupDirectly = async (
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

      // ✅ FIXED: Use correct SDK method signature
      // createGroup(options, groupName, desc, inviteMembers, inviteReason)
      const groupOptions = new ChatGroupOptions({
        style: ChatGroupStyle.PublicOpenJoin, // style 3 = public open join
        maxCount: 200,
        inviteNeedConfirm: false,
      });

      console.log("Agora Group Options:", JSON.stringify(groupOptions, null, 2));

      const result = await chatClient.groupManager.createGroup(
        groupOptions,
        groupName.trim(),
        `Group chat for ${groupName}`,
        membersToAdd,
        "Welcome to the group"
      );

      console.log("✅ Agora group created successfully:", {
        id: result.groupId,
        name: result.groupName,
        owner: result.owner,
        memberCount: result.memberCount
      });

      return result;
    } catch (error: any) {
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

      console.error("❌ Failed to create Agora group:", error);
      throw error;
    }
  };

  // ✅ FIXED: Main group creation function
  const handleCreateGroup = async () => {
    setLoading(true);

    try {
      const currentUserId: any = await getCurrentUserId();
      console.log("👤 Current user ID:", currentUserId);

      // ✅ 1. First login to Agora
      await initChat();
      await safeAgoraLogin(currentUserId.toString(), currentUserId);

      // ✅ 2. Prepare members list
      const allMembers = [...members, currentUserId.toString()];
      const uniqueMembers = Array.from(new Set(allMembers));

      console.log("📋 Final members list:", uniqueMembers);

      // ✅ 3. Backend API call to create group
      const formdata = new FormData();
      formdata.append("GroupName", GroupName as string);
      formdata.append("members", uniqueMembers.join(","));

      if (GroupImage && GroupImage !== "") {
        formdata.append("Image", GroupImage as string);
      } else {
        formdata.append("Image", "");
      }

      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        throw new Error("No authentication token found");
      }

      console.log("🚀 Calling backend API...");

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${apiUrl}/groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formdata,
      });

      const responseText = await response.text();
      console.log("📡 RAW Response:", responseText);

      let res;
      try {
        res = JSON.parse(responseText);
      } catch (error) {
        throw new Error(`Invalid JSON response from server`);
      }

      if (res?.success !== 1) {
        throw new Error(res?.msg || "Group creation failed on server");
      }

      const backendGroupId = res.group_id || res.GroupID || res.id;
      if (!backendGroupId) {
        throw new Error("Server error: Group ID not returned");
      }

      console.log("🎯 Backend Group ID:", backendGroupId);
      console.log("🏷️ Group Name:", res.group_name || GroupName);

      // ✅ 4. Create Agora group with SAME ID and NAME
      await createAgoraGroupDirectly(
        backendGroupId.toString(),  // groupId
        GroupName as string,        // groupName
        currentUserId.toString(),   // ownerId
        uniqueMembers               // allMembers
      );

      // ✅ 5. Show success and navigate
      Toast.show({
        type: "success",
        text1: "Group Created Successfully",
        text2: `"${GroupName}" is ready to chat!`,
      });

      // ✅ 6. Navigate to chat list screen (where chats and groups are shown)
      router.replace("/(tabs)/chats");

    } catch (error: any) {
      console.error("❌ handleCreateGroup error:", error);

      Toast.show({
        type: "error",
        text1: "Failed to create group",
        text2: error?.message || "Please try again",
      });

    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View className="w-full h-full flex items-center justify-center py-4">
        <ActivityIndicator size="large" color="#B06D1E" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-backgground">
      <Toast />
      <View
        className="bg-white flex-row justify-between items-center px-5 pt-10 pb-6 rounded-b-xl z-30"
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
            onPress={() => router.back()}
            className="border border-gray rounded-lg flex justify-center items-center w-8 h-8"
          >
            <Image
              source={icons.back}
              className="size-4"
              resizeMode="contain"
            />
          </TouchableOpacity>
          <Text className="leading-[22px] text-dark text-base font-medium tracking-[-0.41px]">
            Add Members
          </Text>
        </View>

        <TouchableOpacity onPress={handleCreateGroup}>
          <Text className="w-full text-primary font-medium text-base tracking-[-0.41px] leading-[22px]">
            Done
          </Text>
        </TouchableOpacity>
      </View>
      <View
        className="bg-white rounded-[22px] px-[22px] py-[20px] flex-1 mb-5 mt-4 mx-6"
        style={styles.shadow}
      >
        {loadingUsers ? (
          <View className="items-center justify-center py-10">
            <ActivityIndicator size="large" color="#C07618" />
          </View>
        ) : chatUsers.length === 0 ? (
          <View className="items-center justify-center py-10">
            <Text className="text-gray">No users found</Text>
          </View>
        ) : (
          <FlatList
            data={chatUsers}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: user }: { item: any }) => {
              const imageSource =
                user.image && typeof user.image === "object" && user.image.uri
                  ? { uri: MEDIA_BASE_URL + user.image.uri }
                  : icons.ic_user;

              return (
                <TouchableOpacity
                  onPress={() => handleSelectUser(user.id)}
                  className={`flex-row items-center mb-4 px-2 py-2 rounded-lg border ${members.includes(user.id) ? "border-primary bg-[#F3961D1F]" : "border-border bg-light-100"}`}
                >
                  <Image
                    source={imageSource}
                    className="w-[40px] h-[40px] rounded-full mr-3"
                    resizeMode="cover"
                  />
                  <View className="flex-1">
                    <Text className="font-medium text-base text-black">{user.name}</Text>
                    {user.location ? <Text className="text-gray text-xs">{user.location}</Text> : null}
                  </View>
                  {members.includes(user.id) && (
                    <Image source={icons.check} className="w-5 h-5" resizeMode="contain" />
                  )}
                </TouchableOpacity>
              )
            }}
          />
        )}
      </View>
    </View>
  );
}