import React, { createContext, useContext, useState, useRef, useEffect } from 'react';

// Create a context for game state
const GameContext = createContext();

// Custom hook to consume the GameContext
export const useGameContext = () => useContext(GameContext);

// GameProvider component to provide the game state
export const GameProvider = ({ children }) => {

  const diceNumberValue = useRef(0);
  const defaultBoardSize = useRef(0.8);
  const [diceDisabled, setDiceDisabled] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [playerPositions, setPlayerPositions] = useState({
    red: [0, 0, 0, 0],
    green: [0, 0, 0, 0],
    blue: [0, 0, 0, 0],
    yellow: [0, 0, 0, 0]
  });
  const [size, setSize] = useState({
    dice: 1.2,
    board: ''
  });
  const [win, setWin] = useState([]);

  useEffect(() => {
    function handleResize() {
      const screenWidth = window.innerWidth;
      let newBoardSize = 0.8;

      if (screenWidth < 1025 && screenWidth >= 768) {
        newBoardSize = 0.8;
        defaultBoardSize.current=0.8
      } else if (screenWidth < 768 && screenWidth >= 550) {
        newBoardSize = 0.5;
        defaultBoardSize.current=0.5
      } else if (screenWidth < 768) {
        newBoardSize = 0.35;
        defaultBoardSize.current=0.35
      }

      setSize(prevSize => ({ ...prevSize, board: newBoardSize }));
    }

    handleResize(); // Initial update

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const rollDice = () => {
    const randomNumber = Math.floor(Math.random() * 6) + 1;
    diceNumberValue.current = randomNumber;
  };

  const nextTurn = () => {
    if (currentPlayer === 'red') {
      setCurrentPlayer('blue');
    } else if (currentPlayer === 'blue') {
      setCurrentPlayer('green');
    } else if (currentPlayer === 'green') {
      setCurrentPlayer('yellow');
    } else {
      setCurrentPlayer('red');
    }
  };

  return (
    <GameContext.Provider value={{ diceNumberValue, rollDice, diceDisabled, setDiceDisabled, currentPlayer, nextTurn, playerPositions, setPlayerPositions, setCurrentPlayer, size, setSize, win, setWin, defaultBoardSize }}>
      {children}
    </GameContext.Provider>
  );
};
