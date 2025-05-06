import { Routes, Route } from "react-router-dom";
import Wallet from "../components/Wallet";
import AddFunds from "../components/AddFunds";
import UpgradePremium from "../components/UpgradePremium";
import UpgradeContentPremium from "../components/UpgradeContentPremium";

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/wallet" element={<Wallet />} />
      <Route path="/add-funds" element={<AddFunds />} />
      <Route path="/upgrade-premium" element={<UpgradePremium />} />
      <Route path="/upgrade-content-premium" element={<UpgradeContentPremium />} />
      {/* Add other routes as needed */}
    </Routes>
  );
};

export default AppRoutes;
