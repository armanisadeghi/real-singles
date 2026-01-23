import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'auth_token';

export const storeToken = async (token: string) => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

export const addCurrentUserId = async (id: string) => {
  try {
    await AsyncStorage.setItem('curr_userid', id);
  } catch (error) {
    console.error('Error storing current user ID:', error);
  }
};

export const getCurrentUserId = async () => {
  try {
    return await AsyncStorage.getItem('curr_userid');
    
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
};

export const removeCurrentUserId = async () => {
  try {
    await AsyncStorage.removeItem('curr_userid');
  } catch (error) {
    console.error('Error removing current user ID:', error);
  }
}


export const IMAGE_URL = 'https://itinfonity.io/datingAPI/webservice/';
export const VIDEO_URL = 'https://itinfonity.io/datingAPI/webservice/uploads/';
export const MEDIA_BASE_URL = 'https://itinfonity.io/datingAPI/webservice/uploads/';


