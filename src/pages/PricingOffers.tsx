import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const plans = [
	{
		category: "User",
		free: [
			"Earn ₹0.03 Rupees per ad view",
			"60% platform fee on withdrawals for users & creators +18% GST",
			"Tip Call: Charge ₹7 per minute",
			"Ëarn upto ₹2000",
			"Withdrawals processed within 30 business days",
			"Earn ₹1 for accepting Tip Call",
			"Minimum withdrawal: ₹2000",
			"Creators & referral earnings: Minimum withdrawal ₹5000",
		],
		premium: [
			"Earn upto ₹10 per ad view",
			"30% platform fee on withdrawals for users & creators +18% GST",
			"Tip Call: Charge ₹4 per minute",
			"Earn upto ₹20000",
			"Withdrawals processed within 14 business days",
			"Earn ₹2 for accepting Tip Call",
			"Minimum withdrawal: ₹1000",
			"Creates & referral earnings: Minimum withdrawal ₹1000",
		],
	},
	{
		category: "Creator",
		free: [
			"No earnings for uploads on TipTube & TipShorts",
			"Free video upload only",
			"Earn ₹0.06 per ad view",
			"Fan Call to earn ₹0.06(coming soon)",
			"Fan Video to earn ₹1(coming soon)",
		],
		premium: [
			"Earnings for uploads on TipTube & TipShorts",
			"Free & paid video upload",
			"To earn upto ₹10000 per ad view",
			"Fan Call to earn ₹4(coming soon)",
			"Fan Video to earn ₹8(coming soon)",
		],
	},
	{
		category: "Seller",
		free: [
			"14 business days for payment",
			"Return/Replacement option only",
			"No free ad credits",
			"No free banner ads",
			"₹7 per minute",
			"₹14 per minute video call",
			"Close fee applies",
		],
		premium: [
			"5 business days for payment",
			"Replacement option",
			"Free ad credits",
			"3 free banner ads per month",
			"₹4 per minute",
			"₹7 per minute video call",
			"No close fee",
		],
	},
];

const PricingOffers = () => {
	const navigate = useNavigate();
	return (
		<div className="min-h-screen bg-gradient-to-b from-white to-[#e0ecf7] flex flex-col items-center px-2 pt-8 pb-24">
			<h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">
				Our Packages
			</h2>
			<div className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
				{plans.map((plan) => (
					<div key={plan.category} className="flex flex-col gap-8">
						<h3 className="text-xl font-semibold text-center mb-2">
							{plan.category}
						</h3>
						<div className="flex flex-col gap-6">
							{/* Free Box */}
							<div className="flex-1 rounded-2xl border-2 border-red-300 bg-white/80 p-6 shadow-md min-w-[220px]">
								<div className="text-red-500 font-bold text-base mb-2">
									FREE
								</div>
								<ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
									{plan.free.map((item, idx) => (
										<li key={idx} className="text-red-600">
											{item}
										</li>
									))}
								</ul>
							</div>
							{/* Premium Box */}
							<div className="flex-1 rounded-2xl border-2 border-green-300 bg-white/80 p-6 shadow-md min-w-[220px]">
								<div className="text-green-500 font-bold text-base mb-2">
									PREMIUM
								</div>
								<ul className="list-disc pl-4 text-sm text-gray-700 space-y-1">
									{plan.premium.map((item, idx) => (
										<li key={idx} className="text-green-700">
											{item}
										</li>
									))}
								</ul>
							</div>
						</div>
					</div>
				))}
			</div>
			<Button
				className="mt-auto px-8 py-3 rounded-full bg-gradient-to-r from-[#43e97b] to-[#38f9d7] text-white font-bold text-lg shadow-lg hover:scale-105 transition-transform"
				onClick={() => navigate("/chooseplan")}
			>
				Choose plan
			</Button>
		</div>
	);
};

export default PricingOffers;
