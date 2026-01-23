/**
 * Axios Client for API requests
 * 
 * MIGRATION NOTE: This file now points to the Next.js backend.
 * The old PHP backend URL was: https://itinfonity.io/datingAPI/webservice/
 * 
 * For new code, prefer using lib/apiClient.ts which provides typed functions.
 * This axios client is maintained for backward compatibility during migration.
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


