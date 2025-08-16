import { createBrowserRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Login from "./pages/Login";
import OTPVerification from "./pages/OTPVerification";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import TipTube from "./pages/TipTube";
import TipShorts from "./pages/TipShorts";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import PersonalDetails from "./pages/PersonalDetails";
import Interests from "./pages/Interests";
import CreatePost from "./pages/CreatePost";
import TipCall from "./pages/TipCall";
import Refer from "./pages/Refer";
import Premium from "./pages/Premium";
import TipShop from "./pages/marketplace/TipShop";
import BecomeSeller from "./pages/marketplace/BecomeSeller";
import ProductDetail from "./pages/marketplace/ProductDetail";
import ListProductsPage from "./pages/ListProductsPage";
import ListProductFinish from "./pages/marketplace/ListProductFinish";
import AddProduct from "./pages/marketplace/AddProduct";
import AddService from "./pages/marketplace/AddService";
import Checkout from "./pages/marketplace/Checkout";
import OrderConfirmation from "./pages/marketplace/OrderConfirmation";
import BecomeSellerFullPage from "./pages/BecomeSellerFullPage";
import PremiumContent from "./pages/marketplace/PremiumContent";
import PostAds from "./pages/marketplace/PostAds";
import Analysis from "./pages/marketplace/Analysis";
import ContactUs from "./pages/ContactUs";
import Settings from "./pages/Settings";
import TermsAndConditions from "./pages/TermsAndConditions";
import AdsTracker from "./pages/AdsTracker";
import HowToEarnCreator from "./pages/HowToEarnCreator";
import HowToEarnUser from "./pages/HowToEarnUser";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import EarnOpportunities from "./pages/EarnOpportunities";
import Cart from "./pages/marketplace/Cart";
import MyOrders from "./pages/marketplace/MyOrders";
import Favorites from "./pages/marketplace/Favorites";
import CompleteProfile from "./pages/CompleteProfile";
import PricingOffers from "./pages/PricingOffers";
import ChoosePlan from "./pages/ChoosePlan";
import RazorpayCheckout from "@/pages/RazorpayCheckout";
import Wallet from "./components/Wallet";
import ChannelPage from "./pages/ChannelPage";

const router = createBrowserRouter([
	{
		path: "/",
		element: <App />,
		children: [
			{
				path: "",
				element: <Index />,
			},
			{
				path: "home",
				element: <Home />,
			},
			{
				path: "login",
				element: <Login />,
			},
			{
				path: "verify-otp",
				element: <OTPVerification />,
			},
			{
				path: "profile",
				element: <Profile />,
			},
			{
				path: "edit-profile",
				element: <EditProfile />,
			},
			{
    path: "channel/:channelName",
    element: <ChannelPage />,
},

			{
				path: "watch/:id?",
				element: <TipTube />,
			},
			{
				path: "short/:id?",
				element: <TipShorts />,
			},
				{path:"/post/:postId?" ,
				element:<Home/>},
			{
				path: "onboarding",
				element: <Onboarding />,
			},
			{
				path: "otp-verification",
				element: <OTPVerification />,
			},
			{
				path: "personal-details",
				element: <PersonalDetails />,
			},
			{
				path: "interests",
				element: <Interests />,
			},
			{
				path: "create-post",
				element: <CreatePost />,
			},
			{
				path: "tipcall",
				element: <TipCall />,
			},
			{
				path: "refer",
				element: <Refer />,
			},
			{
				path: "premium",
				element: <Premium />,
			},
			{
				path: "tip-shop",
				element: <TipShop />,
			},
			{
				path: "become-seller",
				element: <BecomeSeller />,
			},
			{
				path: "product/:id",
				element: <ProductDetail />,
			},
			{
				path: "list-products",
				element: <ListProductsPage />,
			},
			{
				path: "list-products/finish",
				element: <ListProductFinish />,
			},
			{
				path: "marketplace/add-product",
				element: <AddProduct />,
			},
			{
				path: "marketplace/add-service",
				element: <AddService />,
			},
			{
				path: "checkout",
				element: <Checkout />,
			},
			{
				path: "order-confirmation",
				element: <OrderConfirmation />,
			},
			{
				path: "become-seller-full",
				element: <BecomeSellerFullPage />,
			},
			{
				path: "premium-content",
				element: <PremiumContent />,
			},
			{
				path: "post-ads",
				element: <PostAds />,
			},
		
			{
				path: "analysis",
				element: <Analysis />,
			},
			{
				path: "contact-us",
				element: <ContactUs />,
			},
			{
				path: "settings",
				element: <Settings />,
			},
			{
				path: "terms",
				element: <TermsAndConditions />,
			},
			{
				path: "privacy",
			 element: <PrivacyPolicy />,
			},
			{
				path: "ads-tracker",
				element: <AdsTracker />,
			},
			{
				path: "how-to-earn-creator",
				element: <HowToEarnCreator />,
			},
			{
				path: "how-to-earn-user",
				element: <HowToEarnUser />,
			},
			{
				path: "earn-opportunities",
				element: <EarnOpportunities />,
			},
			{
				path: "marketplace/cart",
				element: <Cart />,
			},
			{
				path: "marketplace/my-orders",
				element: <MyOrders />,
			},
			{
				path: "marketplace/favorites",
				element: <Favorites />,
			},
			{
				path: "complete-profile",
				element: <CompleteProfile />,
			},
			{
				path: "/pricingoffers",
				element: <PricingOffers />,
			},
			{
				path: "chooseplan",
				element: <ChoosePlan />,
			},
			{
				path: "/razorpay-checkout",
				element: <RazorpayCheckout />,
			},
			{
				path: "wallet",
				element: <Wallet />,
			},
			{
				path: "*",
				element: <NotFound />,
			},
		],
	},
]);

export default router;
