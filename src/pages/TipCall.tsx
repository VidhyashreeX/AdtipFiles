
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Search, Filter, Star, ChevronRight, Award, PhoneCall, Video, UserRound, CheckCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Sample call experts data
const expertData = [
  {
    id: 1,
    name: "Dr. Sarah Miller",
    specialty: "Health & Nutrition",
    rating: 4.9,
    ratingCount: 248,
    price: 199,
    priceVideo: 299,
    avatar: "/placeholder.svg",
    available: true,
    premium: true,
    description: "Certified nutritionist with 10+ years of experience. Specializing in weight management and dietary planning."
  },
  {
    id: 2,
    name: "John Tech",
    specialty: "Software Development",
    rating: 4.7,
    ratingCount: 183,
    price: 249,
    priceVideo: 349,
    avatar: "/placeholder.svg",
    available: true,
    premium: false,
    description: "Full-stack developer with expertise in React, Node.js, and cloud architecture. Can help with coding problems and project planning."
  },
  {
    id: 3,
    name: "Emma Finance",
    specialty: "Investment Advisor",
    rating: 4.8,
    ratingCount: 312,
    price: 299,
    priceVideo: 399,
    avatar: "/placeholder.svg",
    available: false,
    premium: true,
    description: "Certified financial advisor helping you make smart investment decisions and plan for your future."
  },
  {
    id: 4,
    name: "Michael Design",
    specialty: "UX/UI Design",
    rating: 4.6,
    ratingCount: 157,
    price: 199,
    priceVideo: 299,
    avatar: "/placeholder.svg",
    available: true,
    premium: false,
    description: "Award-winning designer with focus on creating intuitive and beautiful user interfaces for web and mobile applications."
  },
  {
    id: 5,
    name: "Lisa Career",
    specialty: "Career Counseling",
    rating: 4.9,
    ratingCount: 203,
    price: 249,
    priceVideo: 349,
    avatar: "/placeholder.svg",
    available: true,
    premium: true,
    description: "HR professional helping you advance your career with resume reviews, interview preparation, and job search strategies."
  },
];

// Sample categories
const categories = [
  "Health", "Finance", "Tech", "Business", "Education", 
  "Lifestyle", "Career", "Arts", "Legal", "Sports"
];

