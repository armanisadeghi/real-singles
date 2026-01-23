import Appearance from "@/components/signup/Appearance";
import ChooseInterests from "@/components/signup/ChooseInterests";
import EducationJob from "@/components/signup/EducationJob";
import Ethinicity from "@/components/signup/Ethinicity";
import Gender from "@/components/signup/gender";
import HabitInterests from "@/components/signup/HabitInterests";
import HaveChildren from "@/components/signup/HaveChildren";
import Intro from "@/components/signup/Intro";
import Languages from "@/components/signup/Languages";
import SignupLogin from "@/components/signup/login";
import MaritalStatus from "@/components/signup/MaritalStatus";
import PersonalDetails from "@/components/signup/PersonalDetails";
import PoliticalViews from "@/components/signup/PoliticalViews";
import Qualification from "@/components/signup/Qualification";
import Religion from "@/components/signup/Religion";
import ReviewProfile from "@/components/signup/ReviewProfile";
import Success from "@/components/signup/Success";
import TakePhoto from "@/components/signup/TakePhoto";
import TakeVideo2 from "@/components/signup/TakeVideo2";
import WantChildren from "@/components/signup/WantChildren";
import { images } from "@/constants/images";
import { register } from "@/lib/api";
import { SignupData } from "@/types";
import {
  addCurrentUserId,
  getCurrentUserId,
  removeCurrentUserId,
  storeToken,
} from "@/utils/token";
import * as Location from "expo-location";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, BackHandler, ScrollView, Text, View } from "react-native";

