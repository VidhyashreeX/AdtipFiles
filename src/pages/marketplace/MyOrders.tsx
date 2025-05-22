import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Package, ChevronRight, ArrowRight, Map, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { useShopping } from "@/contexts/ShoppingContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const MyOrders = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { orders, buyAgain } = useShopping();
  
  // Function to view order details
  const viewOrderDetails = (orderId) => {
    navigate(`/marketplace/track-order/${orderId}`);
  };

  // Filter product orders and ad campaigns
  const productOrders = orders.filter(order => !order.isAdCampaign);
  const adCampaigns = orders.filter(order => order.isAdCampaign === true);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <Button variant="outline" onClick={() => navigate("/tip-shop")}>
          Continue Shopping
        </Button>
      </div>

      <Tabs defaultValue="products" className="mb-6">
        <TabsList>
          <TabsTrigger value="products">Product Orders</TabsTrigger>
          <TabsTrigger value="ads">Ad Campaigns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="products" className="mt-4">
          {productOrders.length > 0 ? (
            <div className="space-y-6">
              {productOrders.map((order) => (
                <ProductOrderCard 
                  key={order.id} 
                  order={order} 
                  viewDetails={viewOrderDetails}
                  buyAgain={buyAgain}
                />
              ))}
            </div>
          ) : (
            <EmptyOrderState navigate={navigate} type="products" />
          )}
        </TabsContent>
        
        <TabsContent value="ads" className="mt-4">
          {adCampaigns.length > 0 ? (
            <div className="space-y-6">
              {adCampaigns.map((order) => (
                <AdCampaignCard 
                  key={order.id} 
                  order={order} 
                  viewDetails={viewOrderDetails}
                />
              ))}
            </div>
          ) : (
            <EmptyOrderState navigate={navigate} type="ads" />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Product Order Card Component
const ProductOrderCard = ({ order, viewDetails, buyAgain }) => (
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
            onClick={() => viewDetails(order.id)}
          >
            <Truck className="h-4 w-4 mr-1" />
            Track Order
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
);

// Ad Campaign Card Component
const AdCampaignCard = ({ order, viewDetails }) => (
  <Card key={order.id} className="overflow-hidden">
    <CardHeader className="bg-gray-50 px-6 py-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <CardTitle className="text-lg font-medium">Campaign {order.id}</CardTitle>
          <p className="text-sm text-gray-500">Started on {order.date}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge
            variant={order.status === "Active" ? "default" : "outline"}
            className={order.status === "Active" ? "bg-green-500" : ""}
          >
            {order.status}
          </Badge>
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => viewDetails(order.id)}
          >
            <Map className="h-4 w-4 mr-1" />
            View Analytics
          </Button>
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-6">
      <div className="flex items-center gap-4">
        <div className="h-20 w-20 rounded-md overflow-hidden bg-gray-100">
          <img
            src={order.image || "https://images.unsplash.com/photo-1557838923-2985c318be48"}
            alt={order.campaign || "Campaign"}
            className="h-full w-full object-cover"
          />
        </div>
        <div className="flex-1">
          <h3 className="font-medium">{order.campaign || "Marketing Campaign"}</h3>
          <div className="flex flex-col mt-1 text-sm">
            <span>{order.type || "Banner Ad"}</span>
            <span className="text-gray-500">Target: {order.target || "10,000 views"}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="font-bold">${order.spent?.toFixed(2) || "0.00"}</div>
          <div className="text-sm text-gray-500">spent of ${order.budget?.toFixed(2) || "0.00"}</div>
        </div>
      </div>

      <div className="mt-4 bg-gray-50 p-3 rounded-lg">
        <div className="flex justify-between text-sm">
          <span>Progress</span>
          <span>{order.progress || "25%"} complete</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
          <div 
            className="bg-adtip-teal h-2 rounded-full" 
            style={{ width: order.progress || "25%" }}
          ></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

// Empty State Component
const EmptyOrderState = ({ navigate, type }) => (
  <Card>
    <CardContent className="flex flex-col items-center justify-center py-12">
      {type === "products" ? (
        <>
          <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-medium mb-2">No orders yet</h2>
          <p className="text-gray-500 mb-6">When you place an order, it will appear here</p>
          <Button onClick={() => navigate("/tip-shop")}>Start Shopping</Button>
        </>
      ) : (
        <>
          <Map className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-medium mb-2">No ad campaigns yet</h2>
          <p className="text-gray-500 mb-6">When you create an ad campaign, it will appear here</p>
          <Button onClick={() => navigate("/post-ads")}>Create Campaign</Button>
        </>
      )}
    </CardContent>
  </Card>
);

export default MyOrders;
