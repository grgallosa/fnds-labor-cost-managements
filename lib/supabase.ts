
import { createClient } from '@supabase/supabase-js';

// Connection details updated with provided credentials
const supabaseUrl = 'https://dqvvasadceoksobmcfsd.supabase.co';
const supabaseAnonKey = 'sb_publishable_eJunR26ZiQeTWcORiTqRhg_PERsXAzn';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to upload base64 images to Supabase Storage
 */
export async function uploadImage(bucket: string, path: string, base64Data: string) {
  try {
    // Clean base64 string
    const base64Content = base64Data.split(';base64,').pop();
    if (!base64Content) throw new Error('Invalid image format');
    
    const buffer = Uint8Array.from(atob(base64Content), c => c.charCodeAt(0));
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (error) throw error;
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
      
    return publicUrl;
  } catch (err) {
    console.error('Upload failed:', err);
    return base64Data; // Fallback to base64 if storage fails
  }
}
