// src/components/RandomAvatar.tsx
import React from "react";

// Only use the 3 available avatars
const avatarList = [
  "avatars/avatar1.png",
  "avatars/avatar2.png",
  "avatars/avatar3.png",
];

// Deterministically pick an avatar based on user id or name
export function getRandomAvatar(seed: string | number) {
  let hash = 0;
  const str = String(seed);
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const idx = Math.abs(hash) % avatarList.length;
  return `/${avatarList[idx]}`;
}

const RandomAvatar: React.FC<{ seed: string | number; alt?: string; className?: string }> = ({ seed, alt = "Avatar", className = "" }) => {
  const src = getRandomAvatar(seed);
  return <img src={src} alt={alt} className={className} />;
};

export default RandomAvatar;
