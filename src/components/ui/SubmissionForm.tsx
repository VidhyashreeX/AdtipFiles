import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Youtube, Instagram, User, Phone, MessageSquare, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface FormData {
  name: string;
  number: string;
  youtubeLink: string;
  instagramLink: string;
  comment: string;
}

interface SubmissionFormProps {
  onSuccess?: (data: FormData) => void;
}

const SubmissionForm: React.FC<SubmissionFormProps> = ({ onSuccess }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<FormData>({
    name: "",
    number: "",
    youtubeLink: "",
    instagramLink: "",
    comment: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsSubmitting(true);

  try {
    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    toast({
      title: "Submission Successful!",
      description: "Thank you for your submission. We'll get back to you in 48 Business hours.",
    });

    if (onSuccess) {
      onSuccess(formData);
    }

    // Save a simple flag to localStorage indicating a channel exists
    localStorage.setItem("hasCreatedChannel", "true");

    // Optionally save form data if you wish
    // localStorage.setItem("myChannelData", JSON.stringify(formData));

    // Let sidebar or other components know instantly via event
    window.dispatchEvent(new CustomEvent("channelCreated"));
    window.location.href = "/";


  } finally {
    setIsSubmitting(false);
  }
};


  const isFormValid = formData.name.trim() !== "" && formData.number.trim() !== "" && formData.comment.trim() !== "";


  return (
    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="text-xl">Creator Information Form</DialogTitle>
      </DialogHeader>

      <div className="w-full">
        <Card className="shadow-form border-0 bg-card/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-center">Submit Your Information</CardTitle>
            <CardDescription className="text-center">
              Fill out the form below and we'll get back to you as soon as possible
            </CardDescription>
          </CardHeader>

          <CardContent>
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
                />
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
                />
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
                  />
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
                  />
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
          </CardContent>
        </Card>

        <div className="text-center mt-4">
          <p className="text-sm text-muted-foreground">We respect your privacy and will never share your information</p>
        </div>
      </div>
    </DialogContent>
  );
};

export default SubmissionForm;
