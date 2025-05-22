import React from 'react'
import '../styles/Home.css'
import { useGameContext } from '../context/GameContext';

const Home = ({color, children}) => {

  const { currentPlayer } = useGameContext();

  function colorGenerator(color) {
    switch(color) {
      case 'red':
        return '#B22222';
      case 'blue':
        return '#1034A6';
      case 'green':
        return '#228B22';
      case 'yellow':
        return '#F4C431';
      default:
        return 'white';
    }
  }
  function chanceColor(currentPlayer, color) {
    if (currentPlayer === color) {
      return `home-inner ${currentPlayer}-chance`;
    } else {
      return 'home-inner';
    }
  }
  
  return (
    <div id={color+'-home'} className='home' style={{backgroundColor: colorGenerator(color)}}>
      <div className={chanceColor(currentPlayer, color)}>
        {children}
      </div>
    </div>
  )
}

export default Home