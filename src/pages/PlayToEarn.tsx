import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { ArrowUpRight, Award, Check, Gamepad, Dices } from "lucide-react";
import { useNavigate } from "react-router-dom";
import LudoGame from "../ludo/App";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

const challengeAmounts = [1, 3, 10, 50, 75, 100, 250, 500, 750, 1000];

const PlayToEarn = () => {
  const navigate = useNavigate();
  const [showLudo, setShowLudo] = useState(false);
  const [showChallengeModal, setShowChallengeModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<number | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const games = [
    {
      id: 1,
      title: "Ludo Challenge",
      description: "Play the classic board game and win rewards based on your skill!",
      rewards: "Up to 1000 TipCoins per match",
      image: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0k3Gdijn0SnOVSj7moEVm1axALQbQMgqNLQ&s",
      level: "All Levels",
      action: () => setShowChallengeModal(true)
    },
    {
      id: 2,
      title: "Crypto Blasters",
      description: "Battle in space and earn tokens for each victory!",
      rewards: "Up to 500 TipCoins per week",
      image: "/placeholder.svg",
      level: "Beginner"
    },
    {
      id: 3,
      title: "NFT Heroes",
      description: "Collect heroes, build your team, and earn by winning leagues.",
      rewards: "Earn rare NFTs + 300 TipCoins daily",
      image: "/placeholder.svg",
      level: "Intermediate"
    },
    {
      id: 4,
      title: "Metaverse Tycoon",
      description: "Build your virtual empire and earn passive income.",
      rewards: "Passive earnings up to 1000 TipCoins weekly",
      image: "/placeholder.svg",
      level: "Advanced"
    }
  ];

  const features = [
    "Play exciting games and earn real rewards",
    "Complete daily missions for bonus coins",
    "Compete in tournaments with prize pools",
    "Trade earned tokens for real products",
    "Withdraw earnings to your wallet"
  ];

  return (
    <>
      {/* Challenge Amount Modal */}
      <Dialog open={showChallengeModal} onOpenChange={setShowChallengeModal}>
        <DialogContent className="max-w-lg mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Ludo Challenge</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4 overflow-x-auto py-2 px-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
            {challengeAmounts.map((amt) => (
              <div key={amt} className="min-w-[120px] border rounded-lg p-4 flex flex-col items-center bg-white shadow">
                <span className="font-semibold mb-2">Challenge</span>
                <span className="text-2xl font-bold mb-2">₹{amt}</span>
                <Button size="sm" className="w-full" onClick={() => { setSelectedChallenge(amt); setShowConfirm(true); }}>
                  Select
                </Button>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" className="w-full" onClick={() => setShowChallengeModal(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Confirmation Dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="max-w-xs mx-auto">
          <DialogHeader>
            <DialogTitle className="text-center">Confirm Challenge</DialogTitle>
          </DialogHeader>
          <div className="text-center my-4">
            <p className="mb-2">You selected the <span className="font-bold">₹{selectedChallenge}</span> challenge.</p>
            <p>Do you want to start the game?</p>
          </div>
          <DialogFooter className="flex flex-col gap-2">
            <Button className="w-full" onClick={() => { setShowConfirm(false); setShowChallengeModal(false); setShowLudo(true); }}>Start Game</Button>
            <Button variant="outline" className="w-full" onClick={() => setShowConfirm(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Ludo Game Modal with Zoom Controls */}
      {showLudo && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="relative w-full h-full flex items-center justify-center">
            <button
              className="absolute top-4 right-4 bg-white rounded-full shadow p-2 z-10 hover:bg-gray-200"
              onClick={() => setShowLudo(false)}
            >
              <span className="text-xl font-bold">&times;</span>
            </button>
            {/* Zoom Controls Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
              <Button size="icon" className="bg-white shadow" onClick={() => window.dispatchEvent(new CustomEvent('ludo-zoom-in'))}>+</Button>
              <Button size="icon" className="bg-white shadow" onClick={() => window.dispatchEvent(new CustomEvent('ludo-zoom-out'))}>-</Button>
            </div>
            <div className="w-full h-full flex items-center justify-center">
              <LudoGame />
            </div>
          </div>
        </div>
      )}
      {/* Main Page Content */}
      <div className="container mx-auto py-6 px-4">
        <div className="flex flex-col items-center text-center mb-10">
          <Award className="h-16 w-16 text-adtip-teal mb-4" />
          <h1 className="text-3xl font-bold mb-2">Play to Earn</h1>
          <p className="text-lg text-gray-600 max-w-2xl">
            Play exciting games and complete challenges to earn real rewards. Convert your gaming time into valuable tokens!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <Card className="border-2 border-adtip-teal/20">
            <CardHeader>
              <CardTitle className="text-2xl">How It Works</CardTitle>
              <CardDescription>Simple steps to start earning through gameplay</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <div className="bg-adtip-teal/10 text-adtip-teal rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">1</div>
                <div>
                  <h3 className="font-semibold mb-1">Choose a Game</h3>
                  <p className="text-gray-600">Browse our collection of games and find ones that match your style</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="bg-adtip-teal/10 text-adtip-teal rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">2</div>
                <div>
                  <h3 className="font-semibold mb-1">Play & Complete Tasks</h3>
                  <p className="text-gray-600">Play games, win matches, complete missions to earn coins</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="bg-adtip-teal/10 text-adtip-teal rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">3</div>
                <div>
                  <h3 className="font-semibold mb-1">Collect Rewards</h3>
                  <p className="text-gray-600">Earn TipCoins based on your performance and level</p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <div className="bg-adtip-teal/10 text-adtip-teal rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">4</div>
                <div>
                  <h3 className="font-semibold mb-1">Redeem or Withdraw</h3>
                  <p className="text-gray-600">Exchange coins for products or withdraw to your wallet</p>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full">Get Started Now</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Features & Benefits</CardTitle>
              <CardDescription>Why our Play-to-Earn platform stands out</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <h4 className="font-semibold text-amber-800 mb-2">Earning Potential</h4>
                <p className="text-amber-700">Average users earn 2,000-5,000 TipCoins monthly</p>
                <p className="text-amber-600 text-sm mt-1">Top players can earn up to 20,000 TipCoins!</p>
              </div>
            </CardContent>
            <CardFooter>
              <p className="text-sm text-gray-500">
                *Earnings vary based on skill level, time spent, and game choice
              </p>
            </CardFooter>
          </Card>
        </div>

        <h2 className="text-2xl font-bold mb-6">Featured Games</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {games.map(game => (
            <Card key={game.id} className="overflow-hidden transition-all hover:shadow-lg">
              <div className="h-48 bg-gray-200">
                <img 
                  src={game.image} 
                  alt={game.title} 
                  className="w-full h-full object-cover"
                />
              </div>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{game.title}</CardTitle>
                  <span className="bg-adtip-teal/10 text-adtip-teal text-xs px-2 py-1 rounded">
                    {game.level}
                  </span>
                </div>
                <CardDescription>{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Potential Rewards:</p>
                  <p className="text-adtip-teal font-bold">{game.rewards}</p>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full flex items-center justify-center gap-2"
                  onClick={game.action || (() => {})}
                  variant={game.id === 1 ? "green" : "default"}
                >
                  Play Now
                  <ArrowUpRight className="h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-6">
          <Button size="lg" variant="outline" className="mr-4">View All Games</Button>
          <Button size="lg" variant="green">Start Earning</Button>
        </div>
      </div>
    </>
  );
};

export default PlayToEarn;
