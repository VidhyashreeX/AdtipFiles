export const generateThumbnail = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      // Set canvas dimensions
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Capture frame at 1 second
      video.currentTime = 1;
      video.onseeked = () => {
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg'));
        URL.revokeObjectURL(video.src);
      };
    };

    video.onerror = reject;
  });
};
