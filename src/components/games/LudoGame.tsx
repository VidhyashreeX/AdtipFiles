
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, RotateCw, Search, Dice1, Dice2, Dice3, Dice4, Dice5, Dice6 } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogAction
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface LudoGameProps {
  onClose: () => void;
}

const LudoGame: React.FC<LudoGameProps> = ({ onClose }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const { toast } = useToast();
  
  const challengeAmounts = [1, 3, 10, 50, 75, 100, 250, 500, 750, 1000];
  
  const handleSelectChallenge = (amount: number) => {
    setSelectedAmount(amount);
    setShowConfirmation(true);
  };
  
  const handleConfirmChallenge = () => {
    setShowConfirmation(false);
    setGameStarted(true);
    toast({
      title: "Game Started",
      description: `Ludo Challenge with ₹${selectedAmount} is starting now!`,
    });
  };
  
  if (gameStarted) {
    return <LudoBoardGame onClose={onClose} amount={selectedAmount || 0} />;
  }
  
  return (
    <div className="container mx-auto py-6 px-4 min-h-screen bg-teal-50/30">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={onClose} className="p-2">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold ml-2">Ludo Challenge</h1>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {challengeAmounts.map((amount) => (
          <Card key={amount} className="border border-teal-200 hover:border-teal-400 transition-colors">
            <div className="p-4 text-center">
              <h3 className="font-medium mb-2">Challenge</h3>
              <p className="text-xl font-bold mb-3">₹{amount}</p>
              <Button 
                onClick={() => handleSelectChallenge(amount)} 
                className="w-full bg-green-500 hover:bg-green-600 text-white"
              >
                Select
              </Button>
            </div>
          </Card>
        ))}
      </div>
      
      <Card className="max-w-md mx-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold mb-4">How It Works</h2>
          <ul className="space-y-2">
            <li className="flex items-start gap-2">
              <span className="bg-teal-100 text-teal-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
              <span>Select a challenge amount you want to play for</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-teal-100 text-teal-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
              <span>Complete the game against your opponent</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-teal-100 text-teal-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
              <span>Winner takes the challenge amount in TipCoins</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="bg-teal-100 text-teal-800 rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 mt-0.5">4</span>
              <span>Redeem your winnings through your wallet</span>
            </li>
          </ul>
        </div>
      </Card>
      
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmation</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Do you want to lose ₹{selectedAmount}/-?</p>
            <p className="text-sm text-gray-500 mt-2">
              By proceeding, you agree to play the Ludo Challenge game with the selected amount.
            </p>
          </div>
          <DialogFooter className="sm:justify-between">
            <DialogAction variant="outline" onClick={() => setShowConfirmation(false)}>
              No
            </DialogAction>
            <DialogAction variant="success" onClick={handleConfirmChallenge}>
              Yes
            </DialogAction>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface LudoBoardGameProps {
  onClose: () => void;
  amount: number;
}

