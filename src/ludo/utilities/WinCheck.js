const WinCheck = (color, newPosition, nextTurn, playerPositions) => {
  console.log(newPosition)
  const allPlayers = ['red', 'yellow', 'green', 'blue'];

  if (newPosition > (100*(allPlayers.indexOf(color)+1)) + 6) {
    return false;
  }
}

export default WinCheck