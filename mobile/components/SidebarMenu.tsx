import { Ionicons } from "@expo/vector-icons";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Avatar } from "@/components/ui/Avatar";
import { getReferralLink, APP_NAME } from "@/lib/config";

const { width } = Dimensions.get("window");
const MENU_WIDTH = width * 0.75; // Menu takes 75% of screen width

interface SideMenuProps {
  visible: boolean;
  onClose: () => void;
  /** User avatar URL or image source */
  userAvatar?: string | null;
  userName: string;
  /** User's referral code for sharing */
  referralCode?: string;
  direction?: "right" | "left";
}

const SideMenu = ({
  visible,
  onClose,
  userAvatar,
  userName,
  referralCode,
  direction = "left",
}: SideMenuProps) => {
  const router = useRouter();
  const currentPath = usePathname();
  const translateX = useRef(
    new Animated.Value(direction === "left" ? -MENU_WIDTH : width)
  ).current;

  const handleReferFriend = async () => {
    if (!referralCode) {
      // If no referral code, just navigate to the refer page
      onClose();
      router.push("/refer");
      return;
    }

    try {
      const referralLink = getReferralLink(referralCode);
      const result = await Share.share({
        title: `Join me on ${APP_NAME}!`,
        message:
          `Hey! I've been using ${APP_NAME} to meet amazing people and connect with like-minded individuals. Join me using my referral link and get started today! ${referralLink}`,
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log("Shared via:", result.activityType);
        } else {
          console.log("Shared successfully");
        }
      } else if (result.action === Share.dismissedAction) {
        console.log("Share dismissed");
      }

      // Close the menu after sharing or dismissing
      onClose();
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  useEffect(() => {
    if (visible) {
      Animated.timing(translateX, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateX, {
        toValue: direction === "left" ? -MENU_WIDTH : width,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, direction]);

  const menuItems = [
    {
      title: "Profile",
      icon: "person-outline" as const,
      path: "/(tabs)/profile",
      onPress: () => {
        onClose();
        router.push("/(tabs)/profile");
      },
    },
    {
      title: "Notifications",
      icon: "notifications-outline" as const,
      path: "/notification",
      onPress: () => {
        onClose();
        router.push("/notification");
      },
    },
    {
      title: "Contact Us",
      icon: "mail-outline" as const,
      path: "/contact",
      onPress: () => {
        onClose();
        router.push("/contact");
      },
    },
    {
      title: "Refer a Friend",
      icon: "people-outline" as const,
      path: "/refer",
      onPress: () => {
        onClose();
        router.push("/refer");
      },
    },
  ];

  if (!visible) return null;

  const isRouteActive = (routePath: string) => {
    // Simple case: exact match
    if (currentPath === routePath) return true;

    // Case for tab routes and nested routes
    if (routePath === "/(tabs)/profile" && currentPath.includes("/profile"))
      return true;
    if (routePath === "/notification" && currentPath.includes("/notification"))
      return true;
    if (routePath === "/contact" && currentPath.includes("/contact"))
      return true;
    if (routePath === "/refer" && currentPath.includes("/refer")) return true;

    return false;
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      />
      <Animated.View
        style={[
          styles.menu,
          {
            transform: [{ translateX }],
            left: direction === "left" ? 0 : undefined,
            right: direction === "right" ? 0 : undefined,
          },
        ]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                isRouteActive(item.path) && styles.activeMenuItem,
              ]}
              onPress={item.onPress}
            >
              <Ionicons name={item.icon} size={24} color="#fff" />
              <Text style={styles.menuText}>{item.title}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Avatar
            src={userAvatar}
            name={userName || "User"}
            size="lg"
            borderColor="#ffffff"
            borderWidth={2}
          />
          <Text style={styles.userName}>{userName}</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 99,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  menu: {
    position: "absolute",
    top: 50,
    // left: 0,
    width: MENU_WIDTH,
    height: "86%",
    backgroundColor: "#B06D1E", // Primary color
    paddingTop: 50,
    paddingHorizontal: 20,
    display: "flex",
    flexDirection: "column",
    // borderRadius: 30,
    borderBottomEndRadius: 30,
    borderTopEndRadius: 30,
  },
  activeMenuItem: {
    backgroundColor: "rgba(255, 255, 255, 0.2)", // White with 20% opacity
    borderRadius: 10, // Optional: rounded corners for better look
    paddingLeft: 10, // Optional: add some padding for better visibility
  },
  header: {
    marginBottom: 20,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 10,
  },
  content: {
    flex: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingLeft: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.2)",
  },
  menuText: {
    color: "#fff", // light-100
    fontSize: 18,
    marginLeft: 20,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.2)",
    marginBottom: 30,
  },
  userName: {
    color: "#fff", // light-100
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 15,
  },
});

export default SideMenu;
