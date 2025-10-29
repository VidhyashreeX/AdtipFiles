import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { lazy, Suspense } from "react";

// Lazy load all page components for code splitting
const Analytics = lazy(() => import('./pages/Analytics'));
const App = lazy(() => import("./App"));
const Index = lazy(() => import("./pages/Index"));
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const OTPVerification = lazy(() => import("./pages/OTPVerification"));
const Profile = lazy(() => import("./pages/Profile"));
const EditProfile = lazy(() => import("./pages/EditProfile"));
const TipTube = lazy(() => import("./pages/TipTube"));
const WatchPage = lazy(() => import("./pages/WatchPage"));
const TipShorts = lazy(() => import("./pages/TipShorts"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const PersonalDetails = lazy(() => import("./pages/PersonalDetails"));
const Interests = lazy(() => import("./pages/Interests"));
const CreatePost = lazy(() => import("./pages/CreatePost"));
const LiveStream = lazy(() => import("./pages/LiveStream"));
const StartStream = lazy(() => import("./pages/StartStream"));
const LiveStreaming = lazy(() => import("./pages/LiveStreaming"));
const TipCall = lazy(() => import("./pages/TipCall"));
const Refer = lazy(() => import("./pages/Refer"));
const Premium = lazy(() => import("./pages/Premium"));
const TipShop = lazy(() => import("./pages/marketplace/TipShop"));
const BecomeSeller = lazy(() => import("./pages/marketplace/BecomeSeller"));
const ProductDetail = lazy(() => import("./pages/marketplace/ProductDetail"));
const ProductDetailView = lazy(() => import("./pages/ProductDetailView"));
const ListProductsPage = lazy(() => import("./pages/ListProductsPage"));
const ListProductFinish = lazy(() => import("./pages/marketplace/ListProductFinish"));
const AddProduct = lazy(() => import("./pages/marketplace/AddProduct"));
const AddService = lazy(() => import("./pages/marketplace/AddService"));
const Checkout = lazy(() => import("./pages/marketplace/Checkout"));
const OrderConfirmation = lazy(() => import("./pages/marketplace/OrderConfirmation"));
const BecomeSellerFullPage = lazy(() => import("./pages/BecomeSellerFullPage"));
const PremiumContent = lazy(() => import("./pages/marketplace/PremiumContent"));
const PostAds = lazy(() => import("./pages/marketplace/PostAds"));
const Analysis = lazy(() => import("./pages/marketplace/Analysis"));
const ContactUs = lazy(() => import("./pages/ContactUs"));
const Settings = lazy(() => import("./pages/Settings"));
const TermsAndConditions = lazy(() => import("./pages/TermsAndConditions"));
const AdsTracker = lazy(() => import("./pages/AdsTracker"));
const HowToEarnCreator = lazy(() => import("./pages/HowToEarnCreator"));
const HowToEarnUser = lazy(() => import("./pages/HowToEarnUser"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const EarnOpportunities = lazy(() => import("./pages/EarnOpportunities"));
const Cart = lazy(() => import("./pages/marketplace/Cart"));
const MyOrders = lazy(() => import("./pages/marketplace/MyOrders"));
const Favorites = lazy(() => import("./pages/marketplace/Favorites"));
const CompleteProfile = lazy(() => import("./pages/CompleteProfile"));
const PricingOffers = lazy(() => import("./pages/PricingOffers"));
const ChoosePlan = lazy(() => import("./pages/ChoosePlan"));
const RazorpayCheckout = lazy(() => import("@/pages/RazorpayCheckout"));
const Wallet = lazy(() => import("./components/Wallet"));
const ChannelPage = lazy(() => import("./pages/ChannelPage"));
const SearchResults = lazy(() => import("./pages/SearchResults"));
const SellerDashboard = lazy(() => import("./pages/SellerDashboard"));
const SellerAddProduct = lazy(() => import("./pages/AddProduct"));
const SellerAddPost = lazy(() => import("./pages/AddPost"));
const ViewAllProducts = lazy(() => import("./pages/ViewAllProducts"));
const ViewAllPosts = lazy(() => import("./pages/ViewAllPosts"));
const AdModel = lazy(() => import("./pages/AdModel"));
const ViewAllReviews = lazy(() => import("./pages/ViewAllReviews"));
const ConfigureCampaign = lazy(() => import("./pages/ConfigureCampaign"));
const UploadCreative = lazy(() => import("./pages/UploadCreative"));
const PreviewAd = lazy(() => import("./pages/PreviewAd"));
const AdsCart = lazy(() => import("./pages/AdsCart"));
const PaymentGateway = lazy(() => import("./pages/PaymentGateway"));
const AdOrders = lazy(() => import("./pages/AdOrders"));
const AdAnalytics = lazy(() => import("./pages/AdAnalytics"));
const AdDashboard = lazy(() => import("./pages/AdDashboard"));
const AdOrderDetail = lazy(() => import("./pages/AdOrderDetail"));
const SellerRegistration = lazy(() => import("./components/SellerRegistration"));
const EditSellerInfo = lazy(() => import("./components/EditSellerInfo"));
const BecomeAdvertiserRedirect = lazy(() => import("./components/BecomeAdvertiserRedirect"));
const BecomeAdvertiserLanding = lazy(() => import("./pages/BecomeAdvertiserLanding"));
const Publisher = lazy(() => import("./pages/Publisher"));
const PublisherDashboard = lazy(() => import("./pages/PublisherDashboard"));

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
				path: "analytics",
				element: <Analytics />,
			},
			{
				path: "edit-profile",
				element: <EditProfile />,
			},
			{
    path: "channel/",
    element: <ChannelPage />,
},
			{
				path: "watch",
				element: <TipTube />,
			},
			{
				path: "watch/:id",
				element: <WatchPage />,
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
				path: "livestream",
				element: <LiveStream />,
			},
			{
				path: "start-stream",
				element: <StartStream />,
			},
			{
				path: "live-streaming",
				element: <LiveStreaming />,
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
				element: <BecomeAdvertiserRedirect />,
			},
			{
				path: "become-advertiser-landing",
				element: <BecomeAdvertiserLanding />,
			},
			{
				path: "publisher",
				element: <Publisher />,
			},
			{
				path: "publisher-dashboard",
				element: <PublisherDashboard />,
			},
			{
				path: "product/:id",
				element: <ProductDetailView />,
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
				element: <AdModel />,
			},
		
			{
				path: "/analysis/:channelId",
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
				path: "search",
				element: <SearchResults />,
			},
			{
				path: "seller/dashboard",
				element: <SellerDashboard />,
			},
			{
				path: "seller-dashboard",
				element: <SellerDashboard />,
			},
			{
				path: "seller/add-product",
				element: <SellerAddProduct />,
			},
			{
				path: "seller/add-post",
				element: <SellerAddPost />,
			},
			{
				path: "seller/products",
				element: <ViewAllProducts />,
			},
			{
				path: "seller/posts",
				element: <ViewAllPosts />,
			},
			{
				path: "seller/ad-model",
				element: <AdModel />,
			},
			{
				path: "seller/reviews",
				element: <ViewAllReviews />,
			},
			{
				path: "seller/configure-campaign",
				element: <ConfigureCampaign />,
			},
			{
				path: "seller/upload-creative",
				element: <UploadCreative />,
			},
			{
				path: "seller/preview-ad",
				element: <PreviewAd />,
			},
			{
				path: "seller/ads-cart",
				element: <AdsCart />,
			},
			{
				path: "seller/payment-gateway",
				element: <PaymentGateway />,
			},
			{
				path: "seller/ad-orders",
				element: <AdOrders />,
			},
			{
				path: "seller/ad-analytics/:id",
				element: <AdAnalytics />,
			},
			{
				path: "seller/ad-dashboard",
				element: <AdDashboard />,
			},
			{
				path: "seller/ad-order/:orderId",
				element: <AdOrderDetail />,
			},
			{
				path: "seller/register",
				element: <SellerRegistration />,
			},
			{
				path: "seller/edit-info",
				element: <EditSellerInfo />, 
			},
			{
				path: "*",
				element: <NotFound />,
			},
		],
	},
]);

// Loading component for Suspense fallback
const LoadingFallback = () => (
	<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
		<div className="text-center">
			<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-adtip-teal mx-auto mb-4"></div>
			<p className="text-gray-600 dark:text-gray-400">Loading...</p>
		</div>
	</div>
);

// Wrap router with Suspense for lazy loading
const AppRouter = () => (
	<Suspense fallback={<LoadingFallback />}>
		<RouterProvider router={router} />
	</Suspense>
);

export default AppRouter;
