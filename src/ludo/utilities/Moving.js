import Rules from "./Rules";

const Moving = (currentPosition, setPlayerPositions, color, index, newPosition, playerPositions, currentPlayer, win, setWin) => {
    
    const [totalPositions, winTrackPosition, newPositionInRange] = Rules(color, currentPosition, newPosition);

    if (currentPosition === 0) {
        changingPosition(color, index, newPositionInRange, setPlayerPositions, playerPositions, currentPlayer, win, setWin);
    } else {
        const positionsToMove = newPositionInRange - currentPosition + (newPosition > totalPositions && currentPosition < 100 ? totalPositions : 0);
        for (let i = 1; i <= positionsToMove; i++) {
            setTimeout(() => {
                const newPosition = (currentPosition + i) > totalPositions && currentPosition < 100? winTrackPosition + (currentPosition + i) % totalPositions : currentPosition + i;
                changingPosition(color, index, newPosition, setPlayerPositions, playerPositions, currentPlayer, win, setWin);
            }, 400 * (i - 1));
        }
    }
};

export default Moving;

const changingPosition = (color, index, newPosition, setPlayerPositions, playerPositions, currentPlayer, win, setWin) => {
    setPlayerPositions((prev) => {
        const newPlayerPositions = { ...prev };
        newPlayerPositions[color][index] = newPosition;
        if (playerPositions[currentPlayer].every(value => value === 106 || value === 206 || value === 306 || value === 406) && win.includes(color) === false) {
            setWin([...win, color]);
        }
        return newPlayerPositions;
    });
};
