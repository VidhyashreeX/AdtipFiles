import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Wallet from "../components/Wallet";
import AddFunds from "../components/AddFunds";
import UpgradePremium from "../components/UpgradePremium";
import UpgradeContentPremium from "../components/UpgradeContentPremium";
import HowToEarnCreator from "../pages/HowToEarnCreator";
import HowToEarnUser from "../pages/HowToEarnUser";
import Refer from "../pages/Refer";
import AdsTracker from "../pages/AdsTracker";
import Settings from "../pages/Settings";
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

const ProtectedRoute = () => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const { isAuthenticated } = useAuth();
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
        <Route path="/home" element={<Home />} />
        <Route path="/wallet" element={<Wallet />} />
        <Route path="/add-funds" element={<AddFunds />} />
        <Route path="/upgrade-premium" element={<UpgradePremium />} />
        <Route path="/upgrade-content-premium" element={<UpgradeContentPremium />} />
        <Route path="/how-to-earn-creator" element={<HowToEarnCreator />} />
        <Route path="/how-to-earn-user" element={<HowToEarnUser />} />
        <Route path="/refer" element={<Refer />} />
        <Route path="/ads-tracker" element={<AdsTracker />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/edit-profile" element={<EditProfile />} />
        <Route path="/personal-details" element={<PersonalDetails />} />
        <Route path="/interests" element={<Interests />} />
      </Route>

      {/* Fallback Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;