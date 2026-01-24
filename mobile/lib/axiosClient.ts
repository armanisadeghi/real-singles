/**
 * Axios Client for API requests
 * 
 * This file configures axios to work with the Next.js backend API.
 * For new code, prefer using lib/api.ts which provides typed functions.
 */

import { getSession } from './supabase';
import axios from 'axios';

// Use the Next.js API backend
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

export const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

axiosClient.interceptors.request.use(
  async (config) => {
    try {
      const session = await getSession();
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth session:', error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const axiosPublic = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

axiosPublic.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);


