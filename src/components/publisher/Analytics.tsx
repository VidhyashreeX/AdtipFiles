import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp, Globe, Smartphone, History } from "lucide-react";
import dashboardImage from "@/assets/dashboard-preview.jpg";

const Analytics = () => {
  const features = [
    { icon: BarChart3, title: "Total Ad Views", description: "Track every impression" },
    { icon: TrendingUp, title: "Earnings Split", description: "50/50 transparency" },
    { icon: Globe, title: "Country Analytics", description: "Geographic insights" },
    { icon: Smartphone, title: "Device Reports", description: "Platform performance" },
    { icon: History, title: "Payment History", description: "Complete records" },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Dashboard Preview */}
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 blur-3xl rounded-full" />
            <img
              src={dashboardImage}
              alt="AdTip Real-Time Analytics Dashboard"
              className="relative rounded-2xl shadow-2xl w-full border-2 border-primary/10"
            />
          </div>

          {/* Right: Content */}
          <div className="space-y-8 order-1 lg:order-2">
            <div className="space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">
                Real-Time Analytics Dashboard
              </h2>
              <p className="text-xl text-muted-foreground">
                Gain complete control and insight into your revenue with live updates and transparent reporting
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Card
                    key={index}
                    className="group hover:shadow-lg transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary"
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{feature.title}</h3>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="p-6 rounded-xl bg-accent/10 border border-accent/20">
              <p className="text-lg font-medium text-accent">
                Everything updates live — no delays, no confusion, full transparency
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Analytics;
