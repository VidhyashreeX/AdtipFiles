import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Video, Clock, MessageSquare, HelpCircle, Gift, LayoutGrid, Newspaper } from "lucide-react";

const AdFormats = () => {
  const formats = [
    {
      icon: Video,
      title: "Skip Ad Model",
      description: "Traditional skippable ads for broad reach",
      color: "text-primary",
    },
    {
      icon: Clock,
      title: "Non-Skip Ad Model",
      description: "Full-view ads with higher payout",
      color: "text-accent",
    },
    {
      icon: MessageSquare,
      title: "Non-Skip + Lead",
      description: "Boost earnings when users submit leads",
      color: "text-primary",
    },
    {
      icon: HelpCircle,
      title: "Non-Skip + Question",
      description: "Interactive ads with quick user response",
      color: "text-accent",
    },
    {
      icon: Gift,
      title: "Reward Ads",
      description: "Offer coins, points, or in-app rewards",
      color: "text-primary",
    },
    {
      icon: LayoutGrid,
      title: "Banner React",
      description: "Lightweight banners for high-frequency impressions",
      color: "text-accent",
    },
    {
      icon: Newspaper,
      title: "Native Ads",
      description: "Ads that naturally blend into your app design",
      color: "text-primary",
    },
  ];

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Powerful Ad Formats
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose from 7+ optimized ad formats to match your app's experience and maximize revenue
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {formats.map((format, index) => {
            const Icon = format.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 border-2 hover:border-primary/50"
              >
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className={`w-6 h-6 ${format.color}`} />
                  </div>
                  <CardTitle className="text-xl">{format.title}</CardTitle>
                  <CardDescription className="text-base">{format.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg text-muted-foreground">
            Each ad type is optimized for <span className="font-semibold text-foreground">high engagement</span>, 
            <span className="font-semibold text-foreground"> better retention</span>, and 
            <span className="font-semibold text-foreground"> maximum revenue</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default AdFormats;
