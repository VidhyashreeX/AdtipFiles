import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import EnhancedWallet from "../components/EnhancedWallet";
import EnhancedAddFunds from "../components/EnhancedAddFunds";
import UpgradePremium from "../components/UpgradePremium";
import UpgradeContentPremium from "../components/UpgradeContentPremium";
import HowToEarnCreator from "../pages/HowToEarnCreator";
import HowToEarnUser from "../pages/HowToEarnUser";
import Refer from "../pages/Refer";
import AdsTracker from "../pages/AdsTracker";
import Settings from "../pages/Settings";
import Follow from "../pages/Follow";
import ContactUs from "../pages/ContactUs";
import TermsAndConditions from "../pages/TermsAndConditions";
import Profile from "../pages/Profile";
import EditProfile from "../pages/EditProfile";
import Login from "../pages/Login";
import OTPVerification from "../pages/OTPVerification";
import Onboarding from "../pages/Onboarding";
import PersonalDetails from "../pages/PersonalDetails";
import Interests from "../pages/Interests";
import NotFound from "../pages/NotFound";
import Home from "../pages/Home";
import CompleteProfile from "../pages/CompleteProfile";
import TipShorts from "../pages/TipShorts";
import TipTube from "@/pages/TipTube";
import WatchPage from "@/pages/WatchPage";
import ChannelPage from "@/pages/ChannelPage";
import TipCall from "../pages/TipCall";
import LiveStream from "../pages/LiveStream";
import LiveStreaming from "../pages/LiveStreaming";
import StartStream from "../pages/StartStream";
import EnhancedLiveStreaming from "../pages/EnhancedLiveStreaming";
import EnhancedLiveStream from "../pages/EnhancedLiveStream";
import LiveStreamComparison from "../pages/LiveStreamComparison";
import EnhancedCreatePost from "../pages/EnhancedCreatePost";
import CreateChannel from "../pages/CreateChannel";
import EnhancedHome from "../pages/EnhancedHome";
import CurrencyDemo from "../pages/CurrencyDemo";

const ProtectedRoute = () => {
  const { isAuthenticated, authLoading } = useAuth();
  if (authLoading) return <div>Loading...</div>;
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const { isAuthenticated, authLoading } = useAuth();
  if (authLoading) return <div>Loading...</div>;
  return !isAuthenticated ? <Outlet /> : <Navigate to="/home" replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/verify-otp" element={<OTPVerification />} />
        <Route path="/onboarding" element={<Onboarding />} />
      </Route>

      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/complete-profile" element={<CompleteProfile />} />
        <Route path="/personal-details" element={<PersonalDetails />} />
        <Route path="/interests" element={<Interests />} />
        <Route path="/watch/:id" element={<WatchPage />} />
        <Route path="/watch" element={<TipTube />} />
        <Route path="/tiptube" element={<Navigate to="/watch" replace />} />
        <Route path="/short/:id?" element={<TipShorts />} />
        <Route path="/tipshorts" element={<Navigate to="/short" replace />} />
        <Route path="/channel/:channelName" element={<ChannelPage />} />
        <Route path="/tipcall" element={<TipCall />} />
        <Route path="/livestream" element={<EnhancedLiveStream />} />
        <Route path="/livestream-old" element={<LiveStream />} />
        <Route path="/livestream-comparison" element={<LiveStreamComparison />} />
        <Route path="/start-stream" element={<StartStream />} />
        <Route path="/live-streaming" element={<EnhancedLiveStreaming />} />
        <Route path="/streaming-old" element={<LiveStreaming />} />
        <Route path="/home" element={<Home />} />
        <Route path="/wallet" element={<EnhancedWallet />} />
        <Route path="/add-funds" element={<EnhancedAddFunds />} />
        <Route path="/upgrade-premium" element={<UpgradePremium />} />
        <Route path="/upgrade-content-premium" element={<UpgradeContentPremium />} />
        <Route path="/how-to-earn-creator" element={<HowToEarnCreator />} />
        <Route path="/how-to-earn-user" element={<HowToEarnUser />} />
        <Route path="/refer" element={<Refer />} />
        <Route path="/ads-tracker" element={<AdsTracker />} />
        <Route path="/follow" element={<Follow />} />
        <Route path="/contact-us" element={<ContactUs />} />
        <Route path="/terms" element={<TermsAndConditions />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/create-post" element={<EnhancedCreatePost />} />
        <Route path="/create-channel" element={<CreateChannel />} />
        <Route path="/enhanced-home" element={<EnhancedHome />} />
        <Route path="/currency-demo" element={<CurrencyDemo />} />
        <Route path="/engagement-demo" element={<div className="p-4"><div className="max-w-6xl mx-auto"><h1 className="text-2xl font-bold mb-4">Engagement Demo</h1><p>Demo component would go here</p></div></div>} />
      </Route>

      {/* Fallback Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;