import { useState, useEffect, useRef } from "react";
import { useAuthModal } from "../contexts/AuthModalContext";

interface BannerItem {
  title: string;
  description: string;
  gradient: string;
  icon: string;
}

interface BannerCarouselProps {
  userId: string | number | null;
  isAuthenticated: boolean;
}

const bannerData: BannerItem[] = [
  {
    title: "Watch & Earn",
    description: "Earn rewards by watching videos",
    gradient: "from-[#7F7FD5] via-[#86A8E7] to-[#91EAE4]",
    icon: "🎬",
  },
  {
    title: "Play & Earn",
    description: "Earn money by playing games",
    gradient: "from-[#43e97b] via-[#38f9d7] to-[#38f9d7]",
    icon: "🎮",
  },
  {
    title: "Refer & Earn",
    description: "Invite friends and earn bonuses",
    gradient: "from-[#f7971e] via-[#ffd200] to-[#f7971e]",
    icon: "🤝",
  },
];

const BannerCarousel = ({ userId, isAuthenticated }: BannerCarouselProps) => {
  const { openLoginModal } = useAuthModal();
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setCurrent((prev) => (prev + 1) % bannerData.length);
    }, 4000);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [current]);

  const handleEarnClick = () => {
    if (isAuthenticated && userId) {
      window.open(`https://wow.pubscale.com/?app_id=39604779&user_id=${userId}`, "_blank");
    } else {
      openLoginModal();
    }
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-6">
      <div
        className={`rounded-2xl p-6 flex items-center justify-between shadow-lg bg-gradient-to-r ${bannerData[current].gradient} transition-all duration-700`}
      >
        <div>
          <div className="text-3xl mb-2">{bannerData[current].icon}</div>
          <h3 className="font-bold text-lg mb-1 text-white drop-shadow">{bannerData[current].title}</h3>
          <p className="text-white/90 text-sm mb-3 drop-shadow">{bannerData[current].description}</p>
          <button
            onClick={handleEarnClick}
            className="px-6 py-2 rounded-full font-bold text-white bg-gradient-to-r from-[#ff512f] to-[#dd2476] shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            Earn
          </button>
        </div>
      </div>
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
        {bannerData.map((_, idx) => (
          <span
            key={idx}
            className={`w-2 h-2 rounded-full ${idx === current ? "bg-white/90" : "bg-white/40"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default BannerCarousel;