import React from 'react';

const AddFunds: React.FC = () => {
  const API_BASE_URL = `${import.meta.env.VITE_API_URL}/api`;
  const AUTH_TOKEN =
    'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjo1MDgxNiwiZW1haWwiOiJ2aXZla0BnbWFpbC5jb20iLCJpYXQiOjE3NDUyNDg2NzUsImV4cCI6MTc3Njc4NDY3NX0.CP2hoyHw7dOjB8A6uIifbdfNsztf0Pt1BSw8pEdM92Q';
  const USER_ID = 4586;
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

  const handlePayment = async () => {
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      alert('Razorpay SDK failed to load.');
      return;
    }

    try {
      // Step 1: Create Razorpay order
      const orderResponse = await fetch(`${API_BASE_URL}/razorpay-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: AUTH_TOKEN
        },
        body: JSON.stringify({
          amount: 200,
          currency: 'INR',
          user_id: USER_ID
        })
      });

      const orderData = await orderResponse.json();

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
        description: 'Add Funds',
        order_id: orderData.data.id,
        handler: async function (response: any) {
          try {
            // Step 3: Verify payment
            const verificationResponse = await fetch(`${API_BASE_URL}/razorpay-verification`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: AUTH_TOKEN
              },
              body: JSON.stringify({
                transaction_for: 'add_funds',
                order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                amount: orderData.data.amount / 100,
                currency: 'INR',
                user_id: USER_ID,
                payment_status: 'success'
              })
            });

            const verificationData = await verificationResponse.json();
            if (!verificationData.status) {
              alert('Payment verification failed: ' + (verificationData.message || 'Unknown error'));
              return;
            }

            // Step 4: Update wallet
            const addFundsResponse = await fetch(`${API_BASE_URL}/addfunds`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: AUTH_TOKEN
              },
              body: JSON.stringify({
                createdby: USER_ID,
                amount: orderData.data.amount / 100,
                transactionStatus: '1',
                transaction_type: 'Deposite',
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                isCron: false
              })
            });

            const addFundsData = await addFundsResponse.json();

            if (addFundsData.status === 200) {
              alert('Funds added successfully!');
            } else {
              alert('Funds addition failed: ' + (addFundsData.message || 'Unknown error'));
            }
          } catch (err: any) {
            console.error('Error:', err);
            alert('Error processing payment: ' + err.message);
          }
        },
        prefill: {
          name: 'Test User',
          email: 'test@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#0B72B5'
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Error:', err);
      alert('Error occurred: ' + err.message);
    }
  };

  return (
    <div>
      <h2>Add Funds</h2>
      <button onClick={handlePayment}>Add ₹200 Funds</button>
    </div>
  );
};

export default AddFunds;
