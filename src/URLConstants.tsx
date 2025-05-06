// src/apiConstants.ts

// Set the BASE_URL dynamically based on your environment or preference
let BASE_URL = 'https://adtip.page.link'; // Default URL, can be changed dynamically based on environment
let LOCAL_URL = 'http://localhost:5000'; // Adjust as needed for local development

// API URLs
export const URLConstants = {
  kUriPrefix: 'https://adtip.page.link',
  appUrl: 'https://play.google.com/store/apps/details?id=com.adtip.app.adtip_app',
  gMapApiKey: 'AIzaSyB52k6PZDz7O_LnbFRW50xA4VQWbywiink',

  // Staging or Production BASE_URL can be set here
  BASE_URL: BASE_URL,
  LOCAL_URL: LOCAL_URL,

  // General API endpoints
  Get_Comment_List: `${BASE_URL}getcommentsofvideos/`,
  getLanguagesApi: `${BASE_URL}getlanguages`,
  getInterestsApi: `${BASE_URL}getinterests`,
  createRazorPayOrderId: `${BASE_URL}razorpay-order`,
  getRazorPayKey: `${BASE_URL}razorpay-details`,
  razorpayPaymentVerify: `${BASE_URL}razorpay-verification`,
  getUserDetails: `${BASE_URL}users`,
  getPostCategories: `${BASE_URL}categories`,
  createPost: `${BASE_URL}post`,
  updatePost: `${BASE_URL}update-post`,
  deleteUserPost: `${BASE_URL}post/delete`,
  getPosts: `${BASE_URL}list-posts`,
  updateUser: `${BASE_URL}updateuser`,
  blockUser: `${BASE_URL}block-user`,

  // New POST & GET API Endpoints
  // OTP login
  otpLogin: `${BASE_URL}/api/otplogin`,
  otpVerify: `${BASE_URL}/api/otpverify`,
  logout: `${BASE_URL}/api/logout`,

  // GET Request for ping and funds
  pingApi: `${BASE_URL}/api/ping`,
  getFundsApi: (userId: number) => `${BASE_URL}/api/getfunds/${userId}`, // Dynamic userId

  // Razorpay related POST Endpoints
  razorpayOrder: `${LOCAL_URL}/api/razorpay-order`,
  razorpayVerification: `${LOCAL_URL}/api/razorpay-verification`,

  // Calls APIs
  initiateCall: `${BASE_URL}call`,    // Used for both call initiate and call end need to change the body alone
  checkUserStatus: (receiverId: number) => `${BASE_URL}user/${receiverId}/call-status`,

  // Wallets APIs
  getUserFunds: `${BASE_URL}getfunds`,
  getAnalytics: `${BASE_URL}analytics`,

  // Banners APIs
  getSliderBanners: `${BASE_URL}media?file_type=banner`,

  // Coupons APIs
  couponList: `${BASE_URL}coupons`,
  applyCoupon: `${BASE_URL}apply-coupon`,

  // Premium Packages APIs
  getPremiumDetails: `${BASE_URL}getpremium`,
  getPremiumPlanDetails: `${BASE_URL}getpremium-plans`,
  upgradePremium: `${BASE_URL}upgrade-premium`,
  checkUserPremium: `${BASE_URL}check-premium`,

  // Product APIs
  Save_Comment: `${BASE_URL}savevideocomment`,
  Save_Channel: `${BASE_URL}savemychannel`,
  getVideoByChannel: (channelId: number) => `${BASE_URL}getvideobychannel/${channelId}`,
  getProductList: `${BASE_URL}getProductlist/`,
  getProductDetails: (productId: number) => `${BASE_URL}productbyproductid/${productId}`,
  getCompanyListURL: `${BASE_URL}getcompanylist/`,
  getProfessionListURL: `${BASE_URL}gettargetprofession`,
  getAreaListURL: `${BASE_URL}gettargetareas`,

  // Ads APIs
  getButtonListURL: `${BASE_URL}getbuttons`,
  getAdModelsListURL: `${BASE_URL}getadmodels`,
  savefirstpageadmodelURL: `${BASE_URL}savefirstpageadmodel`,
  savesecondpageadmodelURL: `${BASE_URL}savesecondpageadmodel`,
  saveThirdpageadmodelURL: `${BASE_URL}savethirdpageadmodel`,
  saveGetalladdsURL: `${BASE_URL}getalladds`,
  getproductCategary: `${BASE_URL}productcategory/`,
  addproduct: `${BASE_URL}addproduct/`,
  editproduct: `${BASE_URL}updateproducString`,
  myLikeUrl: `${BASE_URL}getmylikead/`,
  couponUrl: `${BASE_URL}getcoupon`,
  demoRequestUrl: `${BASE_URL}requestdemo`,
  lastDataComapnyUrl: `${BASE_URL}getLastaddetails/`,
  
  // Video APIs
  shortVideoUrl: `${BASE_URL}getshots/`,
  followChannelUrl: `${BASE_URL}updatecompanydetails`,
  likeVideoUrl: `${BASE_URL}savevideodetails`,
  getFollowCompanyUrl: `${BASE_URL}getfollowcompany/`,
  getCommentVideoUrl: `${BASE_URL}getcommentsofvideos/`,
  getOtherCompanyListUrl: `${BASE_URL}getothercompanylist/`,
  followChannelsUrl: `${BASE_URL}saveChannelDetails`,
  replyCommentUrl: `${BASE_URL}savevideocomment`,
  selfChannelUrl: `${BASE_URL}getchannelbyuserid/`,
  getProductByUseridUrl: `${BASE_URL}getProductByUserid`,

  // Admin APIs
  getAdminUrl: `${BASE_URL}getalladmins/`,
  addAdminUrl: `${BASE_URL}saveadmin`,
  deleteAdminUrl: `${BASE_URL}deleteadmin`,
  editAdminUrl: `${BASE_URL}updateadmin`,
  
  // Chatting APIs
  chattingApiGetSentNotificationUrl: `${BASE_URL}getsentnotification/`,
  chattingApiGetMessagesUrl: `${BASE_URL}getmessages/`,
  chattingApiGetOneToOneMessagesUrl: `${BASE_URL}getmessage/`,
  chattingApiSaveUserDeviceTokenUrl: `${BASE_URL}saveuserdevicetoken`,
  chattingApiSendMessageUrl: `${BASE_URL}sendmessage`,
  chattingApiDeleteMessagesUrl: `${BASE_URL}deletemessages`,
  
  // Wallet APIs
  withdrawFundApiUrl: `${BASE_URL}withdrawFund`,
  withdrawContentCreatorAmount: `${BASE_URL}withdraw`,
  
  // Company APIs
  getSingleCompany: `${BASE_URL}getcompany`,
  createNewCompany: `${BASE_URL}createnewcompany`,
  updateCompany: `${BASE_URL}updatecompany`,
  deletePost: `${BASE_URL}deletepost`,
  getAllCompany: `${BASE_URL}getallcompanylist/`,
  getpostDetails: `${BASE_URL}getPostDetails`,
};

