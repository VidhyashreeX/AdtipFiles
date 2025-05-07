import React from 'react';

interface Plan {
  id: number;
  name: string;
  amount: number;
}

const plans: Plan[] = [
  { id: 1, name: '1 Month Plan', amount: 2500 },
  { id: 2, name: '3 Month Plan', amount: 6000 },
  { id: 3, name: '6 Month Plan', amount: 12000 },
  { id: 4, name: '12 Month Plan', amount: 22000 },
];

const UpgradeContentPremium: React.FC = () => {
  const API_BASE_URL = 'http://localhost:7082/api';
  const AUTH_TOKEN =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo1MDgxNiwiZW1haWwiOiJ2aXZla0BnbWFpbC5jb20iLCJpYXQiOjE3NDUyNDg2NzUsImV4cCI6MTc3Njc4NDY3NX0.CP2hoyHw7dOjB8A6uIifbdfNsztf0Pt1BSw8pEdM92Q';
  const USER_ID = 50816;
  const RAZORPAY_KEY = 'rzp_test_ojNkCSTYuUL3w9';

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePlanSelect = async (plan: Plan) => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert('Failed to load Razorpay SDK.');
      return;
    }

    try {
      // Step 1: Create Razorpay order
      const orderRes = await fetch(`${API_BASE_URL}/razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: AUTH_TOKEN
        },
        body: JSON.stringify({
          amount: plan.amount,
          currency: 'INR',
          user_id: USER_ID
        })
      });

      const orderData = await orderRes.json();

      if (!orderData.status) {
        alert('Order creation failed: ' + orderData.message);
        return;
      }

      // Step 2: Configure Razorpay options
      const options = {
        key: RAZORPAY_KEY,
        amount: orderData.data.amount,
        currency: 'INR',
        name: 'Your Business Name',
        description: `Content Premium - ${plan.name}`,
        order_id: orderData.data.id,
        handler: async function (response: any) {
          try {
            // Step 3: Verify payment
            const verificationRes = await fetch(`${API_BASE_URL}/razorpay-verification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: AUTH_TOKEN
              },
              body: JSON.stringify({
                transaction_for: 'content_creator_premium',
                order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: plan.amount,
                currency: 'INR',
                user_id: USER_ID,
                payment_status: 'success',
                plan_id: plan.id
              })
            });

            const verificationData = await verificationRes.json();
            if (!verificationData.status) {
              alert('Payment verification failed: ' + verificationData.message);
              return;
            }

            // Step 4: Activate Premium Plan
            const upgradeRes = await fetch(`${API_BASE_URL}/upgrade-content-premium`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: AUTH_TOKEN
              },
              body: JSON.stringify({
                payment_status: 'success',
                user_id: USER_ID,
                plan_id: plan.id,
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                coupon_code: null,
                isCron: false
              })
            });

            const upgradeData = await upgradeRes.json();

            if (upgradeData.status) {
              alert('Content Premium plan activated successfully!');
            } else {
              alert('Activation failed: ' + upgradeData.message);
            }
          } catch (err: any) {
            console.error('Verification/Upgrade Error:', err);
            alert('Error processing payment: ' + err.message);
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#F37254'
        }
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err: any) {
      console.error('Order Error:', err);
      alert('Something went wrong: ' + err.message);
    }
  };

  return (
    <div style={styles.page}>
      <h1>Choose Your Content Premium Plan</h1>
      <div style={styles.container}>
        {plans.map((plan) => (
          <div key={plan.id} style={styles.card}>
            <h3>{plan.name}</h3>
            <p>₹{plan.amount}</p>
            <button onClick={() => handlePlanSelect(plan)}>Select Plan</button>
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: { [key: string]: React.CSSProperties } = {
  page: {
    fontFamily: 'Arial, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px',
    backgroundColor: '#f4f4f4',
    minHeight: '100vh'
  },
  container: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    justifyContent: 'center'
  },
  card: {
    background: '#fff',
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    width: '200px',
    textAlign: 'center' as const,
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    cursor: 'pointer'
  }
};

export default UpgradeContentPremium;
