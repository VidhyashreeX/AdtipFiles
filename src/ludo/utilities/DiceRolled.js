import React from "react";

const DiceRolled = (
  diceNumberValue,
  nextTurn,
  currentPlayer,
  playerPositions,
  setDiceDisabled
) => {
  const diceNumber = diceNumberValue.current;

  const checkAllPositions = (positions, value) => {
    return positions.every((position) => position === value);
  };

  // if dice is 6 and all are at home track.
  if (diceNumber === 6 && playerPositions[currentPlayer].every(position => position > 100)) {
    setTimeout(() => {
      diceNumberValue.current = 0;
      nextTurn();
      setDiceDisabled(false);
    }, 1500);
  }

  // If all the pieces are at zero position except some which can't move because the dice value is more than the winning value
  const checkAllPossibilities = (diceNumber, currentPlayer, diceNumberValue, nextTurn, setDiceDisabled ) => {
    if (diceNumber !== 0) {
      const allPlayers = ["red", "yellow", "green", "blue"];
      const winTrack = 100 * (allPlayers.indexOf(currentPlayer) + 1);
      let isTurn = true;
      if (diceNumber === 6){
        isTurn = false;
      }
      for (let position of playerPositions[currentPlayer]) {
        if (position < winTrack && position !== 0) {
          isTurn = false;
          break;
        } else if (position > winTrack && position < winTrack+6 && position + diceNumber <= winTrack+6) {
          isTurn = false;
          break;
        }
      }
      if (isTurn) {
        setTimeout(() => {
          diceNumberValue.current = 0;
          nextTurn();
          setDiceDisabled(false);
        }, 1500);
      }
    }
  }

  checkAllPossibilities(diceNumber, currentPlayer, diceNumberValue, nextTurn, setDiceDisabled)

  // checking if all pieces of current player are in the winning position.
  if (currentPlayer === "red") {
    if (checkAllPositions(playerPositions["red"], 106)) {
      nextTurn();
    }
  } else if (currentPlayer === "blue") {
    if (checkAllPositions(playerPositions["blue"], 406)) {
      nextTurn();
    }
  } else if (currentPlayer === "green") {
    if (checkAllPositions(playerPositions["green"], 306)) {
      nextTurn();
    }
  } else if (currentPlayer === "yellow") {
    if (checkAllPositions(playerPositions["yellow"], 206)) {
      nextTurn();
    }
  }
};

export default DiceRolled;
