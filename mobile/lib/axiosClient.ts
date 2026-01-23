// src/api/index.ts
import { getToken } from '@/utils/token';
import axios from 'axios';
//import { API_BASE_URL } from '@env';

export const axiosClient = axios.create({
  baseURL: 'https://itinfonity.io/datingAPI/webservice/',
  timeout: 10000,
});

axiosClient.interceptors.request.use(
  (config) =>
    new Promise((resolve) => {
      getToken().then((token) => {
        if (token) {
          console.log('Token found:', token);
          config.headers.Authorization = `Bearer ${token}`;
        }
        resolve(config);
      });
    }),
  (error) => Promise.reject(error)
);

export const axiosPublic = axios.create({
  baseURL: 'https://itinfonity.io/datingAPI/webservice/',
  timeout: 10000,
  // headers: {
  //   'Content-Type': 'application/json',
  // },
});

axiosPublic.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);


