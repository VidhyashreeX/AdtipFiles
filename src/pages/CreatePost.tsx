
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, Video } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

const CreatePost = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isVideo, setIsVideo] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [pricePerMinute, setPricePerMinute] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is authenticated
  if (!isAuthenticated) {
    navigate("/login");
    return null;
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check if the file is a video
    const isVideoFile = file.type.startsWith('video/');
    setIsVideo(isVideoFile);
    
    // Create a preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
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

    if (isPaid && (pricePerMinute <= 0)) {
      toast({
        title: "Invalid price",
        description: "Please set a valid price per minute",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Simulate uploading
    setTimeout(() => {
      toast({
        title: "Post created successfully",
        description: isPaid 
          ? `Your paid video has been uploaded at ₹${pricePerMinute}/minute` 
          : "Your post has been uploaded",
      });
      setIsLoading(false);
      navigate("/tiptube");
    }, 2000);
  };

  return (
    <div className="pb-20 md:pb-0">
      <div className="bg-white sticky top-0 z-10 p-4 flex items-center border-b">
        <button onClick={() => navigate(-1)} className="mr-4">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="text-lg font-semibold flex-1">Create Post</h1>
        <Button 
          onClick={handleSubmit} 
          className="teal-button"
          disabled={isLoading}
        >
          {isLoading ? "Uploading..." : "Post"}
        </Button>
      </div>

      <div className="max-w-screen-md mx-auto p-4">
        <form className="space-y-6">
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
              accept="image/*,video/*"
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
                  Support for images and videos
                </p>
              </div>
            )}
          </div>

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

          {/* Paid Video Toggle - Only show for videos */}
          {isVideo && (
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Paid Video (Tip Video)</h3>
                  <p className="text-sm text-gray-500">
                    Viewers will pay per minute to watch your video
                  </p>
                </div>
                <Switch 
                  checked={isPaid} 
                  onCheckedChange={setIsPaid}
                  id="paid-video"
                />
              </div>
              
              {isPaid && (
                <div>
                  <Label htmlFor="price-per-minute">Price per minute (₹)</Label>
                  <Input
                    id="price-per-minute"
                    type="number"
                    min="1"
                    value={pricePerMinute === 0 ? "" : pricePerMinute}
                    onChange={(e) => setPricePerMinute(Number(e.target.value))}
                    placeholder="4"
                    className="mt-1"
                  />
                  {pricePerMinute > 0 && (
                    <p className="text-xs text-gray-500 mt-2">
                      For a 10-minute video, viewers will pay ₹{pricePerMinute * 10} in total
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default CreatePost;
