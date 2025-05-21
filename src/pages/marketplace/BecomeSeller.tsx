import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart4,
  CheckCircle2,
  TrendingUp,
  Truck,
  Globe,
  Calendar,
  DollarSign,
  Shield,
  Gift,
  PenLine,
  ArrowRight,
  Store,
  ShoppingCart,
  Upload,
  ChevronsRight,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

// Seller Step Component
const SellerStep = ({
  step,
  isActive,
  isCompleted,
  title,
}: {
  step: number;
  isActive: boolean;
  isCompleted: boolean;
  title: string;
}) => {
  return (
    <div className="flex items-center">
      <div
        className={`flex items-center justify-center w-8 h-8 rounded-full ${
          isCompleted
            ? "bg-teal-500 text-white"
            : isActive
            ? "bg-teal-500 text-white"
            : "bg-gray-200 text-gray-500"
        }`}
      >
        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : step}
      </div>
      <span
        className={`ml-2 text-sm ${
          isActive || isCompleted ? "text-teal-600 font-medium" : "text-gray-500"
        }`}
      >
        {title}
      </span>
    </div>
  );
};

// Define step-specific schemas
const accountDetailsSchema = z.object({
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  phone: z.string().min(10, {
    message: "Phone number must be at least 10 characters.",
  }),
  password: z.string().min(8, {
    message: "Password must be at least 8 characters.",
  }),
});

const businessInfoSchema = z.object({
  businessName: z.string().min(2, {
    message: "Business name must be at least 2 characters.",
  }),
  businessType: z.string({
    required_error: "Please select a business type.",
  }),
  description: z
    .string()
    .min(10, {
      message: "Description must be at least 10 characters.",
    })
    .max(500, {
      message: "Description cannot be longer than 500 characters.",
    }),
  address: z.string().min(5, {
    message: "Address must be at least 5 characters.",
  }),
  city: z.string().min(2, {
    message: "City must be at least 2 characters.",
  }),
  state: z.string().min(2, {
    message: "State must be at least 2 characters.",
  }),
  zipCode: z.string().min(5, {
    message: "ZIP code must be at least 5 characters.",
  }),
  taxId: z.string().optional(),
  website: z
    .string()
    .url({
      message: "Please enter a valid URL.",
    })
    .optional()
    .or(z.literal("")),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions.",
  }),
});

const verificationSchema = z.object({
  idProof: z.any().optional(),
  businessProof: z.any().optional(),
  bankDetails: z.any().optional(),
});

// Combined schema for all steps
const sellerFormSchema = z.object({
  ...accountDetailsSchema.shape,
  ...businessInfoSchema.shape,
  ...verificationSchema.shape,
});

type SellerFormValues = z.infer<typeof sellerFormSchema>;

const businessTypes = [
  "Individual",
  "Sole Proprietorship",
  "Partnership",
  "Limited Liability Company (LLC)",
  "Corporation",
  "Non-profit",
  "Other",
];

// Benefits and feature highlights
const sellerBenefits = [
  {
    title: "Access Millions of Customers",
    description: "Reach active AdTip users and grow your business exponentially",
    icon: <Globe className="h-10 w-10 text-teal-500" />,
  },
  {
    title: "Quick & Easy Registration",
    description: "Register your business in less than 10 minutes",
    icon: <Calendar className="h-10 w-10 text-teal-500" />,
  },
  {
    title: "Low Commission Rates",
    description: "Pay only for what you sell with transparent pricing",
    icon: <DollarSign className="h-10 w-10 text-teal-500" />,
  },
  {
    title: "Secure Payments",
    description: "Get your payments securely processed and transferred",
    icon: <Shield className="h-10 w-10 text-teal-500" />,
  },
  {
    title: "Free Promotions",
    description: "Get free promotions and marketing support for your products",
    icon: <Gift className="h-10 w-10 text-teal-500" />,
  },
  {
    title: "Business Insights",
    description: "Access detailed analytics to grow your business",
    icon: <BarChart4 className="h-10 w-10 text-teal-500" />,
  },
];

