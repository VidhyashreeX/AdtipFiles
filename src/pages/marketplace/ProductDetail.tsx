import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, ArrowLeft, MessageCircle, Phone, CheckCircle, XCircle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useShopping } from "@/contexts/ShoppingContext";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart, addToFavorites } = useShopping();
  const { toast } = useToast();
  const [bargainAmount, setBargainAmount] = useState("");
  const [showBargainResult, setShowBargainResult] = useState<"accepted" | "rejected" | null>(null);

  // Mock product data - in a real app, you would fetch this based on the ID
  const products = [
    {
      id: 1,
      name: "Athletic Greens Ultimate Daily",
      price: 79.99,
      minBargainPrice: 69.99, // Added for bargain functionality
      description: "The all-in-one daily drink to support better health and peak performance.",
      features: [
        "75 vitamins, minerals, and whole-food sourced ingredients",
        "Supports gut health, immune system, energy, recovery, and more",
        "NSF Certified for Sport, vegan, paleo, and keto-friendly"
      ],
      image: "https://images.unsplash.com/photo-1616279969096-54b228f2b9d4",
      seller: "Wellness Products Co.",
      rating: 4.8,
      reviews: 1250
    },
    {
      id: 2,
      name: "Organic Green Juice Superfood Powder",
      price: 49.99,
      minBargainPrice: 44.99, // Added for bargain functionality
      description: "A blend of organic greens, vegetables, and fruits for daily nutrition.",
      features: [
        "Made with 30+ organic superfoods",
        "No added sugar or artificial ingredients",
        "Supports energy, immunity, and detoxification"
      ],
      image: "https://images.unsplash.com/photo-1583683843966-794d80340411",
      seller: "Organic Foods Inc.",
      rating: 4.6,
      reviews: 850
    },
    {
      id: 3,
      name: "Garden of Life Raw Organic Perfect Food",
      price: 35.99,
      minBargainPrice: 31.99, // Added for bargain functionality
      description: "Raw organic green superfood supplement with probiotics and enzymes.",
      features: [
        "Contains 34 nutrient-dense raw greens, sprouts, and veggies",
        "Supports digestive health and nutrient absorption",
        "USDA Organic, Non-GMO Project Verified, and Vegan"
      ],
      image: "https://images.unsplash.com/photo-1543362906-acfc16c67564",
      seller: "Green Earth Organics",
      rating: 4.5,
      reviews: 620
    }
  ];

  const product = products.find(p => p.id === Number(id));

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">Product not found</h2>
        <p className="mb-6 text-gray-600">The product you are looking for does not exist.</p>
        <Button onClick={() => navigate("/tip-shop")}>Return to Shop</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addToCart(product);
    toast({
      title: "Added to cart",
      description: `${product.name} has been added to your cart.`
    });
  };

  const handleAddToFavorites = () => {
    addToFavorites(product);
    toast({
      title: "Added to favorites",
      description: `${product.name} has been added to your favorites.`
    });
  };

  const handleBuyNow = () => {
    addToCart(product);
    navigate("/marketplace/cart");
  };

  const handleBargainSubmit = () => {
    const bargainPrice = parseFloat(bargainAmount);
    if (isNaN(bargainPrice) || bargainPrice < product.minBargainPrice) {
      setShowBargainResult("rejected");
      toast({
        title: "Bargain Rejected",
        description: `Your offer is below the seller's minimum price of $${product.minBargainPrice}`,
        variant: "destructive"
      });
    } else {
      setShowBargainResult("accepted");
      toast({
        title: "Bargain Sent!",
        description: "Your offer has been sent to the seller. They will contact you soon.",
        variant: "default"
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button 
        variant="ghost" 
        className="mb-6 pl-0" 
        onClick={() => navigate(-1)}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product Image */}
        <div className="rounded-lg overflow-hidden bg-gray-100 aspect-square">
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>

        {/* Product Details */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{product.name}</h1>
          <div className="text-gray-500 mb-2">Sold by {product.seller}</div>
          
          <div className="flex items-center gap-2 mb-4">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className={`text-${i < Math.floor(product.rating) ? 'yellow-400' : 'gray-300'}`}>
                  ★
                </span>
              ))}
            </div>
            <span className="text-sm text-gray-600">({product.reviews} reviews)</span>
          </div>
          
          <div className="flex items-center mb-4">
            <span className="text-2xl font-bold text-teal-600 mr-2">${product.price.toFixed(2)}</span>
            <span className="text-sm text-gray-500">Min. Bargain: ${product.minBargainPrice.toFixed(2)}</span>
          </div>
          
          <p className="text-gray-700 mb-6">
            {product.description}
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            <Button 
              className="bg-teal-500 hover:bg-teal-600"
              onClick={handleBuyNow}
            >
              Buy Now
            </Button>
            <Button 
              variant="outline" 
              onClick={handleAddToCart}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              Add to Cart
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  className="col-span-2"
                >
                  Request Bargain
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Make a Bargain Offer</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-gray-500 mb-4">
                    The seller's minimum bargain price is ${product.minBargainPrice.toFixed(2)}. 
                    Enter your offer below:
                  </p>
                  <div className="flex items-center">
                    <span className="mr-2 text-lg">$</span>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="Enter your offer"
                      value={bargainAmount}
                      onChange={(e) => setBargainAmount(e.target.value)}
                    />
                  </div>
                  
                  {showBargainResult === "accepted" && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-green-50 text-green-700 rounded-md">
                      <CheckCircle className="h-5 w-5" />
                      <span>Your offer has been sent to the seller!</span>
                    </div>
                  )}
                  
                  {showBargainResult === "rejected" && (
                    <div className="flex items-center gap-2 mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                      <XCircle className="h-5 w-5" />
                      <span>Your offer is below the minimum bargain price.</span>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <div className="flex gap-2">
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button onClick={handleBargainSubmit}>Send Offer</Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button 
              variant="outline" 
              className="col-span-1"
            >
              <MessageCircle className="mr-2 h-4 w-4" />
              Chat
            </Button>
            <Button 
              variant="outline" 
              className="col-span-1"
            >
              <Phone className="mr-2 h-4 w-4" />
              Call
            </Button>
            <Button 
              variant="outline" 
              className="col-span-2"
              onClick={handleAddToFavorites}
            >
              <Heart className="mr-2 h-4 w-4" />
              Add to Favorites
            </Button>
          </div>
          
          <Separator className="my-6" />
          
          <h3 className="font-semibold text-lg mb-3">Key Features</h3>
          <ul className="list-disc pl-5 space-y-1 text-gray-700">
            {product.features.map((feature, index) => (
              <li key={index}>{feature}</li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="mt-12">
        <Tabs defaultValue="description">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
          </TabsList>
          <TabsContent value="description" className="pt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-3">Product Description</h3>
                <p className="text-gray-700">
                  {product.description} Our premium quality product is designed to help you achieve optimal health and wellness.
                  Made with high-quality ingredients sourced from trusted suppliers around the world, this product stands out for its
                  exceptional purity and effectiveness.
                </p>
                <ul className="list-disc pl-5 mt-4 space-y-2 text-gray-700">
                  {product.features.map((feature, index) => (
                    <li key={index}>{feature}</li>
                  ))}
                  <li>No artificial colors, flavors, or preservatives</li>
                  <li>Manufactured in a GMP-certified facility</li>
                  <li>Third-party tested for quality and purity</li>
                </ul>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="reviews" className="pt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-3">Customer Reviews</h3>
                <div className="flex items-center mb-4">
                  <div className="text-3xl font-bold mr-2">{product.rating}</div>
                  <div className="flex mr-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-${i < Math.floor(product.rating) ? 'yellow-400' : 'gray-300'}`}>
                        ★
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-600">Based on {product.reviews} reviews</div>
                </div>
                <Separator className="my-4" />
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center">
                      <div className="font-semibold">Jane D.</div>
                      <div className="mx-2 text-gray-400">•</div>
                      <div className="text-sm text-gray-600">2 weeks ago</div>
                    </div>
                    <div className="flex text-yellow-400 my-1">★★★★★</div>
                    <p className="text-gray-700">
                      This product exceeded my expectations! I've been using it for two weeks and already notice a difference.
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <div className="flex items-center">
                      <div className="font-semibold">Michael R.</div>
                      <div className="mx-2 text-gray-400">•</div>
                      <div className="text-sm text-gray-600">1 month ago</div>
                    </div>
                    <div className="flex text-yellow-400 my-1">★★★★<span className="text-gray-300">★</span></div>
                    <p className="text-gray-700">
                      Great product overall. Would like to see more flavor options in the future.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="shipping" className="pt-4">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-lg mb-3">Shipping Information</h3>
                <div className="space-y-4 text-gray-700">
                  <p>
                    We offer the following shipping options for this product:
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li><span className="font-medium">Standard Shipping</span>: 5-7 business days (Free)</li>
                    <li><span className="font-medium">Express Shipping</span>: 2-3 business days ($9.99)</li>
                    <li><span className="font-medium">Next Day Delivery</span>: Next business day if ordered before 1pm ($19.99)</li>
                  </ul>
                  <p className="mt-4">
                    International shipping is available to select countries. Delivery times and costs vary by location.
                  </p>
                  <p className="mt-4">
                    <span className="font-medium">Return Policy</span>: We accept returns within 30 days of delivery. Return shipping is free for defective items.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetail;