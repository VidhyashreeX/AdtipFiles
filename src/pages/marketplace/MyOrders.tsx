
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, ChevronRight, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const MyOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Mock orders data
  const [orders, setOrders] = useState([
    {
      id: "ORD-12345",
      date: "May 18, 2025",
      total: 129.99,
      status: "Delivered",
      items: [
        {
          id: 1,
          name: "Athletic Greens Ultimate Daily",
          price: 79.99,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1616279969096-54b228f2b9d4",
        },
        {
          id: 2,
          name: "Organic Green Juice Superfood Powder",
          price: 49.99,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1583683843966-794d80340411",
        },
      ],
    },
    {
      id: "ORD-67890",
      date: "May 15, 2025",
      total: 35.99,
      status: "Processing",
      items: [
        {
          id: 3,
          name: "Garden of Life Raw Organic Perfect Food",
          price: 35.99,
          quantity: 1,
          image: "https://images.unsplash.com/photo-1543362906-acfc16c67564",
        },
      ],
    },
  ]);

  // Function to add to cart
  const buyAgain = (item) => {
    // In a real app, this would add the product to the cart
    const storedCart = localStorage.getItem('cartItems');
    let cart = storedCart ? JSON.parse(storedCart) : [];
    
    // Check if item is already in cart
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      // If item exists, increase quantity
      cart = cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 } 
          : cartItem
      );
    } else {
      // If item doesn't exist, add it with quantity 1
      cart.push({...item, quantity: 1});
    }
    
    localStorage.setItem('cartItems', JSON.stringify(cart));
    toast({
      description: "Item added to cart",
    });
    
    // Optionally navigate to cart
    setTimeout(() => {
      navigate("/marketplace/cart");
    }, 1000);
  };

  // Load orders from localStorage on component mount
  useEffect(() => {
    const storedOrders = localStorage.getItem('orders');
    if (storedOrders) {
      setOrders(JSON.parse(storedOrders));
    }
    
    // Check if we need to create an order from the checkout process
    const checkoutItems = localStorage.getItem('checkoutComplete');
    if (checkoutItems) {
      const newOrder = JSON.parse(checkoutItems);
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      localStorage.setItem('orders', JSON.stringify([newOrder, ...orders]));
      localStorage.removeItem('checkoutComplete');
    }
  }, []);

  // Save orders to localStorage when they change
  useEffect(() => {
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [orders]);

  // Function to view order details
  const viewOrderDetails = (orderId) => {
    // In a real app, this would navigate to an order details page
    toast({
      description: `Viewing details for order ${orderId}`,
    });
    // For demo purposes, just log the order
    console.log("Order details:", orders.find(order => order.id === orderId));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Button variant="outline" onClick={() => navigate("/tip-shop")}>
          Continue Shopping
        </Button>
      </div>

      {orders.length > 0 ? (
        <div className="space-y-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 px-6 py-4">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-lg font-medium">Order {order.id}</CardTitle>
                    <p className="text-sm text-gray-500">Placed on {order.date}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge
                      variant={order.status === "Delivered" ? "default" : "outline"}
                      className={order.status === "Delivered" ? "bg-green-500" : ""}
                    >
                      {order.status}
                    </Badge>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="flex items-center gap-1"
                      onClick={() => viewOrderDetails(order.id)}
                    >
                      View Details <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-4">
                      <div className="h-20 w-20 rounded-md overflow-hidden bg-gray-100">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">{item.name}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm">
                          <span>Qty: {item.quantity}</span>
                          <span>${item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => buyAgain(item)}
                      >
                        Buy Again
                      </Button>
                    </div>
                  ))}
                </div>

                <Separator className="my-4" />

                <div className="flex justify-between items-center">
                  <div className="font-medium">Total</div>
                  <div className="font-bold">${order.total.toFixed(2)}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-medium mb-2">No orders yet</h2>
            <p className="text-gray-500 mb-6">When you place an order, it will appear here</p>
            <Button onClick={() => navigate("/tip-shop")}>Start Shopping</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MyOrders;
