
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface ProductFormFieldsProps {
  onSave?: () => void;
  onSaveDraft?: () => void;
  onCancel?: () => void;
}

const ProductFormFields: React.FC<ProductFormFieldsProps> = ({ 
  onSave, 
  onSaveDraft, 
  onCancel 
}) => {
  return (
    <div className="space-y-6">
      <Accordion type="single" collapsible className="w-full" defaultValue="product-identity">
        {/* Product Identity Section */}
        <AccordionItem value="product-identity" className="border rounded-lg p-2">
          <AccordionTrigger className="py-3 px-4 hover:no-underline">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center">
                1
              </div>
              <h3 className="text-lg font-medium">Product Identity</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beverages">Beverages</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="clothing">Clothing</SelectItem>
                    <SelectItem value="toys">Toys</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="listing-language">Listing Language</Label>
                <Select defaultValue="english">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="hindi">Hindi</SelectItem>
                    <SelectItem value="spanish">Spanish</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="bullet-points">Bullet Points (Features)</Label>
                <div className="space-y-2">
                  <Input placeholder="Feature 1" />
                  <Input placeholder="Feature 2" />
                  <Input placeholder="Feature 3" />
                  <Input placeholder="Feature 4" />
                </div>
                <div className="mt-2 flex space-x-2">
                  <Button variant="outline" size="sm">Add More</Button>
                  <Button variant="outline" size="sm">Remove Last</Button>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Product Description Section */}
        <AccordionItem value="description" className="border rounded-lg p-2">
          <AccordionTrigger className="py-3 px-4 hover:no-underline">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center">
                2
              </div>
              <h3 className="text-lg font-medium">Description</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="product-description">Product Description</Label>
                <Textarea 
                  placeholder="Describe your product in detail..." 
                  className="h-32"
                />
              </div>
              
              <div>
                <Label htmlFor="keywords">Keywords (Max 5)</Label>
                <Input placeholder="Enter keywords separated by commas" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Product Details Section */}
        <AccordionItem value="product-details" className="border rounded-lg p-2">
          <AccordionTrigger className="py-3 px-4 hover:no-underline">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center">
                3
              </div>
              <h3 className="text-lg font-medium">Product Details</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="manufacturer">
                    Manufacturer <span className="text-red-500">*</span>
                  </Label>
                  <Input placeholder="Example: Na, Procter & Gamble" />
                  <p className="text-sm text-gray-500 mt-1">Required</p>
                </div>
                
                <div>
                  <Label htmlFor="number-of-items">
                    Number of Items <span className="text-red-500">*</span>
                  </Label>
                  <Input type="number" placeholder="Example: 5" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="special-ingredients">Special Ingredients</Label>
                <Input placeholder="Example: All Natural, Gluten Free, Organic" />
              </div>
              
              <div>
                <Label>Is the item Heat Sensitive?</Label>
                <RadioGroup defaultValue="no" className="flex space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="heat-yes" />
                    <Label htmlFor="heat-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="heat-no" />
                    <Label htmlFor="heat-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label htmlFor="temperature-rating">Temperature Rating</Label>
                <Input placeholder="Example: Ambient: Room Temperature, Chilled: 33 to 38 degrees" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="serving-size">Serving Size</Label>
                  <Input placeholder="Serving Size" />
                </div>
                
                <div>
                  <Label htmlFor="serving-quantity">Serving Quantity</Label>
                  <Input placeholder="Example: 2,5" />
                </div>
              </div>
              
              <div>
                <Label htmlFor="serving-unit">Serving Quantity Unit</Label>
                <Input placeholder="Example: 32nds, A/W" />
              </div>
              
              <div>
                <Label htmlFor="flavor">Flavor</Label>
                <Input placeholder="Example: Almond, Amaretto" />
              </div>
              
              <div>
                <Label htmlFor="ingredients">Ingredients</Label>
                <Textarea placeholder="Example: Dark Chocolate, Sugar, Almonds" className="h-24" />
                <Button variant="outline" size="sm" className="mt-2">Add More</Button>
              </div>
              
              <div>
                <Label htmlFor="form-factor">Form Factor</Label>
                <Input placeholder="Example: Stand alone, Plastic, Upholstered" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Offer Section */}
        <AccordionItem value="offer" className="border rounded-lg p-2">
          <AccordionTrigger className="py-3 px-4 hover:no-underline">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center">
                4
              </div>
              <h3 className="text-lg font-medium">Offer</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="handling-time">Handling Time</Label>
                <Input type="number" placeholder="Days" />
              </div>
              
              <div>
                <Label htmlFor="gift-message">Offering Can Be Gift Messaged</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="-Select-" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="gift-wrap">Is Gift Wrap Available</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="-Select-" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-date">Offer Start Date</Label>
                  <Input type="date" />
                </div>
                
                <div>
                  <Label htmlFor="restock-date">Restock Date</Label>
                  <Input type="date" />
                </div>
              </div>
              
              <div>
                <Label>Fulfillment Channel</Label>
                <RadioGroup defaultValue="merchant" className="mt-2">
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="merchant" id="merchant" />
                    <Label htmlFor="merchant">I will ship this item myself (Merchant Fulfilled)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="amazon" id="amazon" />
                    <Label htmlFor="amazon">Amazon will ship and provide customer service (Fulfilled by Amazon)</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
        
        {/* Safety & Compliance Section */}
        <AccordionItem value="safety" className="border rounded-lg p-2">
          <AccordionTrigger className="py-3 px-4 hover:no-underline">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center">
                5
              </div>
              <h3 className="text-lg font-medium">Safety & Compliance</h3>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="unit-count">Unit Count</Label>
                <Input type="number" />
              </div>
              
              <div>
                <Label htmlFor="unit-count-type">Unit Count Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Count" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="count">Count</SelectItem>
                    <SelectItem value="fluid_oz">Fluid Ounce</SelectItem>
                    <SelectItem value="grams">Grams</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Contains Liquid Contents?</Label>
                <RadioGroup defaultValue="no" className="flex space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="liquid-yes" />
                    <Label htmlFor="liquid-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="liquid-no" />
                    <Label htmlFor="liquid-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label>Is the Item Heat Sensitive?</Label>
                <RadioGroup defaultValue="no" className="flex space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="yes" id="safety-heat-yes" />
                    <Label htmlFor="safety-heat-yes">Yes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="no" id="safety-heat-no" />
                    <Label htmlFor="safety-heat-no">No</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <div>
                <Label htmlFor="form-factor-safety">Form Factor</Label>
                <Input placeholder="Form Factor" />
              </div>
              
              <div>
                <Label>Is Package Level Orderable</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="-Select-" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Return Policy</Label>
                <div className="mt-2">
                  <RadioGroup defaultValue="7">
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="7" id="seven-days" />
                      <Label htmlFor="seven-days">7 days return policy</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="15" id="fifteen-days" />
                      <Label htmlFor="fifteen-days">15 days return policy</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="30" id="thirty-days" />
                      <Label htmlFor="thirty-days">30 days return policy</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no-returns" id="no-returns" />
                      <Label htmlFor="no-returns">No returns accepted</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>

              <div>
                <Label>Bargain Amount</Label>
                <div className="mt-2">
                  <RadioGroup defaultValue="none">
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="none" id="no-bargain" />
                      <Label htmlFor="no-bargain">No bargaining allowed</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="5" id="five-percent" />
                      <Label htmlFor="five-percent">Up to 5% bargaining allowed</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="10" id="ten-percent" />
                      <Label htmlFor="ten-percent">Up to 10% bargaining allowed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="15" id="fifteen-percent" />
                      <Label htmlFor="fifteen-percent">Up to 15% bargaining allowed</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <div className="space-x-2">
          <Button variant="outline" onClick={onSaveDraft}>
            Save as draft
          </Button>
          <Button onClick={onSave}>
            Save and finish
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProductFormFields;
