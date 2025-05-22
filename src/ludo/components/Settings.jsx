import React from "react";
import { useGameContext } from "../context/GameContext";
import PlayerChance from "./PlayerChance";
import "../styles/Settings.css";
import PlayersRank from "./PlayersRank";

const Settings = ({ setBoardRotate }) => {
  const { size, setSize, defaultBoardSize } = useGameContext();

  const rotateLeft = () => {
    setBoardRotate((prev) => prev + 90);
  };

  const rotateRight = () => {
    setBoardRotate((prev) => prev - 90);
  };

  const resetRotate = () => {
    setBoardRotate(0);
  };

  const zoomIn = () => {
    setSize((prev) => ({
      ...prev,
      board: (typeof prev.board === 'number' ? prev.board : defaultBoardSize.current) + 0.05,
    }));
  };

  const zoomOut = () => {
    setSize((prev) => ({
      ...prev,
      board: (typeof prev.board === 'number' ? prev.board : defaultBoardSize.current) - 0.05,
    }));
  };

  return (
    <div id="settings">
      <div>
        <div className="players-data">
          <div className="current-player-chance">
            <PlayerChance />
          </div>
          <PlayersRank />
        </div>
        <div className="rotate-settings mt-4">
          <p>rotate</p>
          <div className="rotate-btn flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined icons" onClick={rotateLeft}>rotate_left</span>
              <span>rotate</span>
              <span className="material-symbols-outlined icons" onClick={rotateRight}>rotate_right</span>
            </div>
            <span className="reset-btn" onClick={resetRotate}><u>Reset</u></span>
            <div className="flex items-center gap-2 mt-4">
              <button className="bg-gray-200 rounded-full px-3 py-1 font-bold text-lg" onClick={zoomIn}>+</button>
              <span>zoom</span>
              <button className="bg-gray-200 rounded-full px-3 py-1 font-bold text-lg" onClick={zoomOut}>-</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
