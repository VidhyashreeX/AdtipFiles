import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Star } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const categories = [
  "Health", "Finance", "Tech", "Business", "Education",
  "Lifestyle", "Career", "Arts", "Legal", "Sports"
];

const TipCall = () => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [selectedExpert, setSelectedExpert] = useState<any>(null);
  const [callType, setCallType] = useState<"voice" | null>(null);
  const [expertData, setExpertData] = useState<any[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchExperts = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/experts`);
        const data = await res.json();
        setExpertData(data);
        setFilteredExperts(data);
      } catch (error) {
        toast({
          title: "Failed to fetch experts",
          description: "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchExperts();
  }, []);

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

  const handleCallRequest = (expert: any) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }

    setSelectedExpert(expert);
    setCallType("voice");
    setShowCallDialog(true);
  };

  const initiateCall = () => {
    if (!selectedExpert || !callType) return;

    const callPrice = selectedExpert.price;

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

    setTimeout(() => {
      toast({
        title: "Call connected",
        description: `You're now connected with ${selectedExpert.name}. ₹${callPrice}/min will be charged.`,
      });

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
      {/* Search bar */}
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

        {/* Tabs */}
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
                    className={`px-3 py-1 cursor-pointer ${selectedCategory === category ? "bg-adtip-teal hover:bg-adtip-teal/90" : "hover:bg-gray-100"}`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Expert Cards */}
            {loading ? (
              <p className="text-center text-gray-500">Loading experts...</p>
            ) : filteredExperts.length === 0 ? (
              <p className="text-center text-gray-500">No experts found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredExperts.map(expert => (
                  <Card key={expert.id} className="shadow-md flex flex-col justify-between">
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <img src={expert.avatar || "/placeholder.svg"} alt={expert.name} className="w-12 h-12 rounded-full" />
                        <div>
                          <CardTitle className="text-lg font-bold">{expert.name}</CardTitle>
                          <CardDescription className="text-sm text-gray-500">{expert.specialty}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-gray-700">{expert.description}</p>
                      <div className="flex items-center mt-4">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <span className="text-sm ml-1">{expert.rating} ({expert.ratingCount} reviews)</span>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col justify-end items-center">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg font-semibold">₹{expert.price}/min</span>
                      </div>
                      <Button
                        className="teal-button py-1 px-4 text-sm"
                        onClick={() => handleCallRequest(expert)}
                      >
                        Request Call
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={() => setShowCallDialog(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request a Voice Call</DialogTitle>
            <DialogDescription>
              {selectedExpert && (
                <>
                  <h3>{selectedExpert.name}</h3>
                  <p>{selectedExpert.specialty}</p>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCallDialog(false)}>Cancel</Button>
            <Button onClick={initiateCall}>Start Call</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TipCall;
