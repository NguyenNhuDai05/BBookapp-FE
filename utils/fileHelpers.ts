import * as FileSystem from 'expo-file-system';

export const saveImageToLocalDirectory = async (uri: string): Promise<string> => {
  if (!uri || !uri.startsWith('file://')) return uri; // Already a remote URL or invalid
  
  try {
    const filename = uri.split('/').pop() || `image_${Date.now()}.jpg`;
    const newPath = `${FileSystem.documentDirectory}${filename}`;
    
    // Copy the file from temporary cache to permanent document directory
    await FileSystem.copyAsync({
      from: uri,
      to: newPath
    });
    
    return newPath;
  } catch (error) {
    console.error('Error saving image locally:', error);
    return uri; // Return original if failed
  }
};
