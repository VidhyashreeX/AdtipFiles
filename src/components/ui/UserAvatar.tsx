import React from "react";

function UserAvatar({ user }: { user: { profile_image?: string | null; name?: string | null } }) {
  const [imgError, setImgError] = React.useState(false);
  const initial = user?.name?.charAt(0).toUpperCase() || "U";

  if (user?.profile_image && !imgError) {
    return (
      <img
        src={user.profile_image}
        alt="Profile"
        className="h-7 w-7  rounded-full object-cover border-2 border-gray-200"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div className="h-7 w-7 md:h-9 md:w-9 rounded-full bg-adtip-teal text-white font-semibold flex items-center justify-center border-2 border-gray-200 select-none">
      {initial}
    </div>
  );
}

export default UserAvatar;
