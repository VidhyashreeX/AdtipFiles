import React from "react";

const apiData = [
  {
    category: "User Authentication and Management",
    apis: [
      { method: "POST", path: "/auth/register", description: "Register a new user" },
      { method: "POST", path: "/otplogin", description: "Save login OTP" },
      { method: "POST", path: "/logout", description: "User logout" },
      { method: "POST", path: "/otpverify", description: "Verify OTP" },
      { method: "POST", path: "/saveuserdetails", description: "Save user details" },
      { method: "POST", path: "/updateuser", description: "Update user information" },
      { method: "GET", path: "/getuser/:id", description: "Get user details by ID" },
      { method: "GET", path: "/users/mobile/:mobile_number", description: "Get user by mobile number" },
      { method: "POST", path: "/users/multiple", description: "Get multiple users" },
    ],
  },
  {
    category: "User Status and Notifications",
    apis: [
      { method: "GET", path: "/deleteStatus/:statusId", description: "Delete user status" },
      { method: "GET", path: "/getOtherUserStatusList/:userId", description: "Get other user status list" },
      { method: "GET", path: "/getStatusViewersList/:statusId", description: "Get viewers of a status" },
      { method: "POST", path: "/addStatus", description: "Add a new status" },
      { method: "GET", path: "/getCurrentUserStatusList/:userId", description: "Get current user status list" },
      { method: "POST", path: "/addStatusViewers", description: "Add viewers to a status" },
      { method: "POST", path: "/saveNotifications", description: "Save notifications" },
      { method: "GET", path: "/getNotifications/:userId/:page/:limit", description: "Get notifications for a user" },
    ],
  },
  {
    category: "Company Management",
    apis: [
      { method: "GET", path: "/checkCompanyNameExist/:name", description: "Check if a company name exists" },
      { method: "POST", path: "/addCompanyGst", description: "Add company GST" },
      { method: "POST", path: "/savecompany", description: "Save company details" },
      { method: "POST", path: "/createcompany", description: "Create a new company" },
      { method: "GET", path: "/getcompanylist/:userId", description: "Get company list for a user" },
      { method: "GET", path: "/getallcompanylist/:userId", description: "Get all company list for a user" },
      { method: "GET", path: "/getcompany/:id/:userId", description: "Get company details by ID" },
      { method: "POST", path: "/updatecompany", description: "Update company details" },
      { method: "POST", path: "/deletecompany", description: "Delete a company" },
    ],
  },
  {
    category: "Product Management",
    apis: [
      { method: "GET", path: "/getallproduct", description: "Get all products" },
      { method: "POST", path: "/addproduct", description: "Add a new product" },
      { method: "POST", path: "/updateproduct", description: "Update product details" },
      { method: "POST", path: "/deleteProduct", description: "Delete a product" },
      { method: "GET", path: "/getProductlist/:companyId", description: "Get product list by company ID" },
      { method: "GET", path: "/getSingleProductById/:Id", description: "Get a single product by ID" },
      { method: "GET", path: "/getCategoryProduct", description: "Get products by category" },
      { method: "POST", path: "/savevproductsdetails", description: "Save product details" },
      { method: "GET", path: "/getWishList/:Id", description: "Get wishlist items" },
      { method: "POST", path: "/addToWishList", description: "Add product to wishlist" },
      { method: "GET", path: "/getSellerOrders/:userId", description: "Get seller orders" },
      { method: "GET", path: "/getUserOrders/:userId", description: "Get user orders" },
    ],
  },
  {
    category: "Ad Management",
    apis: [
      { method: "GET", path: "/getAdForShortVideo/:userId", description: "Get ad for short video" },
      { method: "GET", path: "/getadmodels", description: "Get ad models" },
      { method: "POST", path: "/savefirstpageadmodel", description: "Save first page ad model" },
      { method: "POST", path: "/savesecondpageadmodel", description: "Save second page ad model" },
      { method: "POST", path: "/savethirdpageadmodel", description: "Save third page ad model" },
      { method: "GET", path: "/getalladds/:userId", description: "Get all ads for a user" },
      { method: "POST", path: "/validatecoupon", description: "Validate a coupon" },
      { method: "GET", path: "/getcoupon", description: "Get coupon details" },
    ],
  },
  {
    category: "Wallet and Payment Management",
    apis: [
      { method: "POST", path: "/addfunds", description: "Add funds to wallet" },
      { method: "GET", path: "/getfunds/:id", description: "Get funds for a user" },
      { method: "GET", path: "/payUsingWallet/:userId/:requestAmount", description: "Pay using wallet" },
      { method: "POST", path: "/withdrawFund", description: "Withdraw funds from wallet" },
      { method: "POST", path: "/razorpay-order", description: "Create a Razorpay order" },
      { method: "POST", path: "/razorpay-verification", description: "Verify Razorpay payment" },
    ],
  },
  {
    category: "Reels and Video Management",
    apis: [
      { method: "POST", path: "/uploadcontent", description: "Upload content (videos, shorts, posts)" },
      { method: "GET", path: "/getvideos/:userid/:categoryid/:offset", description: "Get videos by user and category" },
      { method: "GET", path: "/getrecentlyuploadedvideo/:userid", description: "Get recently uploaded videos" },
      { method: "GET", path: "/getUserVideoViewLikeDetails/:userId/:page", description: "Get video view and like details" },
      { method: "GET", path: "/getvideobychannel/:videoType/:channelid/:userid", description: "Get videos by channel" },
      { method: "POST", path: "/savevideocomment", description: "Save a comment on a video" },
      { method: "GET", path: "/getcommentsofvideos/:userId/:videoId", description: "Get comments for a specific video" },
    ],
  },
  {
    category: "Chat Management",
    apis: [
      { method: "POST", path: "/sendmessage", description: "Send a message" },
      { method: "GET", path: "/getmessages/:userid", description: "Get messages for a user" },
      { method: "GET", path: "/getmessage/:loginuserid/:chattinguserid", description: "Get messages between two users" },
      { method: "POST", path: "/blockChatUser", description: "Block a chat user" },
      { method: "POST", path: "/deletechatforme", description: "Delete chat for the user" },
    ],
  },
  {
    category: "Referral Management",
    apis: [
      { method: "GET", path: "/generateReferalId/:userId", description: "Generate a referral ID for a user" },
      { method: "POST", path: "/checkReferalCodeValid", description: "Check if a referral code is valid" },
      { method: "POST", path: "/saveReferWithdrawRequest", description: "Save a withdrawal request for referral earnings" },
    ],
  },
  {
    category: "Admin Management",
    apis: [
      { method: "POST", path: "/admin/authenticate", description: "Admin authentication" },
      { method: "GET", path: "/admin/getAllAdminUsers/:userid", description: "Get all admin users" },
      { method: "GET", path: "/admin/getwithdrawRequest/:page/:limit", description: "Get withdrawal requests" },
      { method: "POST", path: "/admin/changeStatusPaid", description: "Change status to paid for a withdrawal" },
    ],
  },
  {
    category: "Website Management",
    apis: [
      { method: "POST", path: "/savewebsitemessage", description: "Save a message from the website" },
      { method: "GET", path: "/googleplace", description: "Get Google place details" },
      { method: "GET", path: "/checkadpendingbalance/:id", description: "Check pending balance for an ad" },
    ],
  },
  {
    category: "Utility Functions",
    apis: [
      { method: "POST", path: "/sendNotification", description: "Send a notification" },
      { method: "POST", path: "/sendNotificationToAll", description: "Send a notification to all users" },
      { method: "GET", path: "/getpremium", description: "Get premium details" },
      { method: "GET", path: "/getpremium-plans", description: "Get premium plans" },
    ],
  },
  {
    category: "Transaction Management",
    apis: [
      { method: "GET", path: "/orders/user/:user_id", description: "Get orders by user ID" },
      { method: "GET", path: "/transactions/user/:user_id", description: "Get transactions by user ID" },
      { method: "POST", path: "/transactions/user/phone", description: "Get transactions by phone number" },
    ],
  },
  {
    category: "Miscellaneous",
    apis: [
      { method: "GET", path: "/getconfig/:configkey", description: "Get configuration value by key" },
      { method: "GET", path: "/geteducation", description: "Get education details" },
      { method: "GET", path: "/getlanguages", description: "Get languages" },
      { method: "GET", path: "/getinterests", description: "Get interests" },
      { method: "GET", path: "/getprofessions", description: "Get professions" },
    ],
  },
];

const ApiList: React.FC = () => {
  return (
    <div style={{ padding: "1rem", fontFamily: "Arial, sans-serif" }}>
      <h1>API Endpoints List</h1>
      {apiData.map(({ category, apis }) => (
        <section key={category} style={{ marginBottom: "2rem" }}>
          <h2 style={{ borderBottom: "2px solid #333", paddingBottom: "0.5rem" }}>{category}</h2>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Method</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Endpoint</th>
                <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {apis.map(({ method, path, description }, index) => (
                <tr key={index} style={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white" }}>
                  <td style={{ border: "1px solid #ddd", padding: "8px", color: "#007bff", fontWeight: "bold" }}>{method}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px", fontFamily: "monospace" }}>{path}</td>
                  <td style={{ border: "1px solid #ddd", padding: "8px" }}>{description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
};

export default ApiList;
