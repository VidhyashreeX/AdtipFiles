
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Upload, Users, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

// Define form schema with proper tuple type for targetAudience and added date fields
const formSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  adType: z.string().min(1, { message: "Please select an ad type" }),
  // Define targetAudience as an array with at least one string element (non-empty tuple)
  targetAudience: z.tuple([z.string()]).rest(z.string()),
  budget: z.string().min(1, { message: "Please enter your budget" }),
  platform: z.array(z.string()).nonempty({ message: "Select at least one platform" }),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the terms and conditions",
  }),
});

// Type for the form values
type AdFormValues = z.infer<typeof formSchema>;

// Ad types
const adTypes = [
  { value: "banner", label: "Banner Ad" },
  { value: "video", label: "Video Ad" },
  { value: "sponsored", label: "Sponsored Content" },
  { value: "popup", label: "Pop-up/Overlay" },
  { value: "social", label: "Social Media Post" },
];

// Target audience options
const audienceOptions = [
  "18-24 years",
  "25-34 years",
  "35-44 years",
  "45-54 years",
  "55+ years",
  "Male",
  "Female",
  "Students",
  "Professionals",
  "Parents",
];

// Platforms with icons added
const platforms = [
  { id: "desktop", label: "Desktop" },
  { id: "mobile", label: "Mobile" },
  { id: "tablet", label: "Tablet" },
];

