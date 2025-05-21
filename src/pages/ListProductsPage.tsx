
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Search, Barcode, Globe, FileText, Table, Upload, Info, ChevronRight, ShoppingCart, FileUp, Check, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

const ListProductsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState("keywords");
  const [searchQuery, setSearchQuery] = useState("");
  const [showProductList, setShowProductList] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<null | any>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [productForm, setProductForm] = useState({
    condition: "",
    quantity: "",
    price: "",
    description: "",
    sku: "",
    barcode: "",
    fulfillmentChannel: "merchant"
  });
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // Mock product data
  const mockProducts = [
    {
      id: "1",
      name: "Athletic Greens Ultimate Daily",
      category: "Health & Personal Care",
      image: "https://images.unsplash.com/photo-1616279969096-54b228f2b9d4",
      price: 79.99,
    },
    {
      id: "2",
      name: "Organic Green Juice Superfood Powder",
      category: "Health & Personal Care",
      image: "https://images.unsplash.com/photo-1583683843966-794d80340411",
      price: 49.99,
    },
    {
      id: "3",
      name: "Garden of Life Raw Organic Perfect Food",
      category: "Health & Personal Care",
      image: "https://images.unsplash.com/photo-1543362906-acfc16c67564",
      price: 35.99,
    },
  ];

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowProductList(true);
    }
  };

  const handleSelectProduct = (product: any) => {
    setSelectedProduct(product);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setProductForm({
      ...productForm,
      [e.target.name]: e.target.value
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setProductForm({
      ...productForm,
      [name]: value
    });
  };
  
  const handleFulfillmentChange = (value: string) => {
    setProductForm({
      ...productForm,
      fulfillmentChannel: value
    });
  };

  const handleSubmitProduct = () => {
    toast({
      title: "Product Added",
      description: "Your product has been added to the listings",
    });

    navigate("/list-products/finish");
  };

  const handleAddProduct = () => {
    navigate("/marketplace/add-product");
  };

  const handleAddService = () => {
    navigate("/marketplace/add-service");
  };

  // Handle file selection for bulk upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles(Array.from(files));
    }
  };

  // Handle bulk upload simulation
  const handleBulkUpload = () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsUploading(false);
          toast({
            title: "Upload Complete",
            description: `Successfully uploaded ${selectedFiles.length} products`,
          });
          return 100;
        }
        return prev + 5;
      });
    }, 200);
  };

  // Remove a selected file from the list
  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const renderKeywordsTab = () => {
    if (selectedProduct) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-1/3">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full rounded-md"
                />
              </div>
              <div className="w-full md:w-2/3 space-y-4">
                <h2 className="text-xl font-semibold">{selectedProduct.name}</h2>
                <p className="text-gray-600">Category: {selectedProduct.category}</p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Condition *</label>
                    <Select 
                      onValueChange={(value) => handleSelectChange("condition", value)}
                      value={productForm.condition}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="used">Used</SelectItem>
                        <SelectItem value="refurbished">Refurbished</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity *</label>
                    <Input 
                      name="quantity" 
                      value={productForm.quantity}
                      onChange={handleInputChange}
                      placeholder="Enter quantity" 
                      type="number"
                      min="1"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Your Price ($) *</label>
                    <Input 
                      name="price" 
                      value={productForm.price}
                      onChange={handleInputChange}
                      placeholder="Enter price" 
                      type="number"
                      step="0.01"
                      min="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Description</label>
                    <Textarea 
                      name="description"
                      value={productForm.description}
                      onChange={handleInputChange}
                      placeholder="Enter product description" 
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU (Optional)</label>
                    <Input 
                      name="sku"
                      value={productForm.sku}
                      onChange={handleInputChange}
                      placeholder="Enter SKU" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Barcode (Optional)</label>
                    <Input 
                      name="barcode"
                      value={productForm.barcode}
                      onChange={handleInputChange}
                      placeholder="Enter barcode" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Fulfillment Channel *</label>
                  <div className="space-y-3">
                    <div className="flex items-start p-3 border rounded-md">
                      <input
                        type="radio"
                        id="merchant-fulfilled"
                        name="fulfillmentChannel"
                        value="merchant"
                        checked={productForm.fulfillmentChannel === "merchant"}
                        onChange={() => handleFulfillmentChange("merchant")}
                        className="mt-1"
                      />
                      <label htmlFor="merchant-fulfilled" className="ml-3 cursor-pointer">
                        <div className="font-medium">I will ship this item myself</div>
                        <div className="text-sm text-gray-500">(Merchant Fulfilled)</div>
                      </label>
                    </div>
                    
                    <div className="flex items-start p-3 border rounded-md">
                      <input
                        type="radio"
                        id="platform-fulfilled"
                        name="fulfillmentChannel"
                        value="platform"
                        checked={productForm.fulfillmentChannel === "platform"}
                        onChange={() => handleFulfillmentChange("platform")}
                        className="mt-1"
                      />
                      <label htmlFor="platform-fulfilled" className="ml-3 cursor-pointer">
                        <div className="font-medium">AdTip will ship and provide customer service</div>
                        <div className="text-sm text-gray-500">(Fulfilled by AdTip)</div>
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button 
                    onClick={handleSubmitProduct}
                    className="w-full bg-teal-500 hover:bg-teal-600"
                    disabled={!productForm.condition || !productForm.quantity || !productForm.price}
                  >
                    Save and Continue
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (showProductList) {
      return (
        <div>
          <h2 className="text-lg font-semibold mb-4">Select a product from the catalog</h2>
          <div className="space-y-4">
            {mockProducts.map(product => (
              <div 
                key={product.id}
                className="border rounded-md p-4 flex items-center gap-4 cursor-pointer hover:bg-gray-50"
                onClick={() => handleSelectProduct(product)}
              >
                <div className="w-16 h-16 bg-gray-100 rounded-md overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{product.name}</h3>
                  <p className="text-sm text-gray-500">{product.category}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${product.price}</p>
                  <Button size="sm" variant="ghost" className="mt-1">
                    Select <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="mb-8">
          <label className="block text-gray-700 mb-2 font-medium">Find your product in our catalog using a few words.</label>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              type="text"
              placeholder="Enter product title, description and keywords"
              className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Button type="submit" className="bg-gray-500 hover:bg-gray-600 text-white px-6">Submit</Button>
          </form>
        </div>
      </>
    );
  };

  const renderBlankFormTab = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleAddService}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-teal-50 rounded-full">
                <FileText className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-medium">Add Service</h3>
              <p className="text-gray-500 text-sm">Create a listing for a service you provide</p>
              <Button className="w-full bg-teal-500 hover:bg-teal-600">Add Service</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleAddProduct}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-teal-50 rounded-full">
                <ShoppingCart className="h-8 w-8 text-teal-600" />
              </div>
              <h3 className="text-xl font-medium">Add Product</h3>
              <p className="text-gray-500 text-sm">Create a listing for a physical product</p>
              <Button className="w-full bg-teal-500 hover:bg-teal-600">Add Product</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderBulkUploadTab = () => {
    return (
      <div className="space-y-6">
        <div className="p-6 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-medium mb-2">Download Bulk Template</h3>
          <p className="text-gray-600 mb-4">Download our template spreadsheet, fill it with your product information, and upload it back.</p>
          <Button variant="outline" className="flex items-center">
            <Upload className="h-4 w-4 mr-2" />
            Download Template
          </Button>
        </div>
        
        <div className="p-6 border rounded-lg">
          <h3 className="text-lg font-medium mb-2">Upload Completed Template or Images</h3>
          <p className="text-gray-600 mb-4">You can upload multiple product images or a spreadsheet with product details.</p>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-4">
            <input
              type="file"
              id="file-upload"
              multiple
              accept="image/*,.xlsx,.csv,.xls"
              className="hidden"
              onChange={handleFileChange}
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <FileUp className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <p className="mb-2">Drag and drop your files here</p>
              <p className="text-sm text-gray-500 mb-4">or</p>
              <Button type="button">Browse Files</Button>
            </label>
          </div>

          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Selected Files ({selectedFiles.length})</h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                    <div className="flex items-center">
                      {file.type.startsWith('image/') ? (
                        <div className="h-8 w-8 bg-blue-100 rounded flex items-center justify-center mr-2">
                          <img
                            src={URL.createObjectURL(file)}
                            alt="Preview"
                            className="h-8 w-8 object-cover rounded"
                          />
                        </div>
                      ) : (
                        <div className="h-8 w-8 bg-green-100 rounded flex items-center justify-center mr-2">
                          <Table className="h-4 w-4 text-green-600" />
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-medium truncate" style={{ maxWidth: '200px' }}>{file.name}</p>
                        <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-gray-500 hover:text-red-500"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {isUploading ? (
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              ) : (
                <Button 
                  className="mt-4 bg-teal-500 hover:bg-teal-600" 
                  onClick={handleBulkUpload}
                  disabled={selectedFiles.length === 0}
                >
                  Upload {selectedFiles.length} {selectedFiles.length === 1 ? 'File' : 'Files'}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7fafc] flex flex-col items-center justify-start py-12 px-2">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900">List Your Products</h1>
        <p className="mb-6 text-gray-600">Select an option to start listing your product</p>
        <div className="flex flex-nowrap overflow-x-auto gap-2 mb-6">
          <button
            className={`px-4 py-2 border rounded-md font-medium whitespace-nowrap ${activeTab === "keywords" ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"}`}
            onClick={() => setActiveTab("keywords")}
          >
            <div className="flex items-center">
              <Search className="h-4 w-4 mr-2" />
              Keywords
            </div>
          </button>
          <button
            className={`px-4 py-2 border rounded-md font-medium whitespace-nowrap ${activeTab === "productIds" ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"}`}
            onClick={() => setActiveTab("productIds")}
          >
            <div className="flex items-center">
              <Barcode className="h-4 w-4 mr-2" />
              Product IDs
            </div>
          </button>
          <button
            className={`px-4 py-2 border rounded-md font-medium whitespace-nowrap ${activeTab === "webUrl" ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"}`}
            onClick={() => setActiveTab("webUrl")}
          >
            <div className="flex items-center">
              <Globe className="h-4 w-4 mr-2" />
              Web URL
            </div>
          </button>
          <button
            className={`px-4 py-2 border rounded-md font-medium whitespace-nowrap ${activeTab === "blankForm" ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"}`}
            onClick={() => setActiveTab("blankForm")}
          >
            <div className="flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Blank form
            </div>
          </button>
          <button
            className={`px-4 py-2 border rounded-md font-medium whitespace-nowrap ${activeTab === "bulkTemplate" ? "border-teal-500 bg-teal-50" : "border-gray-200 bg-white"}`}
            onClick={() => setActiveTab("bulkTemplate")}
          >
            <div className="flex items-center">
              <Table className="h-4 w-4 mr-2" />
              Bulk upload
            </div>
          </button>
        </div>
        
        {activeTab === "keywords" && renderKeywordsTab()}
        
        {activeTab === "productIds" && (
          <div className="mb-8">
            <label className="block text-gray-700 mb-2 font-medium">Enter product IDs to find them in our catalog.</label>
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter product IDs (separate multiple IDs by commas)"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <Button className="bg-gray-500 hover:bg-gray-600 text-white px-6">Submit</Button>
            </div>
          </div>
        )}
        
        {activeTab === "webUrl" && (
          <div className="mb-8">
            <label className="block text-gray-700 mb-2 font-medium">Enter a product URL to find it in our catalog.</label>
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="https://example.com/product"
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal-400"
              />
              <Button className="bg-gray-500 hover:bg-gray-600 text-white px-6">Submit</Button>
            </div>
          </div>
        )}
        
        {activeTab === "blankForm" && renderBlankFormTab()}
        
        {activeTab === "bulkTemplate" && renderBulkUploadTab()}
        
        {!selectedProduct && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded flex items-center gap-3 mt-6">
            <Info className="h-5 w-5 text-blue-600" />
            <div>
              <div className="font-medium text-blue-800">Complete your listings</div>
              <div className="text-blue-700 text-sm">You have unfinished listings in Drafts. <a href="#" className="underline">View my drafts</a></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListProductsPage;
