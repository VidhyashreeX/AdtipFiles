
import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { Check, CreditCard, MapPin, Truck } from "lucide-react";

// Steps for checkout
const STEPS = {
  ADDRESS: 0,
  PAYMENT: 1,
  REVIEW: 2,
};

const Checkout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Get products from location state or use empty array
  const products = location.state?.products || [];
  
  const [activeStep, setActiveStep] = useState(STEPS.ADDRESS);
  
  const [formData, setFormData] = useState({
    // Address form
    fullName: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    zipCode: "",
    country: "India",
    phone: "",
    // Payment form
    cardHolder: "",
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    savePaymentInfo: false,
    paymentMethod: "creditCard", // creditCard, upi, cod
  });

  // Calculate order summary
  const subtotal = products.reduce(
    (sum: number, item: any) => sum + item.price * (item.quantity || 1),
    0
  );
  const shippingCost = 5.99;
  const tax = subtotal * 0.18; // 18% tax
  const total = subtotal + shippingCost + tax;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handlePaymentMethodChange = (value: string) => {
    setFormData({
      ...formData,
      paymentMethod: value,
    });
  };

  const handleNext = () => {
    if (activeStep < STEPS.REVIEW) {
      setActiveStep(activeStep + 1);
    } else {
      // Place order
      handlePlaceOrder();
    }
  };

  const handleBack = () => {
    if (activeStep > STEPS.ADDRESS) {
      setActiveStep(activeStep - 1);
    }
  };

  const handlePlaceOrder = () => {
    // In a real app, we would submit the order to an API
    toast({
      title: "Order Placed Successfully",
      description: "Thank you for your purchase!",
    });

    // Redirect to order confirmation page
    navigate("/order-confirmation", {
      state: {
        orderNumber: "ORD" + Math.floor(100000 + Math.random() * 900000),
        orderDate: new Date().toISOString(),
        products,
        total,
      },
    });
  };

  // Validate current step
  const isCurrentStepValid = () => {
    if (activeStep === STEPS.ADDRESS) {
      return (
        formData.fullName &&
        formData.addressLine1 &&
        formData.city &&
        formData.state &&
        formData.zipCode &&
        formData.phone
      );
    }
    if (activeStep === STEPS.PAYMENT) {
      if (formData.paymentMethod === "creditCard") {
        return (
          formData.cardHolder &&
          formData.cardNumber &&
          formData.expiryDate &&
          formData.cvv
        );
      }
      return true; // Other payment methods don't need validation in this example
    }
    return true;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl md:text-3xl font-bold mb-8">Checkout</h1>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3">
          {/* Checkout Steps */}
          <div className="flex justify-between mb-8">
            {Object.entries(STEPS).map(([key, value], index) => (
              <div
                key={key}
                className="flex items-center"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    activeStep >= value
                      ? "bg-adtip-teal text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {activeStep > value ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={`ml-2 hidden sm:block ${
                    activeStep >= value ? "text-adtip-teal font-medium" : "text-gray-500"
                  }`}
                >
                  {key.charAt(0) + key.slice(1).toLowerCase()}
                </span>
                {index < Object.keys(STEPS).length - 1 && (
                  <div className="w-12 sm:w-24 h-1 mx-2 bg-gray-200">
                    <div
                      className={`h-full ${
                        activeStep > value ? "bg-adtip-teal" : "bg-gray-200"
                      }`}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <Card>
            <CardContent className="p-6">
              {/* Address Step */}
              {activeStep === STEPS.ADDRESS && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="h-5 w-5 text-adtip-teal" />
                    <h2 className="text-xl font-semibold">Shipping Address</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name</Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="John Doe"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+91 9876543210"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine1">Address Line 1</Label>
                    <Input
                      id="addressLine1"
                      name="addressLine1"
                      value={formData.addressLine1}
                      onChange={handleChange}
                      placeholder="Street address, P.O. box, company name, c/o"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="addressLine2">
                      Address Line 2 (Optional)
                    </Label>
                    <Input
                      id="addressLine2"
                      name="addressLine2"
                      value={formData.addressLine2}
                      onChange={handleChange}
                      placeholder="Apartment, suite, unit, building, floor, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="City"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="State"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">Zip Code</Label>
                      <Input
                        id="zipCode"
                        name="zipCode"
                        value={formData.zipCode}
                        onChange={handleChange}
                        placeholder="Zip Code"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      name="country"
                      value={formData.country}
                      onChange={handleChange}
                      placeholder="Country"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Payment Step */}
              {activeStep === STEPS.PAYMENT && (
                <div className="space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <CreditCard className="h-5 w-5 text-adtip-teal" />
                    <h2 className="text-xl font-semibold">Payment Method</h2>
                  </div>

                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={handlePaymentMethodChange}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="creditCard" id="creditCard" />
                      <Label htmlFor="creditCard" className="flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Credit / Debit Card
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="upi" id="upi" />
                      <Label htmlFor="upi">UPI Payment</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="cod" id="cod" />
                      <Label htmlFor="cod">Cash on Delivery</Label>
                    </div>
                  </RadioGroup>

                  {formData.paymentMethod === "creditCard" && (
                    <div className="mt-4 space-y-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="cardHolder">Cardholder Name</Label>
                        <Input
                          id="cardHolder"
                          name="cardHolder"
                          value={formData.cardHolder}
                          onChange={handleChange}
                          placeholder="John Doe"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input
                          id="cardNumber"
                          name="cardNumber"
                          value={formData.cardNumber}
                          onChange={handleChange}
                          placeholder="1234 5678 9012 3456"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryDate">Expiry Date</Label>
                          <Input
                            id="expiryDate"
                            name="expiryDate"
                            value={formData.expiryDate}
                            onChange={handleChange}
                            placeholder="MM/YY"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input
                            id="cvv"
                            name="cvv"
                            value={formData.cvv}
                            onChange={handleChange}
                            placeholder="123"
                            required
                            type="password"
                            maxLength={4}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === "upi" && (
                    <div className="mt-4 p-4 border rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="upiId">UPI ID</Label>
                        <Input
                          id="upiId"
                          placeholder="example@upi"
                          required
                        />
                        <p className="text-xs text-gray-500">
                          You will receive a payment request on your UPI app
                        </p>
                      </div>
                    </div>
                  )}

                  {formData.paymentMethod === "cod" && (
                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                      <p>
                        You will pay ₹{total.toFixed(2)} when your order is delivered.
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        Note: Cash on delivery is available for orders under ₹10,000 only
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Review Step */}
              {activeStep === STEPS.REVIEW && (
                <div className="space-y-6">
                  <h2 className="text-xl font-semibold mb-4">Review Order</h2>

                  <div className="space-y-4">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium flex items-center">
                        <MapPin className="h-4 w-4 mr-2 text-adtip-teal" />
                        Shipping Address
                      </h3>
                      <div className="mt-2 text-sm">
                        <p>{formData.fullName}</p>
                        <p>{formData.addressLine1}</p>
                        {formData.addressLine2 && <p>{formData.addressLine2}</p>}
                        <p>
                          {formData.city}, {formData.state} {formData.zipCode}
                        </p>
                        <p>{formData.country}</p>
                        <p>{formData.phone}</p>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-adtip-teal" />
                        Payment Method
                      </h3>
                      <div className="mt-2">
                        {formData.paymentMethod === "creditCard" && (
                          <p>
                            Credit Card ending in{" "}
                            {formData.cardNumber.slice(-4)}
                          </p>
                        )}
                        {formData.paymentMethod === "upi" && <p>UPI Payment</p>}
                        {formData.paymentMethod === "cod" && (
                          <p>Cash on Delivery</p>
                        )}
                      </div>
                    </div>

                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium flex items-center">
                        <Truck className="h-4 w-4 mr-2 text-adtip-teal" />
                        Delivery
                      </h3>
                      <div className="mt-2">
                        <p>Standard Delivery (3-5 business days)</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                {activeStep > STEPS.ADDRESS ? (
                  <Button variant="outline" onClick={handleBack}>
                    Back
                  </Button>
                ) : (
                  <Link to="/tip-shop">
                    <Button variant="outline">Continue Shopping</Button>
                  </Link>
                )}
                <Button
                  onClick={handleNext}
                  disabled={!isCurrentStepValid()}
                  className="bg-adtip-teal hover:bg-adtip-teal-dark"
                >
                  {activeStep === STEPS.REVIEW ? "Place Order" : "Continue"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

              <div className="space-y-4 mb-6">
                {products.map((product: any) => (
                  <div key={product.id} className="flex gap-4">
                    <div className="w-20 h-20 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
                      <img
                        src={product.image || product.images?.[0]}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium line-clamp-2">{product.name}</h3>
                      <div className="flex justify-between mt-1">
                        <p className="text-sm text-gray-600">
                          Qty: {product.quantity || 1}
                        </p>
                        <p className="font-semibold">
                          ${product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span>${shippingCost.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (18%)</span>
                  <span>${tax.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
