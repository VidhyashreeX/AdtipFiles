
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Upload, X, Check, FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

const BulkUpload = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadComplete, setUploadComplete] = useState<boolean>(false);
  const [csvData, setCsvData] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      setFiles(prev => [...prev, ...newFiles]);
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpload = () => {
    if (files.length === 0) {
      toast({
        title: "No files selected",
        description: "Please select files to upload",
        variant: "destructive"
      });
      return;
    }
    
    setUploading(true);
    
    // Simulate upload progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 5;
      setUploadProgress(progress);
      
      if (progress >= 100) {
        clearInterval(interval);
        setUploading(false);
        setUploadComplete(true);
        toast({
          title: "Upload Complete",
          description: `${files.length} files uploaded successfully`,
        });
      }
    }, 200);
  };
  
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    
    if (e.dataTransfer.files) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setFiles(prev => [...prev, ...droppedFiles]);
    }
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (file) {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setCsvData(content);
      };
      
      reader.readAsText(file);
    }
  };
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center mb-6">
        <Button 
          variant="ghost" 
          className="pl-0" 
          onClick={() => navigate("/marketplace/seller-products")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold ml-2">Bulk Upload Products</h1>
      </div>
      
      <Tabs defaultValue="images" className="w-full">
        <TabsList className="grid grid-cols-2 w-full mb-6">
          <TabsTrigger value="images">Image Upload</TabsTrigger>
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
        </TabsList>
        
        <TabsContent value="images">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div 
                className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center ${
                  files.length > 0 ? 'border-gray-300' : 'border-gray-400'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Drop product images here
                </h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Drag and drop your product images, or click to browse. <br />
                  PNG, JPG, and WEBP formats are supported.
                </p>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  id="file-upload"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Browse Files
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {files.length > 0 && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">
                  Selected Files ({files.length})
                </h3>
                <div className="space-y-3">
                  {files.map((file, index) => (
                    <div 
                      key={index} 
                      className="flex items-center justify-between p-3 border rounded-md"
                    >
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-gray-100 rounded overflow-hidden mr-4">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFile(index)}
                        disabled={uploading}
                      >
                        <X className="h-4 w-4 text-gray-500" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {uploading && (
                  <div className="mt-6">
                    <div className="flex justify-between mb-2 text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}
                
                {uploadComplete && (
                  <div className="flex items-center mt-6 p-3 bg-green-50 text-green-700 rounded-md">
                    <Check className="h-5 w-5 mr-2" />
                    <span>All files uploaded successfully!</span>
                  </div>
                )}
                
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={handleUpload}
                    disabled={files.length === 0 || uploading}
                    className="bg-teal-500 hover:bg-teal-600"
                  >
                    {uploading ? "Uploading..." : "Upload All Files"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="csv">
          <Card className="mb-6">
            <CardContent className="p-6">
              <div 
                className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center"
              >
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  Upload Product Data CSV
                </h3>
                <p className="text-sm text-gray-500 text-center mb-4">
                  Upload a CSV file with your product details. <br />
                  <a 
                    href="#" 
                    className="text-teal-500 hover:underline"
                    onClick={(e) => {
                      e.preventDefault();
                      toast({
                        description: "Template downloaded successfully"
                      });
                    }}
                  >
                    Download template
                  </a>
                </p>
                <Input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  id="csv-upload"
                  ref={csvInputRef}
                  onChange={handleCsvUpload}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => csvInputRef.current?.click()}
                >
                  Select CSV File
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {csvData && (
            <Card className="mb-6">
              <CardContent className="p-6">
                <h3 className="text-lg font-medium mb-4">
                  CSV Data Preview
                </h3>
                <div className="bg-gray-50 p-4 rounded overflow-auto max-h-72">
                  <pre className="text-xs">{csvData}</pre>
                </div>
                
                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => {
                      toast({
                        title: "CSV Processed",
                        description: "Your product data has been imported successfully",
                      });
                      setCsvData("");
                    }}
                    className="bg-teal-500 hover:bg-teal-600"
                  >
                    Import Products
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BulkUpload;
