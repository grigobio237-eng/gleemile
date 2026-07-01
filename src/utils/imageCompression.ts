/**
 * Converts a File (image) to a compressed WebP File using HTML5 Canvas API.
 * Resizes the image so that its maximum dimension is `maxSize` pixels.
 * Output quality is 0.8 by default.
 */
export async function compressToWebP(file: File, maxSize: number = 1200, quality: number = 0.8): Promise<File> {
  return new Promise((resolve, reject) => {
    // 1. Validate file type
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // 2. Calculate new dimensions preserving aspect ratio
        let width = img.width;
        let height = img.height;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        // 3. Draw on Canvas
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to get canvas 2D context'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // 4. Convert to WebP and return as File
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas toBlob failed'));
              return;
            }
            // Generate a safe WebP filename
            const newFilename = file.name.replace(/\.[^/.]+$/, "") + ".webp";
            const newFile = new File([blob], newFilename, { type: 'image/webp' });
            resolve(newFile);
          },
          'image/webp',
          quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image element'));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
