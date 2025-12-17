// Enhanced Create Post Component
// Addresses all upload and create-post flow issues

import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { 
  ArrowLeft, 
  Upload, 
  Lock, 
  AlertCircle, 
  CheckCircle, 
  FileText, 
  Video, 
  Image as ImageIcon,
  User,
  Zap,
  Info,
  X,
  RefreshCw
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useAuthModal } from "../contexts/AuthModalContext";
import enhancedUploadService, { UploadProgress, UploadResult } from "../services/enhancedUploadService";
import { validateFile, getAcceptAttribute, getFileTypeDescription, formatFileSize } from "../utils/fileValidation";
import { cn } from "@/lib/utils";

interface CreatePostState {
  title: string;
  description: string;
  category: string;
  postType: 'post' | 'tip-tube' | 'tip-shorts';
  selectedFile: File | null;
  previewUrl: string | null;
  isVideo: boolean;
  isPaid: boolean;
  pricePerMinute: number;
  isLoading: boolean;
  uploadProgress: UploadProgress | null;
  validationErrors: string[];
  validationWarnings: string[];
}

const EnhancedCreatePost = () => {
  const { openLoginModal } = useAuthModal();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [state, setState] = useState<CreatePostState>({
    title: "",
    description: "",
    category: "",
    postType: "post",
    selectedFile: null,
    previewUrl: null,
    isVideo: false,
    isPaid: false,
    pricePerMinute: 0,
    isLoading: false,
    uploadProgress: null,
    validationErrors: [],
    validationWarnings: []
  });

  const [showChannelDialog, setShowChannelDialog] = useState(false);

  // Check upload permissions on component mount
  useEffect(() => {
    if (isAuthenticated) {
      const permissionCheck = enhancedUploadService.canUserUpload();
      if (!permissionCheck.canUpload && permissionCheck.requiresChannel) {
        setShowChannelDialog(true);
      }
    }
  }, [isAuthenticated]);

  // Update state helper
  const updateState = (updates: Partial<CreatePostState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Handle file selection with comprehensive validation
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    console.log('[EnhancedCreatePost] File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    // Clear previous validation errors
    updateState({ validationErrors: [], validationWarnings: [] });

    // Validate file
    const validationResult = validateFile(file, state.postType);
    
    if (!validationResult.isValid) {
      updateState({
        validationErrors: [validationResult.error || 'Invalid file'],
        selectedFile: null,
        previewUrl: null
      });
      
      toast({
        title: "Invalid File",
        description: validationResult.error,
        variant: "destructive",
      });
      return;
    }

    // Set warnings if any
    if (validationResult.warnings) {
      updateState({ validationWarnings: validationResult.warnings });
    }

    // Create preview URL
    const isVideoFile = validationResult.fileInfo?.type === 'video';
    const url = URL.createObjectURL(file);
    
    updateState({
      selectedFile: file,
      previewUrl: url,
      isVideo: isVideoFile,
      validationErrors: [],
    });

    // Show success message with file info
    toast({
      title: "File Selected",
      description: `${validationResult.fileInfo?.sizeFormatted} ${validationResult.fileInfo?.type} file ready for upload`,
    });
  };

  // Handle post type change
  const handlePostTypeChange = (newPostType: 'post' | 'tip-tube' | 'tip-shorts') => {
    // Clear file when changing post type
    if (state.selectedFile) {
      URL.revokeObjectURL(state.previewUrl || '');
    }
    
    updateState({
      postType: newPostType,
      selectedFile: null,
      previewUrl: null,
      isVideo: newPostType !== 'post',
      isPaid: false,
      pricePerMinute: 0,
      validationErrors: [],
      validationWarnings: []
    });
  };

  // Trigger file input
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    const errors: string[] = [];
    
    if (!state.title.trim()) {
      errors.push("Title is required");
    }
    
    if (state.title.length > 100) {
      errors.push("Title must be less than 100 characters");
    }
    
    if (!state.selectedFile) {
      errors.push("Please select a file to upload");
    }
    
    if (state.isPaid && (state.postType === "tip-tube" || state.postType === "tip-shorts")) {
      if (state.pricePerMinute < 0.20 || state.pricePerMinute > 5.00) {
        errors.push("Price must be between ₹0.20 and ₹5.00 per minute");
      }
    }

    if (errors.length > 0) {
      updateState({ validationErrors: errors });
      toast({
        title: "Validation Error",
        description: errors[0],
        variant: "destructive",
      });
      return;
    }

    // Check upload permissions
    const permissionCheck = enhancedUploadService.canUserUpload();
    if (!permissionCheck.canUpload) {
      if (permissionCheck.requiresChannel) {
        setShowChannelDialog(true);
        return;
      } else {
        toast({
          title: "Upload Error",
          description: permissionCheck.error,
          variant: "destructive",
        });
        return;
      }
    }

    updateState({ isLoading: true, uploadProgress: null });

    try {
      const result = await enhancedUploadService.uploadContent(
        state.selectedFile!,
        {
          title: state.title,
          description: state.description,
          category: state.category,
          postType: state.postType,
          isPaid: state.isPaid,
          pricePerMinute: state.pricePerMinute,
          userId: user!.id,
          channelId: user!.channelId || (user as any).channel_id
        },
        (progress) => {
          updateState({ uploadProgress: progress });
        }
      );

      if (result.success) {
        toast({
          title: "Upload Successful!",
          description: `Your ${state.postType === "post" ? "post" : state.postType === "tip-tube" ? "Tip Tube video" : "Tip Shorts video"} has been uploaded successfully.`,
        });
        
        // Navigate to appropriate page
        const targetPage = state.postType === "post" ? "/posts" : "/tiptube";
        navigate(targetPage);
      } else {
        throw new Error(result.error || 'Upload failed');
      }

    } catch (error: any) {
      console.error('[EnhancedCreatePost] Upload error:', error);
      
      updateState({ 
        validationErrors: [error.message || 'Upload failed. Please try again.']
      });
      
      toast({
        title: "Upload Failed",
        description: error.message || 'Please try again.',
        variant: "destructive",
      });
    } finally {
      updateState({ isLoading: false, uploadProgress: null });
    }
  };

  // Handle channel creation
  const handleCreateChannel = () => {
    navigate('/create-channel', { 
      state: { returnTo: '/create-post' } 
    });
  };

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (state.previewUrl) {
        URL.revokeObjectURL(state.previewUrl);
      }
    };
  }, [state.previewUrl]);

  // If user is not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-adtip-teal/10 rounded-full">
                <Lock className="h-8 w-8 text-adtip-teal" />
              </div>
            </div>
            <CardTitle className="text-xl">Authentication Required</CardTitle>
            <CardDescription>
              You need to be logged in to create and upload content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">What you can do after logging in:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Upload images and videos</li>
                <li>• Create Tip Tube and Tip Shorts content</li>
                <li>• Earn money from your content</li>
                <li>• Build your audience</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              className="w-full bg-adtip-teal hover:bg-adtip-teal/90" 
              onClick={openLoginModal}
            >
              Log In to Continue
            </Button>
            <div className="text-center text-sm text-gray-600">
              Don't have an account?{" "}
              <Link to="/signup" className="text-adtip-teal hover:underline font-medium">
                Sign Up Free
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Show channel creation dialog
  if (showChannelDialog) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-gray-50 to-blue-50">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-orange-100 rounded-full">
                <User className="h-8 w-8 text-orange-600" />
              </div>
            </div>
            <CardTitle className="text-xl">Channel Required</CardTitle>
            <CardDescription>
              You need to create a channel before uploading videos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-medium text-orange-900 mb-2">Why do you need a channel?</h4>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Organize your content</li>
                <li>• Build your brand identity</li>
                <li>• Track your earnings</li>
                <li>• Gain subscribers</li>
              </ul>
            </div>
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Creating a channel is free and takes less than a minute!
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button 
              className="w-full bg-adtip-teal hover:bg-adtip-teal/90" 
              onClick={handleCreateChannel}
            >
              <User className="h-4 w-4 mr-2" />
              Create My Channel
            </Button>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // Main create post form
  return (
    <div className="pb-20 md:pb-0 min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 p-4 flex items-center border-b shadow-sm">
        <button onClick={() => navigate(-1)} className="mr-4 p-1 hover:bg-gray-100 rounded">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex-1">
          <h1 className="text-lg font-semibold">
            Create {state.postType === "post" ? "Post" : state.postType === "tip-tube" ? "Tip Tube" : "Tip Shorts"}
          </h1>
          <p className="text-sm text-gray-500">
            {getFileTypeDescription(state.postType)}
          </p>
        </div>
        <Button 
          onClick={handleSubmit} 
          className="bg-adtip-teal hover:bg-adtip-teal/90"
          disabled={state.isLoading || !state.selectedFile || !state.title.trim()}
        >
          {state.isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            "Publish"
          )}
        </Button>
      </div>

      <div className="max-w-screen-md mx-auto p-4">
        {/* Upload Progress */}
        {state.uploadProgress && (
          <Card className="mb-6 border-adtip-teal/20 bg-adtip-teal/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-adtip-teal">
                  {state.uploadProgress.stage}
                </span>
                <span className="text-sm text-adtip-teal">
                  {state.uploadProgress.percentage.toFixed(0)}%
                </span>
              </div>
              <Progress value={state.uploadProgress.percentage} className="mb-2" />
              {state.uploadProgress.currentStep && (
                <p className="text-xs text-gray-600">{state.uploadProgress.currentStep}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Validation Errors */}
        {state.validationErrors.length > 0 && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {state.validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Warnings */}
        {state.validationWarnings.length > 0 && (
          <Alert className="mb-6 border-yellow-200 bg-yellow-50">
            <Info className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <ul className="list-disc list-inside space-y-1">
                {state.validationWarnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <form className="space-y-6">
          {/* Post Type Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <FileText className="h-5 w-5 mr-2 text-adtip-teal" />
                Content Type
              </CardTitle>
              <CardDescription>
                Choose the type of content you want to create
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select value={state.postType} onValueChange={handlePostTypeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="post">
                    <div className="flex items-center">
                      <ImageIcon className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium">Image Post</div>
                        <div className="text-xs text-gray-500">Share photos and graphics</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="tip-tube">
                    <div className="flex items-center">
                      <Video className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium">Tip Tube Video</div>
                        <div className="text-xs text-gray-500">Long-form video content</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="tip-shorts">
                    <div className="flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      <div>
                        <div className="font-medium">Tip Shorts</div>
                        <div className="text-xs text-gray-500">Short vertical videos</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <Upload className="h-5 w-5 mr-2 text-adtip-teal" />
                Upload {state.postType === 'post' ? 'Image' : 'Video'}
              </CardTitle>
              <CardDescription>
                {getFileTypeDescription(state.postType)}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div 
                onClick={triggerFileInput}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all",
                  state.previewUrl 
                    ? "border-adtip-teal bg-adtip-teal/5" 
                    : "border-gray-300 hover:border-adtip-teal hover:bg-adtip-teal/5",
                  state.isLoading && "pointer-events-none opacity-50"
                )}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden" 
                  accept={getAcceptAttribute(state.postType)}
                  onChange={handleFileChange}
                  disabled={state.isLoading}
                />
                
                {state.previewUrl ? (
                  <div className="relative">
                    {state.isVideo ? (
                      <video 
                        src={state.previewUrl} 
                        className="w-full max-h-64 rounded-lg mx-auto" 
                        controls
                      />
                    ) : (
                      <img 
                        src={state.previewUrl} 
                        alt="Preview" 
                        className="w-full max-h-64 object-contain rounded-lg mx-auto" 
                      />
                    )}
                    <div className="mt-4 flex items-center justify-center gap-4">
                      <div className="text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 inline mr-1 text-green-600" />
                        {state.selectedFile?.name} ({formatFileSize(state.selectedFile?.size || 0)})
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (state.previewUrl) {
                            URL.revokeObjectURL(state.previewUrl);
                          }
                          updateState({
                            selectedFile: null,
                            previewUrl: null,
                            validationErrors: [],
                            validationWarnings: []
                          });
                        }}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium mb-2">Click to upload</p>
                    <p className="text-sm text-gray-500 mb-4">
                      {state.postType === "post" ? "Upload an image" : "Upload a video"}
                    </p>
                    <div className="text-xs text-gray-400">
                      Supported formats: {getFileTypeDescription(state.postType)}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Title and Description */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Content Details</CardTitle>
              <CardDescription>
                Add a compelling title and description for your content
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={state.title}
                  onChange={(e) => updateState({ title: e.target.value })}
                  placeholder="Give your content a catchy title"
                  className="mt-1"
                  maxLength={100}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {state.title.length}/100 characters
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={state.description}
                  onChange={(e) => updateState({ description: e.target.value })}
                  placeholder="Describe your content..."
                  className="mt-1 h-24"
                  maxLength={500}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {state.description.length}/500 characters
                </div>
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={state.category} onValueChange={(value) => updateState({ category: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tech">Technology</SelectItem>
                    <SelectItem value="beauty">Beauty & Fashion</SelectItem>
                    <SelectItem value="gaming">Gaming</SelectItem>
                    <SelectItem value="food">Food & Cooking</SelectItem>
                    <SelectItem value="travel">Travel</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="entertainment">Entertainment</SelectItem>
                    <SelectItem value="music">Music</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Paid Content Settings - Only for videos */}
          {(state.postType === "tip-tube" || state.postType === "tip-shorts") && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-adtip-teal" />
                  Monetization Settings
                </CardTitle>
                <CardDescription>
                  Set up paid viewing for your video content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Paid Video</h4>
                    <p className="text-sm text-gray-500">
                      Viewers pay per minute to watch your video
                    </p>
                  </div>
                  <Switch 
                    checked={state.isPaid} 
                    onCheckedChange={(checked) => updateState({ isPaid: checked, pricePerMinute: checked ? 0.20 : 0 })}
                  />
                </div>
                
                {state.isPaid && (
                  <div>
                    <Label htmlFor="price-per-minute">Price per minute (₹)</Label>
                    <Input
                      id="price-per-minute"
                      type="number"
                      min="0.20"
                      max="5.00"
                      step="0.01"
                      value={state.pricePerMinute === 0 ? "" : state.pricePerMinute}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (value <= 5.00) {
                          updateState({ pricePerMinute: value });
                        }
                      }}
                      placeholder="0.20 - 5.00"
                      className="mt-1"
                    />
                    {state.pricePerMinute > 0 && (
                      <div className="mt-2 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800">
                          💰 For a 10-minute video, viewers will pay ₹{(state.pricePerMinute * 10).toFixed(2)} total
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </form>
      </div>
    </div>
  );
};

export default EnhancedCreatePost;