import { Check, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const ComparisonTable = () => {
  const comparisons = [
    {
      feature: "Revenue Sharing",
      admob: { value: "100% to Developer", hasIt: false },
      adtip: { value: "50% Developer + 50% User", hasIt: true },
    },
    {
      feature: "User Engagement",
      admob: { value: "Passive", hasIt: false },
      adtip: { value: "Active – Users earn per ad", hasIt: true },
    },
    {
      feature: "Ad Models",
      admob: { value: "Limited", hasIt: false },
      adtip: { value: "7+ formats (Reward, Interactive, etc.)", hasIt: true },
    },
    {
      feature: "Reports",
      admob: { value: "Delayed", hasIt: false },
      adtip: { value: "Real-time dashboard", hasIt: true },
    },
    {
      feature: "Integration",
      admob: { value: "Complex SDK setup", hasIt: false },
      adtip: { value: "Plug & Play in minutes", hasIt: true },
    },
    {
      feature: "User Retention",
      admob: { value: "Moderate", hasIt: false },
      adtip: { value: "Very High – Users stay for rewards", hasIt: true },
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Why Publishers Choose <span className="text-primary">AdTip</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See how AdTip outperforms traditional ad networks in every metric that matters
          </p>
        </div>

        <Card className="shadow-2xl max-w-5xl mx-auto overflow-hidden border-2">
          <CardContent className="p-0">
            {/* Header */}
            <div className="grid grid-cols-3 gap-4 p-6 bg-muted/50 border-b">
              <div className="font-semibold text-lg">Feature</div>
              <div className="text-center font-semibold text-lg text-muted-foreground">AdMob</div>
              <div className="text-center font-semibold text-lg text-primary">AdTip</div>
            </div>

            {/* Rows */}
            {comparisons.map((item, index) => (
              <div
                key={item.feature}
                className={`grid grid-cols-3 gap-4 p-6 items-center ${
                  index !== comparisons.length - 1 ? "border-b" : ""
                } hover:bg-muted/20 transition-colors`}
              >
                <div className="font-medium">{item.feature}</div>
                
                <div className="text-center flex items-center justify-center gap-2">
                  <X className="w-5 h-5 text-destructive flex-shrink-0" />
                  <span className="text-sm text-muted-foreground">{item.admob.value}</span>
                </div>
                
                <div className="text-center flex items-center justify-center gap-2">
                  <Check className="w-5 h-5 text-accent flex-shrink-0" />
                  <span className="text-sm font-medium">{item.adtip.value}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-accent/10 border border-accent/20">
            <Check className="w-5 h-5 text-accent" />
            <span className="font-medium text-accent">Result: Your users prefer your app because it helps them earn money</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;
