
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const Favorites = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Favorites state
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      name: "Athletic Greens Ultimate Daily",
      price: 79.99,
      image: "https://images.unsplash.com/photo-1616279969096-54b228f2b9d4",
      seller: "Wellness Products Co.",
    },
    {
      id: 2,
      name: "Organic Green Juice Superfood Powder",
      price: 49.99,
      image: "https://images.unsplash.com/photo-1583683843966-794d80340411",
      seller: "Organic Foods Inc.",
    },
    {
      id: 3,
      name: "Garden of Life Raw Organic Perfect Food",
      price: 35.99,
      image: "https://images.unsplash.com/photo-1543362906-acfc16c67564",
      seller: "Green Earth Organics",
    },
  ]);

  // Function to remove item from favorites
  const removeFromFavorites = (id: number) => {
    setFavorites(prevItems => prevItems.filter(item => item.id !== id));
    toast({
      description: "Item removed from favorites",
    });
  };

  // Function to add to cart
  const addToCart = (id: number) => {
    // In a real app, this would interact with a global cart state or API
    toast({
      description: "Item added to cart",
    });
    // Simulate navigating to cart to show the effect
    setTimeout(() => {
      navigate("/marketplace/cart");
    }, 1000);
  };

  // Load favorites from localStorage on component mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  // Save favorites to localStorage when they change
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Favorites</h1>
        <Button variant="outline" onClick={() => navigate("/tip-shop")}>
          Continue Shopping
        </Button>
      </div>

      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((item) => (
            <Card key={item.id} className="overflow-hidden transition-shadow hover:shadow-md">
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-white rounded-full p-1 shadow-sm hover:bg-red-50"
                  onClick={() => removeFromFavorites(item.id)}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
              <CardContent className="p-4">
                <h3 className="font-medium line-clamp-1">{item.name}</h3>
                <p className="text-sm text-gray-500 mt-1">Sold by {item.seller}</p>
                <div className="mt-2 font-semibold">${item.price.toFixed(2)}</div>
                <div className="flex gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate(`/product/${item.id}`)}
                  >
                    View Details
                  </Button>
                  <Button 
                    className="flex-1 bg-teal-500 hover:bg-teal-600"
                    onClick={() => addToCart(item.id)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Heart className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-medium mb-2">No favorites yet</h2>
            <p className="text-gray-500 mb-6">Items you like will be saved here</p>
            <Button onClick={() => navigate("/tip-shop")}>Start Shopping</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Favorites;
