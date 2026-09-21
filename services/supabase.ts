import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { api, API_URL } from './api';
import { Platform } from 'react-native';
import { normalizeMediaUrl } from '../utils/mediaUrl';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Supabase is optional because the app currently uploads images through the
 * backend (`uploadImage`) instead. Do not create a client with empty values at
 * module load time: doing so prevents every route importing this file from
 * loading and Expo Router then reports misleading "missing default export"
 * warnings.
 */
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

export const uploadImageToSupabase = async (uri: string, bucketName: string = 'images'): Promise<string> => {
  try {
    if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
      return uri;
    }

    if (!supabase) {
      throw new Error(
        'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY, or use uploadImage() to upload through the backend.',
      );
    }

    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
    const arrayBuffer = decode(base64);

    const fileExt = uri.split('.').pop()?.split('?')[0] || 'jpg';
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, arrayBuffer, {
        contentType: `image/${fileExt}`,
      });

    if (error) {
      console.error('Supabase upload error:', error);
      throw error;
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading image to Supabase:', error);
    throw error;
  }
};

/** Uploads a picked device image to our API and returns a public HTTP URL. */
export const uploadImage = async (uri: string): Promise<string> => {
  if (!uri || (!uri.startsWith('file://') && !uri.startsWith('content://') && !uri.startsWith('blob:'))) {
    return uri;
  }

  const fileName = uri.split('/').pop()?.split('?')[0] || `image-${Date.now()}.jpg`;
  const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
  const contentType = extension === 'png' ? 'image/png' : extension === 'webp' ? 'image/webp' : 'image/jpeg';
  const form = new FormData();

  if (Platform.OS === 'web') {
    const blob = await fetch(uri).then((response) => response.blob());
    form.append('file', blob, fileName);
  } else {
    form.append('file', { uri, name: fileName, type: contentType } as any);
  }

  const response = await api.post<{ url: string }>('/Upload/image', form);
  const returnedUrl = response.data.url;
  if (/^https?:\/\//i.test(returnedUrl)) return normalizeMediaUrl(returnedUrl);
  return `${API_URL.replace(/\/api\/?$/, '')}${returnedUrl}`;
};
