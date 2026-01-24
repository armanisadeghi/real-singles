import { icons } from "@/constants/icons";
import { addCurrentUserId, getCurrentUserId, getToken, removeCurrentUserId, removeToken, storeToken } from "@/utils/token";
import { AntDesign } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as AppleAuthentication from 'expo-apple-authentication';
// import * as AuthSession from "expo-auth-session";
import * as Google from 'expo-auth-session/providers/google';
import * as Location from "expo-location";
import { router } from "expo-router";
import * as WebBrowser from 'expo-web-browser';
import React from "react";
import { Alert, Image, Platform, Text, TouchableOpacity } from "react-native";

WebBrowser.maybeCompleteAuthSession();

export default function SociaLoginButtons() {
  const [locationError, setLocationError] = React.useState("");
  const [locationPermission, setLocationPermission] = React.useState(false);
  const [saveLocation, setSaveLocation] = React.useState<any>({
    Latitude: "", 
    Longitude: "",
  });
//   const redirectUri = AuthSession.makeRedirectUri({
//   scheme: "realSingle"
// });


  // TODO: Replace with your actual client IDs from Google Cloud Console
  const [request, response, promptAsync] = Google.useAuthRequest({
    //  androidClientId: '1082786910514-8di115qljq1v8rlcqs38efftj5vekd0r.apps.googleusercontent.com',
    androidClientId: '1022558301980-q16c22pud1ad3trh6am40oljr3g83m2n.apps.googleusercontent.com',
    iosClientId: '',
    // redirectUri,   
  });

async function signInWithApple() {
  const coords = await getLocation(); // ask for location here
   // stop if location not granted
   if (!coords) {
    Alert.alert("Location Required", locationError || "Location permission is required to proceed.");``
   }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    console.log("credential in signInWithApple:", credential);
    console.log("credential.fullName.givenName:", credential.fullName?.givenName + " " + credential.fullName?.familyName);
    console.log("credential.fullName.email:", credential?.email);

  const firstName = credential.fullName?.givenName || "";
  const lastName = credential.fullName?.familyName || "";
  const fullName =
      credential.fullName?.givenName && credential.fullName?.familyName
        ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
        : "";

    const email = credential?.email ?? "";

    // ✅ Save name and email in AsyncStorage
    await AsyncStorage.setItem("appleUserFirstName", firstName);
    await AsyncStorage.setItem("appleUserLastName", lastName);
    await AsyncStorage.setItem("appleUserName", fullName);
    await AsyncStorage.setItem("appleUserEmail", email);

    console.log("Saved to AsyncStorage:", {firstName, lastName, fullName, email });
    

    // Prepare payload for backend
    const appleUser = {
      SocialID: credential.user, // stable Apple identifier
      Email: credential.email ?? "", // may be null after first login
      DeviceToken: credential.identityToken,
      Latitude: saveLocation.Latitude || '37.4220936',
      Longitude: saveLocation.Longitude || '-122.083922',
      SocialType: 'apple',
      DeviceType: 'ios'
    };

    console.log("Sending appleUser to backend:", appleUser);

    // ✅ Call the Next.js API for social login
    const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${apiUrl}/auth/social`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(appleUser),
    });

    const res = await response.json();
    console.log("Backend response:", res);

       if (res.success === 1) {
      // Save login session
        const token = await getToken();
        if(token){
          await removeToken();
        }  
       await storeToken(res?.data?.token);

        const id = await getCurrentUserId();
        if (id) {
          await removeCurrentUserId();
        }
       await addCurrentUserId(res?.data?.ID);


      // Navigate to home
      // router.replace("/(tabs)");
      router.replace({ pathname: "/signup", params: { startSection: 1 } });

    } else {
      Alert.alert("Login Failed", res.msg || "Something went wrong");
    }
  } catch (e: any) {
    if (e.code === "ERR_CANCELED") {
      Alert.alert("Cancelled", "User cancelled Apple sign in");
    } else {
      console.error("Apple Sign In Error:", e);
      Alert.alert("Error", "Something went wrong with Apple sign in");
    }
  }
}



  React.useEffect(() => {
  const getUserInfo = async () => {
    if (response?.type === "success") {
      const { authentication } = response;
      console.log("Google Access Token:", authentication?.accessToken);

      // try {
      //   const userInfoResponse = await fetch(
      //     "https://www.googleapis.com/userinfo/v2/me",
      //     {
      //       headers: { Authorization: `Bearer ${authentication?.accessToken}` },
      //     }
      //   );
      //   const user = await userInfoResponse.json();
      //   console.log("Google User Info:", user);
      //   await AsyncStorage.setItem("googleUserInfo", JSON.stringify(user));

      // } catch (error) {
      //   console.error("Error fetching user info:", error);
      // }
    }
  };

  getUserInfo();
}, [response]);


const getLocation = async () => {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setLocationError("Location permission denied. Some features may be limited.");
      return null;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const coords = {
      Latitude: String(location.coords.latitude),
      Longitude: String(location.coords.longitude),
    };

    setSaveLocation(coords);
    return coords;
  } catch (error) {
    console.error("Error getting location:", error);
    setLocationError("Failed to get your location. Some features may be limited.");
    return null;
  }
};


  return (
    <>
     
      {Platform.OS === "ios" ? (
        <TouchableOpacity onPress={() => signInWithApple()} className="flex-row justify-center items-center gap-2 my-2 bg-light-200 py-4 rounded-[99] border-border">
          <AntDesign name="apple1" size={24} color="black" />
          <Text className="text-gray font-medium text-xs">
            Continue with Apple
          </Text>
        </TouchableOpacity>
      ) :  
      <TouchableOpacity
        // onPress={() => promptAsync()}
        onPress={async () => {
            const coords = await getLocation(); // ask for location here
            if (!coords) return;

            promptAsync(); // continue with Google login
          }}
        className="flex-row justify-center items-center gap-2 my-2 bg-light-200 py-4 rounded-[99] border-border"
        disabled={!request}
      >
        <Image source={icons.google} resizeMode="contain" />
        <Text className="text-gray font-medium text-xs">
          Continue with Google
        </Text>
      </TouchableOpacity>}
    </>
  );
}



// const getUserFromStorage = async () => {
//   const userJson = await AsyncStorage.getItem("googleUser");
//   const user = userJson ? JSON.parse(userJson) : null;
//   console.log("Stored user:", user);
//   return user;
// };
