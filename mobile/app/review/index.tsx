import LinearBg from "@/components/LinearBg";
import NotificationBell from "@/components/NotificationBell";
import GradientButton from "@/components/ui/GradientButton";
import { BACKGROUND_COLORS } from "@/components/ui/ProfileCard";
import { icons } from "@/constants/icons";
import { addUpdateRating } from "@/lib/api";
import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { AntDesign } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

export default function Review() {
  const router = useRouter();
  const [comment, setComment] = useState("");
  const [rating, setRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedRating, setSubmittedRating] = useState(0);
  const [submittedComment, setSubmittedComment] = useState("");

  const { userId, userName, userImage, userRating } = useLocalSearchParams();
  const userImageStr = Array.isArray(userImage) ? userImage[0] : userImage;

  console.log("userId:", userId);
  console.log("userName:", userName);
  console.log("userImage:", userImage);
  console.log("userRating:", userRating);

  const handleReview = async () => {
    if (rating === 0) {
      Toast.show({
        type: "error",
        text1: "Please give a rating.",
        position: "bottom",
        visibilityTime: 2000,
      });
      return;
    }
    try {
      const data = new FormData();
      const userIdStr = Array.isArray(userId) ? userId[0] : userId;
      data.append("OtherID", userIdStr);
      data.append("Rating", rating.toString());
      data.append("comment", comment);
      console.log("Submitting review with data:", data);

      setLoading(true);
      const res = await addUpdateRating(data);
      console.log("Review submission response:", res);

      if (res?.success) {
        Toast.show({
          type: "success",
          text1: res?.msg || "Review submitted successfully",
          position: "bottom",
          visibilityTime: 2000,
        });
        console.log("Review submitted successfully:", res);
        setSubmittedRating(rating);
        setSubmittedComment(comment);
        setComment("");
        setRating(0);
        setSubmitted(true);
      } else {
        Toast.show({
          type: "error",
          text1: res?.msg || "Failed to submit review",
          position: "bottom",
          visibilityTime: 2000,
        });
        console.log("Failed to submit review:", res);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      Toast.show({
        type: "error",
        text1: "An error occurred while submitting your review.",
        position: "bottom",
        visibilityTime: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  const bgColor = useMemo(() => {
    const seed = userId || userName || "";
    const index = Math.abs(
      seed
        .toString()
        .split("")
        .reduce((acc, char) => {
          return acc + char.charCodeAt(0);
        }, 0) % BACKGROUND_COLORS.length
    );
    return BACKGROUND_COLORS[index];
  }, [userId]);

  const getInitial = () => {
    const userNameStr = Array.isArray(userName) ? userName[0] : userName;
    if (!userNameStr) return "?";

    const nameParts = userNameStr.split(" ");
    if (nameParts.length === 1) {
      return nameParts[0].charAt(0).toUpperCase();
    } else {
      return (
        nameParts[0].charAt(0).toUpperCase() +
        nameParts[nameParts.length - 1].charAt(0).toUpperCase()
      );
    }
  };

  const displayContent = () => {
    if (userImageStr) {
      // If it's already a full URL, use it directly
      if (userImageStr.startsWith("http://") || userImageStr.startsWith("https://")) {
        return {
          type: "image",
          source: { uri: userImageStr },
        };
      }
      
      // Otherwise, prepend the appropriate base URL
      if (userImageStr.startsWith("uploads/")) {
        return {
          type: "image",
          source: { uri: `${IMAGE_URL}${userImageStr}` },
        };
      } else {
        return {
          type: "image",
          source: { uri: `${VIDEO_URL}${userImageStr}` },
        };
      }
    }

    // Return initials with background color
    return {
      type: "initials",
      initials: getInitial(),
      bgColor: bgColor,
    };
  };

  const content = displayContent();

  return (
    <>
      {/* <StatusBar barStyle="dark-content" backgroundColor="#ffffff" /> */}

      <View className="flex-1 bg-backgground">
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
            <Text className="leading-[22px] text-dark text-base font-medium tracking-[-0.41px]">
              Review
            </Text>
          </View>

          <NotificationBell />
        </View>
        <Toast />
        {!submitted ? (
          <View className="mt-10 px-4">
            <View className="mb-6">
              <Text className="text-primary font-bold text-lg">
                Write Review
              </Text>
              <Text className="text-[#686A6F] font-normal text-sm">
                Your opinion matter!
              </Text>
            </View>
            <View
              style={[styles.shadow, { borderRadius: 20 }]}
              className="bg-white p-6"
            >
              <View className="flex-row items-center gap-12 mb-6">
                <View className="w-[75px] h-[75px] rounded-full overflow-hidden">
                  {userImageStr ? (
                    <Image
                      source={{
                        uri: userImageStr.startsWith("http")
                          ? userImageStr
                          : (userImageStr.startsWith("uploads/")
                              ? IMAGE_URL + userImageStr
                              : VIDEO_URL + userImageStr),
                      }}
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      className="w-full h-full rounded-full justify-center items-center"
                      style={{ backgroundColor: content.bgColor }}
                    >
                      <Text className="text-white text-2xl font-bold">
                        {content.initials}
                      </Text>
                    </View>
                  )}
                </View>
                <View>
                  <Text className="text-gray text-sm font-normal">Rating</Text>
                  {/* rating stars 5 */}
                  <View className="flex-row mt-2 gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <TouchableOpacity
                        key={star}
                        onPress={() => setRating(star)}
                        activeOpacity={0.7}
                      >
                        <AntDesign
                          name={(star <= rating ? "star" : "star-o") as any}
                          size={28}
                          color={star <= rating ? "#B06D1E" : "#D1D1D1"}
                        />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View className="mb-6">
                <Text className="text-gray text-sm mb-2 font-normal">
                  Comments
                </Text>
                <View className="relative py-[13px] px-[15px] border border-border rounded-2xl bg-light-100">
                  <TextInput
                    multiline={true}
                    numberOfLines={6}
                    maxLength={300}
                    placeholder="Write your review here..."
                    placeholderTextColor="#B0B0B0"
                    value={comment}
                    onChangeText={setComment}
                    textAlignVertical="top"
                    style={{
                      height: 120, // Fixed height instead of relying on numberOfLines
                      paddingBottom: 20, // Space for the counter
                    }}
                  />
                  <Text className="absolute bottom-3 right-3 text-xs text-gray">
                    {comment.length || 0}/300
                  </Text>
                </View>
              </View>

              <GradientButton
                text={loading ? "Submitting..." : "Submit Review"}
                containerStyle={{
                  marginVertical: 20,
                  width: "100%",
                  marginHorizontal: "auto",
                }}
                onPress={handleReview}
              />
            </View>
          </View>
        ) : (
          <View className="mt-28 px-4">
            <View
              style={[styles.shadow, { borderRadius: 20 }]}
              className="bg-white p-6 relative"
            >
              <View className="flex-row justify-center mb-6">
                <View className="w-36 h-36 rounded-full mt-[-80px] border-2 border-white overflow-hidden">
                  <Image
                    source={
                      userImage
                        ? { uri: userImage.startsWith('http') ? userImage : VIDEO_URL + userImage }
                        : icons.ic_user
                    }
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                </View>
              </View>

              <View className="mb-6">
                <View className="flex-row my-2 mx-auto gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} activeOpacity={1}>
                      <AntDesign
                        name={(star <= submittedRating ? "star" : "star-o") as any}
                        size={28}
                        color={star <= submittedRating ? "#B06D1E" : "#D1D1D1"}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text className="font-bold text-xl text-center text-dark my-2">
                  Your Opinion Matter!
                </Text>
                <Text className="text-center font-normal text-sm text-gray leading-5">
                  {submittedComment}
                </Text>
              </View>

              <View className="flex-col gap-4 my-10">
                <TouchableOpacity
                  onPress={() => router.replace("/(tabs)")}
                  className="shadow-lg shadow-white rounded-[99] overflow-hidden"
                >
                  <LinearBg className="px-6">
                    <Text className="text-center text-white font-medium py-5">
                      Return to Home
                    </Text>
                  </LinearBg>
                </TouchableOpacity>
                <TouchableOpacity
                  className="py-5 bg-light-100 rounded-[99]"
                  onPress={() => router.back()}
                >
                  <Text className="text-center text-gray font-medium">
                    No Thanks
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#000000",
    shadowOffset: { width: 2, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
});