const LudoBoardGame: React.FC<LudoBoardGameProps> = ({ onClose, amount }) => {
  const [diceValue, setDiceValue] = useState<number>(1);
  const [currentPlayer, setCurrentPlayer] = useState<'RED' | 'GREEN' | 'YELLOW' | 'BLUE'>('RED');
  const [zoom, setZoom] = useState(100);
  const { toast } = useToast();
  
  const rollDice = () => {
    const newValue = Math.floor(Math.random() * 6) + 1;
    setDiceValue(newValue);
    
    // Change player turn
    const players: Array<'RED' | 'GREEN' | 'YELLOW' | 'BLUE'> = ['RED', 'GREEN', 'YELLOW', 'BLUE'];
    const currentIndex = players.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % players.length;
    setCurrentPlayer(players[nextIndex]);
    
    toast({
      title: `Player ${currentPlayer} rolled a ${newValue}`,
      description: `Next turn: Player ${players[nextIndex]}`,
    });
  };

  const resetZoom = () => {
    setZoom(100);
  };
  
  const DiceComponent = () => {
    switch (diceValue) {
      case 1:
        return <Dice1 className="h-8 w-8 text-white" />;
      case 2:
        return <Dice2 className="h-8 w-8 text-white" />;
      case 3:
        return <Dice3 className="h-8 w-8 text-white" />;
      case 4:
        return <Dice4 className="h-8 w-8 text-white" />;
      case 5:
        return <Dice5 className="h-8 w-8 text-white" />;
      case 6:
        return <Dice6 className="h-8 w-8 text-white" />;
      default:
        return <Dice1 className="h-8 w-8 text-white" />;
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={onClose} className="text-white">
          <ArrowLeft className="h-6 w-6" />
          <span className="ml-2">Back</span>
        </Button>
        <div className="bg-gray-700 text-white px-4 py-2 rounded-md">
          Challenge: ₹{amount}
        </div>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Ludo Board */}
        <div className="flex-1 flex justify-center">
          <div 
            className="relative bg-white rounded-lg shadow-xl overflow-hidden transition-transform"
            style={{transform: `scale(${zoom/100})`, maxWidth: '650px', maxHeight: '650px'}}
          >
            <div className="aspect-square grid grid-cols-15 grid-rows-15 border-4 border-white">
              {/* Yellow Home (Top-Left) */}
              <div className="col-span-6 row-span-6 bg-yellow-500 p-2 flex items-center justify-center">
                <div className="bg-white w-5/6 h-5/6 rounded-lg flex items-center justify-center relative">
                  <div className="grid grid-cols-2 grid-rows-2 gap-4 w-3/4 h-3/4">
                    <div className="bg-yellow-500 rounded-full"></div>
                    <div className="bg-yellow-500 rounded-full"></div>
                    <div className="bg-yellow-500 rounded-full"></div>
                    <div className="bg-yellow-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Center Paths */}
              <div className="col-span-3 row-span-6 grid grid-rows-6">
                {Array.from({length: 18}).map((_, i) => (
                  <div key={`top-path-${i}`} className={`border border-gray-300 ${i === 7 ? 'bg-yellow-300' : ''}`}></div>
                ))}
              </div>
              
              {/* Green Home (Top-Right) */}
              <div className="col-span-6 row-span-6 bg-green-600 p-2 flex items-center justify-center">
                <div className="bg-white w-5/6 h-5/6 rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-2 grid-rows-2 gap-4 w-3/4 h-3/4">
                    <div className="bg-green-600 rounded-full"></div>
                    <div className="bg-green-600 rounded-full"></div>
                    <div className="bg-green-600 rounded-full"></div>
                    <div className="bg-green-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Middle Horizontal Paths */}
              <div className="col-span-6 row-span-3 grid grid-cols-6">
                {Array.from({length: 18}).map((_, i) => (
                  <div key={`left-path-${i}`} className={`border border-gray-300 ${i === 5 ? 'bg-green-400' : ''}`}></div>
                ))}
              </div>
              
              {/* Center Cross */}
              <div className="col-span-3 row-span-3 bg-white">
                <div className="w-full h-full bg-white flex items-center justify-center">
                  <div className="w-full h-full transform rotate-45 overflow-hidden">
                    <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-yellow-500"></div>
                    <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-green-600"></div>
                    <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-red-600"></div>
                    <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-blue-600"></div>
                  </div>
                </div>
              </div>
              
              {/* Middle Horizontal Paths */}
              <div className="col-span-6 row-span-3 grid grid-cols-6">
                {Array.from({length: 18}).map((_, i) => (
                  <div key={`right-path-${i}`} className={`border border-gray-300 ${i === 11 ? 'bg-blue-400' : ''}`}></div>
                ))}
              </div>
              
              {/* Red Home (Bottom-Left) */}
              <div className="col-span-6 row-span-6 bg-red-600 p-2 flex items-center justify-center">
                <div className="bg-white w-5/6 h-5/6 rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-2 grid-rows-2 gap-4 w-3/4 h-3/4">
                    <div className="bg-red-600 rounded-full"></div>
                    <div className="bg-red-600 rounded-full"></div>
                    <div className="bg-red-600 rounded-full"></div>
                    <div className="bg-red-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Center Paths */}
              <div className="col-span-3 row-span-6 grid grid-rows-6">
                {Array.from({length: 18}).map((_, i) => (
                  <div key={`bottom-path-${i}`} className={`border border-gray-300 ${i === 10 ? 'bg-red-300' : ''}`}></div>
                ))}
              </div>
              
              {/* Blue Home (Bottom-Right) */}
              <div className="col-span-6 row-span-6 bg-blue-600 p-2 flex items-center justify-center">
                <div className="bg-white w-5/6 h-5/6 rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-2 grid-rows-2 gap-4 w-3/4 h-3/4">
                    <div className="bg-blue-600 rounded-full"></div>
                    <div className="bg-blue-600 rounded-full"></div>
                    <div className="bg-blue-600 rounded-full"></div>
                    <div className="bg-blue-600 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Path stars */}
              {[
                {row: 2, col: 8, className: "text-yellow-500"},
                {row: 8, col: 2, className: "text-yellow-500"},
                {row: 6, col: 6, className: "text-green-500"},
                {row: 8, col: 12, className: "text-blue-500"},
                {row: 12, col: 8, className: "text-red-500"},
              ].map((star, i) => (
                <div 
                  key={`star-${i}`}
                  className={`absolute flex items-center justify-center ${star.className}`}
                  style={{
                    top: `${(star.row / 15) * 100}%`, 
                    left: `${(star.col / 15) * 100}%`,
                    width: `${(1 / 15) * 100}%`,
                    height: `${(1 / 15) * 100}%`,
                  }}
                >
                  ★
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Game Controls */}
        <div className="w-full lg:w-80 bg-gray-700 rounded-lg p-4 text-white">
          <div className="mb-6">
            <h2 className="text-center text-lg font-bold text-gray-300">PLAYER'S CHANCE</h2>
            <h3 className="text-center text-3xl font-bold mb-4" style={{color: currentPlayer.toLowerCase()}}>{currentPlayer}</h3>
            
            <div className="mb-4">
              <h4 className="mb-2">Player's rank</h4>
              <div className="space-y-1">
                <div className="flex justify-between bg-gray-600 px-2 py-1">
                  <span>#1</span>
                </div>
                <div className="flex justify-between bg-gray-600 px-2 py-1">
                  <span>#2</span>
                </div>
                <div className="flex justify-between bg-gray-600 px-2 py-1">
                  <span>#3</span>
                </div>
                <div className="flex justify-between bg-gray-600 px-2 py-1">
                  <span>#4</span>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="mb-2">zoom</h4>
              <div className="flex justify-between mb-2">
                <Button 
                  variant="outline" 
                  className="flex-1 mr-1"
                  onClick={() => setZoom(Math.max(50, zoom - 10))}
                >
                  <Search className="h-4 w-4 mr-1" />
                  BOARD
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 ml-1"
                  onClick={() => setZoom(Math.min(150, zoom + 10))}
                >
                  <Search className="h-4 w-4 mr-1" />
                  DICE
                </Button>
              </div>
              <button 
                onClick={resetZoom}
                className="text-sm text-center w-full text-gray-300 hover:text-white"
              >
                Reset all zoom setting
              </button>
            </div>
            
            <div className="mb-6">
              <h4 className="mb-2"></h4>
              <div className="flex justify-between items-center">
                <Button variant="outline" className="flex-1 font-bold">
                  ROTATE LEFT
                </Button>
                <Button variant="outline" className="flex-1 font-bold ml-4">
                  ROTATE RIGHT
                </Button>
              </div>
            </div>
          </div>
          
          {/* Roll Button */}
          <div className="mt-8 flex justify-center">
            <Button 
              onClick={rollDice} 
              className="bg-red-700 hover:bg-red-800 text-white h-16 w-16 rounded-md flex items-center justify-center"
            >
              <div className="flex flex-col items-center">
                <DiceComponent />
                <span className="text-xs mt-1">ROLL</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LudoGame;
