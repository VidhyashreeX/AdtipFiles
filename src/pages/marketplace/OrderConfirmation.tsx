
import React from "react";
import { useLocation, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, ShoppingCart, ArrowRight } from "lucide-react";

const OrderConfirmation = () => {
  const location = useLocation();
  const { orderNumber, orderDate, products, total } = location.state || {};

  // Format date for display
  const formattedDate = orderDate 
    ? new Date(orderDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

  if (!orderNumber) {
    // Handle invalid access (no order details)
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold mb-4">No Order Details Found</h1>
        <p className="mb-8">It looks like you accessed this page directly without placing an order.</p>
        <Button asChild className="bg-adtip-teal hover:bg-adtip-teal-dark">
          <Link to="/tip-shop">Continue Shopping</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-green-100 text-green-600 p-4 rounded-full">
              <CheckCircle2 size={48} />
            </div>
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Thank You for Your Order!</h1>
          <p className="text-gray-600">
            Your order has been received and is being processed.
          </p>
        </div>

        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="text-sm text-gray-500">Order Number</h3>
                <p className="font-medium">{orderNumber}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Order Date</h3>
                <p className="font-medium">{formattedDate}</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Order Status</h3>
                <p className="font-medium text-green-600">Processing</p>
              </div>
              <div>
                <h3 className="text-sm text-gray-500">Estimated Delivery</h3>
                <p className="font-medium">3-5 business days</p>
              </div>
            </div>

            <h3 className="font-semibold mb-4">Order Summary</h3>

            {products && products.length > 0 ? (
              <div className="space-y-4 mb-6">
                {products.map((product: any) => (
                  <div key={product.id} className="flex gap-4">
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={product.image || product.images?.[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{product.name}</p>
                      <div className="flex justify-between mt-1">
                        <p className="text-sm text-gray-600">
                          Quantity: {product.quantity || 1}
                        </p>
                        <p className="font-semibold">
                          ${(product.price * (product.quantity || 1)).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 mb-6">No product details available</p>
            )}

            <Separator className="mb-4" />
            
            <div className="flex justify-between font-bold">
              <span>Total</span>
              <span>${total ? total.toFixed(2) : "0.00"}</span>
            </div>
          </CardContent>
        </Card>

        <div className="text-center space-y-4">
          <p className="text-gray-600">
            A confirmation email has been sent to your registered email address.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-adtip-teal hover:bg-adtip-teal-dark">
              <Link to="/tip-shop">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Continue Shopping
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/orders">
                Track Your Orders
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
