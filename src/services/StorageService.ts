import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, isFirebaseConfigured } from './firebaseConfig';
import { crashlyticsService } from './CrashlyticsService';

export interface CompressionResult {
  blob: Blob;
  dataUrl: string;
  originalSizeKb: number;
  compressedSizeKb: number;
  savedPercent: number;
}

export interface ProductPhotoPreset {
  id: string;
  label: string;
  labelLocalized: string;
  category: string;
  url: string;
  icon: string;
}

export const KIRANA_PHOTO_PRESETS: ProductPhotoPreset[] = [
  {
    id: 'preset_atta',
    label: 'Atta / Flour (आटा)',
    labelLocalized: 'आटा / मैदा',
    category: 'groceries',
    url: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&q=80',
    icon: '🌾',
  },
  {
    id: 'preset_rice',
    label: 'Basmati Rice (चावल)',
    labelLocalized: 'चावल / दाल',
    category: 'groceries',
    url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&q=80',
    icon: '🍚',
  },
  {
    id: 'preset_milk',
    label: 'Fresh Milk (दूध)',
    labelLocalized: 'दूध / दही / मक्खन',
    category: 'dairy',
    url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=500&q=80',
    icon: '🥛',
  },
  {
    id: 'preset_tea',
    label: 'Leaf Tea (चाय पत्ती)',
    labelLocalized: 'चाय / कॉफ़ी',
    category: 'beverages',
    url: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&q=80',
    icon: '☕',
  },
  {
    id: 'preset_noodles',
    label: 'Instant Noodles (मैगी)',
    labelLocalized: 'मैगी / पास्ता',
    category: 'instant-food',
    url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&q=80',
    icon: '🍜',
  },
  {
    id: 'preset_oil',
    label: 'Cooking Oil (सरसों तेल)',
    labelLocalized: 'तेल / घी',
    category: 'groceries',
    url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&q=80',
    icon: '🛢️',
  },
  {
    id: 'preset_detergent',
    label: 'Detergent Powder (सर्फ)',
    labelLocalized: 'सर्फ / साबुन',
    category: 'household',
    url: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=500&q=80',
    icon: '🧼',
  },
  {
    id: 'preset_biscuits',
    label: 'Biscuits & Cookies (बिस्कुट)',
    labelLocalized: 'बिस्कुट / नमकीन',
    category: 'snacks',
    url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&q=80',
    icon: '🍪',
  },
  {
    id: 'preset_spices',
    label: 'Haldi / Masala (मसाले)',
    labelLocalized: 'हल्दी / मिर्च / धनिया',
    category: 'groceries',
    url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&q=80',
    icon: '🌶️',
  },
];