const TipCall = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<any>(null);
  const [callType, setCallType] = useState<"voice" | "video" | null>(null);
  const [filteredExperts, setFilteredExperts] = useState(expertData);
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (!query) {
      setFilteredExperts(expertData);
      return;
    }
    
    const filtered = expertData.filter(
      expert => 
        expert.name.toLowerCase().includes(query.toLowerCase()) || 
        expert.specialty.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredExperts(filtered);
  };
  
  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
      setFilteredExperts(expertData);
    } else {
      setSelectedCategory(category);
      const filtered = expertData.filter(
        expert => expert.specialty.toLowerCase().includes(category.toLowerCase())
      );
      setFilteredExperts(filtered);
      
      toast({
        title: `${category} selected`,
        description: `Showing experts in ${category}`,
      });
    }
  };
  
  const handleCallRequest = (expert: any, type: "voice" | "video") => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    setSelectedExpert(expert);
    setCallType(type);
    setShowCallDialog(true);
  };
  
  const initiateCall = () => {
    if (!selectedExpert || !callType) return;
    
    const callPrice = callType === "voice" ? selectedExpert.price : selectedExpert.priceVideo;
    
    // Check if user has enough balance
    if ((user?.wallet || 0) < callPrice) {
      toast({
        title: "Insufficient balance",
        description: "Please add money to your wallet to continue",
        variant: "destructive",
      });
      setShowCallDialog(false);
      navigate("/wallet");
      return;
    }
    
    toast({
      title: "Call initiated",
      description: `Connecting to ${selectedExpert.name}...`,
    });
    
    // Simulate call connection
    setTimeout(() => {
      toast({
        title: "Call connected",
        description: `You're now connected with ${selectedExpert.name}. ₹${callPrice}/min will be charged.`,
      });
      
      // Simulate a 1-minute call for demo purposes
      setTimeout(() => {
        toast({
          title: "Call ended",
          description: `Call duration: 1 minute. ₹${callPrice} has been deducted from your wallet.`,
        });
      }, 5000);
    }, 2000);
    
    setShowCallDialog(false);
  };

  return (
    <div className="pb-20 md:pb-0 bg-gray-50">
      {/* Search bar - sticky */}
      <div className="bg-white sticky top-[60px] md:top-[57px] z-10 py-4 px-4 shadow-sm">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search for experts..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-adtip-teal focus:border-transparent"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-screen-md mx-auto px-4 pt-4">
        {/* Talk to Earn Banner */}
        <div className="bg-white rounded-lg overflow-hidden shadow-sm mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/2 mb-4 md:mb-0">
                <h2 className="text-xl font-bold mb-2">Talk to Earn</h2>
                <p className="text-gray-600 mb-4">
                  Share your expertise through one-on-one calls and get paid directly for your knowledge and time.
                </p>
                <Button className="teal-button" onClick={() => {
                  toast({
                    title: "Become an expert",
                    description: "Complete your profile to become a TipCall expert",
                  });
                }}>
                  Become an Expert
                </Button>
              </div>
              <div className="w-full md:w-1/2 md:pl-6">
                <img 
                  src="/lovable-uploads/1052f74a-1ca9-4c6f-b7ad-09d964f20cd1.png" 
                  alt="Talk to Earn" 
                  className="w-full h-auto rounded-lg"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="browse" className="mb-6">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="browse">Browse Experts</TabsTrigger>
            <TabsTrigger value="featured">Featured</TabsTrigger>
          </TabsList>
          
          <TabsContent value="browse" className="mt-4">
            {/* Categories */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-4">Categories</h3>
              <div className="flex flex-wrap gap-2">
                {categories.map((category, index) => (
                  <Badge
                    key={index}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className={`px-3 py-1 cursor-pointer ${
                      selectedCategory === category 
                        ? "bg-adtip-teal hover:bg-adtip-teal/90" 
                        : "hover:bg-gray-100"
                    }`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Expert Cards */}
            <div className="space-y-4">
              {filteredExperts.map((expert) => (
                <Card key={expert.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex items-center">
                      <div className="relative">
                        <img
                          src={expert.avatar}
                          alt={expert.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {expert.premium && (
                          <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-0.5">
                            <Award className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full ${expert.available ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                      <div className="ml-3">
                        <div className="flex items-center">
                          <CardTitle className="text-base">{expert.name}</CardTitle>
                          {expert.premium && (
                            <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">
                              Premium
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="text-sm">{expert.specialty}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-gray-600">{expert.description}</p>
                    <div className="flex items-center mt-2">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-sm font-medium ml-1">{expert.rating}</span>
                        <span className="text-xs text-gray-500 ml-1">({expert.ratingCount})</span>
                      </div>
                      <div className="ml-auto text-sm text-gray-700">
                        <span className="font-medium">₹{expert.price}</span>
                        <span className="text-xs">/min</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 gap-2">
                    <Button 
                      className="flex-1 bg-adtip-teal hover:bg-adtip-teal/90" 
                      size="sm"
                      onClick={() => handleCallRequest(expert, "voice")}
                      disabled={!expert.available}
                    >
                      <PhoneCall className="h-4 w-4 mr-1" />
                      Voice Call
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 border-adtip-teal text-adtip-teal hover:bg-adtip-teal/10" 
                      size="sm"
                      onClick={() => handleCallRequest(expert, "video")}
                      disabled={!expert.available}
                    >
                      <Video className="h-4 w-4 mr-1" />
                      Video Call
                    </Button>
                  </CardFooter>
                </Card>
              ))}
              
              {filteredExperts.length === 0 && (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                  <UserRound className="h-12 w-12 mx-auto text-gray-300" />
                  <h3 className="mt-2 text-lg font-medium text-gray-900">No experts found</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Try different search terms or browse all categories
                  </p>
                  <Button 
                    className="mt-4 bg-adtip-teal hover:bg-adtip-teal/90"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory(null);
                      setFilteredExperts(expertData);
                    }}
                  >
                    View All Experts
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="featured">
            {/* How It Works */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">How TipCall Works</h3>
              <div className="space-y-6">
                <div className="flex">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-adtip-teal flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium">Choose an expert</h4>
                    <p className="text-sm text-gray-600">Browse experts by category and check their profiles, ratings, and availability.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-adtip-teal flex items-center justify-center text-white font-bold">
                    2
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium">Schedule a call</h4>
                    <p className="text-sm text-gray-600">Book a time slot that works for you or connect immediately if they're available.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-adtip-teal flex items-center justify-center text-white font-bold">
                    3
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium">Pay and connect</h4>
                    <p className="text-sm text-gray-600">Make a payment for your scheduled duration and start your call.</p>
                  </div>
                </div>
                
                <div className="flex">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-adtip-teal flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <div className="ml-4">
                    <h4 className="font-medium">Earn as an expert</h4>
                    <p className="text-sm text-gray-600">Share your knowledge and get paid for your time. Premium users earn more per minute!</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 border-t pt-4">
                <h4 className="font-medium mb-2">Pricing</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium">For Callers</p>
                    <ul className="text-sm mt-1 space-y-1">
                      <li className="flex justify-between">
                        <span>Regular rate:</span>
                        <span>₹4/min</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Premium users:</span>
                        <span>₹2/min</span>
                      </li>
                    </ul>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm font-medium">For Experts</p>
                    <ul className="text-sm mt-1 space-y-1">
                      <li className="flex justify-between">
                        <span>Regular earnings:</span>
                        <span>₹1/min</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Premium experts:</span>
                        <span>₹2/min</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Become a TipCall Expert</CardTitle>
                <CardDescription>Share your knowledge and earn money with every call</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Set your own rates and availability</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Earn ₹60-₹300 per hour</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Premium experts earn double the regular rate</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                    <span>Get paid directly to your AdTip wallet</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full bg-adtip-teal hover:bg-adtip-teal/90"
                  onClick={() => {
                    toast({
                      title: "Expert application",
                      description: "Complete your profile to apply as a TipCall expert",
                    });
                  }}
                >
                  Apply Now
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{callType === "voice" ? "Voice Call" : "Video Call"} with {selectedExpert?.name}</DialogTitle>
            <DialogDescription>
              You will be charged ₹{callType === "voice" ? selectedExpert?.price : selectedExpert?.priceVideo} per minute 
              for this call. Your current wallet balance is ₹{user?.wallet || 0}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex items-center justify-center py-6">
            <div className="text-center">
              <div className="mx-auto rounded-full bg-gray-100 h-16 w-16 flex items-center justify-center mb-4">
                {callType === "voice" ? (
                  <PhoneCall className="h-8 w-8 text-adtip-teal" />
                ) : (
                  <Video className="h-8 w-8 text-adtip-teal" />
                )}
              </div>
              <p className="text-sm text-gray-500">
                {callType === "voice" ? "Voice call" : "Video call"} to
              </p>
              <p className="font-medium">{selectedExpert?.name}</p>
              <p className="text-sm text-gray-500 mt-1">{selectedExpert?.specialty}</p>
            </div>
          </div>
          
          <DialogFooter className="flex-col sm:flex-row sm:justify-center gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowCallDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              className="bg-adtip-teal hover:bg-adtip-teal/90"
              onClick={initiateCall}
            >
              {callType === "voice" ? "Start Voice Call" : "Start Video Call"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TipCall;
