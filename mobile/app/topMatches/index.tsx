import NotificationBell from "@/components/NotificationBell";
import ProfileCard from "@/components/ui/ProfileCard";
import VideoCard from "@/components/ui/VideoCard";
import VirtualDateCard from "@/components/ui/VirtualDateCard";
import { icons } from "@/constants/icons";
import {
  getAllFeaturedVideos,
  getAllTopMatches,
  getAllVirtualDate
} from "@/lib/api";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Text,
  TouchableOpacity,
  View
} from "react-native";


export default function TopMatches() {
  // const { category } = useLocalSearchParams();
    const params = useLocalSearchParams();

  // ✅ Safely get category with fallback
  const category = (params.category as string) || "topMatches";  
  console.log("Category:", category);
  const router = useRouter();
  const [data, setData] = useState();
  const [loading, setLoading] = useState(false);


  
  

  const fetchAllTopMatches = async () => {
    setLoading(true);
    try {
      const res = await getAllTopMatches();
      console.log("Response from getAllTopMatches:", res);
      
      if (res?.success) {
        setData(res.data);
      } else {
        console.log(res?.msg || "Failed to fetch top matches");
      }
    } catch (error) {
      console.error("Error fetching top matches:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAllfeaturedVideos = async () => {
    setLoading(true);
    try {
      const res = await getAllFeaturedVideos();
      console.log("Featured Videos Response:", res);
      
      if (res?.success) {
        setData(res.data);
      } else {
        console.log(res?.msg || "Failed to fetch top matches");
      }
    } catch (error) {
      console.error("Error fetching top matches:", error);
    } finally {
      setLoading(false);
    }
  };
  const fetchAllVirtual = async () => {
    setLoading(true);
    try {
      const res = await getAllVirtualDate();
      if (res?.success) {
        setData(res?.data);
      } else {
        console.log(res?.msg || "Failed to fetch top matches");
      }
    } catch (error) {
      console.error("Error fetching top matches:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (category === "topMatches") {
      fetchAllTopMatches();
    } else if (category === "featuredVideos") {
      fetchAllfeaturedVideos();
    } else if (category === "virtualDates") {
      fetchAllVirtual();
    } else {
      console.log("No category selected or invalid category");
      fetchAllTopMatches();
    }
  }, [category]);

  const getCategoryTitle = () => {
    switch (category) {
      case "topMatches":
        return "Top Matches";
      case "featuredVideos":
        return "Featured Videos";
      case "virtualDates":
        return "Virtual Speed Dating";
      default:
        return "Top Matches";
    }
  };

  const renderItem = ({ item }: any) => {
    switch (category) {
      case "featuredVideos":
        return <VideoCard key={item?.ID} video={item} isVideo={true} />;
      case "virtualDates":
        return (
          <VirtualDateCard
            key={item.id}
            virtualDate={item}
          />
        );
      case "topMatches":
        return (
          <ProfileCard
            key={item.id}
            profile={item}
          />
        );

      default:
        return (
          <ProfileCard
            key={item.id}
            profile={item}
          />
        );
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#B06D1E" />
      </View>
    );
  }
  return (
    <>
     
      <View className="flex-1 bg-backgground">
         <StatusBar style="dark" backgroundColor="#ffffff" />

        <View
          className="bg-white flex-row justify-between items-center px-4 pt-20 pb-6 rounded-b-xl z-30"
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
              {getCategoryTitle()}
            </Text>
          </View>

          <NotificationBell />
        </View>
        <View className="mt-4">
          <FlatList
            data={data}
            numColumns={2}
            columnWrapperStyle={{
              justifyContent: "space-between",
              marginBottom: 20,
              paddingHorizontal: 20,
              gap: 20,
            }}
            contentContainerStyle={{ paddingBottom: 150 }}
            renderItem={renderItem}
            keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View className="flex-1 justify-center items-center">
                <Text className="text-gray">
                  No {getCategoryTitle()} available
                </Text>
              </View>
            )}
          />
        </View>
      </View>
    </>
  );
}