class StorageService {
  /**
   * Client-side Image Compression via HTML5 Canvas
   * Downscales image dimensions (max 800px) and applies JPEG 75% quality compression,
   * saving bandwidth on flaky store 3G/4G connections.
   */
  async compressImage(
    source: File | Blob | string,
    maxWidth: number = 800,
    quality: number = 0.75
  ): Promise<CompressionResult> {
    return new Promise((resolve, reject) => {
      // 1. Resolve to a data URL or object URL
      let srcUrl = '';
      let initialBytes = 0;

      if (typeof source === 'string') {
        srcUrl = source;
        // Estimate base64 bytes if data url
        initialBytes = source.startsWith('data:') ? Math.round((source.length * 3) / 4) : 200000;
      } else {
        initialBytes = source.size;
        if (typeof window === 'undefined' || typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
          resolve({
            blob: source,
            dataUrl: '',
            originalSizeKb: Math.round(initialBytes / 1024),
            compressedSizeKb: Math.round(initialBytes / 1024),
            savedPercent: 0,
          });
          return;
        }
        srcUrl = URL.createObjectURL(source);
      }

      if (typeof window === 'undefined' || typeof document === 'undefined') {
        // Non-browser fallback
        resolve({
          blob: typeof source === 'string' ? new Blob([source]) : source,
          dataUrl: typeof source === 'string' ? source : '',
          originalSizeKb: Math.round(initialBytes / 1024),
          compressedSizeKb: Math.round(initialBytes / 1024),
          savedPercent: 0,
        });
        return;
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let { width, height } = img;

          // Scale dimensions preserving aspect ratio
          if (width > maxWidth || height > maxWidth) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxWidth) / height);
              height = maxWidth;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            throw new Error('Canvas 2D context unavailable');
          }

          // Draw and compress to JPEG
          ctx.drawImage(img, 0, 0, width, height);

          const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const originalSizeKb = Math.round(initialBytes / 1024);
                const compressedSizeKb = Math.round(blob.size / 1024);
                const savedPercent =
                  originalSizeKb > 0
                    ? Math.max(0, Math.round(((originalSizeKb - compressedSizeKb) / originalSizeKb) * 100))
                    : 0;

                console.log(
                  `[StorageService] Image compressed: ${originalSizeKb}KB -> ${compressedSizeKb}KB (${savedPercent}% saved)`
                );

                resolve({
                  blob,
                  dataUrl: compressedDataUrl,
                  originalSizeKb,
                  compressedSizeKb,
                  savedPercent,
                });
              } else {
                reject(new Error('Failed to create compressed image blob'));
              }
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          reject(err);
        } finally {
          if (typeof source !== 'string') {
            URL.revokeObjectURL(srcUrl);
          }
        }
      };

      img.onerror = (err) => {
        reject(new Error(`Failed to load image for compression: ${err}`));
      };

      img.src = srcUrl;
    });
  }

  /**
   * Upload Product Image to Firebase Storage
   * Returns permanent public download URL
   */
  async uploadProductImage(
    imageSource: File | Blob | string,
    productId: string
  ): Promise<{ downloadUrl: string; sizeKb: number }> {
    // If it's already an HTTPS link (e.g. from Kirana presets), return it directly
    if (typeof imageSource === 'string' && imageSource.startsWith('http')) {
      return { downloadUrl: imageSource, sizeKb: 120 };
    }

    try {
      // 1. Compress the image first
      const { blob, dataUrl, compressedSizeKb } = await this.compressImage(imageSource);

      // 2. Check if Firebase Storage is live
      if (isFirebaseConfigured()) {
        const timestamp = Date.now();
        const filename = `products/${productId}_${timestamp}.jpg`;
        const storageRef = ref(storage, filename);

        console.log(`[StorageService] Uploading to Firebase Storage: ${filename}...`);
        await uploadBytes(storageRef, blob, {
          contentType: 'image/jpeg',
          customMetadata: { productId, uploadedAt: new Date().toISOString() },
        });

        const downloadUrl = await getDownloadURL(storageRef);
        console.log(`[StorageService] Upload successful! Public URL: ${downloadUrl}`);
        crashlyticsService.logBreadcrumb('storage', `Product photo uploaded: ${productId}`);

        return { downloadUrl, sizeKb: compressedSizeKb };
      } else {
        // Fallback for demo / offline mode: return compressed Data URL
        console.warn(
          '[StorageService] Live Firebase Storage not configured. Using compressed local Data URL.'
        );
        return { downloadUrl: dataUrl, sizeKb: compressedSizeKb };
      }
    } catch (err: any) {
      console.error('[StorageService] Image upload error:', err);
      crashlyticsService.recordError(err, false, { context: 'uploadProductImage', productId });

      // If compression or upload failed, provide resilient fallback
      if (typeof imageSource === 'string' && imageSource.length > 0) {
        return { downloadUrl: imageSource, sizeKb: 100 };
      }

      // Default grocery placeholder
      return {
        downloadUrl: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&q=80',
        sizeKb: 80,
      };
    }
  }
}

export const storageService = new StorageService();
export default storageService;