const BecomeSeller: React.FC = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [sellerStep, setSellerStep] = useState(1);
  const navigate = useNavigate();
  const totalSteps = 4;
  const progress = (sellerStep / totalSteps) * 100;

  const steps = [
    { title: "Account Details", completed: sellerStep > 1 },
    { title: "Business Information", completed: sellerStep > 2 },
    { title: "Verification", completed: sellerStep > 3 },
    { title: "Product Listing", completed: sellerStep > 4 },
  ];

  // Initialize form with step-specific resolver
  const form = useForm<SellerFormValues>({
    resolver: zodResolver(
      sellerStep === 1
        ? accountDetailsSchema
        : sellerStep === 2
        ? businessInfoSchema
        : sellerStep === 3
        ? verificationSchema
        : sellerFormSchema
    ),
    defaultValues: {
      email: "",
      phone: "",
      password: "",
      businessName: "",
      businessType: "",
      description: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      taxId: "",
      website: "",
      acceptTerms: false,
      idProof: null,
      businessProof: null,
      bankDetails: null,
    },
  });

  // Update resolver when sellerStep changes
  useEffect(() => {
    form.reset(form.getValues(), {
      keepValues: true,
      keepDirty: true,
    });
    form.clearErrors();
    console.log(`Resolver updated for step ${sellerStep}`);
  }, [sellerStep, form]);

  // Log sellerStep changes
  useEffect(() => {
    console.log(`Current sellerStep: ${sellerStep}`);
  }, [sellerStep]);

  const nextStep = () => {
    if (sellerStep < totalSteps) {
      console.log(`Advancing from step ${sellerStep} to step ${sellerStep + 1}`);
      setSellerStep(sellerStep + 1);
    } else {
      console.log("Onboarding complete, navigating to /list-products");
      navigate("/list-products");
    }
  };

  const prevStep = () => {
    if (sellerStep > 1) {
      console.log(`Going back from step ${sellerStep} to step ${sellerStep - 1}`);
      setSellerStep(sellerStep - 1);
    }
  };

  const handleSubmit = async (values: Partial<SellerFormValues>) => {
    console.log("Form submitted with values:", values);
    console.log("Form state:", {
      isValid: form.formState.isValid,
      isDirty: form.formState.isDirty,
      errors: form.formState.errors,
    });

    // Explicitly trigger validation
    const isValid = await form.trigger();
    console.log("Validation result:", isValid);

    if (!isValid) {
      console.log("Validation errors:", form.formState.errors);
      toast({
        title: "Validation Error",
        description: "Please fix the errors in the form before submitting.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log(`Step ${sellerStep} completed successfully`);
      toast({
        title: "Step Completed",
        description: `Step ${sellerStep} has been successfully completed.`,
      });
      nextStep();
    } catch (error) {
      console.error("Submission error:", error);
      toast({
        title: "Error",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepContent = () => {
    switch (sellerStep) {
      case 1:
        return (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Create Your Seller Account</h2>
            <p className="text-gray-600 mb-6">
              Creating your AdTip seller account is a quick process, taking less than 10 minutes, and requires only a few documents.
            </p>
            <Form {...form}>
              <form
                onSubmit={(e) => {
                  console.log("Form submission triggered for Step 1");
                  form.handleSubmit(handleSubmit)(e);
                }}
                className="space-y-6"
              >
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Account Details</CardTitle>
                    <CardDescription>Enter your basic information to get started</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your email address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobile Number*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your mobile number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Create Password*</FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder="Create a secure password"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-teal-500 hover:bg-teal-600 w-full"
                >
                  {isSubmitting ? "Submitting..." : "Continue"} <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </form>
            </Form>
          </div>
        );
      case 2:
        return (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Business Information</h2>
            <p className="text-gray-600 mb-6">
              Tell us more about your business to customize your seller experience.
            </p>
            <Form {...form}>
              <form
                onSubmit={(e) => {
                  console.log("Form submission triggered for Step 2");
                  form.handleSubmit(handleSubmit)(e);
                }}
                className="space-y-6"
              >
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>Business Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="businessName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Name*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your business name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="businessType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Type*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select business type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {businessTypes.map((type) => (
                                <SelectItem key={type} value={type}>
                                  {type}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Description*</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your business and what you sell"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            This will be displayed on your seller profile
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Business Address*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your business address" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City*</FormLabel>
                            <FormControl>
                              <Input placeholder="City" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pincode*</FormLabel>
                          <FormControl>
                            <Input placeholder="Pincode" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter your state" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="taxId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tax ID/GSTIN (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Tax ID or registration number" {...field} />
                          </FormControl>
                          <FormDescription>This helps verify your business</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="website"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Website (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="https://yourwebsite.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="acceptTerms"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              I agree to the{" "}
                              <a href="/terms" className="text-teal-500 hover:underline">
                                terms and conditions
                              </a>{" "}
                              and{" "}
                              <a href="/privacy" className="text-teal-500 hover:underline">
                                privacy policy
                              </a>
                            </FormLabel>
                            <FormDescription>You must agree before submitting.</FormDescription>
                            <FormMessage />
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    className="w-1/3"
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-teal-500 hover:bg-teal-600 w-1/3"
                  >
                    {isSubmitting ? "Submitting..." : "Continue"} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      console.log("Debug: Forcing navigation to Step 3");
                      nextStep();
                    }}
                    className="w-1/3"
                  >
                    Debug: Go to Step 3
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );
      case 3:
        return (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">Verification</h2>
            <p className="text-gray-600 mb-6">
              Verify your identity to complete your seller account setup.
            </p>
            <Form {...form}>
              <form
                onSubmit={(e) => {
                  console.log("Form submission triggered for Step 3");
                  form.handleSubmit(handleSubmit)(e);
                }}
                className="space-y-6"
              >
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle>ID & Document Verification</CardTitle>
                    <CardDescription>Upload required documents for verification</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 p-6 rounded-md text-center">
                      <div className="flex justify-center mb-3">
                        <div className="rounded-full bg-teal-100 p-3">
                          <Upload className="h-6 w-6 text-teal-600" />
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-1">Upload ID Proof</p>
                      <p className="text-xs text-gray-500 mb-3">
                        Aadhar Card, PAN Card, Voter ID, etc.
                      </p>
                      <FormField
                        control={form.control}
                        name="idProof"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="file"
                                onChange={(e) => field.onChange(e.target.files?.[0])}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="border-2 border-dashed border-gray-300 p-6 rounded-md text-center">
                      <div className="flex justify-center mb-3">
                        <div className="rounded-full bg-teal-100 p-3">
                          <Upload className="h-6 w-6 text-teal-600" />
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-1">Upload Business Proof</p>
                      <p className="text-xs text-gray-500 mb-3">
                        Business Registration, GST Certificate, etc.
                      </p>
                      <FormField
                        control={form.control}
                        name="businessProof"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="file"
                                onChange={(e) => field.onChange(e.target.files?.[0])}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="border-2 border-dashed border-gray-300 p-6 rounded-md text-center">
                      <div className="flex justify-center mb-3">
                        <div className="rounded-full bg-teal-100 p-3">
                          <Upload className="h-6 w-6 text-teal-600" />
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-1">Upload Bank Details</p>
                      <p className="text-xs text-gray-500 mb-3">
                        Cancelled Cheque or Bank Statement
                      </p>
                      <FormField
                        control={form.control}
                        name="bankDetails"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                type="file"
                                onChange={(e) => field.onChange(e.target.files?.[0])}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
                <div className="flex space-x-4">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    className="w-1/2"
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-teal-500 hover:bg-teal-600 w-1/2"
                  >
                    {isSubmitting ? "Submitting..." : "Continue"} <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );
      case 4:
        return (
          <div className="animate-fade-in">
            <h2 className="text-xl font-semibold mb-4">List Your Products</h2>
            <p className="text-gray-600 mb-6">
              Start listing your products and begin selling on AdTip.
            </p>
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Product Listing Options</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start p-4 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <div className="rounded-full bg-teal-100 p-2 mr-4 mt-1">
                      <ShoppingCart className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">List a new product</h3>
                      <p className="text-sm text-gray-500">
                        Create a new product listing with details, images, and pricing
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start p-4 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <div className="rounded-full bg-teal-100 p-2 mr-4 mt-1">
                      <ChevronsRight className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h3 className="font-medium">Bulk upload products</h3>
                      <p className="text-sm text-gray-500">
                        Upload multiple products at once using our template
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                You have successfully completed your seller account setup. You can now start listing products and growing your business on AdTip!
              </p>
              <Button
                onClick={nextStep}
                className="bg-teal-500 hover:bg-teal-600 w-full"
                disabled={isSubmitting}
              >
                Start Selling <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-teal-500 to-teal-700 rounded-xl p-8 mb-10 relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern opacity-10"></div>
        <div className="relative z-10 max-w-2xl">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Sell on AdTip and Grow Your Business
          </h1>
          <p className="text-teal-50 text-lg mb-6">
            Join thousands of sellers making more money by reaching millions of AdTip users directly.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              size="lg"
              className="bg-white text-teal-700 hover:bg-teal-50"
              onClick={() => setActiveTab("register")}
            >
              Register Now
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white hover:bg-white/10"
            >
              Learn More
            </Button>
          </div>
        </div>
        <div className="hidden md:block absolute right-0 bottom-0 w-1/3 h-full">
          <div className="absolute bottom-0 right-5 w-64 h-64 bg-white/20 rounded-full filter blur-3xl"></div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
        <TabsList className="w-full grid grid-cols-2 md:grid-cols-4 gap-2">
          <TabsTrigger value="overview" className="text-sm md:text-base">
            Overview
          </TabsTrigger>
          <TabsTrigger value="benefits" className="text-sm md:text-base">
            Benefits
          </TabsTrigger>
          <TabsTrigger value="how-it-works" className="text-sm md:text-base">
            How It Works
          </TabsTrigger>
          <TabsTrigger value="register" className="text-sm md:text-base">
            Register Now
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-8 animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Why Sell on AdTip?</h2>
              <p className="text-gray-600 mb-6">
                AdTip is one of the fastest-growing content and e-commerce platforms in India, with millions of daily active users. Selling on AdTip gives you access to this massive customer base without the hassle of setting up your own online store.
              </p>
              <ul className="space-y-3">
                {[
                  "No website development costs",
                  "Built-in logistics and delivery network",
                  "Secure payment processing",
                  "AI-driven product recommendations",
                  "24/7 seller support",
                ].map((item, i) => (
                  <li key={i} className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-teal-500 mr-2 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-teal-50 p-6 rounded-lg">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold">AdTip Seller Stats</h3>
                <TrendingUp className="h-6 w-6 text-teal-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Active Sellers</p>
                  <p className="text-2xl font-bold text-teal-700">50,000+</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Monthly Orders</p>
                  <p className="text-2xl font-bold text-teal-700">2M+</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Categories</p>
                  <p className="text-2xl font-bold text-teal-700">100+</p>
                </div>
                <div className="bg-white p-4 rounded shadow-sm">
                  <p className="text-sm text-gray-500">Return Rate</p>
                  <p className="text-2xl font-bold text-teal-700">{"<5%"}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-xl font-semibold mb-4">Featured Seller Categories</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {["Fashion", "Electronics", "Home & Kitchen", "Beauty", "Toys & Games", "Books", "Grocery", "Health"].map(
                (category, i) => (
                  <div
                    key={i}
                    className="text-center p-4 border rounded-lg hover:bg-teal-50 transition-colors cursor-pointer"
                  >
                    <p>{category}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </TabsContent>

        {/* Benefits Tab */}
        <TabsContent value="benefits" className="animate-fade-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {sellerBenefits.map((benefit, index) => (
              <Card key={index} className="border-none shadow-md hover:shadow-lg transition-shadow">
                <CardHeader className="pb-2">
                  <div className="mb-2">{benefit.icon}</div>
                  <CardTitle>{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{benefit.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-10 bg-teal-50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-center mb-6">Success Stories</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  name: "Priya Sharma",
                  business: "Handmade Crafts Store",
                  quote: "Since joining AdTip as a seller last year, my handcraft business has grown by 300%. The platform's reach is incredible!",
                  revenue: "₹45,000/month",
                },
                {
                  name: "Rajesh Kumar",
                  business: "Electronics Retailer",
                  quote:
                    "AdTip's analytics tools helped me understand what products are trending, allowing me to optimize my inventory and increase profits.",
                  revenue: "₹1,20,000/month",
                },
              ].map((story, i) => (
                <div key={i} className="bg-white p-5 rounded-lg shadow-sm">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold">
                      {story.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{story.name}</p>
                      <p className="text-sm text-gray-500">{story.business}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 mb-3">"{story.quote}"</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Average Revenue:</span>
                    <span className="font-bold text-teal-700">{story.revenue}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* How It Works Tab */}
        <TabsContent value="how-it-works" className="animate-fade-in">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Start Selling in 4 Simple Steps</h2>
            <div className="space-y-12 mt-8">
              {[
                {
                  step: 1,
                  title: "Register Your Account",
                  description:
                    "Complete our simple registration form with your basic business details, verify your email and phone number.",
                  icon: <PenLine className="h-10 w-10 text-teal-500" />,
                },
                {
                  step: 2,
                  title: "List Your Products",
                  description:
                    "Upload product details, images, pricing and inventory. Our AI tools help optimize your listings for better visibility.",
                  icon: <CheckCircle2 className="h-10 w-10 text-teal-500" />,
                },
                {
                  step: 3,
                  title: "Process Orders",
                  description:
                    "Receive notifications for new orders, process them through our seller dashboard, and prepare for shipping.",
                  icon: <DollarSign className="h-10 w-10 text-teal-500" />,
                },
                {
                  step: 4,
                  title: "Ship & Get Paid",
                  description:
                    "Use our integrated shipping solutions or your own carrier. Get paid directly to your bank account on a regular schedule.",
                  icon: <Truck className="h-10 w-10 text-teal-500" />,
                },
              ].map((step) => (
                <div key={step.step} className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                    <span className="text-xl font-bold text-teal-700">{step.step}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold">{step.title}</h3>
                      {step.icon}
                    </div>
                    <p className="text-gray-600 mt-2">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-12 bg-teal-700 text-white p-6 rounded-lg">
              <h3 className="text-xl font-semibold mb-3">Fee Structure</h3>
              <p className="mb-4">AdTip charges simple and transparent fees:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-teal-600 p-4 rounded">
                  <p className="font-medium">Category Commission:</p>
                  <p className="text-teal-50">2-15% (varies by category)</p>
                </div>
                <div className="bg-teal-600 p-4 rounded">
                  <p className="font-medium">Fixed Fee:</p>
                  <p className="text-teal-50">₹10 per order</p>
                </div>
                <div className="bg-teal-600 p-4 rounded">
                  <p className="font-medium">Settlement Cycle:</p>
                  <p className="text-teal-50">7-14 days</p>
                </div>
                <div className="bg-teal-600 p-4 rounded">
                  <p className="font-medium">Listing Fee:</p>
                  <p className="text-teal-50">FREE</p>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Register Tab */}
        <TabsContent value="register" className="animate-fade-in">
          <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <Store className="h-6 w-6 text-teal-600 mr-2" />
                <h1 className="text-xl font-bold text-teal-600">AdTip Seller</h1>
              </div>
              <div className="text-right">
                <span className="text-xs text-gray-500">Onboarding Progress</span>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium">{Math.round(progress)}%</span>
                  <Progress value={progress} className="w-24 h-2" />
                </div>
              </div>
            </div>
            <div className="flex justify-between mb-8 px-2">
              {steps.map((step, index) => (
                <SellerStep
                  key={index}
                  step={index + 1}
                  isActive={sellerStep === index + 1}
                  isCompleted={step.completed}
                  title={step.title}
                />
              ))}
            </div>
            {getStepContent()}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BecomeSeller;
