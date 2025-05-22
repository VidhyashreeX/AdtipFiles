import TrackLayout from './TrackLayout'

const CapturingPiece = (newPosition, color, setPlayerPositions) => {

    if (newPosition > 100) return;

    if (newPosition > 52) {
        newPosition -= 52
    }
    
    const trackType = TrackLayout[newPosition].type
    const pieceOnTrack = TrackLayout[newPosition].Piece

    if (!trackType.includes('safe') && pieceOnTrack.length > 0) {
        const [pieceColor, pieceIndex] = pieceOnTrack[0].split('-')
        if (pieceColor !== color) {
            setPlayerPositions((prev) => {
                const newPlayerPositions = { ...prev };
                newPlayerPositions[pieceColor][pieceIndex] = 0;
                return newPlayerPositions;
              });
            pieceOnTrack.pop()
            return true;
        }
        
    }
    return false;
}

export default CapturingPiece