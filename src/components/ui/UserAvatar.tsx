import React, { useState } from "react";
import { getSafeImageUrl, handleImageError, createPlaceholderImage } from "../../utils/imageUtils";

function UserAvatar({ user }: { user: { profile_image?: string | null; name?: string | null } }) {
  const [imgError, setImgError] = useState(false);
  
  // Get safe image URL with fallback
  const safeImageUrl = getSafeImageUrl(user?.profile_image);
  
  // If no profile image or image error, show placeholder
  if (!user?.profile_image || imgError) {
    const placeholderUrl = createPlaceholderImage(user?.name || 'User', 40);
    return (
      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
        <img
          src={placeholderUrl}
          alt={user?.name || 'User'}
          className="w-10 h-10 rounded-full object-cover"
        />
      </div>
    );
  }

  return (
    <img
      src={safeImageUrl}
      alt={user?.name || 'User'}
      className="w-10 h-10 rounded-full object-cover"
      onError={(e) => {
        setImgError(true);
        handleImageError(e);
      }}
    />
  );
}

export default UserAvatar;
