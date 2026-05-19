export function isFileSizeValid(fileSize: number): boolean {
  const maxSize = 50 * 1024 * 1024;
  return fileSize <= maxSize;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export async function compressImage(file: File): Promise<Blob> {
  // Fallback: si no hay soporte de canvas, devolver el archivo original
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Read file failed'));

    reader.onload = (event) => {
      const result = event.target?.result;
      if (!result || typeof result !== 'string') {
        return reject(new Error('Invalid file data'));
      }

      // Usar window.Image explícitamente para evitar conflicto con Next.js Image
      const img = new window.Image();

      img.onerror = () => reject(new Error('Load image failed'));

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const maxWidth = 1920;
          const maxHeight = 1080;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) return reject(new Error('Canvas context failed'));

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                resolve(blob);
              } else {
                // Si toBlob falla, devolver el archivo original
                resolve(file);
              }
            },
            'image/jpeg',
            0.8
          );
        } catch (e) {
          reject(e);
        }
      };

      img.src = result;
    };

    reader.readAsDataURL(file);
  });
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}
