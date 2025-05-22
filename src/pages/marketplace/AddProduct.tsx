import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Upload, X, PlusCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";

const productFormSchema = z.object({
  name: z.string().min(1, { message: "Product name is required" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  brandName: z.string().optional(),
  category: z.string().min(1, { message: "Category is required" }),
  deliveryTime: z.string().min(1, { message: "Delivery time is required" }),
  unitsAvailable: z.coerce.number().min(1, { message: "Stock quantity is required" }),
  sizeOptions: z.string().optional(),
  regularPrice: z.string().min(1, { message: "Regular price is required" }),
  marketPrice: z.string().optional(),
  selectedDelivery: z.enum(["selfDelivery", "adtipDelivery"]),
  isFeatured: z.boolean().default(false),
  isDiscountable: z.boolean().default(false),
  bargainAmount: z.string().optional(),
  keywords: z.string().optional(),
  careInstructions: z.string().optional(),
  pattern: z.string().optional(),
  threadCount: z.string().optional(),
  material: z.string().optional(),
  fabricType: z.string().optional(),
  itemDimensions: z.object({
    length: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
    unit: z.string().default("inches")
  }).optional(),
  returnPolicy: z.string().default("none"),
  countryOfOrigin: z.string().default("India"),
  modelNumber: z.string().optional(),
  manufacturerName: z.string().optional(),
  warrantyInfo: z.string().optional(),
  hasBatteries: z.boolean().default(false),
  complianceCertificate: z.string().optional(),
  warrantyPeriod: z.string().optional(),
  ageRestriction: z.boolean().default(false),
  hazardousWarning: z.string().optional(),
});

const AddProduct: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [productImages, setProductImages] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const form = useForm<z.infer<typeof productFormSchema>>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: "",
      description: "",
      brandName: "",
      category: "",
      deliveryTime: "",
      unitsAvailable: 1,
      sizeOptions: "",
      regularPrice: "",
      marketPrice: "",
      selectedDelivery: "selfDelivery",
      isFeatured: false,
      isDiscountable: false,
      bargainAmount: "",
      keywords: "",
      careInstructions: "",
      pattern: "",
      threadCount: "",
      material: "",
      fabricType: "",
      returnPolicy: "none",
      countryOfOrigin: "India",
      hasBatteries: false,
      itemDimensions: {
        length: "",
        width: "",
        height: "",
        unit: "inches"
      },
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = () => {
        setProductImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setProductImages(prev => prev.filter((_, i) => i !== index));
  };

  const nextStep = () => {
    if (currentStep === 1) {
      // Check basic information fields
      const basicInfoFields = ["name", "description", "category"];
      const result = basicInfoFields.map(field => form.trigger(field as any));
      
      Promise.all(result).then(results => {
        if (results.every(isValid => isValid)) {
          setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
      });
    } else if (currentStep === 2) {
      // Check pricing & inventory fields
      const pricingFields = ["regularPrice", "unitsAvailable", "deliveryTime"];
      const result = pricingFields.map(field => form.trigger(field as any));
      
      Promise.all(result).then(results => {
        if (results.every(isValid => isValid)) {
          setCurrentStep(prev => Math.min(prev + 1, totalSteps));
        }
      });
    } else {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const onSubmit = (values: z.infer<typeof productFormSchema>) => {
    if (productImages.length === 0) {
      toast({
        title: "Image Required",
        description: "Please upload at least one product image",
        variant: "destructive",
      });
      return;
    }

    console.log("Form values:", values);
    console.log("Product images:", productImages);

    toast({
      title: "Product Added",
      description: "Your product has been added successfully.",
    });
    navigate("/marketplace/seller-products");
  };

  return (
    <div className="min-h-screen bg-white">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <div className="container max-w-2xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <button 
                  type="button"
                  className="mr-3 p-1" 
                  onClick={() => navigate(-1)}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <h1 className="text-xl font-semibold">Add Product</h1>
              </div>
              <div className="text-sm text-gray-500">Step {currentStep} of {totalSteps}</div>
            </div>
            
            {/* Step progress */}
            <div className="w-full bg-gray-200 h-1 mb-8 rounded-full overflow-hidden">
              <div 
                className="bg-teal-500 h-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              ></div>
            </div>

            {/* Step 1: Basic Information */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Basic Information</h2>
                
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Name*</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter product name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description*</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your product here" 
                          className="resize-none"
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="brandName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter brand name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category*</FormLabel>
                      <Select 
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="women_fashion">Women Fashion</SelectItem>
                          <SelectItem value="men_fashion">Men Fashion</SelectItem>
                          <SelectItem value="electronics">Electronics</SelectItem>
                          <SelectItem value="home">Home & Kitchen</SelectItem>
                          <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="countryOfOrigin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country/Region of Origin</FormLabel>
                      <Select 
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select country" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="India">India</SelectItem>
                          <SelectItem value="China">China</SelectItem>
                          <SelectItem value="Japan">Japan</SelectItem>
                          <SelectItem value="United States">United States</SelectItem>
                          <SelectItem value="Others">Others</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords/Search Terms</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter keywords separated by commas" 
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        Help customers find your product with relevant keywords
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 2: Pricing & Inventory */}
            {currentStep === 2 && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Pricing & Inventory</h2>
                
                <FormField
                  control={form.control}
                  name="regularPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regular Price*</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
                          <Input 
                            {...field}
                            placeholder="0.00" 
                            type="text"
                            inputMode="decimal"
                            className="pl-6"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="marketPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Market Price (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
                          <Input 
                            {...field}
                            placeholder="0.00" 
                            type="text"
                            inputMode="decimal"
                            className="pl-6"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bargainAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bargain Amount (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2">₹</span>
                          <Input 
                            {...field}
                            placeholder="0.00" 
                            type="text"
                            inputMode="decimal"
                            className="pl-6"
                          />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Maximum amount customers can bargain from the regular price
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="unitsAvailable"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Units*</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="Enter stock units count"
                          type="number"
                          min="1"
                          onChange={e => {
                            const value = e.target.value === '' ? '1' : e.target.value;
                            field.onChange(parseInt(value));
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliveryTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Time*</FormLabel>
                      <Select 
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select delivery time" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-3">1-3 days</SelectItem>
                          <SelectItem value="4-7">4-7 days</SelectItem>
                          <SelectItem value="7-14">7-14 days</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="returnPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Return Policy</FormLabel>
                      <Select 
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select return policy" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No Return Policy</SelectItem>
                          <SelectItem value="7days">7-Day Return</SelectItem>
                          <SelectItem value="14days">14-Day Return</SelectItem>
                          <SelectItem value="30days">30-Day Return</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sizeOptions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size Options (Optional)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          placeholder="Enter sizes (S,M,L,XL)"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="isFeatured"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel className="text-base">Featured Product</FormLabel>
                          <p className="text-sm text-gray-500">Show in featured section</p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isDiscountable"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-lg border p-4">
                        <div>
                          <FormLabel className="text-base">Allow Discount</FormLabel>
                          <p className="text-sm text-gray-500">Enable special offers</p>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Product Details */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Product Details</h2>
                
                <FormField
                  control={form.control}
                  name="modelNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., RX23R45" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="manufacturerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Samsung Electronics" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="material"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Material</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Cotton, Metal, Plastic" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fabricType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fabric Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 60% Cotton, 40% Polyester" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pattern"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pattern</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Solid, Striped, Floral" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="careInstructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Care Instructions</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Machine Wash, Hand Wash Only" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <h3 className="text-sm font-medium mb-2">Item Dimensions (L x W x H)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="itemDimensions.length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Length</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="itemDimensions.width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Width</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 5" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <FormField
                      control={form.control}
                      name="itemDimensions.height"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Height</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 2" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="itemDimensions.unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="inches">Inches</SelectItem>
                              <SelectItem value="cm">Centimeters</SelectItem>
                              <SelectItem value="mm">Millimeters</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="hasBatteries"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Does this product require batteries?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="complianceCertificate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Compliance Certificate</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., BIS, ISO, CE" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter any compliance certifications this product has obtained
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hazardousWarning"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cautionary Statement/Warnings</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Choking Hazard - Small Parts" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter any warnings that should be displayed with this product
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 4: Images & Delivery */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <h2 className="text-lg font-medium">Images & Delivery</h2>
                
                <div className="space-y-3">
                  <FormLabel>Product Images*</FormLabel>
                  <div className="grid grid-cols-3 gap-3">
                    {productImages.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                        <img 
                          src={image} 
                          alt={`Product ${index + 1}`} 
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    
                    <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-md cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleImageUpload}
                        accept="image/*"
                        multiple
                      />
                      <PlusCircle className="h-6 w-6 text-gray-400 mb-1" />
                      <span className="text-xs text-gray-500">Add Image</span>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">Upload up to 8 product images</p>
                </div>

                <FormField
                  control={form.control}
                  name="selectedDelivery"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Delivery Type*</FormLabel>
                      <div className="space-y-3">
                        <div 
                          className={`border rounded-md p-3 flex items-center gap-3 cursor-pointer ${
                            field.value === 'selfDelivery' ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                          }`}
                          onClick={() => field.onChange('selfDelivery')}
                        >
                          <div className="flex items-center h-5">
                            <input
                              type="radio"
                              checked={field.value === 'selfDelivery'}
                              onChange={() => field.onChange('selfDelivery')}
                              className="cursor-pointer"
                            />
                          </div>
                          <div>
                            <span className="text-sm font-medium block">Self</span>
                            <span className="text-xs text-gray-500">Deliver yourself</span>
                          </div>
                        </div>
                        
                        <div 
                          className={`border rounded-md p-3 flex items-center gap-3 cursor-pointer ${
                            field.value === 'adtipDelivery' ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                          }`}
                          onClick={() => field.onChange('adtipDelivery')}
                        >
                          <div className="flex items-center h-5">
                            <input
                              type="radio"
                              checked={field.value === 'adtipDelivery'}
                              onChange={() => field.onChange('adtipDelivery')}
                              className="cursor-pointer"
                            />
                          </div>
                          <div>
                            <span className="text-sm font-medium block">AdTip Delivery</span>
                            <span className="text-xs text-gray-500">AdTip delivers for you</span>
                          </div>
                        </div>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Card className="p-4 bg-gray-50">
                  <h3 className="font-medium mb-2">Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Product Name:</span>
                      <span>{form.watch("name") || "-"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Regular Price:</span>
                      <span>₹{form.watch("regularPrice") || "0"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Stock Units:</span>
                      <span>{form.watch("unitsAvailable") || "0"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Return Policy:</span>
                      <span>{form.watch("returnPolicy") === "none" 
                        ? "No Returns" 
                        : form.watch("returnPolicy") === "7days" 
                          ? "7-Day Return" 
                          : form.watch("returnPolicy") === "14days" 
                            ? "14-Day Return" 
                            : "30-Day Return"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Delivery:</span>
                      <span>{form.watch("selectedDelivery") === "selfDelivery" ? "Self Delivery" : "AdTip Delivery"}</span>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-8">
              {currentStep > 1 && (
                <Button 
                  type="button" 
                  variant="outline"
                  className="flex-1"
                  onClick={prevStep}
                >
                  Back
                </Button>
              )}
              
              {currentStep < totalSteps ? (
                <Button 
                  type="button"
                  className="flex-1 bg-black hover:bg-gray-800"
                  onClick={nextStep}
                >
                  Continue
                </Button>
              ) : (
                <Button 
                  type="submit"
                  className="flex-1 bg-black hover:bg-gray-800"
                >
                  Add Product
                </Button>
              )}
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default AddProduct;
