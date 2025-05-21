import React, { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuth } from "../contexts/AuthContext";
import { ArrowLeft, User, Mail, Calendar, ChevronDown, Key, MapPin } from "lucide-react";
import { apiSaveUserDetails } from "../api";
import debounce from "lodash/debounce";

const LANGUAGES = [
  { id: 1, name: "hindi" },
  { id: 2, name: "bengali" },
  { id: 3, name: "marathi" },
  { id: 4, name: "telugu" },
  { id: 5, name: "tamil" },
  { id: 6, name: "gujarati" },
  { id: 7, name: "urdu" },
  { id: 8, name: "kannada" },
  { id: 9, name: "odia" },
  { id: 10, name: "malayalam" },
  { id: 11, name: "punjabi" },
  { id: 12, name: "english" },
];

const INTERESTS = [
  { id: 1, name: "Prepare for govt job" },
  { id: 2, name: "Look for jobs" },
  { id: 3, name: "Prepare for neet" },
  { id: 4, name: "Prepare for upsc" },
  { id: 5, name: "To learn English" },
  { id: 6, name: "To learn Hindi" },
  { id: 7, name: "To learn software" },
  { id: 8, name: "To learn AI" },
  { id: 9, name: "To prepare for CA" },
  { id: 10, name: "Doctor" },
  { id: 11, name: "Prepare for jobs" },
  { id: 12, name: "To learn stock market" },
  { id: 13, name: "To learn something new" },
  { id: 14, name: "To learn save environment" },
  { id: 15, name: "To learn marketing" },
  { id: 16, name: "Fashion design" },
  { id: 17, name: "Writer" },
  { id: 18, name: "Law" },
  { id: 19, name: "Marketing" },
  { id: 20, name: "Sports" },
  { id: 21, name: "Science and Technology" },
  { id: 22, name: "History and Archaeology" },
  { id: 23, name: "Health and Fitness" },
  { id: 24, name: "Medicine and Healthcare" },
  { id: 25, name: "Cooking and Culinary Arts" },
  { id: 26, name: "Literature and Books" },
  { id: 27, name: "Philosophy and Ethics" },
  { id: 28, name: "Movies and Entertainment" },
  { id: 29, name: "Spirituality and Religion" },
  { id: 30, name: "Psychology and Behavior" },
  { id: 31, name: "Business and Startups" },
  { id: 32, name: "Music and Arts" },
  { id: 33, name: "Travel and Adventure" },
  { id: 34, name: "Languages and Linguistics" },
  { id: 35, name: "Parenting and Family" },
  { id: 36, name: "Environmental Issues" },
  { id: 37, name: "Education and Learning" },
  { id: 38, name: "Gaming and Esports" },
  { id: 39, name: "Chief" },
  { id: 40, name: "Copyright" },
  { id: 41, name: "Artist" },
  { id: 42, name: "Graphical design" },
  { id: 43, name: "Accounts" },
  { id: 44, name: "Lawyer" },
  { id: 45, name: "Dance" },
  { id: 46, name: "Agriculture" },
  { id: 47, name: "Automobile work" },
  { id: 48, name: "Astrology" },
  { id: 49, name: "Casual talk" },
  { id: 50, name: "Teacher" },
];

