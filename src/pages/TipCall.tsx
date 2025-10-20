import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Search, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuthModal } from "../contexts/AuthModalContext";

const BASE_URL = import.meta.env.VITE_API_URL?.endsWith("/api")
  ? import.meta.env.VITE_API_URL
  : `${import.meta.env.VITE_API_URL}/api`;

const categories = [
  "Health", "Finance", "Tech", "Business", "Education",
  "Lifestyle", "Career", "Arts", "Legal", "Sports"
];

// Mapping categories to interest IDs
const categoryToInterestMap = {
  Health: 1,
  Finance: 2,
  Tech: 3,
  Business: 4,
  Education: 5,
  Lifestyle: 6,
  Career: 7,
  Arts: 8,
  Legal: 9,
  Sports: 10,
};

const MAX_FETCH_RETRIES = 3;

interface Expert {
  id: number;
  name: string;
  specialty: string;
  description: string;
  price: number;
  rating: number;
  ratingCount: number;
  avatar: string;
  is_available: boolean;
  online_status: boolean;
}

// Using TypeScript's utility type to add properties to unknown User type
interface UserData {
  id?: string | number;
  name?: string;
  wallet?: number;
  accessToken?: string;
}

export default function TipCall() {
  const { openLoginModal } = useAuthModal();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();  const userData = user as UserData;
  const token = userData?.accessToken || null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchRetryCount, setFetchRetryCount] = useState(0);
  const [expertData, setExpertData] = useState<Expert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedExpert, setSelectedExpert] = useState<Expert | null>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [callType, setCallType] = useState<"voice" | "video" | null>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(category);
      toast({
        description: `Showing experts in ${category}`
      });
    }
    setPage(1);
  };

  const handleCallRequest = (expert: Expert) => {
    if (!isAuthenticated) {
      openLoginModal();
      return;
    }

    if (!expert.is_available || !expert.online_status) {
      toast({
        description: `${expert.name} is currently unavailable for calls.`,
        variant: "destructive",
      });
      return;
    }

    setSelectedExpert(expert);
    setCallType("voice");
    setShowCallDialog(true);
  };

  const initiateCall = () => {
    if (!selectedExpert || !callType) return;

    const callPrice = selectedExpert.price;

    if ((userData?.wallet || 0) < callPrice) {
      toast({
        description: "Please add money to your wallet to continue",
        variant: "destructive",
      });
      setShowCallDialog(false);
      navigate("/wallet");
      return;
    }

    toast({
      description: `Connecting to ${selectedExpert.name}...`
    });

    setTimeout(() => {
      toast({
        description: `You're now connected with ${selectedExpert.name}. ₹${callPrice}/min will be charged.`
      });

      setTimeout(() => {
        toast({
          description: `Call duration: 1 minute. ₹${callPrice} has been deducted from your wallet.`
        });
      }, 5000);
    }, 2000);

    setShowCallDialog(false);
  };

  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };

  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };

  useEffect(() => {
    const abortController = new AbortController();
    let didCancel = false;    const fetchExperts = async () => {
      if (!isAuthenticated && !localStorage.getItem("UserLoggedIn")) {
        openLoginModal();
        return;
      }

      if (fetchRetryCount >= MAX_FETCH_RETRIES) {
        setLoading(false);
        setError("Failed to load experts after multiple attempts. Please try again later.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const interestId = selectedCategory ? [categoryToInterestMap[selectedCategory]] : [2];
        const userId = userData?.id ? String(userData.id) : null;
        const response = await fetch(`${BASE_URL}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            id: 0,
            page,
            limit: 20,
            language: [4],
            interest: interestId,
            user_id: userId,
            search_by_name: searchQuery,
            loggined_user_id: userId,
            sortBy: {}
          }),
          signal: abortController.signal
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }

        const data = await response.json();

        if (didCancel) return;

        if (!data.status || !Array.isArray(data.data)) {
          setFetchRetryCount(prev => prev + 1);
          throw new Error("Invalid response format");
        }

        const mappedExperts = data.data
          .filter((user: any) => user.id && (user.name && user.name.trim() !== '')) // Filter out users with no ID or empty names
          .map((user: any) => ({
          id: user.id,
          name: user.name?.trim() || `User ${user.id}`, // Better fallback with user ID
          specialty: user.interests?.length > 0 ? user.interests[0].name : "General",
          description: `Available for consultation. ${user.online_status ? "Online now" : "Offline"}`,
          price: 100,
          rating: 4.5,
          ratingCount: 10,
          avatar: "/placeholder.svg",
          is_available: user.is_available,
          online_status: user.online_status,
        }));

        setExpertData(mappedExperts);
        setFilteredExperts(mappedExperts);
        setTotalPages(
          data.pagination?.limit && data.pagination?.totalRecords
            ? Math.ceil(data.pagination.totalRecords / data.pagination.limit)
            : 1
        );
        setFetchRetryCount(0);
        setError(null);

      } catch (error) {
        if (didCancel) return;

        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            return;
          }
          setError(error.message);
        } else {
          setError("An unexpected error occurred");
        }

        if (fetchRetryCount < MAX_FETCH_RETRIES) {
          setFetchRetryCount(prev => prev + 1);
        }

        toast({
          description: fetchRetryCount + 1 >= MAX_FETCH_RETRIES ? "Please try again later." : "Retrying...",
          variant: "destructive",
        });
        console.error("Error fetching experts:", error);
      } finally {
        if (!didCancel) {
          setLoading(false);
        }
      }
    };

    fetchExperts();

    return () => {
      didCancel = true;
      abortController.abort();
    };  }, [
    isAuthenticated,
    userData?.id,
    page,
    searchQuery,
    selectedCategory,
    token,
    fetchRetryCount,
    navigate,    userData?.accessToken,
    // Note: We don't need to re-run the effect when UserLoggedIn changes
  ]);

  return (
    <div className="pb-20 md:pb-0 bg-muted">
      {/* Search bar */}
      <div className="bg-card sticky top-[60px] md:top-[57px] z-10 py-4 px-4 shadow-sm">
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <input
            type="text"
            placeholder="Search for experts..."
            className="w-full pl-10 pr-4 py-2 border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-adtip-teal focus:border-transparent"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="max-w-screen-md mx-auto px-4 pt-4">
        {/* Talk to Earn Banner */}
        <div className="bg-card rounded-lg overflow-hidden shadow-sm mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row items-center">
              <div className="w-full md:w-1/2 mb-4 md:mb-0">
                <h2 className="text-xl font-bold mb-2">Talk to Earn</h2>
                <p className="text-muted-foreground mb-4">
                  Share your expertise through one-on-one calls and get paid directly for your knowledge and time.
                </p>
                <Button className="teal-button" onClick={() => {
                  toast({
                    description: "Complete your profile to become a TipCall expert"
                  });
                }}>
                  Become an Expert
                </Button>
              </div>
              <div className="w-full md:w-1/2 md:pl-6">
                <img
                  src="/lovable-Uploads/1052f74a-1ca9-4c6f-b7ad-09d964f20cd1.png"
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
                    className={`px-3 py-1 cursor-pointer ${selectedCategory === category ? "bg-adtip-teal hover:bg-adtip-teal/90" : "hover:bg-muted"}`}
                    onClick={() => handleCategorySelect(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Expert Cards */}
            {error ? (
              <p className="text-center text-red-500 font-semibold my-8">{error}</p>
            ) : loading ? (
              <p className="text-center text-muted-foreground">Loading experts...</p>
            ) : filteredExperts.length === 0 ? (
              <p className="text-center text-muted-foreground">No experts found.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredExperts.map(expert => (
                    <Card key={expert.id} className="shadow-md flex flex-col justify-between">
                      <CardHeader>
                        <div className="flex items-center gap-3">
                          <img src={expert.avatar} alt={expert.name} className="w-12 h-12 rounded-full" />
                          <div>
                            <CardTitle className="text-lg font-bold">{expert.name}</CardTitle>
                            <CardDescription className="text-sm text-muted-foreground">{expert.specialty}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-foreground">{expert.description}</p>
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
                          disabled={!expert.is_available || !expert.online_status}
                        >
                          Request Call
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-6">
                  <Button
                    onClick={handlePreviousPage}
                    disabled={page === 1}
                    className="flex items-center gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <span>
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    onClick={handleNextPage}
                    disabled={page === totalPages}
                    className="flex items-center gap-2"
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </>
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
}
