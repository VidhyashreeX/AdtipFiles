
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LineChart, Share, ArrowLeft, Upload, Edit } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

const SellerProducts = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [viewerPercentage, setViewerPercentage] = useState(30);
  const [likePercentage, setLikePercentage] = useState(70);
  const [btnText, setBtnText] = useState("Order now");
  const [buttonLink, setButtonLink] = useState("https://www.apple.com/iphone");
  const [selectedPlatform, setSelectedPlatform] = useState("AdTube");
  const [adType, setAdType] = useState("");
  const [showAdOptions, setShowAdOptions] = useState(false);
  const [showAdPreview, setShowAdPreview] = useState(false);
  const [showAdConfig, setShowAdConfig] = useState(false);
  const [showAnalyticsPreview, setShowAnalyticsPreview] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [adImage, setAdImage] = useState("");
  const [uploadStep, setUploadStep] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);

  // Mock products data
  const products = [
    {
      id: 1,
      name: "Athletic Greens Ultimate Daily",
      price: 79.99,
      image: "https://images.unsplash.com/photo-1616279969096-54b228f2b9d4",
      status: "Active",
      type: "Skip Ad",
      description: "Premium greens powder with 75 vitamins, minerals and whole food-sourced ingredients.",
      brandName: "Athletic Greens",
      category: "home",
      stockCount: 120,
      deliveryTime: "1-3"
    },
    {
      id: 2,
      name: "Organic Green Juice Superfood Powder",
      price: 49.99,
      image: "https://images.unsplash.com/photo-1583683843966-794d80340411",
      status: "Active",
      type: "QR code Ad",
      description: "Organic blend of superfoods for daily nutrition support.",
      brandName: "Pure Organics",
      category: "beauty",
      stockCount: 85,
      deliveryTime: "4-7"
    },
    {
      id: 3,
      name: "Garden of Life Raw Organic Perfect Food",
      price: 35.99,
      image: "https://images.unsplash.com/photo-1543362906-acfc16c67564",
      status: "Inactive",
      type: "QR code Ad",
      description: "Raw organic green superfood supplement with probiotics and enzymes.",
      brandName: "Garden of Life",
      category: "men_fashion",
      stockCount: 42,
      deliveryTime: "7-14"
    }
  ];

  const adTypes = [
    { id: "bannerAd", name: "Banner Ad" },
    { id: "bumperAd", name: "Bumper Ad" },
    { id: "skipVideoAd", name: "Skip Video Ad" },
    { id: "nonSkipVideoAd", name: "Non-Skip Video Ad" },
    { id: "masterAd", name: "Master Ad" },
    { id: "businessTrackerAd", name: "Business Tracker Ad" },
    { id: "qrCodeImageAd", name: "QR Code Image Ad" },
    { id: "qrCodeVideoAd", name: "QR Code Video Ad" }
  ];
  
  // Form fields based on ad type
  const [companyName, setCompanyName] = useState("");
  const [targetGender, setTargetGender] = useState("All");
  const [maritalStatus, setMaritalStatus] = useState("All");
  const [targetAge, setTargetAge] = useState<[number, number]>([18, 55]);
  const [targetProfession, setTargetProfession] = useState("Food");
  const [targetArea, setTargetArea] = useState<string>("");
  const [targetAreaList, setTargetAreaList] = useState<string[]>([]);
  const [impressionsPerDay, setImpressionsPerDay] = useState(1);
  const [payPerCustomer, setPayPerCustomer] = useState(10);
  const [customerTargetPerDay, setCustomerTargetPerDay] = useState(1000);
  const [spendPerDay, setSpendPerDay] = useState(50);
  const [campaignStart, setCampaignStart] = useState<Date | undefined>(new Date());
  const [campaignEnd, setCampaignEnd] = useState<Date | undefined>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
  const [scheduleCampaign, setScheduleCampaign] = useState(false);

  // Analytics data for preview
  const analyticsData = {
    views: 15420,
    likes: 873,
    shares: 245,
    clicks: 1289,
    conversionRate: 8.36,
    engagement: [
      { name: 'Mon', views: 1200, likes: 65 },
      { name: 'Tue', views: 1800, likes: 70 },
      { name: 'Wed', views: 2400, likes: 90 },
      { name: 'Thu', views: 1900, likes: 85 },
      { name: 'Fri', views: 2800, likes: 120 },
      { name: 'Sat', views: 3200, likes: 160 },
      { name: 'Sun', views: 2100, likes: 110 },
    ],
    demographics: {
      age: [
        { group: '18-24', percentage: 25 },
        { group: '25-34', percentage: 40 },
        { group: '35-44', percentage: 20 },
        { group: '45+', percentage: 15 }
      ],
      gender: {
        male: 55,
        female: 42,
        other: 3
      },
      locations: [
        { name: 'New York', percentage: 22 },
        { name: 'Los Angeles', percentage: 18 },
        { name: 'Chicago', percentage: 15 },
        { name: 'Miami', percentage: 12 },
        { name: 'Others', percentage: 33 }
      ]
    }
  };

  const handlePromote = (product) => {
    setSelectedProduct(product);
    setShowAdOptions(true);
    setShowAdPreview(false);
    setShowAdConfig(false);
    setUploadStep(false);
    setAdType(""); // Reset ad type selection
  };

  const handleSelectAdType = () => {
    if (!adType) {
      toast({
        title: "Please select an ad type",
        variant: "destructive"
      });
      return;
    }
    setShowAdOptions(false);
    setShowAdConfig(true);
  };
  
  const handleConfigContinue = () => {
    // Validate required fields
    if (!companyName) {
      toast({
        title: "Missing information",
        description: "Please enter a company name",
        variant: "destructive"
      });
      return;
    }
    
    setShowAdConfig(false);
    setShowAdPreview(true);
  };

  const handlePromoteSubmit = () => {
    if (!uploadStep) {
      setUploadStep(true);
      return;
    }
    
    setShowAdPreview(false);
    setUploadStep(false);
    
    toast({
      title: "Campaign Created",
      description: `Promotion campaign for ${selectedProduct.name} has been created successfully.`
    });
    
    setSelectedProduct(null);
  };

  const handleBackToAdTypes = () => {
    setShowAdPreview(false);
    setShowAdConfig(false);
    setUploadStep(false);
    setShowAdOptions(true);
  };
  
  const handleBackToConfig = () => {
    setShowAdPreview(false);
    setShowAdConfig(true);
    setUploadStep(false);
  };

  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = () => {
      setAdImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddTargetArea = () => {
    if (targetArea.trim() === "") return;
    
    setTargetAreaList([...targetAreaList, targetArea]);
    setTargetArea("");
  };

  const handleRemoveTargetArea = (index: number) => {
    const newList = [...targetAreaList];
    newList.splice(index, 1);
    setTargetAreaList(newList);
  };

  const handleActionClick = (action: string, product: any) => {
    if (action === 'analytics') {
      setSelectedProduct(product);
      setShowAnalyticsPreview(true);
    } else if (action === 'share') {
      navigator.clipboard.writeText(`Check out this amazing product: ${product.name}`);
      toast({
        title: "Link Copied",
        description: "Product link has been copied to clipboard."
      });
    } else if (action === 'edit') {
      setEditingProduct({...product});
      setShowEditDialog(true);
    }
  };

  const handleSaveEdit = () => {
    // In a real application, you would update the product in the database
    toast({
      title: "Product Updated",
      description: "Your product has been updated successfully."
    });
    setShowEditDialog(false);
    setEditingProduct(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">

      <div className="flex items-center mb-8">
        <Button
          variant="ghost"
          className="pl-0"
          onClick={() => navigate("/tip-shop")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold ml-2">My Products</h1>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <Button 
          className="bg-teal-500 hover:bg-teal-600"
          onClick={() => navigate("/marketplace/add-product")}
        >
          Add New Product
        </Button>
        
        <Button 
          variant="outline"
          className="flex items-center gap-2"
          onClick={() => navigate("/marketplace/bulk-upload")}
        >
          <Upload className="h-4 w-4" />
          Bulk Upload
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full mb-6">
        <TabsList>
          <TabsTrigger value="active">Active Products</TabsTrigger>
          <TabsTrigger value="inactive">Inactive Products</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          <div className="space-y-4">
            {products.filter(p => p.status === "Active").map((product) => (
              <ProductItem 
                key={product.id} 
                product={product} 
                onPromote={handlePromote}
                onAction={handleActionClick}
              />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="inactive" className="mt-4">
          <div className="space-y-4">
            {products.filter(p => p.status === "Inactive").map((product) => (
              <ProductItem 
                key={product.id} 
                product={product} 
                onPromote={handlePromote}
                onAction={handleActionClick}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dashboard/Summary Block (as requested, below products) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Products */}
        <div className="bg-white border rounded-lg p-4 flex flex-col items-center shadow-sm">
          <span className="text-3xl font-bold text-teal-600">2</span>
          <span className="text-sm text-gray-500 mt-1">Total Products</span>
        </div>
        {/* Active/Inactive Products */}
        <div className="bg-white border rounded-lg p-4 flex flex-col items-center shadow-sm">
          <span className="text-lg font-semibold text-green-600">1</span>
          <span className="text-xs text-gray-500">Active</span>
          <span className="text-lg font-semibold text-gray-400 mt-2">42</span>
          <span className="text-xs text-gray-500">Inactive</span>
        </div>
        {/* Orders & Buyers (Mock Data) */}
        <div className="bg-white border rounded-lg p-4 flex flex-col items-center shadow-sm">
          <span className="text-lg font-semibold text-blue-600">17</span>
          <span className="text-xs text-gray-500">Total Orders</span>
          <span className="text-lg font-semibold text-amber-600 mt-2">Unique Buyers</span>
        </div>
        {/* Popular Locations (Mock Data) */}
        <div className="bg-white border rounded-lg p-4 flex flex-col items-center shadow-sm">
          <span className="text-xs text-gray-500 mb-2">Popular Locations</span>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>New York <span className="text-xs text-gray-400">(22%)</span></li>
            <li>Los Angeles <span className="text-xs text-gray-400">(18%)</span></li>
            <li>Chicago <span className="text-xs text-gray-400">(15%)</span></li>
          </ul>
        </div>
      </div>

      {/* Customer Reviews (Mock Data) */}
      <div className="bg-white border rounded-lg p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Customer Reviews</h2>
        <div className="space-y-4">
          {/* Example Review 1 */}
          <div className="border-b pb-4 flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0">
              <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="User" className="w-12 h-12 rounded-full" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">John Doe</span>
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-xs text-gray-400">2 days ago</span>
              </div>
              <p className="text-gray-700 mt-1">Great product, fast delivery. Will buy again!</p>
              <div className="flex gap-2 mt-2">
                <img src="https://images.unsplash.com/photo-1616279969096-54b228f2b9d4" alt="Review" className="w-16 h-16 object-cover rounded" />
              </div>
              <div className="mt-2">
                <button className="text-xs text-blue-600 hover:underline">Reply</button>
              </div>
            </div>
          </div>
          {/* Example Review 2 */}
          <div className="border-b pb-4 flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0">
              <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="User" className="w-12 h-12 rounded-full" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Jane Smith</span>
                <span className="text-yellow-400">★★★★☆</span>
                <span className="text-xs text-gray-400">5 days ago</span>
              </div>
              <p className="text-gray-700 mt-1">Product quality is good, but delivery took longer than expected.</p>
              <div className="flex gap-2 mt-2">
                <img src="https://images.unsplash.com/photo-1583683843966-794d80340411" alt="Review" className="w-16 h-16 object-cover rounded" />
                <img src="https://images.unsplash.com/photo-1543362906-acfc16c67564" alt="Review" className="w-16 h-16 object-cover rounded" />
              </div>
              <div className="mt-2">
                <button className="text-xs text-blue-600 hover:underline">Reply</button>
              </div>
            </div>
          </div>
          {/* Example Review 3 */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-shrink-0">
              <img src="https://randomuser.me/api/portraits/men/65.jpg" alt="User" className="w-12 h-12 rounded-full" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium">Alex Lee</span>
                <span className="text-yellow-400">★★★★★</span>
                <span className="text-xs text-gray-400">1 week ago</span>
              </div>
              <p className="text-gray-700 mt-1">Amazing value for money. Highly recommend!</p>
              <div className="flex gap-2 mt-2">
                <img src="https://images.unsplash.com/photo-1616279969096-54b228f2b9d4" alt="Review" className="w-16 h-16 object-cover rounded" />
              </div>
              <div className="mt-2">
                <button className="text-xs text-blue-600 hover:underline">Reply</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Type Selection Dialog */}
      {selectedProduct && showAdOptions && (
        <Dialog open={true} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Ad Type for {selectedProduct.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <RadioGroup value={adType} onValueChange={setAdType} className="space-y-3">
                {adTypes.map((type) => (
                  <div key={type.id} className="flex items-center space-x-2 border p-3 rounded-md hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value={type.id} id={type.id} />
                    <Label htmlFor={type.id} className="cursor-pointer w-full">{type.name}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <Button onClick={handleSelectAdType}>
                Continue
              </Button>
              <Button variant="outline" onClick={() => setSelectedProduct(null)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Ad Configuration Dialog */}
      {selectedProduct && showAdConfig && (
        <Dialog open={true} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{adTypes.find(t => t.id === adType)?.name} Configuration</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium">Select Company</label>
                <Input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Gender</label>
                <Select value={targetGender} onValueChange={setTargetGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Marital Status</label>
                <Select value={maritalStatus} onValueChange={setMaritalStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select marital status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Age</label>
                <div className="flex items-center gap-4">
                  <span className="text-sm">{targetAge[0]}</span>
                  <Slider
                    value={[targetAge[0], targetAge[1]]}
                    min={18}
                    max={65}
                    step={1}
                    onValueChange={(value) => setTargetAge([value[0], value[1]])}
                    className="flex-1"
                  />
                  <span className="text-sm">{targetAge[1]}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Profession</label>
                <Select value={targetProfession} onValueChange={setTargetProfession}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select profession" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Food">Food</SelectItem>
                    <SelectItem value="Technology">Technology</SelectItem>
                    <SelectItem value="Medical">Medical</SelectItem>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="Finance">Finance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Target Area</label>
                <div className="flex gap-2">
                  <Input 
                    value={targetArea}
                    onChange={(e) => setTargetArea(e.target.value)}
                    placeholder="Enter a location"
                    className="flex-1"
                  />
                  <Button type="button" onClick={handleAddTargetArea} size="sm">
                    Add
                  </Button>
                </div>
                <div className="border rounded-md p-2 text-sm min-h-8">
                  {targetAreaList.map((area, index) => (
                    <Badge key={index} className="mr-1 mb-1">
                      {area}
                      <button 
                        type="button" 
                        className="ml-1 text-xs opacity-70 hover:opacity-100"
                        onClick={() => handleRemoveTargetArea(index)}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                  {targetAreaList.length === 0 && (
                    <span className="text-xs text-gray-400">No areas selected yet</span>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  How many times customers watch ad per day?
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={impressionsPerDay}
                    onChange={(e) => setImpressionsPerDay(parseInt(e.target.value) || 1)}
                    min={1}
                    className="w-20"
                  />
                  <div className="flex-grow">
                    <Slider
                      value={[impressionsPerDay]}
                      min={1}
                      max={10}
                      step={1}
                      onValueChange={(value) => setImpressionsPerDay(value[0])}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  How much amount do you want to pay per customer?
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={payPerCustomer}
                    onChange={(e) => setPayPerCustomer(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-20"
                  />
                  <div className="flex-grow">
                    <Slider
                      value={[payPerCustomer]}
                      min={1}
                      max={100}
                      step={1}
                      onValueChange={(value) => setPayPerCustomer(value[0])}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  How many customer target per day?
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={customerTargetPerDay}
                    onChange={(e) => setCustomerTargetPerDay(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-20"
                  />
                  <div className="flex-grow">
                    <Slider
                      value={[customerTargetPerDay]}
                      min={100}
                      max={10000}
                      step={100}
                      onValueChange={(value) => setCustomerTargetPerDay(value[0])}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  How much amount do you want to spend per day?
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={spendPerDay}
                    onChange={(e) => setSpendPerDay(parseInt(e.target.value) || 0)}
                    min={0}
                    className="w-20"
                  />
                  <div className="flex-grow">
                    <Slider
                      value={[spendPerDay]}
                      min={10}
                      max={1000}
                      step={10}
                      onValueChange={(value) => setSpendPerDay(value[0])}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Do you want to start the campaign now?
                </label>
                <div className="flex items-center gap-4">
                  <RadioGroup value={scheduleCampaign ? "schedule" : "now"} onValueChange={(val) => setScheduleCampaign(val === "schedule")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="now" id="now" />
                      <Label htmlFor="now">Now</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="schedule" id="schedule" />
                      <Label htmlFor="schedule">Schedule</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
              
              {scheduleCampaign && (
                <>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Start Date & Time</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !campaignStart && "text-muted-foreground"
                          )}
                        >
                          {campaignStart ? format(campaignStart, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={campaignStart}
                          onSelect={setCampaignStart}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">End Date & Time</label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !campaignEnd && "text-muted-foreground"
                          )}
                        >
                          {campaignEnd ? format(campaignEnd, "PPP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={campaignEnd}
                          onSelect={setCampaignEnd}
                          disabled={(date) => date < new Date() || (campaignStart && date < campaignStart)}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={handleBackToAdTypes}>
                Back
              </Button>
              <Button onClick={handleConfigContinue}>
                Next
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Ad Preview Dialog */}
      {selectedProduct && showAdPreview && !uploadStep && (
        <Dialog open={true} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{adTypes.find(t => t.id === adType)?.name} Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    After watching ad customer per view percentage?
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{viewerPercentage}%</span>
                    <Slider
                      value={[viewerPercentage]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => setViewerPercentage(value[0])}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={viewerPercentage}
                      onChange={(e) => setViewerPercentage(parseInt(e.target.value) || 0)}
                      className="w-16"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    After watching ad customer per like percentage?
                  </label>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">{likePercentage}%</span>
                    <Slider
                      value={[likePercentage]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={(value) => setLikePercentage(value[0])}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={likePercentage}
                      onChange={(e) => setLikePercentage(parseInt(e.target.value) || 0)}
                      className="w-16"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Select button to display</label>
                  <Input
                    value={btnText}
                    onChange={(e) => setBtnText(e.target.value)}
                    placeholder="Button text"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Enter button link (Optional)</label>
                  <Input
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Where to display ad?</label>
                  <Select
                    value={selectedPlatform}
                    onValueChange={setSelectedPlatform}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AdTube">AdTube</SelectItem>
                      <SelectItem value="Social">Social Networks</SelectItem>
                      <SelectItem value="Search">Search Engines</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Tax number/GST Number</label>
                  <Input
                    placeholder="Enter tax/GST number"
                    defaultValue="07TRRPS4493R1ZE"
                  />
                </div>

                <div className="mt-6 border rounded-lg p-4 bg-gray-50">
                  <h3 className="text-sm font-medium mb-2">Ad Preview</h3>
                  <div className="aspect-video bg-gray-200 rounded-md overflow-hidden relative mb-2">
                    <img 
                      src={selectedProduct.image} 
                      alt="Ad preview" 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-4 right-4">
                      <Button size="sm" className="bg-white text-black hover:bg-gray-100">{btnText}</Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    This is a preview of how your ad will appear to viewers.
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button className="bg-black text-white hover:bg-gray-800" onClick={handlePromoteSubmit}>
                Continue to Upload
              </Button>
              <Button variant="outline" onClick={handleBackToConfig}>
                Back
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Ad Upload Dialog */}
      {selectedProduct && showAdPreview && uploadStep && (
        <Dialog open={true} onOpenChange={() => setSelectedProduct(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Preview Business Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="bg-white flex flex-col items-center">
                <div className="bg-brown-700 rounded-lg overflow-hidden w-64 p-4 relative">
                  <img 
                    src="/lovable-uploads/fc47b2b3-533c-4783-8c39-e8fb3e1160ff.png" 
                    alt="Ad preview" 
                    className="w-full h-auto rounded-md"
                  />
                </div>
                <div className="text-center mt-4">
                  <h3 className="font-semibold">New Shop Opening</h3>
                  <p className="text-sm text-gray-500">Let's celebrate new milestones in this new shop!</p>
                </div>
                <Button 
                  className="w-full mt-6 bg-black text-white"
                  onClick={() => {
                    toast({
                      title: "Campaign Created",
                      description: "Your ad campaign has been created successfully!",
                    });
                    navigate("/analysis?tab=advertisers"); // Redirect to the analytics page
                    setSelectedProduct(null);
                  }}
                >
                  Order Now
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Analytics Preview Dialog */}
      {selectedProduct && showAnalyticsPreview && (
        <Dialog open={true} onOpenChange={() => {
          setShowAnalyticsPreview(false);
          setSelectedProduct(null);
        }}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Analytics for {selectedProduct.name}</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="border rounded-md p-4 text-center">
                  <h3 className="text-xl font-bold text-teal-500">{analyticsData.views.toLocaleString()}</h3>
                  <p className="text-sm text-gray-500">Total Views</p>
                </div>
                <div className="border rounded-md p-4 text-center">
                  <h3 className="text-xl font-bold text-pink-500">{analyticsData.likes.toLocaleString()}</h3>
                  <p className="text-sm text-gray-500">Total Likes</p>
                </div>
                <div className="border rounded-md p-4 text-center">
                  <h3 className="text-xl font-bold text-blue-500">{analyticsData.shares.toLocaleString()}</h3>
                  <p className="text-sm text-gray-500">Total Shares</p>
                </div>
                <div className="border rounded-md p-4 text-center">
                  <h3 className="text-xl font-bold text-amber-500">{analyticsData.clicks.toLocaleString()}</h3>
                  <p className="text-sm text-gray-500">Link Clicks</p>
                </div>
              </div>
              
              <div className="border rounded-md p-4 mb-6">
                <h3 className="font-medium mb-3">Weekly Engagement</h3>
                <div className="h-64 flex items-end justify-between">
                  {analyticsData.engagement.map((day) => (
                    <div key={day.name} className="flex flex-col items-center w-full">
                      <div className="w-full flex justify-center items-end h-48">
                        <div 
                          className="w-4 bg-teal-500 rounded-t-sm mr-1"
                          style={{ height: `${(day.views / 3500) * 100}%` }}
                        ></div>
                        <div 
                          className="w-4 bg-pink-500 rounded-t-sm"
                          style={{ height: `${(day.likes / 180) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs mt-1">{day.name}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-center mt-2">
                  <div className="flex items-center mr-4">
                    <div className="w-3 h-3 bg-teal-500 mr-1"></div>
                    <span className="text-xs">Views</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-pink-500 mr-1"></div>
                    <span className="text-xs">Likes</span>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-3">Demographics</h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-sm font-medium mb-2">Age Distribution</h4>
                      {analyticsData.demographics.age.map((item) => (
                        <div key={item.group} className="flex items-center mb-2">
                          <span className="w-14 text-xs">{item.group}</span>
                          <div className="flex-1 mx-2">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500"
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <span className="text-xs w-8 text-right">{item.percentage}%</span>
                        </div>
                      ))}
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium mb-2">Gender</h4>
                      <div className="flex gap-2">
                        <div 
                          className="h-4 bg-blue-500 rounded-sm"
                          style={{ width: `${analyticsData.demographics.gender.male}%` }}
                        ></div>
                        <div 
                          className="h-4 bg-pink-500 rounded-sm"
                          style={{ width: `${analyticsData.demographics.gender.female}%` }}
                        ></div>
                        <div 
                          className="h-4 bg-purple-500 rounded-sm"
                          style={{ width: `${analyticsData.demographics.gender.other}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-xs mt-1">
                        <span>Male: {analyticsData.demographics.gender.male}%</span>
                        <span>Female: {analyticsData.demographics.gender.female}%</span>
                        <span>Other: {analyticsData.demographics.gender.other}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-md p-4">
                  <h3 className="font-medium mb-3">Top Locations</h3>
                  <div className="space-y-2">
                    {analyticsData.demographics.locations.map((location) => (
                      <div key={location.name} className="flex items-center">
                        <span className="text-xs w-20">{location.name}</span>
                        <div className="flex-1 mx-2">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-green-500"
                              style={{ width: `${location.percentage}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="text-xs w-8 text-right">{location.percentage}%</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Conversion Rate</h4>
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div 
                          className="bg-amber-500 h-2.5 rounded-full" 
                          style={{ width: `${analyticsData.conversionRate}%` }}
                        ></div>
                      </div>
                      <span className="ml-2 text-sm font-medium">{analyticsData.conversionRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button 
                onClick={() => {
                  navigate("/analysis?tab=advertisers&productId=" + selectedProduct.id);
                  setShowAnalyticsPreview(false);
                  setSelectedProduct(null);
                }}
              >
                View Full Analytics
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAnalyticsPreview(false);
                  setSelectedProduct(null);
                }}
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Product Dialog */}
      {showEditDialog && editingProduct && (
        <Dialog open={true} onOpenChange={() => setShowEditDialog(false)}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Edit Product</DialogTitle>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Product Name</label>
                  <Input 
                    value={editingProduct.name} 
                    onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Price</label>
                  <div className="relative mt-1">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
                    <Input 
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({...editingProduct, price: e.target.value})}
                      className="pl-6"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea 
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Brand Name</label>
                  <Input 
                    value={editingProduct.brandName} 
                    onChange={(e) => setEditingProduct({...editingProduct, brandName: e.target.value})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select 
                    value={editingProduct.category}
                    onValueChange={(value) => setEditingProduct({...editingProduct, category: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="women_fashion">Women Fashion</SelectItem>
                      <SelectItem value="men_fashion">Men Fashion</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                      <SelectItem value="home">Home & Kitchen</SelectItem>
                      <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Stock Count</label>
                  <Input 
                    type="number"
                    value={editingProduct.stockCount} 
                    onChange={(e) => setEditingProduct({...editingProduct, stockCount: parseInt(e.target.value) || 0})}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Delivery Time</label>
                  <Select 
                    value={editingProduct.deliveryTime}
                    onValueChange={(value) => setEditingProduct({...editingProduct, deliveryTime: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-3">1-3 days</SelectItem>
                      <SelectItem value="4-7">4-7 days</SelectItem>
                      <SelectItem value="7-14">7-14 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Status</label>
                  <Select 
                    value={editingProduct.status}
                    onValueChange={(value) => setEditingProduct({...editingProduct, status: value})}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Return Policy</label>
                  <Select defaultValue="no_return">
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no_return">No Return Policy</SelectItem>
                      <SelectItem value="7days">7-Day Return</SelectItem>
                      <SelectItem value="14days">14-Day Return</SelectItem>
                      <SelectItem value="30days">30-Day Return</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Keywords</label>
                <Input 
                  placeholder="Enter keywords separated by commas"
                  className="mt-1"
                  defaultValue="greens, nutrition, health, organic"
                />
              </div>

              <div>
                <label className="text-sm font-medium">Bargain Amount</label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
                  <Input 
                    placeholder="Enter maximum bargain amount"
                    className="pl-6"
                    defaultValue="5.00"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Maximum amount customers can bargain from the regular price</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveEdit}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Product Item Component
const ProductItem = ({ product, onPromote, onAction }) => {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="w-full md:w-40 h-40 bg-gray-100 rounded-md overflow-hidden">
            <img 
              src={product.image} 
              alt={product.name}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <h3 className="font-semibold text-lg">{product.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={product.status === "Active" ? "default" : "outline"}
                    className={product.status === "Active" ? "bg-green-500" : ""}
                  >
                    {product.status}
                  </Badge>
                  <span className="text-sm text-gray-500">{product.type}</span>
                </div>
                <p className="mt-2 text-gray-700">${product.price.toFixed(2)}</p>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => onAction('analytics', product)}
                >
                  <LineChart className="h-4 w-4" />
                  Analytics
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => onAction('edit', product)}
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button 
                  variant={product.status === "Active" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => onPromote(product)}
                  className={product.status === "Active" ? "bg-black hover:bg-gray-800" : ""}
                >
                  Promote
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center gap-1"
                  onClick={() => onAction('share', product)}
                >
                  <Share className="h-4 w-4" />
                  Share
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SellerProducts;
