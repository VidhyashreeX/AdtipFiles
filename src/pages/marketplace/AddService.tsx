
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Upload, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const AddService: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [serviceForm, setServiceForm] = useState({
    name: "",
    description: "",
    brandName: "",
    category: "",
    deliveryTime: "",
    regularPrice: "",
    marketPrice: "",
  });
  const [serviceImage, setServiceImage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setServiceForm({
      ...serviceForm,
      [name]: value,
    });
  };

  const handleSelectChange = (value: string, name: string) => {
    setServiceForm({
      ...serviceForm,
      [name]: value,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setServiceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Service Added",
      description: "Your service has been added successfully.",
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
          <h1 className="text-xl font-semibold">Add Service</h1>
        </div>

        {/* Service Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <div className="relative">
              <Input 
                name="name"
                value={serviceForm.name}
                onChange={handleInputChange}
                placeholder="Enter Service name"
                className="pr-10"
                required
              />
              {serviceForm.name && (
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
                value={serviceForm.description}
                onChange={handleInputChange}
                placeholder="Describe your product here"
                className="resize-none"
                rows={3}
                required
              />
              {serviceForm.description && (
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
                value={serviceForm.brandName}
                onChange={handleInputChange}
                placeholder="Enter brand name"
                className="pr-10"
              />
              {serviceForm.brandName && (
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
              value={serviceForm.category}
              onValueChange={(value) => handleSelectChange(value, 'category')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="photography">Photography</SelectItem>
                <SelectItem value="design">Design</SelectItem>
                <SelectItem value="writing">Writing</SelectItem>
                <SelectItem value="teaching">Teaching</SelectItem>
                <SelectItem value="consulting">Consulting</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Service Delivery Time */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Service Delivery time</label>
            <Select 
              value={serviceForm.deliveryTime}
              onValueChange={(value) => handleSelectChange(value, 'deliveryTime')}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select delivery time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-3">1-3 days</SelectItem>
                <SelectItem value="2-6">2-6 days</SelectItem>
                <SelectItem value="7-10">7-10 days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Regular Price */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Regular Price</label>
            <div className="relative">
              <Input 
                name="regularPrice"
                value={serviceForm.regularPrice}
                onChange={handleInputChange}
                placeholder="0.00"
                type="text"
                inputMode="decimal"
                className="pl-6 pr-10"
                required
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
              {serviceForm.regularPrice && (
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
                value={serviceForm.marketPrice}
                onChange={handleInputChange}
                placeholder="0.00"
                type="text"
                inputMode="decimal"
                className="pl-6 pr-10"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
              {serviceForm.marketPrice && (
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

          {/* Image Upload */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Photoshoot</label>
              <span className="text-xs text-gray-500">Upload service preview or logo</span>
            </div>

            {serviceImage ? (
              <div className="relative">
                <img 
                  src={serviceImage} 
                  alt="Service preview" 
                  className="w-full h-48 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setServiceImage(null)}
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
              Add Service
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

export default AddService;
