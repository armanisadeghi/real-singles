import ProfileListItem from "@/components/ui/ProfileListItem";
import VideoCard from "@/components/ui/VideoCard";
import VirtualDateCard from "@/components/ui/VirtualDateCard";
import { VERTICAL_SPACING } from "@/constants/designTokens";
import { useDeviceSize } from "@/hooks/useResponsive";
import {
  getAllFeaturedVideos,
  getAllTopMatches,
  getAllVirtualDate
} from "@/lib/api";
import { useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Text,
  View
} from "react-native";


export default function TopMatches() {
  // const { category } = useLocalSearchParams();
    const params = useLocalSearchParams();
  const { gridColumns } = useDeviceSize();

  // ✅ Safely get category with fallback
  const category = (params.category as string) || "topMatches";  
  console.log("Category:", category);
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
          <ProfileListItem
            key={item.id}
            profile={item}
            navigateToFocus={true}
          />
        );

      default:
        return (
          <ProfileListItem
            key={item.id}
            profile={item}
            navigateToFocus={true}
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
      <View className="flex-1 bg-background">
        <StatusBar style="dark" backgroundColor="#ffffff" />
        {/* Native header is configured in _layout.tsx - no custom header needed */}
        <View className="mt-4">
          {/* Use single-column for topMatches profiles, 2-column for videos/virtualDates */}
          {category === "topMatches" ? (
            <FlatList
              data={data}
              contentContainerStyle={{ 
                paddingBottom: 150,
                gap: VERTICAL_SPACING.xs,
              }}
              renderItem={renderItem}
              keyExtractor={(item, idx) => item.id ? item.id.toString() : idx.toString()}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={() => (
                <View className="flex-1 justify-center items-center py-20">
                  <Text className="text-gray">
                    No {getCategoryTitle()} available
                  </Text>
                </View>
              )}
            />
          ) : (
            <FlatList
              key={`grid-${gridColumns}`}
              data={data}
              numColumns={gridColumns}
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
          )}
        </View>
      </View>
    </>
  );
}
