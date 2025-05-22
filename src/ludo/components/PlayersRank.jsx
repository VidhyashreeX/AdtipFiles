import React from "react";
import { useGameContext } from "../context/GameContext";

import "../styles/PlayersRank.css";

const PlayersRank = () => {
    const { win } = useGameContext();
  return (
    <div className="players-rank">
      <p>Player's rank</p>
      <div className="player-rank">
        <div className="pr-position">
          <div className="pr-header">#1</div>
          <div className="pr-name">{win[0] ? win[0] : ""}</div>
        </div>
        <div className="pr-position">
          <div className="pr-header">#2</div>
          <div className="pr-name">{win[1] ? win[1] : ""}</div>
        </div>
        <div className="pr-position">
          <div className="pr-header">#3</div>
          <div className="pr-name">{win[2] ? win[2] : ""}</div>
        </div>
        <div className="pr-position">
          <div className="pr-header">#4</div>
          <div className="pr-name">{win[3] ? win[3] : ""}</div>
        </div>
      </div>
    </div>
  );
};

export default PlayersRank;
