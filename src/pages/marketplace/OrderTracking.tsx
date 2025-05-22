import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Truck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const OrderTracking = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock data for product order tracking
  const productOrder = {
    id: id || "277006711517",
    product: "Assorted Gift Items",
    price: "₹1,999",
    date: "20 February",
    status: "Out for Delivery",
    image: "https://images.unsplash.com/photo-1616279969096-54b228f2b9d4",
    shipping: {
      address: "Sheenam, B-16/86/1 Ghalori Gate Patiala, Patiala Punjab 147001",
      carrier: "Amazon",
      trackingNumber: "277006711517"
    },
    steps: [
      { id: 1, title: "Ordered", date: "Sunday, 20 February", completed: true, icon: CheckCircle2 },
      { id: 2, title: "Shipped", date: "Monday, 21 February", completed: true, icon: CheckCircle2 },
      { id: 3, title: "Out for delivery", date: "Today", completed: true, icon: Truck },
      { id: 4, title: "Arriving today", date: "By 9 PM", completed: false, icon: CheckCircle2 }
    ]
  };

  return (
    <div className="bg-white min-h-screen py-4">
      <div className="container mx-auto px-4 max-w-3xl">
        {/* Header with Back Button */}
        <div className="flex items-center mb-4">
          <Button
            variant="ghost"
            className="pl-0"
            onClick={() => navigate("/marketplace/my-orders")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>

        <Card className="shadow-lg border border-gray-100">
          <CardHeader className="p-4 pb-0 flex flex-row gap-4 items-center">
            <div className="h-20 w-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
              <img src={productOrder.image} alt={productOrder.product} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-xl font-bold text-teal-700 mb-1">{productOrder.product}</CardTitle>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-gray-700 font-semibold">{productOrder.price}</span>
                <span className="text-xs bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full font-medium">{productOrder.status}</span>
              </div>
              <div className="text-xs text-gray-500">Order ID: {productOrder.id}</div>
            </div>
          </CardHeader>

          <CardContent className="p-4 pt-2">
            {/* Timeline */}
            <div className="space-y-4 mb-8">
              {productOrder.steps.map((step, index) => (
                <div key={step.id} className="flex items-start">
                  <div className="flex flex-col items-center mr-4">
                    <div
                      className={`rounded-full p-1.5 border-2 ${
                        step.completed ? "bg-teal-100 text-teal-600 border-teal-400" : "bg-gray-200 text-gray-400 border-gray-300"
                      }`}
                    >
                      <step.icon className="h-5 w-5" />
                    </div>
                    {index < productOrder.steps.length - 1 && (
                      <div className="w-0.5 bg-teal-200 h-12 mt-1"></div>
                    )}
                  </div>
                  <div>
                    <p className={`text-base font-medium ${step.completed ? "text-black" : "text-gray-500"}`}>
                      {step.title}
                    </p>
                    {step.date && (
                      <p className="text-sm text-gray-600">{step.date}</p>
                    )}
                    {index === 2 && (
                      <p className="text-sm text-teal-600 cursor-pointer hover:underline">
                        See all updates
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Information */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Delivery by AdTip</h3>
              <p className="text-sm text-gray-600 mb-1">
                Tracking ID: {productOrder.shipping.trackingNumber}
              </p>
            </div>

            {/* Shipping Address */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-700 mb-1">Shipping Address</h3>
              <p className="text-sm text-gray-600">{productOrder.shipping.address}</p>
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={() => navigate("/marketplace/my-orders")}
          variant="outline"
          className="w-full mt-6"
        >
          Back to Orders
        </Button>
      </div>
    </div>
  );
};

export default OrderTracking;