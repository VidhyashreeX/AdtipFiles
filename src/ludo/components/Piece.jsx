import React from 'react'
import Move from '../utilities/Move'
import { useGameContext } from '../context/GameContext'
import '../styles/Piece.css'

const Piece = ({color, id}) => {

  const { currentPlayer, diceNumberValue, playerPositions, setDiceDisabled, setPlayerPositions, nextTurn, win, setWin } = useGameContext();

  function colorGenerator(color) {
    switch(color) {
      case 'red':
        return '#FF0800';
      case 'blue':
        return '#0000FF';
      case 'green':
        return '#4CBB17';
      case 'yellow':
        return '#FFC40C';
      default:
        return 'white';
    }
  }

  const make_a_move = (e) => {
    Move(e, { currentPlayer, playerPositions, diceNumberValue, setDiceDisabled, setPlayerPositions, nextTurn, win, setWin});
  }

  return (
    <div id={id}className="piece" style={{backgroundColor: colorGenerator(color)}} onClick={make_a_move}>
        <div className="piece-inner"></div>
    </div>
  )
}

export default Piece