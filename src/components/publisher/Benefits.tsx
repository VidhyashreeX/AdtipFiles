import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Brain, Settings, Briefcase, TrendingUp, Clock } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: DollarSign,
      title: "Shared Revenue Model",
      description: "Users earn along with you, boosting loyalty and engagement",
    },
    {
      icon: Brain,
      title: "Smarter Ads",
      description: "Interactive and reward-based formats enhance user experience",
    },
    {
      icon: Settings,
      title: "Easy Integration",
      description: "Set up in minutes with SDK or REST API — no complex configuration",
    },
    {
      icon: Briefcase,
      title: "Premium Advertisers",
      description: "Connect with high-quality brands through AdTip's growing network",
    },
    {
      icon: TrendingUp,
      title: "High Retention Rate",
      description: "Users love earning, so they keep coming back to your app",
    },
    {
      icon: Clock,
      title: "Instant Reports & Fast Payments",
      description: "Track earnings in real-time and withdraw anytime you want",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Why AdTip Outperforms Traditional Ad Networks
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            AdTip isn't just an ad network — it's a partnership platform built for mutual growth
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-500">
                    <Icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl mb-3">{benefit.title}</CardTitle>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
