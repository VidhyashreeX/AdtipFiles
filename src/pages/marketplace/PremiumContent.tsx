
import React, { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { 
  Lock, 
  PlayCircle, 
  Image as ImageIcon, 
  Video, 
  File, 
  Upload, 
  Star, 
  Calendar, 
  ChevronRight, 
  Tag, 
  FilePlus2, 
  Crown
} from "lucide-react";

// Mock premium content data
const mockPremiumContent = [
  {
    id: 1,
    title: "Advanced Marketing Strategies",
    type: "video",
    thumbnail: "https://images.unsplash.com/photo-1551434678-e076c223a692",
    price: 19.99,
    creator: "Marketing Academy",
    duration: "45 mins",
    rating: 4.8,
    sales: 1245,
    description: "Learn cutting-edge marketing strategies from industry experts to grow your business and reach new customers."
  },
  {
    id: 2,
    title: "Professional Photography Pack",
    type: "images",
    thumbnail: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e",
    price: 29.99,
    creator: "Photo Masters",
    items: 120,
    rating: 4.5,
    sales: 874,
    description: "A collection of 120+ high-resolution stock photos for commercial use, perfect for websites and marketing materials."
  },
  {
    id: 3,
    title: "Social Media Growth Guide",
    type: "ebook",
    thumbnail: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
    price: 9.99,
    creator: "Digital Influencers",
    pages: 85,
    rating: 4.7,
    sales: 2150,
    description: "Comprehensive guide to growing your social media presence organically across multiple platforms."
  },
  {
    id: 4,
    title: "Business Plan Templates",
    type: "templates",
    thumbnail: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40",
    price: 14.99,
    creator: "Startup Success",
    items: 15,
    rating: 4.9,
    sales: 1632,
    description: "15 professional business plan templates in Word, Excel and PowerPoint formats for startups and established businesses."
  },
  {
    id: 5,
    title: "Website Design Masterclass",
    type: "course",
    thumbnail: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4",
    price: 49.99,
    creator: "Web Design Academy",
    lessons: 24,
    rating: 4.6,
    sales: 978,
    description: "Complete web design course covering UI/UX principles, HTML, CSS, JavaScript and responsive design."
  },
  {
    id: 6,
    title: "Logo Design Templates",
    type: "graphics",
    thumbnail: "https://images.unsplash.com/photo-1558655146-9f40138edfeb",
    price: 24.99,
    creator: "Creative Design Studio",
    items: 50,
    rating: 4.4,
    sales: 1124,
    description: "50 editable logo templates in AI, EPS, PSD and PNG formats suitable for various industries."
  }
];

// Content types with their icons
const contentTypes = [
  { type: "video", label: "Video", icon: <PlayCircle className="h-4 w-4" /> },
  { type: "images", label: "Images", icon: <ImageIcon className="h-4 w-4" /> },
  { type: "ebook", label: "E-Book", icon: <File className="h-4 w-4" /> },
  { type: "templates", label: "Templates", icon: <FilePlus2 className="h-4 w-4" /> },
  { type: "course", label: "Course", icon: <Video className="h-4 w-4" /> },
  { type: "graphics", label: "Graphics", icon: <ImageIcon className="h-4 w-4" /> }
];

// Find icon for content type
const getContentIcon = (type: string) => {
  const contentType = contentTypes.find(item => item.type === type);
  return contentType ? contentType.icon : <File className="h-4 w-4" />;
};

const PremiumContent: React.FC = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadPrice, setUploadPrice] = useState("");
  const [uploadType, setUploadType] = useState("video");
  const [filteredContent, setFilteredContent] = useState(mockPremiumContent);
  
  // Filter content based on search and type
  React.useEffect(() => {
    const filtered = mockPremiumContent.filter(content => {
      const matchesSearch = content.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           content.creator.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === "all" || content.type === selectedType;
      return matchesSearch && matchesType;
    });
    setFilteredContent(filtered);
  }, [searchQuery, selectedType]);
  
  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally send the data to your backend
    setUploadDialogOpen(false);
    toast({
      title: "Content Uploaded!",
      description: "Your premium content has been submitted for review.",
      duration: 5000,
    });
    // Reset form
    setUploadTitle("");
    setUploadDescription("");
    setUploadPrice("");
    setUploadType("video");
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold">Premium Content</h1>
          <p className="text-gray-500">Access exclusive content or sell your own premium materials</p>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Upload className="h-4 w-4" /> Upload Premium Content
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Upload Premium Content</DialogTitle>
              <DialogDescription>
                Create and share your premium content with the community. Quality content can generate passive income.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUploadSubmit} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Enter a descriptive title"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what your content offers"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input
                    id="price"
                    type="number"
                    placeholder="9.99"
                    min="0.99"
                    step="0.01"
                    value={uploadPrice}
                    onChange={(e) => setUploadPrice(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Content Type</Label>
                  <select
                    id="type"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={uploadType}
                    onChange={(e) => setUploadType(e.target.value)}
                    required
                  >
                    {contentTypes.map((type) => (
                      <option key={type.type} value={type.type}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="file">Upload File</Label>
                <div className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-300 px-6 py-10">
                  <div className="text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                      <Upload className="h-6 w-6 text-gray-400" />
                    </div>
                    <div className="mt-4 flex text-sm leading-6 text-gray-600">
                      <label
                        htmlFor="file-upload"
                        className="relative cursor-pointer rounded-md font-semibold text-adtip-teal focus-within:outline-none focus-within:ring-2 focus-within:ring-adtip-teal"
                      >
                        <span>Upload a file</span>
                        <input id="file-upload" name="file-upload" type="file" className="sr-only" />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      Max 1GB. Supported formats depend on content type
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Upload Content</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Tabs defaultValue="browse" className="mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="browse">Browse Content</TabsTrigger>
          <TabsTrigger value="purchased">My Purchases</TabsTrigger>
          <TabsTrigger value="selling">My Content</TabsTrigger>
        </TabsList>
        
        <TabsContent value="browse">
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search premium content..."
                className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adtip-teal focus:outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 absolute left-3 top-2.5 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            
            <select
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adtip-teal focus:outline-none"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="all">All Types</option>
              {contentTypes.map((type) => (
                <option key={type.type} value={type.type}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* Content Grid */}
          {filteredContent.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map((content) => (
                <Card key={content.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative h-48 bg-gray-100">
                    <img
                      src={content.thumbnail}
                      alt={content.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-0 left-0 bg-adtip-teal/90 text-white text-xs font-medium px-2 py-1 rounded-br-md flex items-center gap-1">
                      <Crown className="h-3 w-3" />
                      Premium
                    </div>
                    <div className="absolute top-0 right-0 bg-white/90 text-gray-800 text-xs font-medium px-2 py-1 rounded-bl-md flex items-center gap-1">
                      {getContentIcon(content.type)}
                      {contentTypes.find(type => type.type === content.type)?.label}
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg line-clamp-1">{content.title}</CardTitle>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <span>{content.creator}</span>
                      <span className="flex items-center ml-2">
                        <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                        <span className="ml-1">{content.rating}</span>
                        <span className="ml-1 text-xs text-gray-400">({content.sales})</span>
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-600 line-clamp-2">{content.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
                      {content.duration && (
                        <div className="flex items-center">
                          <Calendar className="h-3.5 w-3.5 mr-1" />
                          {content.duration}
                        </div>
                      )}
                      {content.pages && (
                        <div className="flex items-center">
                          <File className="h-3.5 w-3.5 mr-1" />
                          {content.pages} pages
                        </div>
                      )}
                      {content.items && (
                        <div className="flex items-center">
                          <FilePlus2 className="h-3.5 w-3.5 mr-1" />
                          {content.items} items
                        </div>
                      )}
                      {content.lessons && (
                        <div className="flex items-center">
                          <Video className="h-3.5 w-3.5 mr-1" />
                          {content.lessons} lessons
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-between items-center">
                    <div className="font-bold text-lg">${content.price.toFixed(2)}</div>
                    <Button className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      Unlock
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No content found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter to find what you're looking for.
              </p>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="purchased">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Lock className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No purchased content yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Unlock premium content to access exclusive materials.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => document.querySelector('[value="browse"]')?.dispatchEvent(new Event('click'))}>
                Browse Content
              </Button>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="selling">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                <Upload className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No content uploaded yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Start sharing your expertise and earn money with premium content.
              </p>
              <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
                Upload Your First Content
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Featured Section */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-6">Featured Premium Content</h2>
        <Card className="overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="bg-gradient-to-r from-adtip-teal to-blue-500 p-8 text-white flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-5 w-5" />
                <span className="text-xs uppercase font-bold tracking-wider">Featured Course</span>
              </div>
              <h3 className="text-2xl font-bold mb-2">Complete Digital Marketing Masterclass</h3>
              <p className="mb-4 text-white/90">
                Master digital marketing strategies with 150+ lessons covering SEO, social media, email marketing, and growth hacking.
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">150+ Lessons</span>
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">20+ Hours</span>
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">Certificate</span>
                <span className="bg-white/20 text-xs px-2 py-1 rounded-full">Lifetime Access</span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-bold">$99.99</span>
                  <span className="text-sm line-through ml-2 opacity-75">$199.99</span>
                </div>
                <Button className="bg-white text-adtip-teal hover:bg-white/90">
                  Learn More <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
            <div>
              <img
                src="https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07"
                alt="Digital Marketing Course"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </Card>
      </div>
      
      {/* Testimonials */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-6">What Content Creators Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <div className="flex items-center gap-1 mb-2">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className={`h-4 w-4 ${j < 5 ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                <p className="text-gray-600 mb-4">
                  {i === 0
                    ? "I've been able to monetize my photography skills by selling premium photo collections. The platform makes it easy to upload and manage content."
                    : i === 1
                    ? "As a web developer, I earn passive income by selling my templates and code snippets. The customer base is engaged and willing to pay for quality."
                    : "My video tutorials generate consistent revenue each month. The analytics help me understand what content performs best."
                  }
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium">
                      {i === 0 ? "Sarah J." : i === 1 ? "Michael T." : "Rebecca L."}
                    </p>
                    <p className="text-xs text-gray-500">
                      {i === 0
                        ? "Professional Photographer"
                        : i === 1
                        ? "Web Developer"
                        : "Marketing Consultant"
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      
      {/* How It Works */}
      <div className="mt-10 mb-6">
        <h2 className="text-xl font-bold mb-6">How Premium Content Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <div className="bg-adtip-teal/10 text-adtip-teal w-10 h-10 rounded-full flex items-center justify-center mb-2">
                <Upload className="h-5 w-5" />
              </div>
              <CardTitle>1. Create & Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Create high-quality content like videos, templates, or e-books and upload them to the platform with pricing and descriptions.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="bg-adtip-teal/10 text-adtip-teal w-10 h-10 rounded-full flex items-center justify-center mb-2">
                <Tag className="h-5 w-5" />
              </div>
              <CardTitle>2. Set Your Price</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Choose how much to charge for your premium content. You keep 80% of all sales while we handle the transactions.
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <div className="bg-adtip-teal/10 text-adtip-teal w-10 h-10 rounded-full flex items-center justify-center mb-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    d="M12 2v6m0 12V12m0 0 4-4m-4 4-4-4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                  />
                </svg>
              </div>
              <CardTitle>3. Earn Money</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Get paid when users purchase your content. Track your performance with detailed analytics and optimize for better results.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <div className="text-center py-8">
        <Button size="lg" onClick={() => setUploadDialogOpen(true)}>
          <Crown className="h-5 w-5 mr-2" /> Start Selling Premium Content
        </Button>
      </div>
    </div>
  );
};

export default PremiumContent;
