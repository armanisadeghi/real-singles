import { IMAGE_URL, VIDEO_URL } from "@/utils/token";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View
} from "react-native";


interface ReviewProfileProps {
  data: any;
  onSubmit: () => void;
  onBack: () => void;
  isLoading: boolean;
  error: string;
  isSubmitted?: boolean
}

const ReviewProfile = ({
  data,
  onSubmit,
  onBack,
  isLoading,
  error,
  isSubmitted,
}: ReviewProfileProps) => {

  console.log("ReviewProfile data:", data);
  console.log('isSubmitted===>>>>>>', isSubmitted);


  // Helper function to format array data
  const formatArrayData = (arr: any[]) => {
    if (!arr || arr.length === 0) return "None";
    return arr.filter(Boolean).join(", ");
  };

  // Format date of birth
  const formatDOB = (dob: string) => {
    if (!dob) return "Not provided";
    const date = new Date(dob);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const capitalizeWords = (str: string): string => {
    if (!str) return "";
    return str
      .split(" ")
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView className="px-4 mt-16 pb-16">
        <Text className="text-2xl font-bold text-primary text-center mb-6">
          Review Your Profile
        </Text>

        {error ? (
          <View className="bg-red-100 p-3 rounded-lg mb-4">
            <Text className="text-red-600">{error}</Text>
          </View>
        ) : null}

        <Text className="text-lg font-semibold text-primary mb-2">
          Profile Photo
        </Text>
        <View className="items-start mb-6">
          {data.Image ? (
            <Image
              source={{ uri: VIDEO_URL + data.Image }}
              className="w-24 h-24 rounded-full"
            />
          ) : data.livePicture ? (
            <Image
              source={{
                uri: IMAGE_URL + data.livePicture.split(",")[0], // ✅ pick only first one
              }}
              className="w-24 h-24 rounded-full"
            />
          ) : (
            <View className="w-24 h-24 rounded-full bg-gray-300 items-center justify-center">
              <Text className="text-gray-500">No Photo</Text>
            </View>
          )}
        </View>
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-primary mb-2">
            Basic Information
          </Text>
          <InfoRow label="Name" value={`${data.FirstName} ${data.LastName}`} />
          <InfoRow label="Display Name" value={data.DisplayName} />
          <InfoRow label="Email" value={data.Email} />
          <InfoRow label="Phone" value={data.Phone || "Not provided"} />
          <InfoRow label="Date of Birth" value={data.DOB} />
          <InfoRow label="Gender" value={capitalizeWords(data.Gender)} />
          <InfoRow label="Horographic Sign" value={data.HSign || "Not provided"} />
          <InfoRow label="City" value={data.City || "Not provided"} />
          <InfoRow label="State" value={data.State || "Not provided"} />
        </View>

        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-primary mb-2">
            Personal Details
          </Text>
          <InfoRow label="Marital Status" value={capitalizeWords(data.MaritalStatus)} />
          <InfoRow label="Have Children" value={data.HaveChild || "No"} />
          <InfoRow label="Want Children" value={capitalizeWords(data.WantChild) || "No"} />
          <InfoRow
            label="Height"
            value={data.Height ? `${data.Height.toFixed(1)} feet` : "Not provided"}
          />
          <InfoRow label="Body Type" value={data.BodyType || "Not provided"} />
          <InfoRow label="Ethnicity" value={data.Ethniticity || "Not provided"} />
          <InfoRow label="Religion" value={capitalizeWords(data.Religion) || "Not provided"} />
          <InfoRow
            label="Political Views"
            value={data.Political || "Not provided"}
          />
        </View>

        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-primary mb-2">
            Education & Career
          </Text>
          <InfoRow label="Education" value={capitalizeWords(data.Education) || "Not provided"} />
          <InfoRow
            label="Schools"
            value={
              data.School && data.School.length
                ? formatArrayData(data.School)
                : "Not provided"
            }
          />
          <InfoRow label="Job Title" value={data.JobTitle || "Not provided"} />
          <InfoRow label="Company" value={data.Company || "Not provided"} />
        </View>

        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-primary mb-2">
            Lifestyle
          </Text>
          <InfoRow
            label="Marijuana Use"
            value={data.Marijuna || "Not provided"}
          />
          <InfoRow label="Smoking" value={capitalizeWords(data.Smoking) || "Not provided"} />
          <InfoRow label="Drinking" value={data.Drinks || "Not provided"} />
          <InfoRow label="Pets" value={capitalizeWords(data.Pets) || "Not provided"} />
          <InfoRow label="Languages" value={capitalizeWords(data.Language) || "Not provided"} />
        </View>

        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <Text className="text-lg font-semibold text-primary mb-2">
            About Me
          </Text>
          <Text className="text-gray-700 mb-3">{data.About || "Not provided"}</Text>

          <Text className="text-gray-800 font-medium mb-1">Craziest Things:</Text>
          <Text className="text-gray-700 mb-3">
            {data.CraziestThings || "Not provided"}
          </Text>

          <Text className="text-gray-800 font-medium mb-1">Interests:</Text>
          <Text className="text-gray-700">
            {data.Interest && data.Interest.length
              ? formatArrayData(data.Interest)
              : "Not provided"}
          </Text>
        </View>

        <View className="flex-row gap-4 mt-4 mb-20">
          <TouchableOpacity
            onPress={onBack}
            className="flex-1 py-3 px-4 rounded-full border border-border bg-light-100"
          >
            <Text className="text-gray text-center font-medium">Go Back</Text>
          </TouchableOpacity>

          {!isSubmitted &&
            <TouchableOpacity
              onPress={onSubmit}
              disabled={isLoading}
              activeOpacity={0.7}
              style={{
                alignSelf: "stretch",
                borderRadius: 20,
                overflow: "hidden",
              }}
            >
              <LinearGradient
                colors={["#B06D1E", "#DCA469"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                  height: 44,            // slightly increased
                  width: "100%",
                  borderRadius: 20,      // 👈 SAME radius
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 40,
                }}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "600" }}>
                    Submit Profile
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

          }
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Helper component for displaying information rows
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <View className="flex-row justify-between py-2 border-b border-gray-100">
    <Text className="text-gray-800 font-medium mr-2 w-[35%]">
      {label}
    </Text>

    <Text className="text-gray-700 flex-1 text-right">
      {value}
    </Text>
  </View>
);


export default ReviewProfile;