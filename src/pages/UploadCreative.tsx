import React, { useState } from 'react';
import { ArrowLeft, Upload, Wand2, Video, FileImage, Camera, Zap, Loader2, Eye, Sparkles } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { apiSaveSecondPageAdModel } from '@/api';
import AIAdGenerator from '@/components/AIAdGenerator';

const UploadCreative = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectedModel, campaignData, adId, apiData } = location.state || {};

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string>('');
  const [showContentDetails, setShowContentDetails] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [contentData, setContentData] = useState({
    adTitle: '',
    adDescription: '',
    callToAction: ''
  });

  const uploadToCloudflare = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'ads'); // Organize ad creatives in 'ads' folder
    
    try {
      // Use the backend upload endpoint that handles Cloudflare
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://10.67.209.225:7082'}/api/uploadcontent`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('UserLoggedIn')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.statusText}. ${errorText}`);
      }
      
      const result = await response.json();
      
      // Properly check for success - result.status should be 200 and url should exist
      if (result.status === 200 && result.url) {
        console.log('Upload successful! URL:', result.url);
        return result.url;
      } else if (result.data && result.data.url) {
        // Alternative response structure
        console.log('Upload successful! URL:', result.data.url);
        return result.data.url;
      } else {
        throw new Error(result.message || 'Upload failed - no URL returned from server');
      }
    } catch (error: any) {
      console.error('Upload error details:', {
        message: error.message,
        error: error
      });
      // Throw with clear error message
      throw new Error(error.message || 'Failed to upload file. Please check your connection and try again.');
    }
  };

  // Function to download AI-generated image and upload to Cloudflare
  const uploadAIImageToCloudflare = async (imageUrl: string): Promise<string> => {
    try {
      console.log('Downloading AI-generated image from:', imageUrl);
      
      // Fetch the image from Gemini/AI service
      const imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch AI-generated image');
      }
      
      const blob = await imageResponse.blob();
      
      // Determine file type and create appropriate file
      const contentType = blob.type || 'image/png';
      const extension = contentType.split('/')[1] || 'png';
      const fileName = `ai-generated-${Date.now()}.${extension}`;
      
      const file = new File([blob], fileName, { type: contentType });
      console.log('Created file for upload:', fileName, 'Size:', (file.size / 1024).toFixed(2), 'KB');
      
      // Upload to Cloudflare
      const cloudflareUrl = await uploadToCloudflare(file);
      console.log('AI image uploaded to Cloudflare:', cloudflareUrl);
      
      return cloudflareUrl;
    } catch (error: any) {
      console.error('Failed to upload AI image to Cloudflare:', error);
      // If upload fails, use the original URL as fallback
      toast({
        title: "Upload Warning",
        description: "Using AI-generated image directly. Upload to CDN failed.",
        variant: "default",
      });
      return imageUrl;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const fileType = file.type.toLowerCase();
    const isVideo = fileType.startsWith('video/');
    const isImage = fileType.startsWith('image/');
    
    if (!isVideo && !isImage) {
      toast({
        title: "Invalid File Type",
        description: "Please upload a video or image file.",
        variant: "destructive",
      });
      return;
    }

    // Check file size (100MB max for videos, 5MB for images)
    const maxSize = isVideo ? 100 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "File Too Large",
        description: `File size should be less than ${isVideo ? '100MB' : '5MB'}.`,
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadedUrl = await uploadToCloudflare(file);
      setUploadedFile(file);
      setUploadedFileUrl(uploadedUrl);
      setShowContentDetails(true);
      
      toast({
        title: "Upload Successful",
        description: "Your creative has been uploaded successfully!",
      });
    } catch (error: any) {
      console.error('Upload failed:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setContentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNextPreview = async () => {
    if (!uploadedFileUrl || !contentData.adTitle || !contentData.adDescription) {
      toast({
        title: "Missing Information",
        description: "Please upload a creative and fill in all content details.",
        variant: "destructive",
      });
      return;
    }

    if (!adId) {
      toast({
        title: "Error",
        description: "Campaign ID is missing. Please start over.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      let finalImageUrl = uploadedFileUrl;
      
      // If this is an AI-generated image (no uploadedFile but has uploadedFileUrl),
      // upload it to Cloudflare first
      if (!uploadedFile && uploadedFileUrl) {
        toast({
          title: "Uploading to CDN",
          description: "Preparing your AI-generated creative...",
        });
        
        console.log('AI-generated content detected, uploading to Cloudflare...');
        finalImageUrl = await uploadAIImageToCloudflare(uploadedFileUrl);
        
        // Update the state with the new Cloudflare URL
        setUploadedFileUrl(finalImageUrl);
      }
      
      // Get user data
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      
      // Prepare data for second page API call
      const secondPageData = {
        adId: adId,
        adTitle: contentData.adTitle,
        adDescription: contentData.adDescription,
        adVideoPath: finalImageUrl,
        adImagePath: finalImageUrl, // Use same URL for both video and image
        cta: contentData.callToAction,
        createdby: userData.id || '1'
      };

      console.log('Sending second page data:', secondPageData);
      
      const response = await apiSaveSecondPageAdModel(secondPageData);
      
      if (response.data?.status === 200) {
        toast({
          title: "Success!",
          description: "Creative details saved successfully!",
        });
        
        // Navigate to preview with all the data
        navigate('/seller/preview-ad', {
          state: {
            selectedModel,
            campaignData,
            uploadedFile,
            uploadedFileUrl: finalImageUrl, // Use the Cloudflare URL
            contentData,
            adId,
            apiData
          }
        });
      } else {
        throw new Error(response.data?.message || 'Failed to save creative details');
      }
      
    } catch (error: any) {
      console.error('Save creative failed:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save creative details';
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAIGeneration = (type: string) => {
    console.log('AI Generation for:', type);
    setShowAIGenerator(true);
  };

  const handleAIGeneratedContent = (result: { imageUrl: string; title: string; description: string; cta: string }) => {
    console.log('AI Generated Content Received:', result);
    setUploadedFileUrl(result.imageUrl);
    setContentData({
      adTitle: result.title,
      adDescription: result.description,
      callToAction: result.cta
    });
    setShowContentDetails(true);
    setShowAIGenerator(false);
    
    toast({
      title: "AI Content Ready!",
      description: "Your AI-generated ad creative is ready to use!",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* AI Generator Modal */}
      {showAIGenerator && (
        <AIAdGenerator
          onGenerated={handleAIGeneratedContent}
          onClose={() => setShowAIGenerator(false)}
        />
      )}
      
      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-[#00dcaa] to-[#00b894] p-6">
            <div className="flex items-center space-x-4">
              <button 
                className="p-2 hover:bg-white/20 rounded-lg transition-all duration-300" 
                onClick={() => navigate('/seller/configure-campaign')}
                title="Back to Configure Campaign"
                aria-label="Back to Configure Campaign"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Upload Creative or Generate with AI</h1>
                <p className="text-white/90">Step 2 of 5 - Add your creative assets or let AI create them for you</p>
              </div>
            </div>
          </div>

          <div className="p-8">
            {!showContentDetails ? (
              <>
                {/* Upload and AI Options */}
                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  
                  {/* Upload Creative */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border-2 border-dashed border-blue-200 dark:border-blue-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors backdrop-blur-sm">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">Upload Creative</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Drag and drop or click to browse<br />
                        Supports: JPG, PNG, MP4, MOV (Max 50MB)
                      </p>
                      
                      <label className="inline-block">
                        <div className={`bg-white dark:bg-gray-800 border-2 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-300 cursor-pointer flex items-center justify-center gap-2 ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          {isUploading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4" />
                              Upload your creative
                            </>
                          )}
                        </div>
                        <input 
                          type="file" 
                          accept="image/*,video/*" 
                          onChange={handleFileUpload}
                          className="hidden"
                          disabled={isUploading}
                        />
                      </label>
                      
                      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        Upload your own photos, videos or graphics
                      </div>
                    </div>
                  </div>

                  {/* AI Ad Generator */}
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border-2 border-dashed border-purple-200 dark:border-purple-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors backdrop-blur-sm">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Wand2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">AI Ad Generator</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Create professional marketing videos with AI avatars,<br />
                        product showcases, and automated scripts
                      </p>
                      
                      <button 
                        onClick={() => handleAIGeneration('general')}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                      >
                        <Zap className="w-4 h-4 inline mr-2" />
                        Start AI Generation
                      </button>
                      
                      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                        Let AI create compelling content for you
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Generation Options */}
                <div className="grid md:grid-cols-4 gap-4">
                  <div 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#00dcaa] transition-colors cursor-pointer group"
                    onClick={() => handleAIGeneration('avatar')}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-[#00dcaa] group-hover:text-white transition-colors">
                        <Video className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Avatar Videos</h4>
                      <p className="text-xs text-gray-600">AI presenters for your products</p>
                    </div>
                  </div>

                  <div 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#00dcaa] transition-colors cursor-pointer group"
                    onClick={() => handleAIGeneration('product')}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-[#00dcaa] group-hover:text-white transition-colors">
                        <FileImage className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Product Shots</h4>
                      <p className="text-xs text-gray-600">Professional product showcases</p>
                    </div>
                  </div>

                  <div 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#00dcaa] transition-colors cursor-pointer group"
                    onClick={() => handleAIGeneration('script')}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-[#00dcaa] group-hover:text-white transition-colors">
                        <Camera className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Smart Scripts</h4>
                      <p className="text-xs text-gray-600">Auto-generated marketing copy</p>
                    </div>
                  </div>

                  <div 
                    className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#00dcaa] transition-colors cursor-pointer group"
                    onClick={() => handleAIGeneration('import')}
                  >
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-[#00dcaa] group-hover:text-white transition-colors">
                        <Upload className="w-6 h-6" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">Link Import</h4>
                      <p className="text-xs text-gray-600">Import from e-commerce sites</p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Creative Preview Section - Shows for both uploaded files and AI-generated content */}
                {uploadedFileUrl && (
                  <div className="mb-8">
                    {/* Success Banner */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-dashed border-green-300 dark:border-green-700 rounded-xl p-6 mb-6">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center flex-shrink-0">
                          {uploadedFile ? (
                            <Upload className="w-8 h-8 text-green-600 dark:text-green-400" />
                          ) : (
                            <Wand2 className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <span className="text-white text-xs">✓</span>
                            </div>
                            <span className="text-green-700 dark:text-green-400 font-semibold">
                              {uploadedFile ? 'File uploaded successfully!' : 'AI creative generated successfully!'}
                            </span>
                          </div>
                          {uploadedFile && (
                            <>
                              <p className="text-gray-700 dark:text-gray-300 font-medium">{uploadedFile.name}</p>
                              <p className="text-sm text-gray-500 dark:text-gray-400">
                                {uploadedFile.type.startsWith('image/') ? 'Image file' : 'Video file'} • {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Visual Preview */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl p-6 border-2 border-purple-200 dark:border-purple-700">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Eye className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        Creative Preview
                      </h3>
                      
                      <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                        {/* Image or Video Preview */}
                        {uploadedFileUrl.includes('.mp4') || uploadedFileUrl.includes('video') ? (
                          <video
                            src={uploadedFileUrl}
                            controls
                            className="w-full h-auto max-h-[400px] object-contain bg-gray-900"
                            onError={(e) => {
                              console.error('Video load error:', e);
                              toast({
                                title: "Preview Error",
                                description: "Unable to load video preview. The file will still be used.",
                                variant: "destructive",
                              });
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        ) : (
                          <img
                            src={uploadedFileUrl}
                            alt="Ad Creative Preview"
                            className="w-full h-auto max-h-[400px] object-contain bg-gray-100 dark:bg-gray-800"
                            onError={(e) => {
                              console.error('Image load error:', e);
                              toast({
                                title: "Preview Error",
                                description: "Unable to load image preview. The file will still be used.",
                                variant: "destructive",
                              });
                            }}
                          />
                        )}
                      </div>
                      
                      <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Sparkles className="w-4 h-4" />
                        <span>Preview of your ad creative</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Content Details */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-800/50 dark:to-blue-900/20 p-6 rounded-xl backdrop-blur-sm">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-6">Edit Content Details</h3>
                  
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ad Title *</label>
                      <input 
                        type="text" 
                        name="adTitle"
                        value={contentData.adTitle}
                        onChange={handleInputChange}
                        placeholder="Enter compelling ad title" 
                        className="w-full rounded-xl bg-white dark:bg-gray-800/50 backdrop-blur-sm border-0 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Ad Description</label>
                      <textarea 
                        name="adDescription"
                        value={contentData.adDescription}
                        onChange={handleInputChange}
                        placeholder="Describe your product or service..." 
                        rows={4}
                        className="w-full rounded-xl bg-white dark:bg-gray-800/50 backdrop-blur-sm border-0 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Call to Action</label>
                      <input 
                        type="text" 
                        name="callToAction"
                        value={contentData.callToAction}
                        onChange={handleInputChange}
                        placeholder="e.g., Shop Now, Learn More, Get Started" 
                        className="w-full rounded-xl bg-white dark:bg-gray-800/50 backdrop-blur-sm border-0 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#00dcaa]/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Form Actions */}
            <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-6 flex flex-col sm:flex-row gap-4 justify-between">
              <button
                type="button"
                onClick={() => navigate('/seller/configure-campaign')}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-800/70 transition-all duration-300 backdrop-blur-sm"
              >
                <ArrowLeft className="w-4 h-4 inline mr-2" />
                Back
              </button>
              
              {showContentDetails && (
                <button
                  type="button"
                  onClick={handleNextPreview}
                  disabled={isLoading}
                  className={`px-8 py-3 bg-gradient-to-r from-[#00dcaa] to-[#00b894] hover:from-[#00b894] hover:to-[#00a085] text-white rounded-xl transition-all duration-300 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Next: Preview Ad'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 py-12 w-full">
        <div className="max-w-full mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Company Info */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-[#00dcaa] rounded flex items-center justify-center">
                  <span className="text-white font-bold text-sm">▶</span>
                </div>
                <span className="text-xl font-bold text-[#00dcaa]">AdTip</span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Digital Marketing & Advertising Solutions platform that empowers businesses to grow.
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Navigation</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-[#00dcaa]">About</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Careers</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Advertising</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Small Business</a></li>
              </ul>
            </div>

            {/* Services */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-[#00dcaa]">Ad Solutions</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Marketing Solutions</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Sales Solutions</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Help Center</a></li>
              </ul>
            </div>

            {/* Contact & Support */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4">Support</h3>
              <ul className="space-y-3 text-sm text-gray-600">
                <li><a href="#" className="hover:text-[#00dcaa]">Community Guidelines</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Privacy & Terms</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Mobile App</a></li>
                <li><a href="#" className="hover:text-[#00dcaa]">Contact Us</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="border-t border-gray-200 mt-8 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <div className="flex items-center space-x-6">
                <button className="bg-[#00dcaa] text-white px-4 py-2 rounded text-sm font-medium">
                  QUESTIONS?
                </button>
                <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded text-sm font-medium">
                  SETTINGS
                </button>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-2">Get our app now:</p>
                <div className="flex space-x-3">
                  <div className="bg-black text-white px-3 py-1 rounded text-xs">Google Play</div>
                  <div className="bg-black text-white px-3 py-1 rounded text-xs">App Store</div>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Language</p>
                <select className="border border-gray-300 rounded px-2 py-1 text-sm" title="Select language">
                  <option>ENGLISH</option>
                </select>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-500">
                © 2024 AdTip. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default UploadCreative;