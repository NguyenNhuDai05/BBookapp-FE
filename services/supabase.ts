import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadImageToSupabase = async (uri: string, bucketName: string = 'images'): Promise<string> => {
  try {
    if (!uri.startsWith('file://') && !uri.startsWith('content://')) {
      return uri;
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
