import { EditProfileFormData } from "@/types";
import { axiosClient, axiosPublic } from "./axiosClient";

export const login = async (loginData: FormData) => {
  const res = await axiosPublic.post("/login.php", loginData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const login2 = async (loginData: FormData) => {
  const res = await fetch('https://itinfonity.io/datingAPI/webservice/login.php', {
    method: 'POST',
    body: loginData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  const data = await res.json();
  // console.log("Login response:", data);
  
  return data;
}

export const register = async (registerData: FormData) => {
  console.log("Registering with data:", registerData);
  const res = await axiosPublic.post("/register.php", registerData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const register2 = async (registerData: FormData) => {
  const res = await fetch('https://itinfonity.io/datingAPI/webservice/register.php', {
    method: 'POST',
    body: registerData,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  console.log("Registering res:", res);
  
  const data = await res.json();
  console.log("Register response:", data);
  return data;
}

export const logout = async () => {
  const res = await axiosClient.get("/logout.php");
  return res.data;
}

export const forgotPassword = async (Email: FormData) => {
  const res = await axiosClient.post('/forgotPassword.php', Email, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const verifyOtp = async (data: FormData) => {
  const res = await axiosClient.post('/VerifyOTP.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const forgotPassword2 = async (data: FormData) => {
  const res = await axiosClient.post('/ForgotPasswordStep2.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const changePassword = async (data: FormData) => {
  const res = await axiosClient.post('/changePassword.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};


export const CommonFileUpload = async (formData: FormData) => {
  console.log("Uploading attachments (public):", JSON.stringify(formData));

  const res = await axiosPublic.post("upload_image.php", formData, {

    headers: { 
       "Content-Type": "multipart/form-data",
       "User-Agent": "ReactNativeApp",
       "Accept": "*/*",
     },
  });
  return res.data;
};



export const getHomeScreenData = async () => {
  const res = await axiosClient.get('/HomeScreen.php', {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
};

export const getFilter = async () => {
  const res = await axiosClient.get('/GetFilter.php', {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

export const saveFilter = async (data: FormData) => {
  const res = await axiosClient.post('/saveFilter.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

export const applyFilters = async (paramsObj: any) => {
  try {
    const res = await axiosClient.get('/Filter.php', {
      params: paramsObj, // Ye query string banayega: /Filter.php?Gender=both&min_age=18...
    });
    return res.data;
  } catch (error) {
    throw error;
  }
};

export const clearFilter = async () => {
  const res = await axiosClient.post('/ClearFilter.php');
  return res.data;
};


export const getAllTopMatches = async () => {
  const res = await axiosClient.get('/TopMatchProfile.php');
  return res.data;
}
export const getAllFeaturedVideos = async () => {
  const res = await axiosClient.get('/FeaturedVideo.php');
  return res.data;
}
export const getAllEvents = async () => {
  const res = await axiosClient.get('/EventList.php');
  return res.data;
}
export const getAllVirtualDate = async () => {
  const res = await axiosClient.get('/VirtualSpeedDating.php');
  return res.data;
}
export const getAllNearBy = async (location: FormData) => {
  const res = await axiosClient.post('/NearByProfile.php', location, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const getEventDetails = async (EventID: string) => {
  const res = await axiosClient.get('/EventDetails.php', {
    params: { EventID },
  });
  return res.data;
}

export const markEventAsInterested = async (data: FormData) => {
  console.log("Marking event as interested with data:", data);
  
  const res = await axiosClient.post('/MarkAsInterested.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const getAllNotifications = async () => {
  const res = await axiosClient.get('/NotificationList.php');
  return res.data;
}

export const checkEmailExist = async (email: FormData) => {
  console.log("Checking email existence with data:", email);
  
  const res = await axiosClient.post('/CheckEmailExist.php', email, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const fetchUserProfile = async (userId: string) => {
  const res = await axiosClient.get('/UserProfile.php', {
    params: { userID: userId },
  });
  return res.data;
}

export const updateUser = async (data: EditProfileFormData) => {
  try {
    const res = await axiosClient.put('/UpdateProfile.php', data, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return res.data;
  } catch (error) {
    console.log("Error updating user:", error);
    return {
      success: false,
      msg: "Failed to update profile"
    };
  }
  
}

export const fetchOtherProfile = async (id: string) => {
  console.log("id in fetchOtherProfile:", id);
  
  const res = await axiosClient.get(`/getOtherProfile.php?OtherUserID=${encodeURIComponent(id)}`, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

// export const fetchOtherProfile2 = async (id: string) => {
//   const token = await getToken();
//   console.log("token in other profile: ", token);
  
//   const res = await fetch(`https://itinfonity.io/datingAPI/webservice/getOtherProfile.php?OtherUserID=${encodeURIComponent(id)}`, {
//     method: 'GET',
//     headers: {
//       "Content-Type": "application/json",
//       "Authorization": `Bearer eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE3NTA3NDQyMDEsImlzcyI6InlvdXIuZG9tYWluLm5hbWUiLCJuYmYiOjE3NTA3NDQyMDEsInVzZXJJRCI6IjExMCJ9.7HcFZoIISCwKP91OYofKv3EmQyhkWuwuRASv6nuR3NU`,
//     },
//   });
//   const data = await res.json();
//   console.log("Other profile response:", data);
//   return data;
// }

export const toggleFavourite = async (data: FormData) => {
  const res = await axiosClient.post('/AddFavourite.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const getFavouriteList = async () => {
  const res = await axiosClient.get('/FavouriteList.php', {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

export const createEvent = async (data: FormData) => {
  const res = await axiosClient.post('/CreateEvent.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const contactUs = async (data: FormData) => {
  const res = await axiosClient.post('/contactUs.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}



export const getProductsGiftList = async () => {
  const res = await axiosClient.get('/GetProductGiftList.php');
  return res.data;
}

export const getProductsGiftDetail = async (data: FormData) => {
  console.log("Fetching product gift details with data:", data);
  
  const res = await axiosClient.get(`/GetProductGiftDetail.php?productid=${data.get('productid')}`, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  console.log("Product details response:", res.data);
  
  return res.data;
}

export const addUpdateRating = async (data: FormData) => {
  const res = await axiosClient.post('/addRating.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },  
  });
  return res.data;
}


export const createGroup = async (data: FormData) => {
  const res = await axiosClient.post('/CreateGroup.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const getGroupList = async () => {
  const res = await axiosClient.get('/GroupList.php', {
    headers: {
      "Content-Type": "application/json",
    },
  });
  return res.data;
}

export const getVirtualDateList = async () => {
  const res = await axiosClient.get('/GetVirtualDateList.php');
  return res.data;
}

export const getVirtualSpeedDetails = async (id: string) => {
  const res = await axiosClient.get('/GetVirtualSpeedDetail.php', {
    params: {
      id
    },
  });
  return res.data;
}

export const registerVirtualSlot = async (data: FormData) => {
  const res = await axiosClient.post('/registerVirtualSlots.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const checkRedeemPoints = async () => {
  const res = await axiosClient.get('/CheckRedeemPoint.php');
  return res.data;
}

export const acceptOrderRedeemPoints = async (data: FormData) => {
  console.log("Accepting order redeem points with data:", data);
  
  const res = await axiosClient.post('/AcceptOrderReedemPoint.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const acceptOrderRedeemPointsWithFetch = async (data: FormData) => {
  console.log("Accepting order redeem points with fetch:", data);
  
  try {
    const response = await fetch('https://itinfonity.io/datingAPI/webservice/AcceptOrderRedeemPoint.php', {
      method: 'POST',
      body: data,
      headers: {
        // Let fetch set content type with boundary
      }
    });
    
    console.log("Response status:", response.status);
    
    // Get text first to avoid JSON parse errors
    const text = await response.text();
    console.log("Response text:", text);
    
    if (!text) {
      return {
        success: false,
        msg: "Server returned empty response"
      };
    }
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Failed to parse response as JSON:", e);
      return {
        success: false,
        msg: "Invalid server response format"
      };
    }
  } catch (error) {
    console.error("Fetch error:", error);
    return {
      success: false,
      msg: "Network error during API call"
    };
  }
}

export const getAgoraChatToken = async (userId: string) => {
  const data = new FormData();
  data.append("userId", userId);
  const res = await axiosClient.post("/AgoraChatToken.php", data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const getAgoraCallToken = async (userid: string) => {
  const data = new FormData();
  data.append('userid', userid);
  const res = await axiosClient.post('/AgoraCallToken.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const getAgoraCallRefreshToken = async (data: FormData) => {
  const res = await axiosClient.post('/AgoraRefreshToken.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}
export const getAgoraChatRefreshToken = async (data: FormData) => {
  const res = await axiosClient.post('/AgoraRefreshToken.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const getProfile = async () => {
  const res = await axiosClient.get('/GetProfile.php');
  return res.data;
}

export const followUser = async (userId: string) => {
  const data = new FormData();
  data.append('FollowingID', userId);
  const res = await axiosClient.post('/FollowUser.php', data, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
}

export const uploadImage = async (imageUrl?: string, videoUrl?: string) => {
  const formdata: any = new FormData();

  if (imageUrl) {
    formdata.append("uploadattachments[]", {
      uri: imageUrl,
      type: "image/jpeg",
      name: "photo.jpg",
    });
  }

  if (videoUrl) {
    formdata.append("uploadattachments[]", {
      uri: videoUrl,
      type: "video/mp4",
      name: "video.mp4",
    });
  }

     formdata.forEach((value: any, key: string) => {
      console.log(key, value);
    });


  console.log("formdata in uploadImage:", JSON.stringify(formdata));

  const res = await axiosClient.post("upload_image.php", formdata, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  // const res = await axiosClient.post("upload_image.php", formdata);

  console.log("res in uploadImage", res);
  
  return res.data;
};

export const saveGalleryImage = async (imageUrl: string, videoUrl: string) => {
  const formdata: any = new FormData();
  if (imageUrl) formdata.append('livePicture', imageUrl);
  if (videoUrl) formdata.append('LiveVideo', videoUrl);

  console.log("formdata in saveGalleryImage:", formdata);

  const res = await axiosClient.post('/addNewGalleryImage.php', formdata, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
};


export const saveLink = async (linkData: FormData) => {
  const res = await axiosPublic.post("/saveShareLinkNotification.php", linkData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return res.data;
};

