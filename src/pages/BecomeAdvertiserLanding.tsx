import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Zap, 
  Users, 
  Eye, 
  TrendingUp, 
  DollarSign, 
  CheckCircle2, 
  Sparkles,
  Video,
  Gift,
  ArrowRight,
  Target,
  BarChart3,
  Shield
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/contexts/ThemeContext";

const BecomeAdvertiserLanding = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const pricingData = [
    { type: "Skip Ad", description: "5-sec skippable ad", cost: "₹0.20" },
    { type: "Non-Skip Ad", description: "Full watch required", cost: "₹0.50" },
    { type: "Bumper Ad", description: "Short impact ad", cost: "₹0.30" },
    { type: "Non-Skip + Lead Form", description: "Watch + fill lead form", cost: "₹1.00" },
    { type: "Non-Skip + Question Ad", description: "Watch + answer question", cost: "₹1.00" },
    { type: "Skip + Question Ad", description: "Skippable + question", cost: "₹0.50" },
  ];

  const benefits = [
    { icon: Shield, title: "Real Users Only", description: "No bots, no fake impressions—verified users only" },
    { icon: Eye, title: "High Attention", description: "Users get paid to watch, ensuring better ad recall" },
    { icon: BarChart3, title: "Live Tracking", description: "Monitor real visitors to your website or app in real-time" },
    { icon: DollarSign, title: "Ultra-Low Pricing", description: "Up to 70% cheaper than traditional platforms" },
    { icon: Gift, title: "Free Credits", description: "Get up to ₹10,000 in free ad credits for new advertisers" },
    { icon: Target, title: "Real Engagement", description: "Every view counts, every click converts" },
  ];

  const features = [
    {
      icon: Video,
      title: "Live Product Streaming",
      description: "Showcase your product live! Customers earn money for watching your stream, so they stay longer and engage more.",
    },
    {
      icon: Gift,
      title: "Reward Visits",
      description: "Give rewards when customers visit your website. If they stay 30+ seconds, they get paid—if not, the reward is saved for later.",
    },
    {
      icon: DollarSign,
      title: "Wallet Integration",
      description: "Users' ad earnings go into their AdTip wallet, building loyalty and encouraging repeated exposure to your brand.",
    },
  ];

  const steps = [
    { number: "1", title: "Add Your Product", description: "Upload your product details and create your campaign" },
    { number: "2", title: "Create Your Ad", description: "Choose from multiple engaging ad formats" },
    { number: "3", title: "Choose Your Model", description: "Select the perfect ad type for your goals" },
    { number: "4", title: "Promote & Track", description: "Launch your campaign and monitor live results" },
    { number: "5", title: "Watch Sales Grow", description: "See real engagement turn into real profits" },
  ];

  // Handler to redirect to seller registration process
  const handleBookAds = () => {
    navigate('/become-seller-full');
  };

  const handleClaimCredits = () => {
    navigate('/become-seller-full');
  };

  const handleContactUs = () => {
    navigate('/contact-us');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
        <div className="container mx-auto px-4 py-20 md:py-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8 z-10">
              <Badge className="bg-accent/20 text-accent-foreground border-accent/50">
                <Sparkles className="w-4 h-4 mr-1" />
                The Future of Advertising
              </Badge>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight text-foreground">
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">AdTip</span>
                {" "}— The Smartest Way to Advertise
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground">
                Reach Real People. Get Real Engagement. Pay Less.
              </p>
              <p className="text-lg text-muted-foreground">
                Every user gets paid to watch your ad → higher attention & recall. You get live tracking of real visitors at ultra-low prices.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  onClick={handleBookAds}
                  size="lg" 
                  className="text-lg bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
                >
                  Book Ads Now
                  <ArrowRight className="ml-2" />
                </Button>
                <Button 
                  onClick={handleContactUs}
                  variant="outline" 
                  size="lg" 
                  className="text-lg border-primary/50 hover:bg-primary/10"
                >
                  Learn More
                </Button>
              </div>
              <div className="flex items-center gap-6 pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 w-5 h-5" />
                  <span className="text-sm text-muted-foreground">No bots guarantee</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 w-5 h-5" />
                  <span className="text-sm text-muted-foreground">70% cheaper</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-green-500 w-5 h-5" />
                  <span className="text-sm text-muted-foreground">₹10K free credits</span>
                </div>
              </div>
            </div>
            <div className="relative lg:block hidden">
              <div className="absolute -inset-4 bg-primary/20 blur-3xl rounded-full"></div>
              <div className="relative rounded-2xl shadow-2xl border border-border bg-gradient-to-br from-card via-card to-primary/5 h-96 p-8 overflow-hidden">
                {/* Animated Stats Dashboard Mockup */}
                <div className="space-y-4">
                  <div className="bg-primary/10 backdrop-blur-sm rounded-lg p-4 border border-primary/20 animate-pulse">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Live Views</p>
                        <p className="text-2xl font-bold text-foreground">2,847</p>
                      </div>
                      <Eye className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div className="bg-green-500/10 backdrop-blur-sm rounded-lg p-4 border border-green-500/20 animate-pulse delay-75">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Engagement Rate</p>
                        <p className="text-2xl font-bold text-foreground">87.3%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                  <div className="bg-blue-500/10 backdrop-blur-sm rounded-lg p-4 border border-blue-500/20 animate-pulse delay-150">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Cost Saved</p>
                        <p className="text-2xl font-bold text-foreground">₹12,450</p>
                      </div>
                      <DollarSign className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-2xl"></div>
                  <div className="absolute -top-10 -left-10 w-32 h-32 bg-accent/20 rounded-full blur-2xl"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose AdTip */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/50">
              <Zap className="w-4 h-4 mr-1" />
              Why AdTip?
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Unlike Traditional Platforms
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Your ad works harder — not just for you, but for your customers too. Every view counts, every click converts.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {benefits.map((benefit, index) => (
              <Card key={index} className="bg-card hover:bg-accent transition-all duration-300 border-border backdrop-blur-sm">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4">
                    <benefit.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{benefit.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base text-muted-foreground">{benefit.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Table */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/50">
              <DollarSign className="w-4 h-4 mr-1" />
              Transparent Pricing
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Pay Only for Real Engagement
            </h2>
            <p className="text-xl text-muted-foreground">
              Not empty impressions. Every rupee gives double value.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid gap-4">
              {pricingData.map((item, index) => (
                <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all duration-300 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-1 text-foreground">{item.type}</h3>
                        <p className="text-muted-foreground">{item.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                          {item.cost}
                        </div>
                        <div className="text-sm text-muted-foreground">per view</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Features */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <Badge className="mb-4 bg-primary/20 text-primary border-primary/50">
                <Sparkles className="w-4 h-4 mr-1" />
                Interactive Features
              </Badge>
              <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
                AdTip = Ads + Income + Sales
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                You're not just advertising. You're building relationships with customers who want to see your ads.
              </p>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-br from-primary/30 to-primary/20 blur-3xl rounded-full"></div>
              <div className="relative rounded-2xl shadow-2xl border border-primary/20 bg-gradient-to-br from-card to-card/80 h-96 p-8 overflow-hidden">
                {/* Interactive Features Visualization */}
                <div className="h-full flex flex-col justify-center space-y-6">
                  {/* Live Streaming Icon */}
                  <div className="flex items-center gap-4 bg-primary/10 backdrop-blur-sm rounded-xl p-4 border border-primary/20 transform hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                      <Video className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Live Streaming</p>
                      <p className="text-xs text-muted-foreground">Active campaigns: 127</p>
                    </div>
                  </div>
                  
                  {/* Rewards Icon */}
                  <div className="flex items-center gap-4 bg-green-500/10 backdrop-blur-sm rounded-xl p-4 border border-green-500/20 transform hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center flex-shrink-0">
                      <Gift className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Reward Visits</p>
                      <p className="text-xs text-muted-foreground">Total rewards: ₹45,230</p>
                    </div>
                  </div>
                  
                  {/* Wallet Icon */}
                  <div className="flex items-center gap-4 bg-blue-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-500/20 transform hover:scale-105 transition-transform">
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Wallet Integration</p>
                      <p className="text-xs text-muted-foreground">Active users: 8,542</p>
                    </div>
                  </div>

                  {/* Decorative elements */}
                  <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                  <div className="absolute -top-20 -left-20 w-32 h-32 bg-accent/10 rounded-full blur-3xl"></div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="bg-card hover:bg-accent transition-all duration-300 border-border backdrop-blur-sm">
                <CardHeader>
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-4">
                    <feature.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <CardTitle className="text-xl text-foreground">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-primary/20 text-primary border-primary/50">
              <TrendingUp className="w-4 h-4 mr-1" />
              How It Works
            </Badge>
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Simple. Affordable. Profitable.
            </h2>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="space-y-6">
              {steps.map((step, index) => (
                <Card key={index} className="bg-card border-border hover:border-primary/50 transition-all duration-300 backdrop-blur-sm">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl font-bold text-primary-foreground">{step.number}</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2 text-foreground">{step.title}</h3>
                        <p className="text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Special Offer */}
      <section className="py-20 bg-gradient-to-r from-orange-600 to-orange-500 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]"></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <Gift className="w-16 h-16 mx-auto mb-6 text-white" />
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
              Special Offer for Early Advertisers
            </h2>
            <p className="text-2xl mb-8 text-white/90">
              Get FREE Ad Credits up to ₹10,000 when you sign up today
            </p>
            <Badge className="mb-8 bg-white/20 text-white border-white/30 text-base px-4 py-2">
              Limited Time Offer
            </Badge>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={handleClaimCredits}
                size="lg" 
                className="text-lg bg-white text-orange-600 hover:bg-gray-100"
              >
                Claim Your Credits
                <ArrowRight className="ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
              Where Ads Reward Everyone
            </h2>
            <p className="text-2xl text-muted-foreground mb-4">
              Join the future of advertising.
            </p>
            <p className="text-xl text-primary mb-12 font-semibold">
              "When your customer earns, your brand wins."
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Button 
                onClick={handleBookAds}
                size="lg" 
                className="text-lg"
              >
                Book Your Ads Now
                <ArrowRight className="ml-2" />
              </Button>
              <Button 
                onClick={handleContactUs}
                variant="outline" 
                size="lg" 
                className="text-lg"
              >
                Contact Us
              </Button>
            </div>
            <div className="text-muted-foreground">
              <p>support@adtip.in</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              AdTip
            </h3>
            <p className="text-muted-foreground mb-4">
              Promote Your Product. Earn Profits. Forever.
            </p>
            <p className="text-sm text-muted-foreground">
              © 2025 AdTip. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BecomeAdvertiserLanding;