const getSections = (signupData: any, updateSignupData: any, goToNextSection: any, sectionError: any) => [
  {
    title: "Login",
    component: (
      <SignupLogin
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Gender",
    component: (
      <Gender
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Personal details",
    component: (
      <PersonalDetails
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Martital Status",
    component: (
      <MaritalStatus
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Have Children",
    component: (
      <HaveChildren
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Want Children",
    component: (
      <WantChildren
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Qualification",
    component: (
      <Qualification
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Education and Job Details",
    component: (
      <EducationJob
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Appearance",
    component: (
      <Appearance
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Habits & Interests",
    component: (
      <HabitInterests
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Ethinicity",
    component: (
      <Ethinicity
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Languages",
    component: (
      <Languages
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Religion?",
    component: (
      <Religion
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Political Views",
    component: (
      <PoliticalViews
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "In a few Words",
    component: (
      <Intro
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Pick your interests",
    component: (
      <ChooseInterests
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Upload Live Photo",
    component: (
      <TakePhoto
        data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
        error={sectionError}
      />
    ),
  },
  {
    title: "Upload Live Video",
    component: (
      <TakeVideo2
        // data={signupData}
        updateData={updateSignupData}
        onNext={goToNextSection}
      // error={sectionError}
      />
    ),
  },
  // {
  //   title: "Upload Live Video",
  //   component: (
  //     <TakeVideo
  //       data={signupData}
  //       updateData={updateSignupData}
  //       onNext={goToNextSection}
  //       error={sectionError}
  //     />
  //   ),
  // },
]



const Signup = () => {
  const { startSection } = useLocalSearchParams<{ startSection?: string }>();
  const [sectionError, setSectionError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const router = useRouter();
  const [signupData, setSignupData] = useState<SignupData>({
    Username: "",
    Email: "",
    Password: "",
    Gender: "",
    FirstName: "",
    LastName: "",
    DisplayName: "",
    DOB: "",
    Phone: null,
    Zipcode: "",
    HSign: "",
    City: "",
    State: "",
    MaritalStatus: "",
    HaveChild: "",
    WantChild: "",
    Education: "",
    School: [""],
    JobTitle: "",
    Company: "",
    Height: 0,
    BodyType: "",
    Marijuna: "",
    Smoking: "",
    Drinks: "",
    Pets: "",
    Ethniticity: "",
    Language: "",
    Religion: "",
    // Political: "",
    NightAtHome: "",
    About: "",
    CraziestThings: "",
    Interest: [],
    livePicture: "",
    liveVideo: "",
    Latitude: "",
    Longitude: "",
  });
  const [currentSection, setCurrentSection] = useState(
    startSection ? Number(startSection) : 0
  );



  //   const updateSignupData = (updatedData: Partial<SignupData>) => {
  //   console.log("updatedData in Signup process:", updatedData);

  //   setSignupData((prev) => ({ ...prev, ...updatedData }));
  //   setSectionError("");
  // };

  const updateSignupData = useCallback((updatedData: Partial<SignupData>) => {
    console.log("updatedData in Signup process:", updatedData);
    setSignupData((prev) => ({ ...prev, ...updatedData }));
    setSectionError("");
  }, []);

  const validateCurrentSection = useCallback(() => {
    return true;
  }, [signupData]);


  // const validateCurrentSection = () => {
  //   return true;
  // };

  const goToNextSection = () => {
    if (validateCurrentSection()) {
      if (currentSection < sections.length - 1) {
        setCurrentSection(currentSection + 1);
      } else {
        setShowReview(true);
      }
    }
  };


  const sections = useMemo(() => {
    return getSections(signupData, updateSignupData, goToNextSection, sectionError);
  }, [signupData, updateSignupData, goToNextSection, sectionError]);

    const currentComponent = useMemo(() => {
    const section = sections[currentSection];
    return section ? section.component : null;
  }, [currentSection, signupData]);

  useEffect(() => {
    const backAction = () => {
      return true; // prevent default back navigation
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove(); // cleanup
  }, []);


  const goBackFromReview = () => {
    setShowReview(false);
  };

  useEffect(() => {
    const getLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          throw new Error("Permission denied");
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
          timeout: 15000, // 15 sec wait
        })

        if (location?.coords) {
          updateSignupData({
            Latitude: String(location.coords.latitude),
            Longitude: String(location.coords.longitude),
          });
        } else {
          throw new Error("No coordinates found");
        }
      } catch (error) {
        console.log("Location error:", error);
        // Default: Google HQ (Mountain View)
        updateSignupData({
          Latitude: "37.4219983",
          Longitude: "-122.084",
        });
      }
    };

    getLocation();
  }, []);



  const handleSubmit = async () => {
    // try {
    const formData = new FormData();
    Object.entries(signupData).forEach(([key, value]) => {
      if (value === null || value === undefined) return;

      if (key === "DOB" && typeof value === "string" && value.includes("/")) {
        // Convert MM/DD/YYYY → YYYY-MM-DD
        const [month, day, year] = value.split("/");
        const formattedDOB = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        formData.append("DOB", formattedDOB);
      } else if (Array.isArray(value)) {
        if (key === "Interest") {
          formData.append(key, value.join(","));
        } else if (key === "School") {
          formData.append(key, value.join(", "));
        }
      } else if (key === "Pets" && value) {
        formData.append("Pets", value);
      } else {
        formData.append(key, String(value));
      }
    });

    console.log("Form data created successfully");
    console.log("formData: ", formData);
    setLoading(true);
    setSectionError("");
    try {
      const res = await register(formData);
      console.log("Register response:", res);

      if (res?.success) {
        console.log("Form submitted successfully:", res);
        if (res?.data?.token) {
          await storeToken(res?.data?.token);
          const id = await getCurrentUserId();
          if (id) {
            await removeCurrentUserId();
          }
          await addCurrentUserId(res?.data?.ID);
          setIsSubmitted(true);
          setSectionError("");
        }
      } else {
        console.error(res?.msg || "Unknown error");
        setSectionError(
          res?.msg || "Failed to submit your information. Please try again."
        );
      }
    } catch (error) {
      console.error("Error registering user:", error);
      setSectionError("Failed to register. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <ScrollView className="flex-1 bg-backgground">
        <View className="flex-1 items-center justify-center h-screen">
          <ActivityIndicator size="large" color="#B06D1E" />
          <Text className="mt-4 text-gray-600">Creating your profile...</Text>
        </View>
      </ScrollView>
    );
  }

  if (showReview) {
    return (
      <ReviewProfile
        data={signupData}
        onSubmit={handleSubmit}
        onBack={goBackFromReview}
        isLoading={loading}
        error={sectionError}
        isSubmitted={isSubmitted}
      />
    );
  }

  if (currentSection === 1) {
    console.log("TakeVideo is now rendering");
  }





  return (
    <View style={{ flex: 1, backgroundColor: "#FFFAF2" }}>
      {isSubmitted ? (
        <Success
          image={images.signupSuccess}
          title="Congratulations!"
          subTitle="Welcome to RealSingles!"
          desc="Your profile is ready..."
          onPress={() => router.replace("/(tabs)")}
        />
      ) : (
        // sections[currentSection].component
        currentComponent
      )}
    </View>
  );

};

export default Signup;
