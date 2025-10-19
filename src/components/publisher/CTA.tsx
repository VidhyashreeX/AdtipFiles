import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

const CTA = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-primary/10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
            <Rocket className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Start Earning Today</span>
          </div>

          <h2 className="text-4xl md:text-6xl font-bold">
            Ready to Transform Your
            <br />
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Ad Monetization?
            </span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of publishers who have switched to AdTip and are earning more while keeping their users engaged and happy.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button variant="default" size="lg" asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
              <Link to="/publisher-dashboard">
                Create Publisher Account
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
            <Button variant="outline" size="lg">
              View Documentation
            </Button>
          </div>

          <div className="pt-8 space-y-4">
            <div className="flex items-center justify-center gap-8 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-muted-foreground">No Setup Fees</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-muted-foreground">Free Integration Support</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent" />
                <span className="text-muted-foreground">Instant API Access</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;
