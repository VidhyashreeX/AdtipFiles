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

interface CreatePostDialogProps {
  onClose: () => void;
}

const CreatePostDialog: React.FC<CreatePostDialogProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [postType, setPostType] = React.useState("post");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [isVideo, setIsVideo] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type based on post type
    const isVideoFile = file.type.startsWith('video/');
    const isImageFile = file.type.startsWith('image/');
    
    if (postType === "post" && !isImageFile) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image for regular posts",
        variant: "destructive",
      });
      return;
    }
    if ((postType === "tip-tube" || postType === "tip-shorts") && !isVideoFile) {
      toast({
        title: "Invalid file type",
        description: `Please upload a video for ${postType === "tip-tube" ? "Tip Tube" : "Tip Shorts"}`,
        variant: "destructive",
      });
      return;
    }

    setIsVideo(isVideoFile);
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

    setIsLoading(true);

    // Simulate uploading
    setTimeout(() => {
      toast({
        title: `${postType === "post" ? "Post" : postType === "tip-tube" ? "Tip Tube" : "Tip Shorts"} created successfully`,
        description: "Your content has been uploaded",
      });
      setIsLoading(false);
      onClose();
      navigate(postType === "post" ? "/home" : "/tiptube");
    }, 1500);
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
          <Select 
            value={postType} 
            onValueChange={setPostType}
          >
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
            accept={postType === "post" ? "image/" : "video/"}
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