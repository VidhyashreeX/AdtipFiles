import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Copy, Share2 } from "lucide-react";
import { FaWhatsapp, FaTelegramPlane, FaFacebook } from "react-icons/fa";

interface ShareModalProps {
  shareUrl: string;
  open: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ shareUrl, open, onClose }) => {
  const [copied, setCopied] = useState(false);
 const url = shareUrl;


  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Copy failed", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Check this short!",
          text: "I found this short interesting — take a look:",
          url: url,
        });
        return;
      } catch (e) {
        console.warn("Native share failed or cancelled", e);
      }
    } else {
      handleCopy();
    }
  };

  const iconButtonClasses =
    "flex flex-col items-center gap-2 w-[72px] text-xs focus:outline-none";

  const circleClasses =
    "w-12 h-12 flex items-center justify-center rounded-full shadow hover:scale-110 transition-transform";

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-sm rounded-2xl shadow-2xl border-0 bg-white dark:bg-neutral-900">
        <DialogHeader>
          <DialogTitle className="text-center text-[15px] font-semibold">
            Share
          </DialogTitle>
        </DialogHeader>

        {/* Icons grid */}
        <div className="flex justify-center flex-wrap mt-4 gap-5">
          {/* Copy Link */}
          <button onClick={handleCopy} className={iconButtonClasses}>
            <div className={`${circleClasses} bg-neutral-200 dark:bg-neutral-700`}>
              <Copy size={20} />
            </div>
            {copied ? "Copied!" : "Copy"}
          </button>

          {/* WhatsApp */}
          <a
            href={`https://wa.me/?text=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={iconButtonClasses}
          >
            <div className={`${circleClasses} bg-[#25D366]`}>
              <FaWhatsapp size={20} className="text-white" />
            </div>
            WhatsApp
          </a>

          {/* Telegram */}
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={iconButtonClasses}
          >
            <div className={`${circleClasses} bg-[#229ED9]`}>
              <FaTelegramPlane size={20} className="text-white" />
            </div>
            Telegram
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={iconButtonClasses}
          >
            <div className={`${circleClasses} bg-[#3b5998]`}>
              <FaFacebook size={20} className="text-white" />
            </div>
            Facebook
          </a>

          {/* Native Share */}
          <button onClick={handleNativeShare} className={iconButtonClasses}>
            <div className={`${circleClasses} bg-purple-500`}>
              <Share2 size={20} className="text-white" />
            </div>
            More
          </button>
        </div>

        {/* Link preview at bottom */}
        <div className="mt-5 px-3 py-2 bg-neutral-100 dark:bg-neutral-800 rounded-lg text-xs text-center truncate select-all">
          {url}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareModal;
