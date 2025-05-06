import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import PhoneLogin from './components/PhoneLogin';
import OtpPage from './components/OtpPage';
import { UserProvider } from './UserContext'; // ⬅️ for global state

export default function App() {
  return (
    <UserProvider>
      <Router>
        <Routes>
          <Route path="/" element={<PhoneLogin />} />
          <Route path="/otp" element={<OtpPage />} />
        </Routes>
      </Router>
    </UserProvider>
  );
}
