import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, MessageSquare, Share2, User } from "lucide-react";

interface TipShort {
  id: number;
  user: {
    name: string;
    avatar: string;
    isVerified: boolean;
  };
  content: {
    video: string;
    description: string;
    likes: string;
    comments: number;
    shares: number;
  };
  musicName: string;
}

const TipShorts = () => {
  const [shorts, setShorts] = useState<TipShort[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [liked, setLiked] = useState<{ [key: number]: boolean }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const currentShort = shorts[currentIndex];

  useEffect(() => {
    const fetchShorts = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_TIP_SHORTS_BASE_URL}/tipshorts`);
        if (!res.ok) throw new Error("Failed to load tip shorts");
        const data = await res.json();
        setShorts(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchShorts();
  }, []);

  const handleNext = () => {
    if (currentIndex < shorts.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrevious = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const toggleLike = (id: number) => {
    setLiked(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  if (loading) return <div className="text-white h-screen flex items-center justify-center">Loading...</div>;
  if (error) return <div className="text-red-500 h-screen flex items-center justify-center">{error}</div>;
  if (!currentShort) return null;

  return (
    <div className="h-screen bg-black overflow-hidden">
      <div className="relative h-full w-full overflow-hidden">
        <div
          ref={el => (videoRefs.current[currentIndex] = el)}
          className="h-full w-full bg-gray-900 flex items-center justify-center"
        >
          <img
            src={currentShort.content.video}
            alt="TipShort video"
            className="h-full w-full object-cover"
          />
        </div>

        {/* Right-side actions */}
        <div className="absolute right-4 bottom-28 flex flex-col items-center space-y-6">
          <button onClick={() => toggleLike(currentShort.id)} className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full ${liked[currentShort.id] ? 'bg-pink-500/20' : 'bg-black/20'} backdrop-blur-lg flex items-center justify-center`}>
              <Heart className={`h-6 w-6 ${liked[currentShort.id] ? 'text-pink-500 fill-pink-500' : 'text-white'}`} />
            </div>
            <span className="text-white text-xs mt-1">{currentShort.content.likes}</span>
          </button>
          <button className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-lg flex items-center justify-center">
              <MessageSquare className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs mt-1">{currentShort.content.comments}</span>
          </button>
          <button className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-lg flex items-center justify-center">
              <Share2 className="h-6 w-6 text-white" />
            </div>
            <span className="text-white text-xs mt-1">{currentShort.content.shares}</span>
          </button>
        </div>

        {/* Bottom user info */}
        <div className="absolute left-4 right-20 bottom-6 text-white">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 rounded-full bg-gray-600 overflow-hidden mr-3">
              {currentShort.user.avatar ? (
                <img src={currentShort.user.avatar} alt={currentShort.user.name} className="h-full w-full object-cover" />
              ) : (
                <User className="h-full w-full p-2" />
              )}
            </div>
            <div>
              <div className="flex items-center">
                <h3 className="font-semibold text-sm">{currentShort.user.name}</h3>
                {currentShort.user.isVerified && <span className="ml-1 text-adtip-teal text-xs">✓</span>}
              </div>
              <Button size="sm" className="h-7 mt-1 teal-button text-xs">Follow</Button>
            </div>
          </div>

          <p className="text-sm mb-2">{currentShort.content.description}</p>

          <div className="flex items-center text-xs bg-black/30 rounded-full px-3 py-1 w-fit">
            <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none"><path d="M9 18V5l12 6.5L9 18z" fill="currentColor" /></svg>
            {currentShort.musicName}
          </div>
        </div>

        {/* Top indicators */}
        <div className="absolute top-4 left-4 right-4 flex">
          {shorts.map((_, index) => (
            <div key={index} className={`h-1 flex-1 mx-0.5 rounded-full ${index === currentIndex ? 'bg-adtip-teal' : 'bg-gray-400/50'}`} />
          ))}
        </div>

        {/* Click zones */}
        <div className="absolute inset-0">
          <div className="absolute left-0 top-0 bottom-0 w-1/3 h-full" onClick={handlePrevious} />
          <div className="absolute right-0 top-0 bottom-0 w-1/3 h-full" onClick={handleNext} />
        </div>
      </div>
    </div>
  );
};

export default TipShorts;
