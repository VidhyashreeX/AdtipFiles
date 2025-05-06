
import { createBrowserRouter } from "react-router-dom";
import App from "./App";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import EarnOpportunities from "./pages/EarnOpportunities";
import Login from "./pages/Login";
import OTPVerification from "./pages/OTPVerification";
import PersonalDetails from "./pages/PersonalDetails";
import Home from "./pages/Home";
import TipTube from "./pages/TipTube";
import TipCall from "./pages/TipCall";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import CreatePost from "./pages/CreatePost";
import Wallet from "./components/Wallet";
import Interests from "./pages/Interests";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import HowToEarnCreator from "./pages/HowToEarnCreator";
import HowToEarnUser from "./pages/HowToEarnUser";
import Refer from "./pages/Refer";
import AdsTracker from "./pages/AdsTracker";
import Premium from "./pages/Premium";
import Settings from "./pages/Settings";
import ContactUs from "./pages/Contactus";


export const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { index: true, element: <Index /> },
      { path: "onboarding", element: <Onboarding /> },
      { path: "earn-opportunities", element: <EarnOpportunities /> },
      { path: "login", element: <Login /> },
      { path: "verify-otp", element: <OTPVerification /> },
      { path: "personal-details", element: <PersonalDetails /> },
      { path: "interests", element: <Interests /> },
      { path: "home", element: <Home /> },
      { path: "tiptube", element: <TipTube /> },
      { path: "tipcall", element: <TipCall /> },
      { path: "profile", element: <Profile /> },
      { path: "edit-profile", element: <EditProfile /> },
      { path: "create-post", element: <CreatePost /> },
      { path: "wallet", element: <Wallet /> },
      { path: "terms", element: <TermsAndConditions /> },
      { path: "privacy", element: <PrivacyPolicy /> },
      { path: "how-to-earn-creator", element: <HowToEarnCreator /> },
  { path: "how-to-earn-user", element: <HowToEarnUser /> },
  { path: "refer", element: <Refer /> },
  { path: "ads-tracker", element: <AdsTracker /> },
  { path: "premium", element: <Premium /> },
  { path: "settings", element: <Settings /> },
  { path: "contact-us", element: <ContactUs /> },
      

      { path: "*", element: <NotFound /> }
    ]
  }
]);
