
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    brandName: "",
    category: "",
    deliveryTime: "",
    unitsAvailable: "",
    sizeOptions: "",
    regularPrice: "",
    marketPrice: "",
    selectedDelivery: "selfDelivery", // Default to self delivery
  });
  const [productImage, setProductImage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProductForm({
      ...productForm,
      [name]: value,
    });
  };

  const handleSelectChange = (value: string, name: string) => {
    setProductForm({
      ...productForm,
      [name]: value,
    });
  };

  const handleDeliveryOptionChange = (option: string) => {
    setProductForm({
      ...productForm,
      selectedDelivery: option,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setProductImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Product Added",
      description: "Your product has been added successfully.",
    });
    navigate("/tip-shop");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="container max-w-md mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button 
            className="mr-3 p-1" 
            onClick={() => navigate(-1)}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-xl font-semibold">Add Product</h1>
        </div>

        {/* Product Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <div className="relative">
              <Input 
                name="name"
                value={productForm.name}
                onChange={handleInputChange}
                placeholder="Enter product name"
                className="pr-10"
                required
              />
              {productForm.name && (
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => handleInputChange({target: {name: 'name', value: ''}} as React.ChangeEvent<HTMLInputElement>)}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <div className="relative">
              <Textarea 
                name="description"
                value={productForm.description}
                onChange={handleInputChange}
                placeholder="Describe your product here"
                className="resize-none"
                rows={3}
                required
              />
              {productForm.description && (
                <button 
                  type="button"
                  className="absolute right-3 top-3"
                  onClick={() => handleInputChange({target: {name: 'description', value: ''}} as React.ChangeEvent<HTMLTextAreaElement>)}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Brand Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Brand Name</label>
            <div className="relative">
              <Input 
                name="brandName"
                value={productForm.brandName}
                onChange={handleInputChange}
                placeholder="Enter brand name"
                className="pr-10"
              />
              {productForm.brandName && (
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => handleInputChange({target: {name: 'brandName', value: ''}} as React.ChangeEvent<HTMLInputElement>)}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <Select 
              value={productForm.category}
              onValueChange={(value) => handleSelectChange(value, 'category')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
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

          {/* Delivery Time */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Delivery time (days)</label>
            <Select 
              value={productForm.deliveryTime}
              onValueChange={(value) => handleSelectChange(value, 'deliveryTime')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-3">1-3</SelectItem>
                <SelectItem value="4-7">4-7</SelectItem>
                <SelectItem value="7-14">7-14</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Units Available */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Units Available</label>
            <div className="relative">
              <Input 
                name="unitsAvailable"
                value={productForm.unitsAvailable}
                onChange={handleInputChange}
                placeholder="Enter stock units count"
                type="number"
                className="pr-10"
              />
              {productForm.unitsAvailable && (
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => handleInputChange({target: {name: 'unitsAvailable', value: ''}} as React.ChangeEvent<HTMLInputElement>)}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Size Options */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Size Options</label>
            <div className="relative">
              <Input 
                name="sizeOptions"
                value={productForm.sizeOptions}
                onChange={handleInputChange}
                placeholder="Enter sizes (S,M,L,XL)"
                className="pr-10"
              />
              {productForm.sizeOptions && (
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => handleInputChange({target: {name: 'sizeOptions', value: ''}} as React.ChangeEvent<HTMLInputElement>)}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Regular Price */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Regular Price</label>
            <div className="relative">
              <Input 
                name="regularPrice"
                value={productForm.regularPrice}
                onChange={handleInputChange}
                placeholder="0.00"
                type="text"
                inputMode="decimal"
                className="pl-6 pr-10"
                required
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
              {productForm.regularPrice && (
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => handleInputChange({target: {name: 'regularPrice', value: ''}} as React.ChangeEvent<HTMLInputElement>)}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Market Price */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Market Price</label>
            <div className="relative">
              <Input 
                name="marketPrice"
                value={productForm.marketPrice}
                onChange={handleInputChange}
                placeholder="0.00"
                type="text"
                inputMode="decimal"
                className="pl-6 pr-10"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
              {productForm.marketPrice && (
                <button 
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  onClick={() => handleInputChange({target: {name: 'marketPrice', value: ''}} as React.ChangeEvent<HTMLInputElement>)}
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}
            </div>
          </div>

          {/* Select Delivery Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Select Delivery type</label>
            <div className="flex flex-col gap-3">
              {/* Self Delivery Option */}
              <div 
                className={`border rounded-md p-3 flex items-center gap-3 cursor-pointer ${
                  productForm.selectedDelivery === 'selfDelivery' ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                }`}
                onClick={() => handleDeliveryOptionChange('selfDelivery')}
              >
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={productForm.selectedDelivery === 'selfDelivery'}
                    onChange={() => handleDeliveryOptionChange('selfDelivery')}
                    className="cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium block">Self</span>
                  <span className="text-xs text-gray-500">Deliver yourself</span>
                </div>
              </div>
              
              {/* AdTip Delivery Option */}
              <div 
                className={`border rounded-md p-3 flex items-center gap-3 cursor-pointer ${
                  productForm.selectedDelivery === 'adtipDelivery' ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                }`}
                onClick={() => handleDeliveryOptionChange('adtipDelivery')}
              >
                <div className="flex items-center h-5">
                  <input
                    type="radio"
                    checked={productForm.selectedDelivery === 'adtipDelivery'}
                    onChange={() => handleDeliveryOptionChange('adtipDelivery')}
                    className="cursor-pointer"
                  />
                </div>
                <div>
                  <span className="text-sm font-medium block">AdTip Delivery</span>
                  <span className="text-xs text-gray-500">AdTip delivers for you</span>
                </div>
              </div>
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Product Image</label>
              <span className="text-xs text-gray-500">Upload product images</span>
            </div>

            {productImage ? (
              <div className="relative">
                <img 
                  src={productImage} 
                  alt="Product" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setProductImage(null)}
                  className="absolute top-2 right-2 bg-black bg-opacity-50 rounded-full p-1"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-full max-w-sm">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="h-6 w-6 text-gray-400 mb-2" />
                      <p className="mb-2 text-sm text-gray-500">Click to upload</p>
                      <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      onChange={handleImageUpload}
                      accept="image/*"
                    />
                  </label>
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-4">
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
              <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                <Upload className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 space-y-3">
            <Button 
              type="submit"
              className="w-full bg-black hover:bg-gray-800"
            >
              Add Product
            </Button>
            
            <Button 
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate(-1)}
            >
              No Thanks
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProduct;
