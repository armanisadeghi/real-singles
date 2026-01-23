import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

export default function AuthHome() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState({
    title: "",
    image: null,
    description: "",
    modalImage: null,
  });

  const { width } = useWindowDimensions();
  const router = useRouter();

  const itemWidth = (width - 40 - 16) / 2;

  const features = [
    // {
    //   title: "Smart Matching",
    //   image: images.samrtmatch,
    //   description: "Experience intelligent matchmaking that goes beyond surface-level connections. Our smart algorithm considers your preferences, behavior, and compatibility factors to find your perfect match.",
    //   modalImage: images.samrtmatchModal,
    // },
    {
      title: "Virtual Speed Dating",
      image: images.virtual,
      description: "Connect with potential matches through our innovative virtual speed dating platform. Enjoy meaningful conversations and build genuine connections from the comfort of your home.",
      modalImage: images.samrtmatchModal,
    },
    // {
    //   title: "Local Events",
    //   image: images.locationEvent,
    //   description: "Discover and participate in curated local events designed for singles. From casual meetups to organized activities, find opportunities to meet like-minded people in your area.",
    //   modalImage: images.samrtmatchModal,
    // },
    // {
    //   title: "Location-Based Matches",
    //   image: images.location,
    //   description: "Find matches near you with our location-based matching system. Connect with people in your vicinity and turn online connections into real-world relationships.",
    //   modalImage: images.samrtmatchModal,
    // },
     // {
    //   title: "Privacy and Security",
    //   image: images.privacy,
    //   description: "Your safety is our priority. Enjoy secure dating with verified profiles, privacy controls, and advanced security measures to ensure a safe and comfortable dating experience.",
    //   modalImage: images.samrtmatchModal,
    // },
    {
      title: "Interests & Hobbies",
      image: images.interest,
      description: "Connect through shared passions and interests. Our platform helps you find people who share your hobbies and lifestyle, making it easier to build meaningful relationships.",
      modalImage: images.samrtmatchModal,
    },
    {
      title: "Verification & Video Profile",
      image: icons.ic_welcome1,
      description: "To improve safety and combat fake profiles, RealSingles goes over and beyond to verify everyone's identity. We use factial recognition technology, video verification, selfie verification (one selfie taken on the our app date stamped and visible to everyone) and confirming phone numbers to ensur that users are genuine. The goal is to ensure users are who they claim to be and deter catfishing and other scams.",
      modalImage: images.samrtmatchModal,
    },
    {
      title: "Events",
      image: icons.ic_welcome2,
      description: "Are you tired of swiping and reading profiles? Are you someone that enjoys meeting people face to face? Our events offer a fresh alternative to just online searches. We hold events in many markets to provide you an opportunity to meet many quality singles in one night. We also allow our members to create their own events and invite our members to attend. This allows us to bring the virtual into reality. What's even better, you get rewarded for it.",
      modalImage: images.samrtmatchModal,
    },
    // {
    //   title: "Virtual Speed Dating",
    //   image: icons.ic_welcome3,
    //   description: "Are you a busy person that does not have time to keep swiping? Would you like to have a live 3 minute conversation with 5-7 potential matches? This is for you! Once a week you have an opportunity to participate in a 30 minute live virtual speed dating and connecting with several matches for 3 minute each.",      
    //   modalImage: images.samrtmatchModal,
    // },
    {
      title: "Rewards",
      image: icons.ic_welcome4,
      description: "Real singles is committed to authenticity and weeding out bad actores. We Reward our members As they help us verify accounts and screen out fakes in our effort to build a safe community full of real prospects. Earn rewards for different activities such as refers someone to our site, and get rewarded. Write a positive review on someone you personally know or have met and get rewarded. Play wingman by matching couples on the app and get rewarded... Rewards are redeemable for products and services through our store.",
      modalImage: images.samrtmatchModal,
    },
    {
      title: "Reviews",
      image: icons.ic_welcome5,
      description: "Wouldn't it be great to get a third party verification by somone that knows your match personaly or have met them. Well our Reviews offer just that. If you see somone you personally know or someone you have met before on the app, take a minute and write a brief review. You will get reward points and they get a positive review that set them appart from others.",
      modalImage: images.samrtmatchModal,
    },
    // {
    //   title: "Wingman",
    //   image: icons.ic_welcome6,
    //   description: "On RealSingles we welcome non-singles to have a limited access account to play wingman for their friends. A wingman is a supportive friend who assists others to connect with and attract the best potential match. As you play wingman weather you are single or just on to play wingman, you earn rewards for your efforts.",
    //   modalImage: images.samrtmatchModal,
    // },
    // {
    //   title: "Coaching & Resources",
    //   image: icons.ic_welcome7,
    //   description: "Dating in the current environment is not easy so we are here to help. Whether you are looking for resources to help improve your profile or you would like to work with a dating coach we got you covered.",
    //   modalImage: images.samrtmatchModal,
    // },
    // {
    //   title: "VIP Matchmakers",
    //   image: icons.ic_welcome8,
    //   description: "Tires of swiping? Would love to work with a Matchmaker the will curate your perfect match but can't afford to pay $10k to $100K Well, we have you covered! coming Soon, we will feature professional matchmakers that you can hire for an additional fee and they will provide you with personized matches based on your preferences. Stay tuned!",
    //   modalImage: images.samrtmatchModal,
    // },
  ];

  const openModal = (feature: any) => {
    setSelectedFeature(feature);
    setModalVisible(true);
  };

  return (
    <>
      <ScrollView className="flex-1 bg-white" 
      contentContainerStyle={{ paddingVertical: Platform.OS == 'android' ? 20 : 70 }} >
        <View className="mt-12">
          <Image
            source={images.logo}
            className="mx-auto w-32 h-28"
          />
          <Text className="text-center mt-3 text-dark">
            Discover Amazing Features
          </Text>
            <TouchableOpacity className="mt-3" onPress={() => router.push("/(auth)/login")}>
              <Text className="text-center text-primary font-bold">
                Get Started
              </Text>
            </TouchableOpacity>
        </View>
        <View className="mt-6 md:mt-8 px-5 flex flex-row flex-wrap justify-center gap-4">
          {features.map((feature, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => openModal(feature)}
              style={{ width: itemWidth, height: itemWidth }}
              className="relative flex flex-col justify-between items-center border-2 border-secondary overflow-hidden rounded-2xl md:rounded-3xl"
            >
              <Image
                source={images.wavy}
                className="absolute bottom-0 opacity-40 w-full"
                resizeMode="cover"
              />
              <Text className="text-center mt-6 md:mt-5 text-sm md:text-base font-bold px-5 text-black">
                {feature.title}
              </Text>
              <Image 
                source={feature.image} 
                className="mb-4 md:mb-7"
                resizeMode="contain"
                style={{ width: itemWidth * 0.5, height: itemWidth * 0.4 }}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50">
          <View className="w-10/12 bg-white p-6 rounded-2xl">
            <View className="flex-row-reverse justify-between items-center mb-4">
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Image
                  source={icons.Close}
                  className="w-6 h-6"
                />
              </TouchableOpacity>
            </View>

            {selectedFeature.modalImage && (
              <Image
                source={selectedFeature.modalImage}
                className="w-32 h-32 mx-auto"
                resizeMode="contain"
              />
            )}
            <Text className="text-center text-primary font-bold mt-8 text-[18px]">
              {selectedFeature.title}
            </Text>
            <Text className="text-gray leading-5 mb-5 text-center mt-4 text-[11px]">
              {selectedFeature.description}
            </Text>
          </View>
        </View>
      </Modal>
    </>
  );
}
