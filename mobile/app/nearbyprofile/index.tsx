import NotificationBell from "@/components/NotificationBell";
import { PlatformIcon } from "@/components/ui";
import { icons } from "@/constants/icons";
import { fetchUserProfile, getAllNearBy } from "@/lib/api";
import { User } from "@/types";
import { requestPermissionWithExplanation } from "@/utils/permissions";
import { getCurrentUserId, VIDEO_URL } from "@/utils/token";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  BackHandler,
  Image,
  Modal,
  Platform,
  PlatformColor,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
  useWindowDimensions,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeColors } from "@/context/ThemeContext";

export default function NearBy() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = useThemeColors();
  const mapRef = useRef<any>(null);

  const themedColors = useMemo(() => ({
    background: Platform.OS === 'ios' ? (PlatformColor('systemBackground') as unknown as string) : colors.background,
    secondaryBackground: Platform.OS === 'ios' ? (PlatformColor('secondarySystemBackground') as unknown as string) : colors.surfaceContainer,
    text: Platform.OS === 'ios' ? (PlatformColor('label') as unknown as string) : colors.onSurface,
    secondaryText: Platform.OS === 'ios' ? (PlatformColor('secondaryLabel') as unknown as string) : colors.onSurfaceVariant,
    // System accent colors
    systemPink: Platform.OS === 'ios' ? (PlatformColor('systemPink') as unknown as string) : '#B06D1E',
    systemOrange: Platform.OS === 'ios' ? (PlatformColor('systemOrange') as unknown as string) : '#FFB72B',
  }), [isDark, colors]);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [userLocation, setUserLocation] = useState({
    latitude: 37.78825, // Default location (San Francisco)
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [showUserModal, setShowUserModal] = useState(false);
  const [profile, setProfile] = useState<User | null>(null);

  // Android hardware back button handling
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      router.back();
      return true;
    });
    return () => backHandler.remove();
  }, []);

  console.log("selectedUser in nerby", selectedUser);


  const zoomIn = () => {
    if (mapRef.current) {
      try {
        mapRef.current.getCamera().then((camera: any) => {
          const newZoom = camera.zoom ? camera.zoom + 1 : 16;
          mapRef.current.animateCamera(
            {
              ...camera,
              zoom: newZoom,
            },
            { duration: 300 }
          );
        });
      } catch (error) {
        // Fallback method if camera API fails
        const region = {
          ...userLocation,
          latitudeDelta: userLocation.latitudeDelta / 2,
          longitudeDelta: userLocation.longitudeDelta / 2,
        };
        mapRef.current.animateToRegion(region, 300);
      }
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      try {
        mapRef.current.getCamera().then((camera: any) => {
          const newZoom = camera.zoom ? camera.zoom - 1 : 14;
          mapRef.current.animateCamera(
            {
              ...camera,
              zoom: newZoom,
            },
            { duration: 300 }
          );
        });
      } catch (error) {
        // Fallback method if camera API fails
        const region = {
          ...userLocation,
          latitudeDelta: userLocation.latitudeDelta * 2,
          longitudeDelta: userLocation.longitudeDelta * 2,
        };
        mapRef.current.animateToRegion(region, 300);
      }
    }
  };

  const goToMyLocation = async () => {
    try {
      const coords = await getUserLocation();
      if (mapRef.current && coords) {
        mapRef.current.animateToRegion(
          {
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          },
          1000
        );
      }
    } catch (error) {
      console.error("Error going to current location:", error);
    }
  };

  const getUserLocation = async () => {
    // Use centralized permission utility with pre-explanation for better iOS UX
    const granted = await requestPermissionWithExplanation("location", {
      title: "Location Access",
      message: "RealSingles needs your location to show you nearby singles on the map.",
    });
    
    if (!granted) {
      console.log("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setUserLocation({
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    });
    return location.coords;
  };

  const fetchAllNearby = async () => {
    setLoading(true);
    const coords = await getUserLocation();
    console.log("coords in fetchAllNearby", coords);


    const formData = new FormData();
    formData.append(
      "Latitude",
      coords ? coords.latitude.toString() : "37.4220936"
    );
    formData.append(
      "Longitude",
      coords ? coords.longitude.toString() : "-122.083922"
    );
    console.log("Form Data for Nearby Profiles:", formData);

    try {
      const res = await getAllNearBy(formData);
      console.log("Response from getAllNearBy:", res);
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

  const fetchUserData = async () => {
    try {
      const userid = await getCurrentUserId();
      if (!userid) {
        console.error("User ID not found");
        return;
      }
      const res = await fetchUserProfile(userid);
      if (res?.success) {
        setProfile(res?.data);
        console.log("User profile fetched successfully:", res?.data);
      } else {
        console.error(res?.msg || "Failed to fetch user profile");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    Promise.all([fetchAllNearby(), fetchUserData()]);
  }, []);

  useFocusEffect(
    useCallback(() => {
      // 👇 Screen focus hone par chalega
      console.log('Screen focused');
      fetchAllNearby();

      return () => {
        // 👇 Screen blur / unfocus hone par chalega
        console.log('Screen unfocused');
      };
    }, [])
  );

  // Primary color for loading indicators
  const primaryColor = Platform.OS === 'ios' 
    ? (PlatformColor('systemPink') as unknown as string) 
    : '#B06D1E';

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color={primaryColor} />
      </View>
    );
  }
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
  return (
    <View className="flex-1">
      {/* Full-screen Map */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={userLocation}
        showsUserLocation
        showsMyLocationButton
        ref={mapRef}
      >
        <Marker
          coordinate={{
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
          }}
          title="You are here"
        >
          <View className="rounded-full">
            {profile?.Image ? (
              <Image
                source={{ uri: profile.Image.startsWith('http') ? profile.Image : VIDEO_URL + profile.Image }}
                className="w-10 h-10 rounded-full"
                resizeMode="contain"
              />
            ) : (
              <View
                className="w-10 h-10 rounded-full justify-center items-center"
                style={{
                  backgroundColor:
                    BACKGROUND_COLORS[
                    Math.abs(
                      (profile?.DisplayName || "User")
                        .split("")
                        .reduce(
                          (acc, char) => acc + char.charCodeAt(0),
                          0
                        ) % BACKGROUND_COLORS.length
                    )
                    ],
                }}
              >
                <Text className="text-white font-bold">
                  {profile?.DisplayName
                    ? profile.DisplayName.split(" ")
                      .map((part) => part.charAt(0))
                      .slice(0, 2)
                      .join("")
                      .toUpperCase()
                    : "U"}
                </Text>
              </View>
            )}
          </View>
        </Marker>


        {data &&
          data.map((user: any, index) => {
            console.log("user.id", user.id);

            // Parse latitude and longitude as numbers if available
            const lat = user.latitude ? Number(user.latitude) : 37.4220936 + index * 0.001;
            const lng = user.longitude ? Number(user.longitude) : -122.083922 + index * 0.001;
            return (
              <Marker
                key={index}
                coordinate={{
                  latitude: lat,
                  longitude: lng,
                }}
                onPress={() => {
                  console.log("selected user details:",user);
                  setSelectedUser(user);
                  setShowUserModal(true);
                }}
              >
                <View className="items-center">
                  <View
                    // onPress={() => router.push(`/profiles/${user?.id}`)} 
                    className="bg-white p-1 rounded-full shadow-md">
                    {user?.Image ? (
                      <Image
                        source={{ uri: user.Image.startsWith('http') ? user.Image : VIDEO_URL + user.Image }}
                        className="w-10 h-10 rounded-full"
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        className="w-10 h-10 rounded-full justify-center items-center"
                        style={{
                          backgroundColor:
                            BACKGROUND_COLORS[
                            Math.abs(
                              (user?.DisplayName || "User")
                                .split("")
                                .reduce(
                                  (acc: any, char: any) => acc + char.charCodeAt(0),
                                  0
                                ) % BACKGROUND_COLORS.length
                            )
                            ],
                        }}
                      >
                        <Text className="text-white font-bold">
                          {user?.DisplayName
                            ? user.DisplayName.split(" ")
                              .map((part: any) => part.charAt(0))
                              .slice(0, 2)
                              .join("")
                              .toUpperCase()
                            : "User"}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View className="bg-primary px-2 py-1 rounded-lg mt-1">
                    <Text className="text-white text-xs font-medium">
                      {user.distance_in_km
                        ? `${Number(user.distance_in_km).toFixed(1)} km`
                        : ""}
                    </Text>
                  </View>
                </View>
              </Marker>
            )
          })}
      </MapView>

      {/* Map Controls */}
      <View
        style={styles.mapControlsContainer}
        className="absolute right-4 bottom-40 z-10"
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            goToMyLocation();
          }}
          style={styles.mapControlButton}
          className="bg-white rounded-full shadow-md  mb-2"
        >
          <PlatformIcon
            name="location-on"
            iosName="location.fill"
            size={20}
            color={themedColors.systemPink}
          />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            zoomIn();
          }}
          style={styles.mapControlButton}
          className="bg-white rounded-full shadow-md mb-2"
        >
          <Text style={styles.mapControlText}>+</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            zoomOut();
          }}
          style={styles.mapControlButton}
          className="bg-white rounded-full shadow-md mb-2"
        >
          <Text style={styles.mapControlText}>-</Text>
        </TouchableOpacity>
      </View>

      {/* Header Bar (Floating) */}
      <View
        style={[styles.headerContainer, { paddingTop: insets.top + 8, backgroundColor: themedColors.background }]}
        className="flex-row justify-between items-center px-4 pb-4 absolute top-0 left-0 right-0 z-10"
      >
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            className="border border-gray rounded-lg flex justify-center items-center w-8 h-8 shadow-sm"
            style={{ backgroundColor: themedColors.background }}
          >
            <PlatformIcon name="chevron-left" size={16} color={themedColors.text} />
          </TouchableOpacity>
          <View className="px-3 py-1 rounded-lg shadow-sm" style={{ backgroundColor: themedColors.background }}>
            <Text className="text-base font-medium tracking-[-0.41px]" style={{ color: themedColors.text }}>
              Nearby Profiles
            </Text>
          </View>
        </View>

        <View className="rounded-lg shadow-sm" style={{ backgroundColor: themedColors.background }}>
          <NotificationBell />
        </View>
      </View>

      {/* User Profile Modal */}
      <Modal
        transparent={true}
        visible={showUserModal}
        animationType="slide"
        onRequestClose={() => {
          setShowUserModal(false);
          setSelectedUser(null);
        }}
      >
        <View style={[styles.modalContainer, { justifyContent: 'flex-end' }]}>
          <View style={[styles.modalContent, { height: '60%', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: themedColors.background }]}>
            {selectedUser && (
              <>
                <View className="relative w-full h-80 rounded-t-2xl overflow-hidden">
                  <Image
                    source={
                      selectedUser?.Image
                        ? { uri: selectedUser.Image.startsWith('http') ? selectedUser.Image : VIDEO_URL + selectedUser?.Image }
                        : icons.placeholder
                    }
                    style={{ width: "100%", height: "100%", resizeMode: 'cover' }}
                  />
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.7)"]}
                    style={[styles.gradient, { height: '100%' }]}
                  />
                  <View className="absolute bottom-3 left-4">
                    <Text className="text-white text-xl font-bold">
                      {selectedUser?.DisplayName}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <PlatformIcon
                        name="location-on"
                        size={16}
                        color="#ffffff"
                        style={{ marginRight: 4 }}
                      />
                      <Text className="text-white">
                        {selectedUser?.distance_in_km
                          ? `${Number(selectedUser.distance_in_km).toFixed(1)} km away`
                          : "Nearby"}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.closeButton}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setShowUserModal(false);
                      setSelectedUser(null);
                    }}
                  >
                    <PlatformIcon name="close" size={24} color="white" />
                  </TouchableOpacity>
                </View>

                <View className="p-6 flex-1">
                  <View className="flex-row items-center mb-4">
                    <PlatformIcon
                      name="mail"
                      iosName="envelope.fill"
                      size={20}
                      color={themedColors.systemPink}
                      style={{ marginRight: 8 }}
                    />
                    <Text className="flex-1" style={{ color: themedColors.secondaryText }}>
                      {selectedUser?.Email}
                    </Text>
                  </View>

                  <View className="flex-row gap-3 mt-6">
                    <TouchableOpacity
                      style={styles.profileButton}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setShowUserModal(false);
                        router.push(`/discover/profile/${selectedUser?.id}`);
                      }}
                    >
                      <LinearGradient
                        colors={[themedColors.systemOrange, themedColors.systemPink]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.gradientButton}
                      >
                        <Text className="text-white font-medium">
                          View Full Profile
                        </Text>
                      </LinearGradient>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="flex-1 py-3 bg-gray-100 rounded-full items-center border border-gray-400"
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setShowUserModal(false);
                        setSelectedUser(null);
                      }}
                    >
                      <Text className="text-gray font-medium">Close</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>


      {/* Empty State Message */}
      {data && data.length === 0 && !loading && (
        <View className="absolute inset-0 justify-center items-center bg-white bg-opacity-80">
          {/* <Image
              source={images.noData}
              style={{ width: 100, height: 100, marginBottom: 20 }}
              resizeMode="contain"
            /> */}
          <Text className="text-gray-500 text-lg">
            No nearby profiles found
          </Text>
          <TouchableOpacity
            className="mt-4 bg-primary px-4 py-2 rounded-lg"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              fetchAllNearby();
            }}
          >
            <Text className="text-white">Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  headerContainer: {
    // backgroundColor applied inline with themedColors.background
  },
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    // backgroundColor applied inline with themedColors.background
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 80,
  },
  closeButton: {
    position: "absolute",
    top: 15,
    right: 15,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  profileButton: {
    flex: 1,
    borderRadius: 999,
    overflow: "hidden",
  },
  gradientButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  mapControlsContainer: {
    alignItems: "center",
  },
  mapControlButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  mapControlText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Platform.OS === 'ios' ? (PlatformColor('systemPink') as unknown as string) : '#B06D1E',
  },
});
