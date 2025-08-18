import * as React from "react";
import { useNavigate } from "react-router-dom";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";



interface CreatePostDialogProps {
  onClose: () => void;
}

const CreatePostDialog: React.FC<CreatePostDialogProps> = ({ onClose }) => {
const { user } = useAuth();
const userId = user?.id;
const token = user?.accessToken;

  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")

  ? import.meta.env.VITE_API_URL
  : `${import.meta.env.VITE_API_URL}/api`;
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [postType, setPostType] = React.useState("post");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
const [promotionalPrice, setPromotionalPrice] = React.useState<string>(""); 
// or if you want number:
// const [promotionalPrice, setPromotionalPrice] = React.useState<number | "">("");

 
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isVideo, setIsVideo] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [videoThumbnail, setVideoThumbnail] = React.useState<string>("");
  

const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;

  const isVideoFile = file.type.startsWith("video/");
  const isImageFile = file.type.startsWith("image/");

  setIsVideo(isVideoFile);

  // Local preview with blob URL for instant UI feedback
  const url = URL.createObjectURL(file);
  setPreviewUrl(url);
  setSelectedFile(file);

  if (isImageFile) {
    // Convert image to base64 to send as thumbnail
    const reader = new FileReader();
    reader.onloadend = () => {
      // Save base64 string as thumbnail
      const base64String = reader.result as string;
      setPreviewUrl(base64String); // preview with base64
      setVideoThumbnail(base64String); // save thumbnail for uploading
    };
    reader.readAsDataURL(file);
  } else {
    // For videos, use a fallback thumbnail until backend processes it
    setVideoThumbnail("https://placehold.co/600x400?text=Thumbnail");
  }
};

const [isPaid, setIsPaid] = React.useState(false);

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
// Utility to generate a thumbnail file from video

