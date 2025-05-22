import React, { useEffect, useState } from 'react'
import Model from './Model'
import PlayersRank from './PlayersRank';
import { useGameContext } from '../context/GameContext';

import '../styles/GameOver.css'

const GameOver = () => {

  const { win, setWin } = useGameContext();
  const [gameOver, setGameOver] = useState('none');

  useEffect(() => {
    const players = ['red', 'green', 'blue', 'yellow'];
    
    if (win.length === 3) {
      players.forEach(player => {
        if (!win.includes(player)) {
          setWin([...win, player]);
        }
      });
      setGameOver('block');
    }
  }, [win, setWin])

  return (
    <div style={{display: gameOver}}>
      <Model heading='Game Over'>
        <div className='game-over'>
          <PlayersRank />
          <div className="restart-btn-container">
            <div className='restart-game-btn' onClick={() => window.location.reload()}>
              Restart Game
            </div>
          </div>
          </div>
      </Model>
    </div>
  )
}

export default GameOver;