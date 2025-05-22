import React, { useState, useEffect } from 'react';
import Piece from './Piece';
import Home from './Home';
import Square from './Square';
import trackLayout from '../utilities/TrackLayout';
import { useGameContext } from '../context/GameContext';
import '../styles/Board.css';

const Board = () => {
  const { playerPositions, currentPlayer, size } = useGameContext();
  const [layout, setLayout] = useState(trackLayout);

  useEffect(() => {
    // Update the layout based on player positions
    const updatedLayout = { ...trackLayout };
  
    // Clear the Piece array in the layout
    Object.values(updatedLayout).forEach((value) => {
      value.Piece = [];
    });
  
    // Update the Piece array in the layout based on player positions
    Object.entries(playerPositions).forEach(([color, positions]) => {
      positions.forEach((position, index) => {
        if (position !== 0 && position !== 106 && position !== 206 && position !== 306 && position !== 406) {
          updatedLayout[position].Piece.push(`${color}-${index}`);
        }
      });
    });
  
    // Update the layout state
    setLayout(updatedLayout);
  }, [playerPositions, currentPlayer]);
  

  return (
    <div id="board" style={{transform: `scale(${size.board})`}}>
      {/* Render Home components for each color */}
      {['red', 'green', 'yellow', 'blue'].map((color) => (
        <Home key={color} color={color}>
          {/* Render pieces for each color */}
          {playerPositions[color].map((position, index) => {
            if (position === 0) {
              return <Piece key={index} id={`${color}-${index}`} color={color} />;
            }
            return null;
          })}
        </Home>
      ))}
      <Square />
      {/* Render track layout */}
      {Object.entries(layout).map(([key, value]) => {
        const numberOfPieces = value.Piece.length;
        const childClassName = numberOfPieces > 1 ? 'multiple-pieces' : '';

        return (
          <div key={key} className={`${value.type} track-${key} ${childClassName}`}>
          {/* {key} */}
            {value.Piece.map((piece, i) => (
              <Piece key={i} id={piece} color={piece.split('-')[0]} />
            ))}
          </div>
        );
      })}
    </div>
  );
};

export default Board;