// ...

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  // Validation
  if (!title.trim()) {
    toast({
      title: "Title required",
      description: "Please enter a title for your post",
      variant: "destructive",
    });
    return;
  }

  if (!selectedFile) {
    toast({
      title: "File required",
      description: "Please select a file to upload",
      variant: "destructive",
    });
    return;
  }

  setIsLoading(true);

  try {
    // Wallet deduction for paid content
    if (isPaid) {
      if (!userId || !token) {
        toast({
          title: "Sign-in required",
          description: "Please sign in before uploading paid content.",
          variant: "destructive",
        });
        setIsLoading(false);
        navigate("/login");
        return;
      }

      const paidUploadCharge = 50; // Set your charge amount here

      const walletRes = await axios.post(
        `${BASE_URL}/deduct-wallet/${userId}`,
        { amount: paidUploadCharge },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (walletRes.status !== 200 || walletRes.data.success !== true) {
        throw new Error(walletRes.data.message || "Insufficient balance or deduction failed");
      }
    }

    const isShot = postType === "tip-shorts";
    const isTube = postType === "tip-tube";
    

    const videoThumbnail = previewUrl; // Or replace with actual thumbnail URL if available

    const videoLinkToSend = ""; // Replace with actual video URL if needed
    const videoLink = videoLinkToSend.trim() !== "" ? videoLinkToSend : "";

    // Debug logging
    console.log("Uploading video_Thumbnail:", videoThumbnail);
    console.log("Uploading videoLink:", videoLink);

    // Build FormData
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("name", title.trim());
    formData.append("isShot", String(isShot));
    formData.append("categoryId", String(parseInt(category) || 0));
    formData.append("channelId", "123"); // Update as appropriate
    formData.append("videoLink", videoLink);
    formData.append("videoDesciption", description.trim());
    formData.append("createdby", "123"); // Update as needed
    formData.append("play_duration", "00:00");
    formData.append("video_Thumbnail", videoThumbnail);

    // Debug print formData entries
    for (const [key, value] of formData.entries()) {
      console.log(key, value);
    }

    const res = await fetch(`${BASE_URL}/uploadshot`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid response: ${text}`);
    }

    if (!res.ok || data.status !== 200) {
      throw new Error(data.message || `Upload failed (status ${res.status})`);
    }

    toast({
      title: isTube ? "Tip Tube created successfully" : "Tip Shorts created successfully",
      description: "Your video content has been uploaded",
    });

    setIsLoading(false);
    onClose();
    navigate(isTube ? "/tiptube" : "/tipshorts");
  } catch (err: any) {
    console.error("Upload error:", err);
    toast({
      title: "Upload failed",
      description: err.message || String(err),
      variant: "destructive",
    });
    setIsLoading(false);
  }
};







  React.useEffect(() => {
    // Reset form when post type changes
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsVideo(postType !== "post");
  }, [postType]);

  return (
<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
  <DialogHeader>
    <DialogTitle className="text-xl">
      Create {postType === "post" ? "Post" : postType === "tip-tube" ? "Tip Tube" : "Tip Shorts"}
    </DialogTitle>
  </DialogHeader>

  <form onSubmit={handleSubmit} className="space-y-5 py-3">
    {/* Post Type Selection */}
    <div>
      <Label htmlFor="post-type">Post Type</Label>
      <Select value={postType} onValueChange={setPostType}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Select post type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="post">Create a Post</SelectItem>
          <SelectItem value="tip-tube">Tip Tube</SelectItem>
          <SelectItem value="tip-shorts">Tip Shorts</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* File Upload */}
    <div
      onClick={triggerFileInput}
      className={`border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50 transition ${
        previewUrl ? "bg-gray-50" : ""
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={postType === "post" ? "image/*" : "video/*"}
        onChange={handleFileChange}
      />

      {previewUrl ? (
        <div className="relative">
          {isVideo ? (
            <video
              src={previewUrl}
              className="w-full rounded-lg"
              height={240}
              controls
            />
          ) : (
            <img
              src={previewUrl}
              alt="Preview"
              className="w-full rounded-lg"
              height={240}
            />
          )}
          <div className="mt-2 text-sm text-gray-500">
            Click to change {isVideo ? "video" : "image"}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm font-medium">Click to upload</p>
          <p className="text-xs text-gray-500">
            {postType === "post" ? "Upload an image" : "Upload a video"}
          </p>
        </div>
      )}
    </div>

    {/* Paid Content Checkbox */}
    <div className="flex items-center gap-2 mb-2">
      <Input
        id="isPaid"
        type="checkbox"
        checked={isPaid}
        onChange={(e) => setIsPaid(e.target.checked)}
        className="w-5 h-5 accent-teal-500 cursor-pointer"
      />
      <Label
        htmlFor="isPaid"
        className="cursor-pointer text-base font-medium"
      >
        Is this content paid?
      </Label>
    </div>

    {/* Promotional Price (conditional) */}
    {isPaid && (
      <div>
        <Label htmlFor="promotionalPrice">Set Promotional Price</Label>
        <Input
          id="promotionalPrice"
          type="number"
          min="1"
          value={promotionalPrice}
          onChange={(e) => setPromotionalPrice(e.target.value)}
          placeholder="Enter price in credits"
          className="mt-1"
        />
      </div>
    )}

    {/* Title */}
    <div>
      <Label htmlFor="title">Title</Label>
      <Input
        id="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Give your post a title"
        className="mt-1"
      />
    </div>

    {/* Description */}
    <div>
      <Label htmlFor="description">Description</Label>
      <Textarea
        id="description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What's your post about?"
        className="mt-1 h-24"
      />
    </div>

    {/* Category Selection */}
    <div>
      <Label htmlFor="category">Category</Label>
      <Select value={category} onValueChange={setCategory}>
        <SelectTrigger className="mt-1">
          <SelectValue placeholder="Select a category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="tech">Tech</SelectItem>
          <SelectItem value="beauty">Beauty</SelectItem>
          <SelectItem value="gaming">Gaming</SelectItem>
          <SelectItem value="food">Food</SelectItem>
          <SelectItem value="travel">Travel</SelectItem>
          <SelectItem value="finance">Finance</SelectItem>
          <SelectItem value="fashion">Fashion</SelectItem>
          <SelectItem value="music">Music</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Action Buttons */}
    <div className="flex justify-end pt-3 gap-3">
      <Button variant="outline" type="button" onClick={onClose}>
        Cancel
      </Button>
      <Button
        type="submit"
        className="bg-adtip-teal hover:bg-adtip-teal/90 text-white"
        disabled={isLoading}
      >
        {isLoading ? "Posting..." : "Post"}
      </Button>
    </div>
  </form>
</DialogContent>


  );
};

export default CreatePostDialog;