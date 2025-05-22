import React, { useEffect, useState } from 'react';
import { useGameContext } from '../context/GameContext';
import DiceRolled from '../utilities/DiceRolled';
import '../styles/Dice.css';
import rollSound from '../assests/roll.mp3';

const Dice = () => {

  const { diceNumberValue, rollDice, diceDisabled, setDiceDisabled, currentPlayer, playerPositions, nextTurn, size } = useGameContext();
  const [shadow, setShadow] = useState("");
  const diceNumber = diceNumberValue.current;

  const audio = new Audio(rollSound);

  const [rotated, setRotated] = useState(false);

  const allInitialValues = [1, 2, 3, 4, 5, 6]
  const [allValues, setValues] = useState(allInitialValues);

  const [diceStyle, setDiceStyle] = useState('hidden');

  const handleClick = () => {
    if (diceDisabled) return;
    audio.play();

    setTimeout(() => {
      setDiceStyle('visible')
      rollDice();
    }, 100);

    setRotated(true);

    setValues(allInitialValues);

    setValues(prevValues => {
      const otherValues = [...prevValues];
      otherValues[diceNumber - 1] = 2;
      return otherValues;
    });

    setTimeout(() => {
      setRotated(false);
      if (!audio.paused && audio.currentTime > 0 && !audio.ended) {
        audio.pause();
        audio.currentTime = 0;
      }
    
    }, 1000);

    setTimeout(() => { setDiceStyle('hidden') }, 800);

  };

  useEffect(() => {

    DiceRolled(diceNumberValue, nextTurn, currentPlayer, playerPositions, setDiceDisabled)

    if (diceNumber === 0) return;
    
    if ((diceNumber === 6 || playerPositions[currentPlayer].some(value => value !== 0))) {
      setDiceDisabled(true);
    } else {
      setTimeout(() => {
        diceNumberValue.current = 0;
        nextTurn();
        setDiceDisabled(false);
      }, 1500);
    }

  }, [diceNumber, playerPositions, diceNumberValue, nextTurn, setDiceDisabled]);

  return (
    <div id="dice" style={{transform: `scale(${size.dice})`}}>
      <div
        className={`dice ${rotated ? 'rotate' : ''}`}
        onClick={handleClick}
        style={{ overflow: diceStyle }}
      >
        <div className="face top shadow-on">
          <div className={'inner-face face' + allValues[0]}>
            {Array(allValues[0])
              .fill()
              .map((_, i) => (
                <span key={i} className={'dot'} />
              ))}
          </div>
        </div>
        <div className="face front">
          <div className={'inner-face face' + allValues[1]}>
            {Array(allValues[1])
              .fill()
              .map((_, i) => (
                <span key={i} className="dot" />
              ))}
          </div>
        </div>
        <div className="face left shadow-on">
          <div className={'inner-face face' + allValues[2]}>
            {Array(allValues[2])
              .fill()
              .map((_, i) => (
                <span key={i} className="dot" />
              ))}
          </div>
        </div>
        {/* Main Face (front face) */}
        <div className="face back">
          <div className={'inner-face face' + diceNumber}>
            {Array(diceNumber)
              .fill()
              .map((_, i) => (
                <span key={i} className="dot" />
              ))}
            {diceNumber === 0 && (
              <span className="dice-initial-face">ROLL</span>
            )}
          </div>
        </div>
        <div className="face right shadow-on">
          <div className={'inner-face face' + allValues[4]}>
            {Array(allValues[4])
              .fill()
              .map((_, i) => (
                <span key={i} className="dot" />
              ))}
          </div>
        </div>
        <div className="face bottom shadow-on">
          <div className={'inner-face face' + allValues[5]}>
            {Array(allValues[5])
              .fill()
              .map((_, i) => (
                <span key={i} className="dot" />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dice;
