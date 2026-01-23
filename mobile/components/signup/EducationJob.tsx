import { icons } from "@/constants/icons";
import { images } from "@/constants/images";
import React, { useState } from "react";
import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from "react-native";
import GradientButton from "../ui/GradientButton";

const EducationJob = ({
  data,
  updateData,
  onNext,
  error,
}: any) => {
  const [validationError, setValidationError] = useState("");
  
  const handleNext = () => {
    // Reset validation error
    setValidationError("");
    
    // Validate schools
    if (!data.School || data.School.length === 0) {
      setValidationError("Please add at least one school");
      return;
    }
    
    // Check if schools have values
    for (let i = 0; i < data.School.length; i++) {
      if (!data.School[i].trim()) {
        setValidationError(`Please enter a name for school ${i + 1}`);
        return;
      }
    }
    
    // Validate company name
    if (!data.Company?.trim()) {
      setValidationError("Company name is required");
      return;
    }
    
    // Validate job title
    if (!data.Company?.trim()) {
      setValidationError("Job title is required");
      return;
    }
    
    onNext();
  };

  // Add a function to add another school
  const handleAddSchool = () => {
    const newSchools = [...(data.School || []), ''];
    updateData({ School: newSchools });
  };

  return (
    <ScrollView className="flex-1 bg-backgground">
    <View className="mt-20 px-6 w-full">
      {/* Header section */}
      <View className="flex-row items-center justify-between px-2">
        <View className="flex-1">
          <Text className="text-primary font-bold text-2xl mb-2">Education and Job Details</Text>
        </View>
        <View className="">
          <Image
            source={images.educationJob}
            width={114}
            height={76}
            resizeMode="contain"
            alt="gender"
          />
        </View>
      </View>

      <View className="">
        {/* Schools section */}
        <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
          <Text className="text-dark font-medium text-sm mb-4">Add Your School</Text>
          {data?.School?.length > 0 ? (
            data.School.map((school: string, index: number) => (
              <View key={index} className="flex-row items-center mb-4">
                <TextInput
                  value={school}
                  onChangeText={(text) => {
                    const newSchools = [...data.School];
                    newSchools[index] = text;
                    updateData({ School: newSchools });
                    setValidationError(""); 
                  }}
                  placeholder="Add school name"
                  placeholderTextColor="#B0B0B0"
                  className="flex-1 px-4 py-4 border border-border rounded-[99] mr-2 bg-light-200"
                />
                <TouchableOpacity 
                  onPress={() => {
                    const newSchools = data.School.filter((_: string, i: number) => i !== index);
                    updateData({ School: newSchools });
                  }}
                  disabled={data.School.length === 1}
                  className={`p-2 ${data.School.length === 1 ? 'opacity-50' : ''}`}
                >
                  <Image source={icons.remove} alt="remove" className="w-5 h-5" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <TouchableOpacity
              onPress={() => updateData({ School: [''] })}
              className="bg-primary py-2 px-4 rounded-lg"
            >
              <Text className="text-white text-center">Add School</Text>
            </TouchableOpacity>
          )}
          
          {/* Add School button */}
          {data.School?.length > 0 && (
            <TouchableOpacity
              onPress={handleAddSchool}
              className="bg-gray-200 py-2 px-4 rounded-lg mt-2"
            >
              <Text className="text-primary text-center">+ Add Another School</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Job details section */}
        <View className="mt-16 px-6 bg-white rounded-2xl shadow-lg py-6">
          <Text className="text-dark font-medium text-sm mb-4">Add Job Details</Text>
          <View className="mb-4">
            <TextInput
              value={data.Company}
              onChangeText={(text) => {
                updateData({ Company: text });
                setValidationError(""); // Clear error on change
              }}
              placeholder="Company Name"
              placeholderTextColor="#B0B0B0"
              className="flex-1 px-4 py-4 border border-border rounded-[99] mr-2 mb-4 bg-light-200"
            />
            <TextInput
              value={data.JobTitle}
              onChangeText={(text) => {
                updateData({ JobTitle: text });
                setValidationError(""); // Clear error on change
              }}
              placeholder="Job Title"
              placeholderTextColor="#B0B0B0"
              className="flex-1 bg-gray-50 px-4 py-4 border border-border rounded-[99] mb-4 bg-light-200"
            />
          </View>
        </View>

        {/* Display validation error */}
        {validationError ? (
          <Text className="text-red-500 text-center text-xs px-2 mb-2">{validationError}</Text>
        ) : null}
        
        {/* Display parent component error if any */}
        {error ? (
          <Text className="text-red-500 text-xs px-2 mb-2">{error}</Text>
        ) : null}
      </View>
      
      <GradientButton
        text="Next"
        onPress={handleNext}
        containerStyle={{
          marginVertical: 50,
          width: "50%",
          marginHorizontal: "auto",
        }}
      />
    </View>
    </ScrollView>
  );
};

export default EducationJob;