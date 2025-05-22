
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Filter, ShoppingCart } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useShopping } from "@/contexts/ShoppingContext";
import { useToast } from "@/components/ui/use-toast";

// Mock product data
const mockProducts = [
  {
    id: 1,
    name: "Premium Wireless Headphones",
    price: 149.99,
    minBargainPrice: 129.99,
    seller: "AudioTech",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e",
    category: "Electronics"
  },
  {
    id: 2,
    name: "Handcrafted Leather Wallet",
    price: 79.99,
    minBargainPrice: 69.99,
    seller: "LeatherCrafts",
    image: "https://images.unsplash.com/photo-1627123424574-724758594e93",
    category: "Fashion"
  },
  {
    id: 3,
    name: "Smart Home Hub",
    price: 199.99,
    minBargainPrice: 179.99,
    seller: "TechInnovate",
    image: "https://images.unsplash.com/photo-1558089687-f282ffcbc0d4",
    category: "Electronics"
  },
  {
    id: 4,
    name: "Organic Face Cream",
    price: 34.99,
    minBargainPrice: 29.99,
    seller: "NaturalBeauty",
    image: "https://images.unsplash.com/photo-1571781926291-c477ebfd024b",
    category: "Beauty"
  },
  {
    id: 5,
    name: "Fitness Smart Watch",
    price: 129.99,
    minBargainPrice: 109.99,
    seller: "FitTech",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30",
    category: "Fitness"
  },
  {
    id: 6,
    name: "Designer Coffee Mug",
    price: 24.99,
    minBargainPrice: 19.99,
    seller: "HomeDecor",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d",
    category: "Home"
  }
];

// Categories
const categories = [
  "All Categories",
  "Electronics",
  "Fashion",
  "Beauty",
  "Fitness",
  "Home",
  "Food",
  "Books"
];

const TipShop: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All Categories");
  const navigate = useNavigate();
  const { addToCart } = useShopping();
  const { toast } = useToast();
  
  // Filter products based on search and category
  const filteredProducts = mockProducts.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          product.seller.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All Categories" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle Buy Now click
  const handleBuyNow = (product) => {
    addToCart({
      ...product,
      quantity: 1
    });
    
    navigate("/checkout", {
      state: {
        products: [{
          ...product,
          quantity: 1
        }]
      }
    });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Tip Shop</h1>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search products..."
            className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-adtip-teal focus:outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
        
        <div className="relative w-full md:w-64">
          <select
            className="w-full appearance-none px-4 py-2 pl-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-adtip-teal focus:outline-none"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <Filter className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        </div>
      </div>
      
      {/* Product Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-8">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="h-full hover:shadow-lg transition-shadow duration-300 overflow-hidden">
            <Link to={`/product/${product.id}`}>
              <div className="h-48 overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                />
              </div>
              <CardContent className="p-4">
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{product.name}</h3>
                <p className="text-gray-500 text-sm mb-1">Seller: {product.seller}</p>
                <p className="text-xs text-gray-400 mb-1">Added by: {product.seller}</p>
                <div className="flex justify-between items-center mt-2">
                  <span className="font-bold text-lg text-adtip-teal">${product.price}</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    {product.category}
                  </span>
                </div>
              </CardContent>
            </Link>
            <div className="p-4">
              <Button
                onClick={() => handleBuyNow(product)}
                className="w-full bg-adtip-teal hover:bg-adtip-teal-dark text-white"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Buy Now
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No products found matching your search.</p>
        </div>
      )}
    </div>
  );
};

export default TipShop;
