import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, Globe, Smartphone, History, Users, Eye, DollarSign } from "lucide-react";
import dashboardImage from "@/assets/dashboard-preview.jpg";

const Analytics = () => {
  const features = [
    { icon: Eye, title: "Content Performance", description: "Track views, engagement, and reach" },
    { icon: TrendingUp, title: "Revenue Analytics", description: "Monitor earnings and monetization" },
    { icon: Users, title: "Audience Insights", description: "Understand your followers and demographics" },
    { icon: Globe, title: "Global Reach", description: "See where your content performs best" },
    { icon: DollarSign, title: "Earning Reports", description: "Detailed breakdown of your income" },
    { icon: History, title: "Payment History", description: "Complete transaction records" },
  ];

  return (
    <section className="py-24 bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Dashboard Preview */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 blur-3xl rounded-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent rounded-2xl" />
            <img
              src={dashboardImage}
              alt="AdTip Content Creator Analytics Dashboard"
              className="relative rounded-2xl shadow-2xl w-full border-2 border-primary/10 hover:border-primary/20 transition-all duration-300"
            />
          </div>

          {/* Right: Content */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="space-y-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium">
                Content Creator Premium
              </div>
              <h2 className="text-4xl md:text-5xl font-bold leading-tight">
                Advanced Analytics for
                <span className="text-primary block">Content Creators</span>
              </h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Unlock powerful insights into your content performance, audience engagement, and revenue streams with our comprehensive analytics dashboard
              </p>
            </div>

            <div className="grid gap-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary hover:-translate-y-1"
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 group-hover:bg-primary/20 flex items-center justify-center flex-shrink-0 transition-colors duration-300">
                          <Icon className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="p-8 rounded-2xl bg-gradient-to-r from-primary/5 to-accent/10 border border-primary/10">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-lg font-medium text-foreground mb-2">
                    Real-time updates with premium insights
                  </p>
                  <p className="text-muted-foreground">
                    Everything updates live — no delays, no confusion, full transparency for content creators
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Analytics;
