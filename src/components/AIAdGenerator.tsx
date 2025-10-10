import React, { useState } from 'react';
import { Wand2, Sparkles, Image as ImageIcon, FileText, Loader2, X } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface AIAdGeneratorProps {
  onGenerated: (result: { imageUrl: string; title: string; description: string; cta: string }) => void;
  onClose: () => void;
}

const AIAdGenerator: React.FC<AIAdGeneratorProps> = ({ onGenerated, onClose }) => {
  const [step, setStep] = useState<'input' | 'generating' | 'preview'>('input');
  const [prompt, setPrompt] = useState('');
  const [contentType, setContentType] = useState<'image' | 'video'>('image');
  const [productDetails, setProductDetails] = useState({
    name: '',
    category: '',
    targetAudience: '',
    keyFeatures: '',
    tone: 'professional'
  });
  const [generatedContent, setGeneratedContent] = useState({
    imageUrl: '',
    title: '',
    description: '',
    cta: 'Shop Now'
  });
  const [isGenerating, setIsGenerating] = useState(false);

  const generateWithAI = async () => {
    if (!prompt && !productDetails.name) {
      toast({
        title: "Input Required",
        description: "Please provide either a prompt or product details.",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    setStep('generating');

    try {
      // Call backend AI generation endpoint
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://10.67.209.225:7082'}/api/generate-ad-creative`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('UserLoggedIn')}`
        },
        body: JSON.stringify({
          prompt: prompt || `Create an ad for ${productDetails.name}`,
          productDetails: productDetails,
          contentType: contentType, // Send selected content type (image or video)
          imageModel: 'banana-nano', // Use banana nano imagen model
          textModel: 'gemini' // Use Gemini for text generation
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate ad creative');
      }

      const result = await response.json();
      console.log('AI Generation Result:', result);

      if (result.status === 200 && result.data) {
        // Fix: Backend returns mediaUrl, not imageUrl
        setGeneratedContent({
          imageUrl: result.data.mediaUrl || result.data.imageUrl || '',
          title: result.data.title || '',
          description: result.data.description || '',
          cta: result.data.cta || 'Shop Now'
        });
        setStep('preview');
        
        toast({
          title: "Success!",
          description: `AI ${contentType} creative generated successfully!`,
        });
      } else {
        throw new Error(result.message || 'Failed to generate ad creative');
      }
    } catch (error: any) {
      console.error('AI generation error:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate ad creative. Please try again.",
        variant: "destructive",
      });
      setStep('input');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUseGenerated = () => {
    onGenerated(generatedContent);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Wand2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">AI Ad Generator</h2>
              <p className="text-white/80 text-sm">Create stunning ad creatives with AI</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 'input' && (
            <div className="space-y-6">
              {/* Content Type Toggle */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                <label className="block text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Select Content Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setContentType('image')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      contentType === 'image'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:border-purple-400'
                    }`}
                  >
                    <ImageIcon className="w-5 h-5" />
                    Image Ad
                  </button>
                  <button
                    type="button"
                    onClick={() => setContentType('video')}
                    className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                      contentType === 'video'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg scale-105'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-700 hover:border-purple-400'
                    }`}
                  >
                    <FileText className="w-5 h-5" />
                    Video Ad
                  </button>
                </div>
                {contentType === 'video' && (
                  <p className="mt-2 text-xs text-purple-600 dark:text-purple-400 text-center">
                    ⚡ Video generation takes longer (30-60 seconds)
                  </p>
                )}
              </div>

              {/* Quick Prompt */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  <Sparkles className="w-4 h-4 inline mr-2" />
                  Quick Prompt (Optional)
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="E.g., 'Create a vibrant summer sale ad for trendy fashion accessories targeting young adults...'"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100 resize-none"
                  rows={3}
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white dark:bg-gray-900 text-gray-500">OR</span>
                </div>
              </div>

              {/* Detailed Product Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Product Details</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      value={productDetails.name}
                      onChange={(e) => setProductDetails({ ...productDetails, name: e.target.value })}
                      placeholder="Enter product name"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Category
                    </label>
                    <select
                      value={productDetails.category}
                      onChange={(e) => setProductDetails({ ...productDetails, category: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100"
                    >
                      <option value="">Select category</option>
                      <option value="fashion">Fashion</option>
                      <option value="electronics">Electronics</option>
                      <option value="food">Food & Beverage</option>
                      <option value="beauty">Beauty & Cosmetics</option>
                      <option value="home">Home & Garden</option>
                      <option value="sports">Sports & Fitness</option>
                      <option value="automotive">Automotive</option>
                      <option value="services">Services</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Target Audience
                  </label>
                  <input
                    type="text"
                    value={productDetails.targetAudience}
                    onChange={(e) => setProductDetails({ ...productDetails, targetAudience: e.target.value })}
                    placeholder="E.g., Young professionals aged 25-35"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Key Features/Benefits
                  </label>
                  <textarea
                    value={productDetails.keyFeatures}
                    onChange={(e) => setProductDetails({ ...productDetails, keyFeatures: e.target.value })}
                    placeholder="List the main features or benefits of your product..."
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Tone & Style
                  </label>
                  <select
                    value={productDetails.tone}
                    onChange={(e) => setProductDetails({ ...productDetails, tone: e.target.value })}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-800 dark:text-gray-100"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual & Friendly</option>
                    <option value="luxury">Luxury & Premium</option>
                    <option value="energetic">Energetic & Bold</option>
                    <option value="minimal">Minimal & Clean</option>
                    <option value="playful">Playful & Fun</option>
                  </select>
                </div>
              </div>

              <button
                onClick={generateWithAI}
                disabled={isGenerating}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                <Wand2 className="w-5 h-5" />
                Generate Ad Creative with AI
              </button>
            </div>
          )}

          {step === 'generating' && (
            <div className="py-16 text-center">
              <div className="inline-block animate-bounce mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-10 h-10 text-white animate-pulse" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                Creating Your Ad...
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">
                Our AI is crafting the perfect ad creative for you
              </p>
              <div className="max-w-md mx-auto space-y-3">
                <div className="flex items-center gap-3 text-left">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  <span className="text-gray-700 dark:text-gray-300">Generating compelling ad copy...</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Loader2 className="w-5 h-5 text-pink-600 animate-spin" />
                  <span className="text-gray-700 dark:text-gray-300">Creating stunning visuals...</span>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                  <span className="text-gray-700 dark:text-gray-300">Optimizing for engagement...</span>
                </div>
              </div>
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  Generated Ad Preview
                </h3>

                {/* Generated Media (Image or Video) */}
                {generatedContent.imageUrl && (
                  <div className="mb-6 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {contentType === 'video' && generatedContent.imageUrl.includes('.mp4') ? (
                      <video
                        src={generatedContent.imageUrl}
                        controls
                        className="w-full h-auto object-cover"
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <img
                        src={generatedContent.imageUrl}
                        alt="Generated Ad"
                        className="w-full h-auto object-cover"
                        onError={(e) => {
                          console.error('Image load error:', e);
                          toast({
                            title: "Image Load Error",
                            description: "Failed to load the generated image. Please try again.",
                            variant: "destructive",
                          });
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Generated Content */}
                <div className="space-y-4 bg-white dark:bg-gray-800 p-4 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Ad Title
                    </label>
                    <input
                      type="text"
                      value={generatedContent.title}
                      onChange={(e) => setGeneratedContent({ ...generatedContent, title: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={generatedContent.description}
                      onChange={(e) => setGeneratedContent({ ...generatedContent, description: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-gray-100 resize-none"
                      rows={4}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Call to Action
                    </label>
                    <input
                      type="text"
                      value={generatedContent.cta}
                      onChange={(e) => setGeneratedContent({ ...generatedContent, cta: e.target.value })}
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 dark:bg-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setStep('input')}
                  className="flex-1 px-6 py-3 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-semibold"
                >
                  Regenerate
                </button>
                <button
                  onClick={handleUseGenerated}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
                >
                  Use This Creative
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAdGenerator;
