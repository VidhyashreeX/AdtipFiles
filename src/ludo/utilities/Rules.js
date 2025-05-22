import React from 'react'

const Rules = (color, currentPosition, newPosition) => {
    let totalPositions = 52
    let winTrackPosition = 0
    let newPositionInRange;

  if (color === 'red') {
    if (currentPosition !== 0 && newPosition > 51) {
      totalPositions = 51;
      winTrackPosition = 100;
    }
  }
  if (color === 'blue') {
    if (currentPosition !== 0 && newPosition > 38 && currentPosition < 40) {
      totalPositions = 38;
      winTrackPosition = 400;
    }
  }
  if (color === 'green') {
    if (currentPosition !== 0 && newPosition > 25 && currentPosition < 27) {
      totalPositions = 25;
      winTrackPosition = 300;
    }
  }
  if (color === 'yellow') {
    if (currentPosition !== 0 && newPosition > 12 && currentPosition < 14) {
      totalPositions = 12;
      winTrackPosition = 200;
    }
  }
  newPositionInRange = newPosition > totalPositions && currentPosition < 100 ? newPosition % totalPositions : newPosition;
  return [totalPositions, winTrackPosition, newPositionInRange];
}

export default Rules