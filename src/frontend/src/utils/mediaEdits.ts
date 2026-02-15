interface ImageEditOptions {
  filter: string;
  textOverlay: string;
  crop: { x: number; y: number; width: number; height: number };
}

interface VideoEditOptions {
  filter: string;
  textOverlay: string;
  trimStart: number;
  trimEnd: number;
}

export async function applyImageEdits(
  image: HTMLImageElement,
  options: ImageEditOptions
): Promise<File> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  // Apply filter
  if (options.filter !== 'none') {
    ctx.filter = `${options.filter}(100%)`;
  }

  ctx.drawImage(image, 0, 0);

  // Apply text overlay
  if (options.textOverlay) {
    ctx.filter = 'none';
    ctx.font = 'bold 48px Arial';
    ctx.fillStyle = 'white';
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 3;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const x = canvas.width / 2;
    const y = canvas.height / 2;
    ctx.strokeText(options.textOverlay, x, y);
    ctx.fillText(options.textOverlay, x, y);
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `edited-${Date.now()}.jpg`, {
          type: 'image/jpeg',
        });
        resolve(file);
      }
    }, 'image/jpeg', 0.9);
  });
}

export async function applyVideoEdits(
  video: HTMLVideoElement,
  originalFile: File,
  options: VideoEditOptions
): Promise<File> {
  // Browser-based video editing with filters/trim/text would require complex processing
  // that strips audio or requires server-side transcoding.
  // For now, return the original video file to preserve audio and playback.
  // True non-destructive editing is not supported in this implementation.
  console.warn('Video editing is not fully supported. Returning original file to preserve audio.');
  return originalFile;
}
