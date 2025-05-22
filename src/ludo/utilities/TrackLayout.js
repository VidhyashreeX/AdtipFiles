const trackLayout = {};

const createTrack = (type, piece = []) => ({ type, Piece: piece });

// Constants for track positions
const START_POSITIONS = [1, 14, 27, 40];
const STOP_POSITIONS = [9, 22, 35, 48];
const FINAL_POSITIONS = { red: 101, yellow: 201, green: 301, blue: 401 };

const getColorByPosition = (position) => {
    if (position >= 1 && position <= 13) {
        return "red";
    } else if (position >= 14 && position <= 26) {
        return "yellow";
    } else if (position >= 27 && position <= 39) {
        return "green";
    } else if (position >= 40 && position <= 52) {
        return "blue";
    } else {
        return null; // Handle positions outside the defined range
    }
};


// Define normal tracks
for (let i = 1; i <= 52; i++) {
    let type = "track";
    if (START_POSITIONS.includes(i)) {
        type = "track " + getColorByPosition(i) + " start safe";
    } else if (STOP_POSITIONS.includes(i)) {
        type = "track stop safe";
    }
    trackLayout[i] = createTrack(type);
}

// Define win tracks for each color
Object.entries(FINAL_POSITIONS).forEach(([color, startPosition]) => {
    for (let i = startPosition; i <= startPosition + 4; i++) {
        trackLayout[i] = createTrack(`track ${color} final`);
    }
});

export default trackLayout;
