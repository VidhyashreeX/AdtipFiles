import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, Instagram, User, Phone, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SubmissionFormData {
  name: string;
  number: string;
  youtubeLink: string;
  instagramLink: string;
  comment: string;
}

interface SubmissionFormProps {
  onSuccess?: (data: SubmissionFormData) => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<SubmissionFormData>({
    name: "",
    number: "",
    youtubeLink: "",
    instagramLink: "",
    comment: "",
  });


  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [responseMessage, setResponseMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "warning" | "info">("success");
  const [validationErrors, setValidationErrors] = useState<{
    name?: string;
    number?: string;
    youtubeLink?: string;
    instagramLink?: string;
  }>({});

  const validateField = (field: keyof SubmissionFormData, value: string): string | undefined => {
    switch (field) {
      case 'name':
        if (!value.trim()) return undefined; // Don't show error for empty field
        if (!/^[a-zA-Z\s]+$/.test(value)) {
          return "Name should only contain letters and spaces";
        }
        if (value.trim().length < 2) {
          return "Name should be at least 2 characters long";
        }
        return undefined;
      
      case 'number':
        if (!value.trim()) return undefined; // Don't show error for empty field
        if (!/^\d+$/.test(value)) {
          return "Phone number should only contain numbers";
        }
        if (value.length !== 10) {
          return "Phone number should be exactly 10 digits";
        }
        return undefined;
      
      case 'youtubeLink':
        if (!value.trim()) return undefined; // Don't show error for empty field
        if (!value.includes('youtube.com') && !value.includes('youtu.be')) {
          return "Please enter a valid YouTube channel URL";
        }
        return undefined;
      
      case 'instagramLink':
        if (!value.trim()) return undefined; // Don't show error for empty field
        if (!value.includes('instagram.com')) {
          return "Please enter a valid Instagram profile URL";
        }
        return undefined;
      
      default:
        return undefined;
    }
  };

  const handleInputChange = (field: keyof SubmissionFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    
    // Validate the field and update errors
    const error = validateField(field, value);
    setValidationErrors(prev => ({
      ...prev,
      [field]: error
    }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  // Check if form has actual user input
  if (formData.name === "" || formData.number === "" || formData.comment === "") {
    toast({
      title: "Error",
      description: "Please fill in all required fields.",
      variant: "destructive",
    });
    setIsSubmitting(false);
    return;
  }

  // Check for validation errors
  const hasValidationErrors = Object.values(validationErrors).some(error => error !== undefined);
  if (hasValidationErrors) {
    toast({
      title: "Validation Error",
      description: "Please fix the validation errors before submitting.",
      variant: "destructive",
    });
    setIsSubmitting(false);
    return;
  }

  try {
    // Get user ID and token from localStorage
    const token = localStorage.getItem("UserLoggedIn");
    const userData = localStorage.getItem("user");
    
    if (!token) {
      toast({
        title: "Error",
        description: "Authentication token not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }
    
    if (!userData) {
      toast({
        title: "Error",
        description: "User data not found. Please log in again.",
        variant: "destructive",
      });
      return;
    }
    
    // Parse user data to get user ID
    const user = JSON.parse(userData);
    const userId = user.id;
    
    if (!userId) {
      toast({
        title: "Error",
        description: "User ID not found in user data. Please log in again.",
        variant: "destructive",
      });
      return;
    }
    
    const payload = {
      userId: parseInt(userId),
      name: formData.name,
      phone: formData.number,
      instagramLink: formData.instagramLink,
      youtubeLink: formData.youtubeLink,
      remarks: formData.comment
    };


    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/content-creator/apply-free-premium`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      
      if (response.status === 401) {
        toast({
          title: "Authentication Error",
          description: "Your session has expired. Please log in again.",
          variant: "destructive",
        });
        return;
      }
      
      // Handle business logic responses (like pending application)
      if (response.status === 400 && errorData.message) {
        setResponseMessage(errorData.message);
        setMessageType("warning");
        setIsSubmitted(true);
        if (onSuccess) {
          onSuccess(formData);
        }
        localStorage.setItem("hasCreatedChannel", "true");
        window.dispatchEvent(new CustomEvent("channelCreated"));
        return;
      }
      
      toast({
        title: "Error",
        description: errorData.message || `Server error: ${response.status}`,
        variant: "destructive",
      });
      return;
    }

    const data = await response.json();

    if (data.status) {
      // Success case
      setResponseMessage(data.message || "Thank you for your submission. We'll get back to you in 48 Business hours.");
      setMessageType("success");
      setIsSubmitted(true);
      if (onSuccess) {
        onSuccess(formData);
      }
      // Save a simple flag to localStorage indicating a channel exists
      localStorage.setItem("hasCreatedChannel", "true");
      // Let sidebar or other components know instantly via event
      window.dispatchEvent(new CustomEvent("channelCreated"));
    } else {
      // Error case - show the message from API
      toast({
        title: "Application Status",
        description: data.message || "An error occurred while submitting your application.",
        variant: "destructive",
      });
    }

  } catch (error) {
    console.error("Error submitting form:", error);
    toast({
      title: "Error",
      description: "Failed to submit your application. Please try again.",
      variant: "destructive",
    });
  } finally {
    setIsSubmitting(false);
  }
};


  const isFormValid = formData.name.trim() !== "" && 
                     formData.number.trim() !== "" && 
                     formData.comment.trim() !== "" &&
                     !Object.values(validationErrors).some(error => error !== undefined);


  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      {/* <DialogHeader>
        <DialogTitle className="text-xl">
          {!isSubmitted ? "Apply for Free Premium Access" : "Application Status"}
        </DialogTitle>
      </DialogHeader> */}

      <div className="w-full">
        <Card className="shadow-form border-0 bg-card/80 backdrop-blur-sm">
          {!isSubmitted && (
            <CardHeader className="space-y-1 pb-6">
              <CardTitle className="text-2xl font-semibold text-center">Apply for Free Premium Access</CardTitle>
              <CardDescription className="text-center">
                Fill out the form below to apply for free premium features. We'll review your application and get back to you soon.
              </CardDescription>
            </CardHeader>
          )}

          <CardContent>
            {!isSubmitted ? (
              <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" />
                  Full Name *
                </Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  required
                  className={validationErrors.name ? "border-red-500" : ""}
                />
                {validationErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="number" className="text-sm font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" />
                  Phone Number *
                </Label>
                <Input
                  id="number"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={formData.number}
                  onChange={(e) => handleInputChange("number", e.target.value)}
                  required
                  className={validationErrors.number ? "border-red-500" : ""}
                />
                {validationErrors.number && (
                  <p className="text-sm text-red-500 mt-1">{validationErrors.number}</p>
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube" className="text-sm font-medium flex items-center gap-2">
                    <Youtube className="w-4 h-4 text-red-500" />
                    YouTube Channel
                  </Label>
                  <Input
                    id="youtube"
                    type="url"
                    placeholder="https://youtube.com/@yourchannel"
                    value={formData.youtubeLink}
                    onChange={(e) => handleInputChange("youtubeLink", e.target.value)}
                    className={validationErrors.youtubeLink ? "border-red-500" : ""}
                  />
                  {validationErrors.youtubeLink && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.youtubeLink}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instagram" className="text-sm font-medium flex items-center gap-2">
                    <Instagram className="w-4 h-4 text-pink-500" />
                    Instagram Profile
                  </Label>
                  <Input
                    id="instagram"
                    type="url"
                    placeholder="https://instagram.com/yourusername"
                    value={formData.instagramLink}
                    onChange={(e) => handleInputChange("instagramLink", e.target.value)}
                    className={validationErrors.instagramLink ? "border-red-500" : ""}
                  />
                  {validationErrors.instagramLink && (
                    <p className="text-sm text-red-500 mt-1">{validationErrors.instagramLink}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="comment" className="text-sm font-medium flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  Message *
                </Label>
                <Textarea
                  id="comment"
                  placeholder="Tell us about yourself..."
                  value={formData.comment}
                  onChange={(e) => handleInputChange("comment", e.target.value)}
                  required
                  className="min-h-[120px] resize-none"
                />
              </div>

              <Button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full h-12 font-semibold text-base shadow-form disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Send className="w-4 h-4" />
                    Submit Form
                  </div>
                )}
              </Button>
            </form>
            ) : (
              <div className="text-center py-8">
                {messageType === "success" ? (
                  <>
                    <div className="p-4 bg-green-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-green-900 mb-2">
                      Application Submitted Successfully!
                    </h3>
                    <p className="text-green-800 mb-4 text-lg">
                      {responseMessage}
                    </p>
                    <p className="text-sm text-green-700">
                      You can now close this dialog to continue.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="p-4 bg-yellow-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                    <h3 className="text-2xl font-semibold text-yellow-900 mb-2">
                      Application Under Review
                    </h3>
                    <p className="text-yellow-800 mb-4 text-lg">
                      {responseMessage}
                    </p>
                    {/* <p className="text-sm text-yellow-700">
                      You can now close this dialog to continue.
                    </p> */}
                  </>
                )}
              </div>
            )}
          </CardContent>
        </Card>


        {!isSubmitted && (
          <div className="text-center mt-4">
            <p className="text-sm text-muted-foreground">We respect your privacy and will never share your information</p>
          </div>
        )}
      </div>
    </DialogContent>
  );
};

export default SubmissionForm;
