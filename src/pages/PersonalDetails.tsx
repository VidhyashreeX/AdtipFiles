import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, User, Mail, Calendar, ChevronDown, Key } from "lucide-react";
import axios from "axios";

const PersonalDetailsForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    dateOfBirth: "", // Changed from age to match User interface
    gender: "",
    profession: "",
    maritalStatus: "",
    referralCode: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { updateUserProfile } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your name");
      return;
    }

    if (!formData.email.trim()) {
      setError("Please enter your email");
      return;
    }

    if (!formData.dateOfBirth.trim()) {
      setError("Please enter your date of birth");
      return;
    }

    if (!formData.gender) {
      setError("Please select your gender");
      return;
    }

    if (!formData.profession) {
      setError("Please select your profession");
      return;
    }

    if (!formData.maritalStatus) {
      setError("Please select your marital status");
      return;
    }

    setIsLoading(true);

    try {
      // API call to update profile (adjust endpoint as needed)
      const userId = localStorage.getItem("tempUserId") || "";
      await axios.post("http://3.6.15.198:7082/api/updateProfile", {
        id: userId,
        name: formData.name,
        email: formData.email,
        dob: formData.dateOfBirth,
        gender: formData.gender,
        profession: formData.profession,
        maritalStatus: formData.maritalStatus,
        referralCode: formData.referralCode || null,
      });

      // Update local user profile
      if (updateUserProfile) {
        updateUserProfile({
          name: formData.name,
          email: formData.email,
          dateOfBirth: formData.dateOfBirth,
          gender: formData.gender,
          profession: formData.profession,
          maritalStatus: formData.maritalStatus,
        });
      }

      setIsLoading(false);
      navigate("/interests");
    } catch (err: any) {
      console.error("Profile update failed", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.message || "Failed to save profile. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen p-6">
      <div className="mb-8">
        <button
          onClick={() => navigate("/verify-otp")}
          className="text-gray-500 flex items-center"
        >
          <ArrowLeft size={20} className="mr-1" />
          <span>Back</span>
        </button>
      </div>

      <div className="flex-1 flex flex-col max-w-md mx-auto w-full">
        <h1 className="text-2xl font-bold mb-2 text-gray-800">
          Personal Details
        </h1>

        <p className="text-gray-500 mb-8">
          Your information is under our security guidelines and not allowed to be shared with third party.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              id="name"
              name="name"
              placeholder="Name"
              value={formData.name}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Input
              id="dateOfBirth"
              name="dateOfBirth"
              type="date"
              placeholder="Date of Birth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Select
              value={formData.gender}
              onValueChange={(value) => handleSelectChange("gender", value)}
            >
              <SelectTrigger className="pl-10 py-6 rounded-xl">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Select
              value={formData.profession}
              onValueChange={(value) => handleSelectChange("profession", value)}
            >
              <SelectTrigger className="pl-10 py-6 rounded-xl">
                <SelectValue placeholder="Select your profession" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="engineer">Engineer</SelectItem>
                <SelectItem value="doctor">Doctor</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="business">Business</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
            <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Select
              value={formData.maritalStatus}
              onValueChange={(value) => handleSelectChange("maritalStatus", value)}
            >
              <SelectTrigger className="pl-10 py-6 rounded-xl">
                <SelectValue placeholder="Select your marital status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
            <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Input
              id="referralCode"
              name="referralCode"
              placeholder="Referral code (optional)"
              value={formData.referralCode}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
            />
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            type="submit"
            className="w-full py-6 mt-4 bg-[#00D1A1] hover:bg-[#00BA90] text-white font-medium text-lg rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Next"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default PersonalDetailsForm;