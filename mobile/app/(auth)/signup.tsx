import Appearance from "@/components/signup/Appearance";
import ChooseInterests from "@/components/signup/ChooseInterests";
import EducationJob from "@/components/signup/EducationJob";
import Ethnicity from "@/components/signup/Ethnicity";
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
import { signUpWithEmail, supabase, updateProfile } from "@/lib/supabase";
import { SignupData } from "@/types";
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
    title: "Ethnicity",
    component: (
      <Ethnicity
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
    LookingFor: [],
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
    Marijuana: "",
    Smoking: "",
    Drinks: "",
    Pets: "",
    Ethnicity: "",
    Language: "",
    Religion: "",
    Political: "",
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
    console.log("Starting registration with Supabase...");
    setLoading(true);
    setSectionError("");

    try {
      // Step 1: Create auth user with Supabase
      const authData = await signUpWithEmail(
        signupData.Email,
        signupData.Password,
        {
          display_name: signupData.DisplayName || `${signupData.FirstName} ${signupData.LastName}`.trim(),
        }
      );

      console.log("Auth signup response:", authData);

      if (!authData.user) {
        throw new Error("Failed to create account. Please try again.");
      }

      // Step 2: Update the profile with all the collected data
      // Format date of birth
      let formattedDOB = signupData.DOB;
      if (signupData.DOB && signupData.DOB.includes("/")) {
        const [month, day, year] = signupData.DOB.split("/");
        formattedDOB = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
      }

      // Map signup data to profile schema
      const profileData = {
        first_name: signupData.FirstName || null,
        last_name: signupData.LastName || null,
        date_of_birth: formattedDOB || null,
        gender: signupData.Gender || null,
        looking_for: signupData.LookingFor?.length > 0 ? signupData.LookingFor : null,
        height_inches: signupData.Height ? Number(signupData.Height) : null,
        body_type: signupData.BodyType?.toLowerCase() || null,
        city: signupData.City || null,
        state: signupData.State || null,
        country: null, // Country not collected in signup flow
        occupation: signupData.JobTitle || null,
        education: signupData.Education || null,
        religion: signupData.Religion?.toLowerCase() || null,
        smoking: signupData.Smoking?.toLowerCase() || null,
        drinking: signupData.Drinks?.toLowerCase() || null,
        has_kids: signupData.HaveChild === "Yes" ? "yes" : signupData.HaveChild || null,
        wants_kids: signupData.WantChild?.toLowerCase().replace(" ", "_") || null,
        interests: signupData.Interest?.length > 0 ? signupData.Interest : null,
        bio: signupData.About || null,
        profile_image_url: signupData.livePicture || null,
        // Additional fields
        ethnicity: Array.isArray(signupData.Ethnicity) 
          ? signupData.Ethnicity 
          : signupData.Ethnicity ? [signupData.Ethnicity] : null,
        marijuana: signupData.Marijuana || null,
        political_views: signupData.Political || null,
        nightclub_or_home: signupData.NightAtHome || null,
      };

      // Update profile - wait a moment for the trigger to create the user record
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      try {
        await updateProfile(profileData);
        console.log("Profile updated successfully");
      } catch (profileError) {
        console.warn("Profile update warning:", profileError);
        // Continue anyway - user can update profile later
      }

      // Step 3: Update users table with additional data
      try {
        const { error: userError } = await supabase
          .from('users')
          .update({
            display_name: signupData.DisplayName || `${signupData.FirstName} ${signupData.LastName}`.trim(),
            phone: signupData.Phone || null,
          })
          .eq('id', authData.user.id);
        
        if (userError) {
          console.warn("User update warning:", userError);
        }
      } catch (userUpdateError) {
        console.warn("User update warning:", userUpdateError);
      }

      console.log("Registration completed successfully!");
      setIsSubmitted(true);
      setSectionError("");
      
    } catch (error: any) {
      console.error("Error registering user:", error);
      
      // Handle specific Supabase errors
      if (error?.message?.includes("User already registered")) {
        setSectionError("This email is already registered. Please log in instead.");
      } else if (error?.message?.includes("Password")) {
        setSectionError("Password must be at least 8 characters long.");
      } else {
        setSectionError(error?.message || "Failed to register. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <ScrollView className="flex-1 bg-background">
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