const PostAds: React.FC = () => {
  const [adImagePreview, setAdImagePreview] = useState<string | null>(null);
  // Initialize with a default value to ensure it's never empty
  const [selectedAudiences, setSelectedAudiences] = useState<[string, ...string[]]>(["General"]);
  const { toast } = useToast();

  // Initialize form
  const form = useForm<AdFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      adType: "",
      targetAudience: ["General"],
      budget: "",
      platform: ["desktop", "mobile"],
      acceptTerms: false,
    },
  });

  // Handle image preview
  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toggle audience selection
  const toggleAudience = (audience: string) => {
    if (selectedAudiences.includes(audience)) {
      const newSelection = selectedAudiences.filter(item => item !== audience);
      // Ensure we always have at least one item in the array
      const validSelection: [string, ...string[]] = newSelection.length > 0 
        ? newSelection as [string, ...string[]] 
        : ["General"];
      
      setSelectedAudiences(validSelection);
      form.setValue("targetAudience", validSelection);
    } else {
      // Remove "General" if it was just a placeholder
      const baseSelection = selectedAudiences[0] === "General" && selectedAudiences.length === 1
        ? [] 
        : selectedAudiences.filter(a => a !== "General");
      
      const newSelection: [string, ...string[]] = [audience, ...baseSelection];
      setSelectedAudiences(newSelection);
      form.setValue("targetAudience", newSelection);
    }
  };

  // Remove an audience tag
  const removeAudience = (audience: string) => {
    // Prevent removing the last item
    if (selectedAudiences.length <= 1) {
      return;
    }
    
    const newSelection = selectedAudiences.filter(item => item !== audience);
    // Ensure we always have at least one item in the array
    const validSelection: [string, ...string[]] = newSelection.length > 0 
      ? newSelection as [string, ...string[]] 
      : ["General"];
    
    setSelectedAudiences(validSelection);
    form.setValue("targetAudience", validSelection);
  };

  // Handle form submission
  const onSubmit = (data: AdFormValues) => {
    console.log("Form data submitted:", data);
    
    toast({
      title: "Ad Created Successfully",
      description: "Your advertisement has been submitted for review.",
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 bg-background">
      <h1 className="text-2xl font-bold mb-2 text-foreground">Create Ad Campaign</h1>
      <p className="text-muted-foreground mb-8">Reach potential customers and promote your products or services.</p>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6 bg-muted">
          <TabsTrigger value="create">Create Ad</TabsTrigger>
          <TabsTrigger value="analytics">Campaign Analytics</TabsTrigger>
          <TabsTrigger value="history">Ad History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="create">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Ad Details</CardTitle>
                  <CardDescription>
                    Provide information about your ad campaign
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad Title*</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter an attention-grabbing title" {...field} />
                            </FormControl>
                            <FormDescription>
                              This will be displayed as the headline of your ad.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ad Description*</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Describe your product/service and what makes it unique" 
                                className="resize-none" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Keep it concise and focused on benefits to the customer.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="adType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ad Type*</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select ad type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {adTypes.map((type) => (
                                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormDescription>
                                Different ad types have different engagement rates.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Budget*</FormLabel>
                              <FormControl>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                                  <Input className="pl-8" placeholder="Enter your budget" {...field} />
                                </div>
                              </FormControl>
                              <FormDescription>
                                Your total budget for the campaign duration.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>Start Date*</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date < new Date()
                                    }
                                    initialFocus
                                    className={cn("p-3 pointer-events-auto")}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormField
                          control={form.control}
                          name="endDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel>End Date*</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "w-full pl-3 text-left font-normal",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "PPP")
                                      ) : (
                                        <span>Pick a date</span>
                                      )}
                                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                  </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                  <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) =>
                                      date < new Date() || (form.getValues("startDate") && date < form.getValues("startDate"))
                                    }
                                    initialFocus
                                    className={cn("p-3 pointer-events-auto")}
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="platform"
                        render={() => (
                          <FormItem>
                            <FormLabel>Platforms*</FormLabel>
                            <div className="flex flex-wrap gap-4">
                              {platforms.map((item) => (
                                <FormField
                                  key={item.id}
                                  control={form.control}
                                  name="platform"
                                  render={({ field }) => {
                                    return (
                                      <FormItem
                                        key={item.id}
                                        className="flex flex-row items-center space-x-3 space-y-0"
                                      >
                                        <FormControl>
                                          <Checkbox
                                            checked={field.value?.includes(item.id)}
                                            onCheckedChange={(checked) => {
                                              const updatedValue = checked
                                                ? [...field.value, item.id]
                                                : field.value?.filter(
                                                    (val) => val !== item.id
                                                  );
                                              field.onChange(updatedValue);
                                            }}
                                          />
                                        </FormControl>
                                        <FormLabel className="flex items-center space-x-2 cursor-pointer">
                                          <span>{item.label}</span>
                                        </FormLabel>
                                      </FormItem>
                                    );
                                  }}
                                />
                              ))}
                            </div>
                            <FormDescription>
                              Select where your ads will be displayed.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="targetAudience"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Target Audience*</FormLabel>
                            <div>
                              <div className="flex flex-wrap gap-2 mb-2">
                                {selectedAudiences.map((audience) => (
                                  <Badge key={audience} variant="outline" className="flex items-center gap-1">
                                    {audience}
                                    <button
                                      type="button"
                                      onClick={() => removeAudience(audience)}
                                      className="ml-1 hover:text-destructive rounded-full"
                                    >
                                      <X className="h-3 w-3" />
                                    </button>
                                  </Badge>
                                ))}
                              </div>
                              <div className="border rounded-lg p-2 h-32 overflow-y-auto">
                                <div className="flex flex-wrap gap-2">
                                  {audienceOptions.map((audience) => (
                                    <Badge
                                      key={audience}
                                      variant={selectedAudiences.includes(audience) ? "default" : "outline"}
                                      className="cursor-pointer hover:bg-primary/90"
                                      onClick={() => toggleAudience(audience)}
                                    >
                                      {audience}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                            <FormDescription>
                              Select demographics and interests to target.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div>
                        <FormLabel>Upload Ad Creative*</FormLabel>
                        <div className="mt-2 flex justify-center rounded-lg border border-dashed border-border px-6 py-10">
                          <div className="text-center">
                            {adImagePreview ? (
                              <div className="mb-4">
                                <img
                                  src={adImagePreview}
                                  alt="Ad preview"
                                  className="mx-auto h-32 object-contain"
                                />
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setAdImagePreview(null)}
                                  className="mt-2"
                                >
                                  Remove
                                </Button>
                              </div>
                            ) : (
                              <>
                                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                  <Upload className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <div className="mt-4 flex text-sm leading-6 text-muted-foreground">
                                  <label
                                    htmlFor="file-upload"
                                    className="relative cursor-pointer rounded-md font-semibold text-adtip-teal focus-within:outline-none focus-within:ring-2 focus-within:ring-adtip-teal"
                                  >
                                    <span>Upload a file</span>
                                    <input
                                      id="file-upload"
                                      name="file-upload"
                                      type="file"
                                      accept="image/*"
                                      className="sr-only"
                                      onChange={handleImageChange}
                                    />
                                  </label>
                                  <p className="pl-1">or drag and drop</p>
                                </div>
                                <p className="text-xs leading-5 text-muted-foreground">
                                  PNG, JPG, GIF up to 5MB
                                </p>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="acceptTerms"
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
                                I agree to the <a href="/terms" className="text-adtip-teal hover:underline">ad policies</a> and <a href="/terms" className="text-adtip-teal hover:underline">content guidelines</a>
                              </FormLabel>
                              <FormDescription>
                                All ads must comply with our policies.
                              </FormDescription>
                              <FormMessage />
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      <Button type="submit" className="w-full sm:w-auto">Create Campaign</Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
            
            {/* Ad Preview & Tips */}
            <div className="space-y-6">
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Ad Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border border-border rounded-lg p-4 text-center bg-background">
                    {adImagePreview ? (
                      <img
                        src={adImagePreview}
                        alt="Ad preview"
                        className="mx-auto mb-2 max-w-full h-auto max-h-64 object-contain"
                      />
                    ) : (
                      <div className="w-full h-40 bg-muted flex items-center justify-center rounded-md">
                        <p className="text-muted-foreground">Ad preview will appear here</p>
                      </div>
                    )}
                    
                    <div className="mt-4 text-left">
                      <h3 className="font-bold text-lg">
                        {form.watch("title") || "Your Ad Title"}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {form.watch("description") || "Your ad description will appear here. Make it compelling!"}
                      </p>
                      <div className="flex justify-between mt-2">
                        <span className="text-xs text-muted-foreground">
                          Sponsored
                        </span>
                        <span className="text-xs font-medium text-adtip-teal">
                          Learn More
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Ad Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Use high-quality images that stand out</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Keep your headline short and impactful</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Include a clear call to action</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Target specific audiences for better results</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-green-500">✓</span>
                      <span>Test different variations to optimize performance</span>
                    </li>
                  </ul>
                </CardContent>
                <CardFooter>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="link" className="p-0 text-adtip-teal hover:text-adtip-teal/80">
                          View Ad Guidelines
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="right">
                        <p>Opens our full advertising guidelines</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardFooter>
              </Card>
              
              <Card className="bg-card border-border">
                <CardHeader>
                  <CardTitle className="text-foreground">Estimated Reach</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Potential audience:</span>
                    <span className="font-bold">
                      {selectedAudiences.length ? "10,000+ users" : "Select audience to see estimate"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Estimated impressions:</span>
                    <span className="font-bold">
                      {form.watch("budget") ? `${parseInt(form.watch("budget")) * 120}+` : "Enter budget to see estimate"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Campaign Analytics</CardTitle>
              <CardDescription>
                View the performance of your ad campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No active campaigns</h3>
                  <p className="text-muted-foreground mb-4">Create your first ad campaign to see analytics</p>
                  <Button variant="outline" onClick={() => form.setValue("title", "")}>Create Campaign</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Ad Campaign History</CardTitle>
              <CardDescription>
                View and manage your previous ad campaigns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <CalendarIcon className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium mb-2">No campaign history</h3>
                  <p className="text-muted-foreground mb-4">Your previous campaigns will appear here</p>
                  <Button variant="outline" onClick={() => form.setValue("title", "")}>Create Campaign</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PostAds;