const PersonalDetailsForm = () => {
  const [formData, setFormData] = useState({
    name: "",
    firstname: "",
    lastname: "",
    email: "",
    dateOfBirth: "",
    gender: "",
    profession: "",
    maritalStatus: "",
    referralCode: "",
    address: "",
    pincode: "",
    longitude: "",
    latitude: "",
    language: "" as number | "",
    interest: "" as number | "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const navigate = useNavigate();
  const { updateUserProfile, user } = useAuth();

  useEffect(() => {
    console.log("Rendering PersonalDetailsForm", {
      user,
      localStorage: {
        mobile_number: localStorage.getItem("mobile_number"),
        tempUserId: localStorage.getItem("tempUserId"),
        adtip_user: localStorage.getItem("adtip_user"),
      },
    });
    if (user?.isRegistered) {
      console.warn("User already registered, redirecting to /home", { user });
      navigate("/home", { replace: true });
    }
  }, [user, navigate]);

  const requestLocation = useCallback(() => {
    if (navigator.geolocation) {
      setIsLoading(true);
      setLocationError("");
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData((prev) => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          setIsLoading(false);
        },
        (err) => {
          setLocationError("Failed to get location. Please enter manually.");
          setIsLoading(false);
          console.error("Geolocation error:", err);
        },
        { timeout: 5000 }
      );
    } else {
      setLocationError("Geolocation is not supported by your browser.");
    }
  }, []);

  const handleChange = useCallback(
    debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    }, 300),
    []
  );

  const handleSelectChange = useCallback((name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleLanguageChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, language: value ? Number(value) : "" }));
  }, []);

  const handleInterestChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, interest: value ? Number(value) : "" }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.name.trim()) {
      setError("Please enter your full name");
      return;
    }
    if (!formData.firstname.trim()) {
      setError("Please enter your first name");
      return;
    }
    if (!formData.lastname.trim()) {
      setError("Please enter your last name");
      return;
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email");
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
    if (!formData.address.trim()) {
      setError("Please enter your address");
      return;
    }
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode)) {
      setError("Please enter a valid 6-digit pincode");
      return;
    }
    if (!formData.latitude || !formData.longitude) {
      setError("Please provide latitude and longitude or allow location access");
      return;
    }
    if (!formData.language) {
      setError("Please select a language");
      return;
    }
    if (!formData.interest) {
      setError("Please select an interest");
      return;
    }

    setIsLoading(true);

    try {
      const userId = user?.id || localStorage.getItem("tempUserId");
      if (!userId) {
        setError("User ID is missing. Please log in again.");
        navigate("/login");
        return;
      }

      const payload = {
        id: parseInt(userId),
        name: formData.name,
        firstname: formData.firstname,
        lastname: formData.lastname,
        emailId: formData.email,
        dob: formData.dateOfBirth,
        gender: formData.gender,
        profession: formData.profession,
        maternal_status: formData.maritalStatus,
        referal_code: formData.referralCode || "",
        address: formData.address,
        pincode: formData.pincode,
        longitude: formData.longitude,
        latitude: formData.latitude,
        languages: formData.language ? [formData.language] : [],
        interests: formData.interest ? [formData.interest] : [],
        profile_image: "",
      };
      console.log("Saving personal details:", JSON.stringify(payload, null, 2));
      await apiSaveUserDetails(payload);

      updateUserProfile({
        name: formData.name,
        email: formData.email,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        profession: formData.profession,
        maritalStatus: formData.maritalStatus,
        languages: formData.language
          ? LANGUAGES.find((l) => l.id === formData.language)?.name || ""
          : "",
        interests: formData.interest
          ? [INTERESTS.find((i) => i.id === formData.interest)?.name || ""]
          : [],
        isRegistered: true,
      });
      console.log("Navigating to /home after saving details");
      navigate("/home", { replace: true });
    } catch (err: any) {
      console.error("Profile update failed", {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
      });
      setError(err.message || "Failed to save profile. Please try again.");
    } finally {
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
        <h1 className="text-2xl font-bold mb-2 text-gray-800">Personal Details</h1>
        <p className="text-gray-500 mb-8">
          Your information is under our security guidelines and not allowed to be shared with third party.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Input
              name="name"
              placeholder="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
              disabled={isLoading}
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Input
              name="firstname"
              placeholder="First Name"
              value={formData.firstname}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
              disabled={isLoading}
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Input
              name="lastname"
              placeholder="Last Name"
              value={formData.lastname}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
              disabled={isLoading}
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
              disabled={isLoading}
            />
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Input
              name="dateOfBirth"
              type="date"
              placeholder="Date of Birth"
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
              disabled={isLoading}
            />
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Select
              value={formData.gender}
              onValueChange={(value) => handleSelectChange("gender", value)}
              disabled={isLoading}
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
              disabled={isLoading}
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
              disabled={isLoading}
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
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
              disabled={isLoading}
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Input
              name="pincode"
              placeholder="Pincode"
              value={formData.pincode}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
              disabled={isLoading}
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="space-y-2">
            <Button
              type="button"
              onClick={requestLocation}
              className="w-full py-6 bg-[#00D1A1] hover:bg-[#00BA90] text-white font-medium text-lg rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? "Fetching Location..." : "Get Current Location"}
            </Button>
            {locationError && <p className="text-red-500 text-sm">{locationError}</p>}
          </div>

          <div className="relative">
            <Input
              name="latitude"
              placeholder="Latitude"
              value={formData.latitude}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
              disabled={isLoading}
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Input
              name="longitude"
              placeholder="Longitude"
              value={formData.longitude}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
              disabled={isLoading}
            />
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Select
              value={formData.language ? formData.language.toString() : ""}
              onValueChange={handleLanguageChange}
              disabled={isLoading}
            >
              <SelectTrigger className="pl-10 py-6 rounded-xl">
                <SelectValue placeholder="Select a language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((lang) => (
                  <SelectItem key={lang.id} value={lang.id.toString()}>
                    {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Select
              value={formData.interest ? formData.interest.toString() : ""}
              onValueChange={handleInterestChange}
              disabled={isLoading}
            >
              <SelectTrigger className="pl-10 py-6 rounded-xl">
                <SelectValue placeholder="Select an interest" />
              </SelectTrigger>
              <SelectContent>
                {INTERESTS.map((interest) => (
                  <SelectItem key={interest.id} value={interest.id.toString()}>
                    {interest.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ChevronDown className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          <div className="relative">
            <Input
              name="referralCode"
              placeholder="Referral code (optional)"
              value={formData.referralCode}
              onChange={handleChange}
              className="pl-10 py-6 rounded-xl"
              disabled={isLoading}
            />
            <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button
            type="submit"
            className="w-full py-6 mt-4 bg-[#00D1A1] hover:bg-[#00BA90] text-white font-medium text-lg rounded-xl"
            disabled={isLoading}
          >
            {isLoading ? "Saving..." : "Finish"}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default React.memo(PersonalDetailsForm);
