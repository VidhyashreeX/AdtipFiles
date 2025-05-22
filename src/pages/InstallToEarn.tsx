
import React from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Award, 
  Download, 
  ArrowUpRight, 
  Check, 
  Timer, 
  Smartphone, 
  Calendar, 
  Shield 
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const InstallToEarn = () => {
  const apps = [
    {
      id: 1,
      name: "FitTracker Pro",
      description: "Track your fitness goals and earn rewards for staying active",
      category: "Health & Fitness",
      reward: "25 TipCoins",
      retention: "7 days",
      image: "/placeholder.svg"
    },
    {
      id: 2,
      name: "CryptoWallet X",
      description: "Secure crypto wallet with built-in exchange features",
      category: "Finance",
      reward: "50 TipCoins",
      retention: "14 days",
      image: "/placeholder.svg"
    },
    {
      id: 3,
      name: "MeditateDaily",
      description: "Guided meditation and mindfulness exercises",
      category: "Lifestyle",
      reward: "15 TipCoins",
      retention: "5 days",
      image: "/placeholder.svg"
    },
    {
      id: 4,
      name: "ShopSmart",
      description: "Compare prices and earn cashback on purchases",
      category: "Shopping",
      reward: "35 TipCoins",
      retention: "10 days",
      image: "/placeholder.svg"
    },
    {
      id: 5,
      name: "NewsDigest",
      description: "Personalized news from trusted sources",
      category: "News",
      reward: "20 TipCoins",
      retention: "7 days",
      image: "/placeholder.svg"
    }
  ];

  const categories = [
    "All", "Games", "Productivity", "Social", "Finance", "Health & Fitness", "Lifestyle"
  ];

  const howItWorks = [
    {
      icon: <Download className="h-6 w-6 text-adtip-teal" />,
      title: "Install Apps",
      description: "Browse our collection of partner apps and install them on your device."
    },
    {
      icon: <Timer className="h-6 w-6 text-adtip-teal" />,
      title: "Keep & Use",
      description: "Keep the app installed and use it regularly for the required retention period."
    },
    {
      icon: <Award className="h-6 w-6 text-adtip-teal" />,
      title: "Earn Rewards",
      description: "Receive TipCoins when you complete the retention period requirements."
    },
    {
      icon: <ArrowUpRight className="h-6 w-6 text-adtip-teal" />,
      title: "Withdraw or Shop",
      description: "Use your earned coins on our marketplace or withdraw to your wallet."
    }
  ];

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col items-center text-center mb-10">
        <Award className="h-16 w-16 text-adtip-teal mb-4" />
        <h1 className="text-3xl font-bold mb-2">Install to Earn</h1>
        <p className="text-lg text-gray-600 max-w-2xl">
          Install partner apps, use them regularly, and earn rewards. It's that simple!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div>
          <h2 className="text-2xl font-bold mb-4">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {howItWorks.map((step, index) => (
              <Card key={index} className="border-2 border-adtip-teal/10">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <div className="bg-adtip-teal/10 p-2 rounded-full">
                      {step.icon}
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="mt-6 bg-blue-50 border border-blue-100 rounded-lg p-5">
            <div className="flex items-start">
              <Shield className="h-6 w-6 text-blue-600 mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-bold text-blue-800 mb-1">Safe & Trusted</h3>
                <p className="text-blue-700 text-sm">
                  We verify all partner apps for safety and quality. Your data is protected and you're never required to make in-app purchases.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-adtip-teal/5 to-blue-50 rounded-xl p-6">
          <h2 className="text-2xl font-bold mb-4">Earning Potential</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <Smartphone className="h-6 w-6 text-adtip-teal mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">App Installation</h3>
                <p className="text-sm text-gray-600">Earn 15-50 TipCoins per qualified app installation</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Calendar className="h-6 w-6 text-adtip-teal mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Retention Bonuses</h3>
                <p className="text-sm text-gray-600">Additional 5-25 TipCoins for keeping apps beyond minimum period</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <Award className="h-6 w-6 text-adtip-teal mr-3 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Achievement Rewards</h3>
                <p className="text-sm text-gray-600">Unlock special rewards by installing apps in multiple categories</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h4 className="font-semibold mb-2">Average Monthly Earnings</h4>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Casual Users:</span>
                <span className="font-bold">500-1,000 TipCoins</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-600">Active Users:</span>
                <span className="font-bold">1,500-3,000 TipCoins</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-gray-600">Power Users:</span>
                <span className="font-bold">4,000+ TipCoins</span>
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Button className="w-full">Start Earning Now</Button>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Featured Apps</h2>
          <Button variant="outline" className="flex items-center gap-1">
            View All <ArrowUpRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex overflow-x-auto space-x-2 pb-4 mb-6">
          {categories.map((category, index) => (
            <Badge 
              key={index}
              variant={index === 0 ? "default" : "outline"} 
              className="cursor-pointer whitespace-nowrap"
            >
              {category}
            </Badge>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {apps.map(app => (
            <Card key={app.id} className="overflow-hidden transition-all hover:shadow-md">
              <div className="flex p-4 items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  <img 
                    src={app.image}
                    alt={app.name} 
                    className="w-full h-full object-cover" 
                  />
                </div>
                <div className="ml-4">
                  <h3 className="font-semibold">{app.name}</h3>
                  <p className="text-xs text-gray-500">{app.category}</p>
                </div>
              </div>
              
              <CardContent className="pt-0">
                <p className="text-sm text-gray-600 mb-4">{app.description}</p>
                <div className="flex justify-between text-sm">
                  <div>
                    <span className="text-gray-500">Reward</span>
                    <p className="font-bold text-adtip-teal">{app.reward}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Retention</span>
                    <p className="font-medium">{app.retention}</p>
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="border-t bg-gray-50">
                <Button className="w-full flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" /> Install & Earn
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
      
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4">Frequently Asked Questions</h2>
        <div className="space-y-4">
          {[
            {
              q: "How soon will I get my rewards after installing an app?",
              a: "Rewards are credited to your account after you complete the required retention period, which varies by app (typically 5-14 days)."
            },
            {
              q: "Can I install the same app multiple times to earn more?",
              a: "No, rewards are limited to one per app per user to maintain fairness in our ecosystem."
            },
            {
              q: "Do I need to make purchases within the apps?",
              a: "No, you're never required to make in-app purchases to earn rewards."
            }
          ].map((faq, index) => (
            <div key={index} className="border-b border-gray-200 pb-4 last:border-none last:pb-0">
              <h3 className="font-semibold mb-1">{faq.q}</h3>
              <p className="text-sm text-gray-600">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="text-center">
        <Button size="lg">Browse Available Apps</Button>
      </div>
    </div>
  );
};

export default InstallToEarn;
