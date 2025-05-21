
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const ListProductFinish: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Mock product data that would come from the previous step
  const product = {
    name: "Athletic Greens Ultimate Daily",
    image: "https://images.unsplash.com/photo-1616279969096-54b228f2b9d4",
    condition: "New",
    price: 79.99,
    quantity: 25,
    sku: "ATH-GR-123",
    fulfillmentMethod: "Merchant Fulfilled"
  };

  const handleListProduct = () => {
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      toast({
        title: "Product Listed Successfully",
        description: "Your product is now available on AdTip Shop",
      });
      navigate("/tip-shop");
    }, 1500);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">List as Seller</h1>
        
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 p-4 bg-green-50 rounded-md mb-6">
              <div className="rounded-full bg-green-100 p-2">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium">Ready to List</h3>
                <p className="text-sm text-gray-600">
                  1 of your selected listings are ready to be listed on AdTip Shop
                </p>
              </div>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="p-4">Image</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Fulfillment Method</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t">
                    <td className="p-4">
                      <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                        <img 
                          src={product.image} 
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-gray-500">SKU: {product.sku}</p>
                        <p className="text-sm text-gray-500">
                          {product.condition} · ${product.price} · Qty: {product.quantity}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center text-sm">
                        <Check className="h-4 w-4 text-green-600 mr-1" />
                        {product.fulfillmentMethod}
                      </div>
                    </td>
                    <td className="p-4">
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-500" />
                <span>
                  Once a product is listed, the offer will be live immediately.
                </span>
              </div>
              
              <Button
                onClick={handleListProduct}
                className="bg-teal-500 hover:bg-teal-600"
                disabled={isProcessing}
              >
                {isProcessing ? "Processing..." : "Add This Product"}
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="font-medium mb-4">What happens next?</h3>
          <ol className="space-y-3 list-decimal pl-5">
            <li>Your listing will appear on AdTip Shop and be available for customers to purchase.</li>
            <li>You'll receive order notifications when customers buy your products.</li>
            <li>For merchant fulfilled items, you'll be responsible for shipping within the stated timeframe.</li>
            <li>Payments will be processed and transferred to your account after successful delivery.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default ListProductFinish;
