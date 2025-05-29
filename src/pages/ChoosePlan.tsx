import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const plans = [
	{
		category: "User Packs",
		options: [
			{ label: "1 Month Plan", price: 200 },
			{ label: "6 Month Plan", price: 1200 },
			{ label: "1 Year Plan", price: 2400 },
		],
		button: "Choose Plan",
	},
	{
		category: "Creator Packs",
		options: [
			{ label: "Monthly Pack", price: 2500 },
			{ label: "Quaterly Pack", price: 6000 },
			{ label: "Half Yearly Pack", price: 12000 },
			{ label: "Yearly Pack", price: 22000 },
		],
		button: "Choose Plan",
		note: "After applying Referral Coupon\nYearly plan as per selected plan",
	},
	{
		category: "Seller Packs",
		options: [
			{ label: "Monthly Pack", price: 5000 },
			{ label: "Quaterly Pack", price: 12000 },
			{ label: "Half Yearly Pack", price: 24000 },
			{ label: "Yearly Pack", price: 48000 },
		],
		button: "Choose Plan",
		note: "After applying Referral Coupon\nYearly plan as per selected plan",
	},
];

const ChoosePlan = () => {
	const [selectedCategory, setSelectedCategory] = useState(0);
	const navigate = useNavigate();

	return (
		<div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-white to-[#e0ecf7] px-2 py-8">
			<div className="w-full max-w-5xl bg-white/90 rounded-3xl shadow-2xl p-6 md:p-12 relative border border-gray-200">
				<div className="flex justify-center mb-6 gap-4">
					{plans.map((plan, idx) => (
						<button
							key={plan.category}
							className={`px-4 py-2 rounded-full font-semibold text-base transition-all border-2 ${
								selectedCategory === idx
									? "bg-adtip-teal text-white border-adtip-teal shadow"
									: "bg-white text-adtip-teal border-adtip-teal/30 hover:bg-adtip-teal/10"
							}`}
							onClick={() => setSelectedCategory(idx)}
						>
							{plan.category}
						</button>
					))}
				</div>
				<h2 className="text-xl md:text-2xl font-bold text-center mb-6">
					{plans[selectedCategory].category}
				</h2>
				<div
					className={
						selectedCategory === 0
							? "flex flex-wrap justify-center gap-8 mb-8"
						: "flex flex-wrap justify-center gap-8 mb-8 md:grid md:grid-cols-4 md:gap-8"
					}
				>
					{plans[selectedCategory].options.map((option, idx) => (
						<div
							key={option.label}
							className="flex flex-col items-center bg-[#f8fafc] rounded-2xl shadow-md px-8 py-6 min-w-[200px] max-w-[260px] border border-gray-200"
						>
							<div className="text-lg font-semibold mb-2 text-gray-800 text-center">
								{option.label}
							</div>
							{plans[selectedCategory].note && (
								<div className="text-xs text-gray-500 text-center mb-1 whitespace-pre-line">
									{plans[selectedCategory].note}
								</div>
							)}
							<div className="text-2xl font-bold mb-4 text-gray-900 text-center">
								₹{option.price}
							</div>
							<Button
								className="w-full bg-gradient-to-r from-[#43e97b] to-[#38f9d7] text-white font-semibold rounded-full shadow hover:scale-105 transition-transform"
								onClick={() => {
									navigate("/razorpay-checkout", {
										state: {
											amount: option.price,
											planLabel: option.label,
										},
									});
								}}
							>
								{selectedCategory === 0
									? "Choose Plan"
									: plans[selectedCategory].button}
							</Button>
						</div>
					))}
				</div>
			</div>
		</div>
	);
};

export default ChoosePlan;
