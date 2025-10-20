import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Laptop, Key, Code, DollarSign } from "lucide-react";

const Steps = () => {
  const steps = [
    {
      icon: UserPlus,
      number: "01",
      title: "Create Publisher Account",
      description: "Sign up instantly on publisher.adtip.in",
    },
    {
      icon: Laptop,
      number: "02",
      title: "Add Your App",
      description: "Enter details, category, and traffic info",
    },
    {
      icon: Key,
      number: "03",
      title: "Get API Key",
      description: "Automatically generated in your dashboard",
    },
    {
      icon: Code,
      number: "04",
      title: "Integrate AdTip",
      description: "Use our lightweight SDK or API",
    },
    {
      icon: DollarSign,
      number: "05",
      title: "Start Earning",
      description: "Earn instantly for every ad viewed",
    },
  ];

  return (
    <section className="py-24 bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl md:text-5xl font-bold">
            Your 5-Step <span className="text-green-600 dark:text-green-400">Earning Journey</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Get up and running in minutes with our simple integration process
          </p>
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-300 border-2 hover:border-primary/30"
              >
                <CardContent className="p-6">
                  <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-r from-primary to-primary/80 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500">
                        <Icon className="w-8 h-8 text-primary-foreground" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-2">
                        <span className="text-5xl font-bold text-primary/20">{step.number}</span>
                        <h3 className="text-2xl font-bold">{step.title}</h3>
                      </div>
                      <p className="text-lg text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <p className="text-lg font-medium">
            AdTip pays you <span className="text-accent font-bold">per ad view</span>, not just clicks — 
            giving you <span className="text-primary font-bold">steady, predictable income</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Steps;
