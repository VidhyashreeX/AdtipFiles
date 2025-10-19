import { Button } from "@/components/ui/button";
import { ArrowRight, Rocket } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-adtip.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-10" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)]" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <Rocket className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">The Future of Fair Ad Monetization</span>
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
              Monetize Smarter.
              <br />
              <span className="bg-[image:var(--gradient-hero)] bg-clip-text text-transparent">
                Engage Better.
              </span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
              AdTip introduces a revolutionary <span className="font-semibold text-accent">50-50 revenue share</span> model — 
              where you earn 50% and your users earn 50% from every ad view. 
              More engagement. Higher retention. Better monetization.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="default" size="lg" asChild className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                <Link to="/publisher-dashboard">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg">
                View Demo
              </Button>
            </div>

            <div className="flex items-center gap-8 justify-center lg:justify-start text-sm">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">50%</div>
                <div className="text-muted-foreground">Publisher Revenue</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">50%</div>
                <div className="text-muted-foreground">User Earnings</div>
              </div>
              <div className="w-px h-12 bg-border" />
              <div className="text-center">
                <div className="text-2xl font-bold">7+</div>
                <div className="text-muted-foreground">Ad Formats</div>
              </div>
            </div>
          </div>

          {/* Right Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-[image:var(--gradient-hero)] opacity-20 blur-3xl rounded-full" />
            <img 
              src={heroImage} 
              alt="AdTip Revenue Sharing Platform" 
              className="relative rounded-2xl shadow-[var(--shadow-elevated)] w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
