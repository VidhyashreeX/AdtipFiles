import React from 'react'
import { useGameContext } from '../context/GameContext';

import '../styles/PlayerChance.css'

const PlayerChance = () => {

    const { currentPlayer } = useGameContext();

  return (
    <div className='current-player-info'>
        <h3 className='current-player-heading'>Player's Chance</h3>
        <h1 className={`current-player-name cpn-${currentPlayer}`}>{currentPlayer}</h1>
    </div>
  )
}

export default PlayerChance