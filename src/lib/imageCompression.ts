export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read selected file.'));
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.readAsDataURL(file);
  });
}

function estimateBase64Bytes(dataUrl: string): number {
  const idx = dataUrl.indexOf(',');
  if (idx === -1) return dataUrl.length;
  return Math.round(((dataUrl.length - idx - 1) * 3) / 4);
}

export async function compressImageFile(
  file: File,
  maxWidth = 1920,
  quality = 0.84
): Promise<{
  dataUrl: string;
  width: number;
  height: number;
  originalBytes: number;
  compressedBytes: number;
}> {
  const result = await fileToDataUrl(file);
  const originalBytes = file.size || estimateBase64Bytes(result);

  if (!file.type.startsWith('image/')) {
    return {
      dataUrl: result,
      width: 0,
      height: 0,
      originalBytes,
      compressedBytes: originalBytes,
    };
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () =>
      resolve({
        dataUrl: result,
        width: 0,
        height: 0,
        originalBytes,
        compressedBytes: originalBytes,
      });
    img.onload = () => {
      let targetWidth = img.width;
      let targetHeight = img.height;
      const resized = targetWidth > maxWidth;
      if (resized) {
        targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
        targetWidth = maxWidth;
      }
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve({
          dataUrl: result,
          width: img.width,
          height: img.height,
          originalBytes,
          compressedBytes: originalBytes,
        });
        return;
      }
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      const outputMime =
        file.type === 'image/png'
          ? 'image/png'
          : file.type === 'image/webp'
          ? 'image/webp'
          : 'image/jpeg';
      const compressed = canvas.toDataURL(outputMime, quality);
      const compressedSize = estimateBase64Bytes(compressed);
      const finalUrl = !resized && compressedSize > originalBytes ? result : compressed;
      const finalBytes = Math.min(originalBytes, compressedSize);
      resolve({
        dataUrl: finalUrl,
        width: targetWidth,
        height: targetHeight,
        originalBytes,
        compressedBytes: resized ? compressedSize : finalBytes,
      });
    };
    img.src = result;
  });
}
