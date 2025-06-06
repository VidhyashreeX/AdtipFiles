import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Image,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Try to import useTabNavigator, but don't fail if it's not available
let useTabNavigator = () => ({ contentPaddingBottom: 0 });
try {
  // This is a dynamic import to prevent the app from crashing
  // if the TabNavigatorContext is not available
  useTabNavigator = require('../../contexts/TabNavigatorContext').useTabNavigator;
} catch (e) {
  console.log('TabNavigatorContext not available, using fallback padding');
}

// Calculate adaptive sizes based on screen width
const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const BOARD_SIZE = Math.min(width * 0.9, height * 0.45); // Limit board size relative to height
const CELL_SIZE = BOARD_SIZE / 15;
const HOME_SIZE = BOARD_SIZE * 0.4;
const TOKEN_SIZE = CELL_SIZE * 0.8;

// Player colors
const PLAYER_COLORS = {
  red: '#FF5252',
  green: '#4CAF50',
  yellow: '#FFC107',
  blue: '#2196F3',
};

// Initial player tokens positions
const INITIAL_POSITIONS = {
  red: [
    { x: 1, y: 1 }, { x: 3, y: 1 }, 
    { x: 1, y: 3 }, { x: 3, y: 3 }
  ],
  green: [
    { x: 11, y: 1 }, { x: 13, y: 1 }, 
    { x: 11, y: 3 }, { x: 13, y: 3 }
  ],
  yellow: [
    { x: 1, y: 11 }, { x: 3, y: 11 }, 
    { x: 1, y: 13 }, { x: 3, y: 13 }
  ],
  blue: [
    { x: 11, y: 11 }, { x: 13, y: 11 }, 
    { x: 11, y: 13 }, { x: 13, y: 13 }
  ],
};

// Challenge types with their entry fees and winnings
const CHALLENGES = [
  { id: 'free', name: 'Free Play', entryFee: 0, winAmount: 0, players: '2/4', difficulty: 'Easy' },
  { id: 'beginner', name: 'Beginner Challenge', entryFee: 1, winAmount: 1.8, players: '2/4', difficulty: 'Easy' },
  { id: 'casual', name: 'Casual Match', entryFee: 5, winAmount: 9, players: '3/4', difficulty: 'Easy' },
  { id: 'classic', name: 'Classic Battle', entryFee: 10, winAmount: 18, players: '2/4', difficulty: 'Medium' },
  { id: 'pro', name: 'Pro Tournament', entryFee: 25, winAmount: 45, players: '2/4', difficulty: 'Medium' },
  { id: 'expert', name: 'Expert League', entryFee: 50, winAmount: 90, players: '2/4', difficulty: 'Hard' },
  { id: 'championship', name: 'Championship', entryFee: 100, winAmount: 180, players: '2/4', difficulty: 'Hard' },
];

// Path coordinates for each player (simplified for brevity)
const PATH_COORDINATES = {
  red: [
    { x: 6, y: 1 }, { x: 6, y: 2 }, { x: 6, y: 3 }, { x: 6, y: 4 }, 
    { x: 6, y: 5 }, { x: 5, y: 6 }, { x: 4, y: 6 }, { x: 3, y: 6 }, 
    { x: 2, y: 6 }, { x: 1, y: 6 }, { x: 0, y: 7 }, { x: 1, y: 8 },
    { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }, { x: 5, y: 8 },
    { x: 6, y: 9 }, { x: 6, y: 10 }, { x: 6, y: 11 }, { x: 6, y: 12 },
    { x: 6, y: 13 }, { x: 7, y: 14 }, { x: 8, y: 13 }, { x: 8, y: 12 },
    { x: 8, y: 11 }, { x: 8, y: 10 }, { x: 8, y: 9 }, { x: 9, y: 8 },
    { x: 10, y: 8 }, { x: 11, y: 8 }, { x: 12, y: 8 }, { x: 13, y: 8 },
    { x: 14, y: 7 }, { x: 13, y: 6 }, { x: 12, y: 6 }, { x: 11, y: 6 },
    { x: 10, y: 6 }, { x: 9, y: 6 }, { x: 8, y: 5 }, { x: 8, y: 4 },
    { x: 8, y: 3 }, { x: 8, y: 2 }, { x: 8, y: 1 }, { x: 7, y: 0 },
    // Red home path
    { x: 7, y: 1 }, { x: 7, y: 2 }, { x: 7, y: 3 }, { x: 7, y: 4 },
    { x: 7, y: 5 }, { x: 7, y: 6 }, { x: 7, y: 7 },
  ],
  green: [
    // Similar pattern for green, adjusted to start from green's entry point
    // For brevity, showing only part of it
    { x: 13, y: 6 }, { x: 12, y: 6 }, { x: 11, y: 6 }, { x: 10, y: 6 }
    // ... remaining path coordinates
  ],
  yellow: [
    // Yellow path coordinates
    { x: 8, y: 13 }, { x: 8, y: 12 }, { x: 8, y: 11 }, { x: 8, y: 10 }
    // ... remaining path coordinates
  ],
  blue: [
    // Blue path coordinates
    { x: 1, y: 8 }, { x: 2, y: 8 }, { x: 3, y: 8 }, { x: 4, y: 8 }
    // ... remaining path coordinates
  ],
};

// Safe cells where tokens cannot be captured
const SAFE_CELLS = [
  {x: 6, y: 2}, {x: 8, y: 6}, {x: 12, y: 8}, {x: 8, y: 12}, {x: 6, y: 8}, {x: 2, y: 6}
];

const PlayToEarnScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  // Try to use TabNavigator context, but fallback to safe area bottom padding if not available
  let contentPadding = 0;
  try {
    contentPadding = useTabNavigator().contentPaddingBottom;
  } catch (e) {
    contentPadding = insets.bottom;
  }
  
  // Game states
  const [gameMode, setGameMode] = useState<'menu' | 'challenges' | 'lobby' | 'game'>('challenges');
  const [gameStarted, setGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPlayer, setCurrentPlayer] = useState('red');
  const [diceValue, setDiceValue] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [players, setPlayers] = useState(['red', 'green', 'yellow', 'blue']);
  const [showRulesModal, setShowRulesModal] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState(CHALLENGES[3]); // Classic Battle as default
  const [gameDuration, setGameDuration] = useState(0);
  const [totalMoves, setTotalMoves] = useState(0);
  const [movesPerPlayer, setMovesPerPlayer] = useState({red: 0, blue: 0, yellow: 0, green: 0});
  const [avgDiceRoll, setAvgDiceRoll] = useState(0);
  const [luckyRolls, setLuckyRolls] = useState(0);
  const [gameStats, setGameStats] = useState({
    duration: '0:00',
    totalMoves: 0,
    avgRoll: 0,
    luckyRolls: 0
  });
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  // Player tokens state
  const [tokens, setTokens] = useState({
    red: [
      { position: 'home', index: 0, pathIndex: -1 }, 
      { position: 'home', index: 1, pathIndex: -1 },
      { position: 'home', index: 2, pathIndex: -1 }, 
      { position: 'home', index: 3, pathIndex: -1 }
    ],
    green: [
      { position: 'home', index: 0, pathIndex: -1 }, 
      { position: 'home', index: 1, pathIndex: -1 },
      { position: 'home', index: 2, pathIndex: -1 }, 
      { position: 'home', index: 3, pathIndex: -1 }
    ],
    yellow: [
      { position: 'home', index: 0, pathIndex: -1 }, 
      { position: 'home', index: 1, pathIndex: -1 },
      { position: 'home', index: 2, pathIndex: -1 }, 
      { position: 'home', index: 3, pathIndex: -1 }
    ],
    blue: [
      { position: 'home', index: 0, pathIndex: -1 }, 
      { position: 'home', index: 1, pathIndex: -1 },
      { position: 'home', index: 2, pathIndex: -1 }, 
      { position: 'home', index: 3, pathIndex: -1 }
    ],
  });
  
  // Animation refs
  const diceAnimation = useRef(new Animated.Value(0)).current;
  const shakeAnimation = useRef(new Animated.Value(0)).current;
  
  // Transition between screens with animations
  const transitionToScreen = (screen) => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(slideAnim, {
        toValue: screen === 'game' ? -width : (screen === 'challenges' ? width : 0),
        duration: 0,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setGameMode(screen);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };
  
  // Handle dice roll
  const rollDice = () => {
    if (isRolling) return;
    
    setIsRolling(true);
    
    // Animate dice rolling
    Animated.sequence([
      Animated.timing(diceAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(diceAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(diceAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(diceAnimation, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(diceAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start(() => {
      const newValue = Math.floor(Math.random() * 6) + 1;
      setDiceValue(newValue);
      setIsRolling(false);
      
      // Update stats
      setTotalMoves(prev => prev + 1);
      setMovesPerPlayer(prev => ({
        ...prev,
        [currentPlayer]: prev[currentPlayer] + 1
      }));
      
      if (newValue === 6) {
        setLuckyRolls(prev => prev + 1);
      }
      
      setAvgDiceRoll(prev => {
        const total = avgDiceRoll * totalMoves + newValue;
        return total / (totalMoves + 1);
      });
      
      // If game not started and rolled 6, start game
      if (!gameStarted && newValue === 6) {
        setGameStarted(true);
        Alert.alert("Game Started!", "You rolled a 6! Move one of your tokens out of home.");
      } else if (!gameStarted) {
        // Move to next player if didn't roll 6
        nextPlayer();
      }
      
      // If no valid moves, go to next player
      checkForValidMoves(newValue);
    });
  };
  
  // Check if current player has valid moves
  const checkForValidMoves = (diceVal) => {
    // Existing logic
    const playerTokens = tokens[currentPlayer];
    let hasValidMove = false;
    
    // Check if any token can move
    playerTokens.forEach(token => {
      if (token.position === 'home' && diceVal === 6) {
        hasValidMove = true;
      } else if (token.position === 'path') {
        hasValidMove = true;
      }
    });
    
    if (!hasValidMove) {
      setTimeout(() => {
        nextPlayer();
      }, 1000);
    }
  };
  
  // Move to next player
  const nextPlayer = () => {
    const currentIndex = players.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % players.length;
    
    // Animate player change
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentPlayer(players[nextIndex]);
    });
  };
  
  // Calculate player stats
  const calculatePlayerStats = (color) => {
    const playerTokens = tokens[color];
    const home = playerTokens.filter(t => t.position === 'home').length;
    const board = playerTokens.filter(t => t.position === 'path').length;
    const finished = playerTokens.filter(t => t.position === 'finished').length;
    
    return { home, board, finished };
  };
  
  // Render challenges selection screen (images 3 & 4)
  const renderChallengesScreen = () => {
    return (
      <View style={styles.challengesContainer}>
        <View style={styles.ludoHeader}>
          <View style={styles.logoContainer}>
            <Icon name="cube" size={36} color="#FF7043" style={styles.logoIcon} />
            <View>
              <Text style={styles.gameTitle}>
                <Text style={{color: '#FF7043'}}>Ludo</Text>{' '}
                <Text style={{color: '#4CAF50'}}>Game</Text>{' '}
                <Icon name="gamepad-variant" size={24} color="#4CAF50" />
              </Text>
              <Text style={styles.gameSubtitle}>
                Classic Board Game • 4 Players • {'\n'}
                Strategic Fun • Real Money Challenges
              </Text>
            </View>
          </View>
          
          <View style={styles.challengeHeader}>
            <Text style={styles.challengeTitle}>Choose Your Challenge</Text>
            <Text style={styles.challengeSubtitle}>
              Select a challenge to start playing and win real money!
            </Text>
          </View>
        </View>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.challengesScrollContent}
        >
          {CHALLENGES.map((challenge) => (
            <TouchableOpacity 
              key={challenge.id}
              style={[
                styles.challengeCard,
                selectedChallenge.id === challenge.id && styles.selectedChallenge
              ]}
              onPress={() => {
                Animated.sequence([
                  Animated.timing(scaleAnim, {
                    toValue: 0.95,
                    duration: 100,
                    useNativeDriver: true,
                  }),
                  Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 100,
                    useNativeDriver: true,
                  }),
                ]).start(() => {
                  setSelectedChallenge(challenge);
                });
              }}
            >
              <View style={styles.challengeMain}>
                <Text style={styles.challengeName}>{challenge.name}</Text>
                
                <View style={styles.challengeDetails}>
                  <View style={styles.challengeDetailItem}>
                    <Icon name="ticket-percent-outline" size={16} color="#4CAF50" />
                    <Text style={styles.detailLabel}>Entry Fee</Text>
                    <Text style={styles.detailValue}>
                      ₹{challenge.entryFee}
                    </Text>
                  </View>
                  
                  <View style={styles.challengeDetailItem}>
                    <Icon name="trophy-outline" size={16} color="#FFC107" />
                    <Text style={styles.detailLabel}>Win Amount</Text>
                    <Text style={[styles.detailValue, {color: '#4CAF50'}]}>
                      ₹{challenge.winAmount}
                    </Text>
                  </View>
                  
                  <View style={styles.challengeDetailItem}>
                    <Icon name="account-group-outline" size={16} color="#2196F3" />
                    <Text style={styles.detailLabel}>Players</Text>
                    <Text style={styles.detailValue}>
                      {challenge.players}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.progressContainer}>
                  <View 
                    style={[
                      styles.progressBar, 
                      {
                        width: challenge.id === 'casual' ? '75%' : '50%',
                        backgroundColor: challenge.id === selectedChallenge.id ? '#651FFF' : '#E0E0E0'
                      }
                    ]} 
                  />
                </View>
              </View>
              
              <View style={[
                styles.difficultyBadge, 
                {
                  backgroundColor: challenge.difficulty === 'Easy' 
                    ? '#4CAF50' 
                    : challenge.difficulty === 'Medium' 
                    ? '#FFC107' 
                    : '#FF5252'
                }
              ]}>
                <Text style={styles.difficultyText}>{challenge.difficulty}</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          {/* Selection card */}
          {selectedChallenge && (
            <View style={styles.selectionCardContainer}>
              <View style={styles.selectionCard}>
                <Text style={styles.selectionCardTitle}>
                  {selectedChallenge.name} Selected!
                </Text>
                <View style={styles.selectionCardDetails}>
                  <View style={styles.feeSection}>
                    <Text style={styles.feeAmount}>₹{selectedChallenge.entryFee}</Text>
                    <Text style={styles.feeLabel}>Entry Fee</Text>
                  </View>
                  <Icon name="arrow-right" size={20} color="#651FFF" />
                  <View style={styles.winSection}>
                    <Text style={styles.winAmount}>₹{selectedChallenge.winAmount}</Text>
                    <Text style={styles.winLabel}>Win Amount</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  style={styles.startGameButton}
                  onPress={() => {
                    // First transition to lobby screen with loading animation
                    transitionToScreen('lobby');
                    
                    // After a short delay, transition to the actual game screen
                    setTimeout(() => {
                      transitionToScreen('game');
                    }, 2000);
                  }}
                >
                  <Text style={styles.startGameButtonText}>
                    {selectedChallenge.entryFee > 0 
                      ? `Start Game - Pay ₹${selectedChallenge.entryFee}` 
                      : 'Start Free Game'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
          {/* Add bottom padding to ensure content is visible */}
          <View style={{height: contentPadding + 20}} />
        </ScrollView>
      </View>
    );
  };
  
  // Render game screen (images 1 & 2)
  const renderGameScreen = () => {
    return (
      <ScrollView 
        style={styles.gameScrollView}
        contentContainerStyle={styles.gameContentContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.gameScreen}>
          <View style={styles.ludoHeader}>
            <View style={styles.logoContainer}>
              <Icon name="cube" size={24} color="#FF7043" style={styles.logoIcon} />
              <View>
                <Text style={[styles.gameTitle, { fontSize: 20 }]}>
                  <Text style={{color: '#FF7043'}}>Ludo</Text>{' '}
                  <Text style={{color: '#4CAF50'}}>Game</Text>
                </Text>
                <Text style={[styles.gameSubtitle, { fontSize: 10 }]}>
                  Classic Board Game • 4 Players • Strategic Fun
                </Text>
              </View>
            </View>
            
            <View style={styles.gameInfoBanner}>
              <Text style={styles.gameInfoText}>
                Playing: <Text style={{color: '#651FFF', fontWeight: 'bold'}}>{selectedChallenge.name}</Text> | Win: <Text style={{color: '#4CAF50', fontWeight: 'bold'}}>₹{selectedChallenge.winAmount}</Text>
              </Text>
            </View>
          </View>
          
          {/* Game Board */}
          <View style={styles.modernBoardContainer}>
            <View style={styles.modernBoard}>
              {/* Colored Regions */}
              <View style={[styles.colorRegion, styles.redRegion]} />
              <View style={[styles.colorRegion, styles.greenRegion]} />
              <View style={[styles.colorRegion, styles.yellowRegion]} />
              <View style={[styles.colorRegion, styles.blueRegion]} />
              
              {/* Center Finish */}
              <View style={styles.centerFinish} />
              
              {/* Grid Lines */}
              <View style={styles.gridContainer}>
                {Array(15).fill(0).map((_, i) => (
                  <View 
                    key={`horizontal-${i}`} 
                    style={[styles.gridLineHorizontal, { top: i * CELL_SIZE }]} 
                  />
                ))}
                {Array(15).fill(0).map((_, i) => (
                  <View 
                    key={`vertical-${i}`} 
                    style={[styles.gridLineVertical, { left: i * CELL_SIZE }]} 
                  />
                ))}
              </View>
              
              {/* Safe Cells */}
              {SAFE_CELLS.map((cell, index) => (
                <View 
                  key={`safe-${index}`}
                  style={[
                    styles.safeCell,
                    {
                      left: cell.x * CELL_SIZE,
                      top: cell.y * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                    }
                  ]}
                />
              ))}
              
              {/* Tokens */}
              {Object.keys(tokens).map(color => 
                tokens[color].map((token, index) => {
                  if (token.position === 'home') {
                    const position = INITIAL_POSITIONS[color][index];
                    return (
                      <TouchableOpacity
                        key={`${color}-${index}`}
                        style={[
                          styles.token,
                          {
                            backgroundColor: 'white',
                            borderColor: PLAYER_COLORS[color],
                            left: position.x * CELL_SIZE - TOKEN_SIZE/2,
                            top: position.y * CELL_SIZE - TOKEN_SIZE/2,
                            width: TOKEN_SIZE,
                            height: TOKEN_SIZE,
                            borderRadius: TOKEN_SIZE / 2,
                          }
                        ]}
                        onPress={() => {
                          // Add moveToken function implementation if not already defined
                          if (typeof moveToken === 'function') {
                            moveToken(color, index);
                          }
                        }}
                      />
                    );
                  } else if (token.position === 'path') {
                    // For brevity, just place at the first path position
                    const pathPos = {x: 6, y: 1}; // Would be PATH_COORDINATES[color][token.pathIndex]
                    return (
                      <TouchableOpacity
                        key={`${color}-path-${index}`}
                        style={[
                          styles.token,
                          {
                            backgroundColor: 'white',
                            borderColor: PLAYER_COLORS[color],
                            left: pathPos.x * CELL_SIZE - TOKEN_SIZE/2,
                            top: pathPos.y * CELL_SIZE - TOKEN_SIZE/2,
                            width: TOKEN_SIZE,
                            height: TOKEN_SIZE,
                            borderRadius: TOKEN_SIZE / 2,
                          }
                        ]}
                        onPress={() => {
                          // Add moveToken function implementation if not already defined
                          if (typeof moveToken === 'function') {
                            moveToken(color, index);
                          }
                        }}
                      />
                    );
                  }
                  return null;
                })
              )}
            </View>
          </View>
          
          {/* Game Controls */}
          <View style={styles.gameControlsPanel}>
            <Text style={styles.controlsPanelTitle}>Game Controls</Text>
            {gameStarted ? (
              <View style={styles.activeControls}>
                <Text style={styles.currentPlayerText}>
                  Current Player: <Text style={{color: PLAYER_COLORS[currentPlayer]}}>{currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)}</Text>
                </Text>
                
                <TouchableOpacity 
                  style={styles.diceButton}
                  onPress={rollDice}
                  disabled={isRolling}
                >
                  <Animated.View
                    style={[
                      styles.diceButtonInner,
                      {
                        transform: [
                          { scale: diceAnimation.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: [1, 1.2, 1],
                          })},
                          { rotate: diceAnimation.interpolate({
                            inputRange: [0, 0.5, 1],
                            outputRange: ['0deg', '180deg', '360deg'],
                          })}
                        ]
                      }
                    ]}
                  >
                    <Icon name={`dice-${diceValue}`} size={32} color="#FF5252" />
                  </Animated.View>
                  <Text style={styles.diceButtonText}>Roll Dice</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={() => {
                    Alert.alert(
                      "Reset Game",
                      "Are you sure you want to reset the game?",
                      [
                        { text: "Cancel", style: "cancel" },
                        { 
                          text: "Reset", 
                          onPress: () => {
                            setGameMode('challenges');
                            setGameStarted(false);
                            // Reset other game state
                          }
                        }
                      ]
                    );
                  }}
                >
                  <Icon name="refresh" size={18} color="#555" />
                  <Text style={styles.resetButtonText}>Reset Game</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.preGameControls}>
                <Text style={styles.readyText}>Ready to play Ludo?</Text>
                <TouchableOpacity 
                  style={styles.startButton}
                  onPress={() => setGameStarted(true)}
                >
                  <Icon name="play" size={18} color="#FFFFFF" />
                  <Text style={styles.startButtonText}>Start Game</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          {/* Players Section */}
          <View style={styles.playersSection}>
            <View style={styles.sectionHeader}>
              <Icon name="account-group" size={18} color="#555" />
              <Text style={styles.sectionTitle}>Players</Text>
            </View>
            
            {players.map(color => {
              const stats = calculatePlayerStats(color);
              return (
                <View 
                  key={`player-${color}`}
                  style={[
                    styles.playerCard,
                    color === currentPlayer && styles.activePlayerCard,
                    { borderColor: PLAYER_COLORS[color] }
                  ]}
                >
                  <View style={styles.playerHeader}>
                    <View style={[styles.playerColor, { backgroundColor: PLAYER_COLORS[color] }]} />
                    <Text style={styles.playerName}>{color.charAt(0).toUpperCase() + color.slice(1)}</Text>
                    {color === currentPlayer && (
                      <View style={styles.currentBadge}>
                        <Text style={styles.currentBadgeText}>Current</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.playerStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Home:</Text>
                      <Text style={styles.statValue}>{stats.home}</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Board:</Text>
                      <Text style={styles.statValue}>{stats.board}</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={styles.statLabel}>Final:</Text>
                      <Text style={styles.statValue}>{stats.finished}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          
          {/* Game Statistics */}
          <View style={styles.statsSection}>
            <View style={styles.sectionHeader}>
              <Icon name="chart-bar" size={18} color="#555" />
              <Text style={styles.sectionTitle}>Game Statistics</Text>
            </View>
            
            <View style={styles.statsGrid}>
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Icon name="clock-outline" size={16} color="#2196F3" />
                  <Text style={styles.statBoxLabel}>Duration</Text>
                  <Text style={styles.statBoxValue}>0:00</Text>
                </View>
                <View style={styles.statBox}>
                  <Icon name="arrow-decision-outline" size={16} color="#4CAF50" />
                  <Text style={styles.statBoxLabel}>Total Moves</Text>
                  <Text style={styles.statBoxValue}>{totalMoves}</Text>
                </View>
              </View>
              
              <Text style={styles.statSubheading}>Moves per Player</Text>
              
              {players.map(color => (
                <View key={`moves-${color}`} style={styles.playerMovesRow}>
                  <View style={[styles.playerMovesDot, { backgroundColor: PLAYER_COLORS[color] }]} />
                  <Text style={styles.playerMovesName}>{color.charAt(0).toUpperCase() + color.slice(1)}</Text>
                  <Text style={styles.playerMovesValue}>{movesPerPlayer[color]}</Text>
                </View>
              ))}
              
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Average Dice Roll:</Text>
                  <Text style={styles.statBoxValue}>{avgDiceRoll.toFixed(1)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statBoxLabel}>Lucky Rolls (6s):</Text>
                  <Text style={styles.statBoxValue}>{luckyRolls}</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Add bottom padding to ensure content is visible */}
          <View style={{height: contentPadding + 20}} />
        </View>
      </ScrollView>
    );
  };
  
  // Render lobby screen
  const renderLobbyScreen = () => {
    return (
      <View style={styles.lobbyContainer}>
        <Text style={styles.lobbyTitle}>Waiting for Players...</Text>
        
        <ActivityIndicator size="large" color="#651FFF" style={styles.lobbyLoader} />
        
        <View style={styles.lobbyPlayers}>
          {players.map((color, index) => (
            <View key={`lobby-${color}`} style={styles.lobbyPlayer}>
              <View style={[styles.lobbyPlayerIcon, { backgroundColor: PLAYER_COLORS[color] }]} />
              <Text style={styles.lobbyPlayerText}>
                {index === 0 ? `You (${color.charAt(0).toUpperCase() + color.slice(1)})` : 'Waiting...'}
              </Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity
          style={styles.lobbyButton}
          onPress={() => transitionToScreen('challenges')}
        >
          <Text style={styles.lobbyButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Add function for moving tokens if not already defined
  const moveToken = (color, index) => {
    // Make sure this function exists to avoid errors when pressing tokens
    if (color !== currentPlayer || !gameStarted) {
      return;
    }

    // Example implementation stub
    console.log(`Moving ${color} token ${index}`);
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: colors.background}]}>
      <Header title="Play to Earn" showBackButton />
      
      <Animated.View 
        style={[
          styles.animatedContainer,
          {
            opacity: fadeAnim,
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim }
            ]
          }
        ]}
      >
        {gameMode === 'challenges' && renderChallengesScreen()}
        {gameMode === 'lobby' && renderLobbyScreen()}
        {gameMode === 'game' && renderGameScreen()}
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  
  // Challenge screen styles
  challengesContainer: {
    flex: 1,
  },
  challengesScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  
  // Game screen styles
  gameScrollView: {
    flex: 1,
  },
  gameContentContainer: {
    paddingBottom: 24,
  },
  gameScreen: {
    flex: 1,
  },
  
  // Ludo header
  ludoHeader: {
    padding: 12,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoIcon: {
    marginRight: 8,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 28,
  },
  gameSubtitle: {
    fontSize: 12,
    color: '#757575',
    lineHeight: 16,
  },
  gameInfoBanner: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  gameInfoText: {
    fontSize: 12,
    textAlign: 'center',
    color: '#424242',
  },
  
  // Challenge header
  challengeHeader: {
    marginTop: 16,
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  challengeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#651FFF',
    marginBottom: 4,
  },
  challengeSubtitle: {
    fontSize: 14,
    color: '#757575',
  },
  
  // Challenge cards
  challengeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
  },
  selectedChallenge: {
    borderWidth: 2,
    borderColor: '#651FFF',
  },
  challengeMain: {
    position: 'relative',
  },
  challengeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 10,
  },
  challengeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  challengeDetailItem: {
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#212121',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 6,
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  difficultyBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Selection card
  selectionCardContainer: {
    marginTop: 24,
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  selectionCard: {
    backgroundColor: '#F4EEFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#651FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  selectionCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#651FFF',
    marginBottom: 16,
  },
  selectionCardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    justifyContent: 'center',
  },
  feeSection: {
    alignItems: 'center',
    marginRight: 20,
  },
  winSection: {
    alignItems: 'center',
    marginLeft: 20,
  },
  feeAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212121',
  },
  feeLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  winAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  winLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  startGameButton: {
    backgroundColor: '#651FFF',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
  },
  startGameButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Game board
  modernBoardContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modernBoard: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  colorRegion: {
    position: 'absolute',
    width: '40%',
    height: '40%',
  },
  redRegion: {
    top: 0,
    left: 0,
    backgroundColor: 'rgba(255, 82, 82, 0.15)',
  },
  greenRegion: {
    top: 0,
    right: 0,
    backgroundColor: 'rgba(76, 175, 80, 0.15)',
  },
  yellowRegion: {
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
  },
  blueRegion: {
    bottom: 0,
    right: 0,
    backgroundColor: 'rgba(33, 150, 243, 0.15)',
  },
  centerFinish: {
    position: 'absolute',
    width: '20%',
    height: '20%',
    top: '40%',
    left: '40%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  gridContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLineHorizontal: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  gridLineVertical: {
    position: 'absolute',
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  safeCell: {
    position: 'absolute',
    backgroundColor: 'rgba(102, 187, 106, 0.3)',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.5)',
  },
  token: {
    position: 'absolute',
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  
  // Game Controls Panel
  gameControlsPanel: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  controlsPanelTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 12,
  },
  activeControls: {
    alignItems: 'center',
  },
  currentPlayerText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  diceButton: {
    alignItems: 'center',
    marginBottom: 12,
  },
  diceButtonInner: {
    width: 60,
    height: 60,
    backgroundColor: 'white',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
    marginBottom: 8,
  },
  diceButtonText: {
    fontSize: 14,
    color: '#424242',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  resetButtonText: {
    fontSize: 13,
    color: '#424242',
    marginLeft: 4,
  },
  preGameControls: {
    alignItems: 'center',
  },
  readyText: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 12,
  },
  startButton: {
    backgroundColor: '#651FFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  startButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  
  // Players section
  playersSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212121',
    marginLeft: 6,
  },
  playerCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 4,
  },
  activePlayerCard: {
    backgroundColor: '#FFFFFF',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
    elevation: 2,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  playerColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212121',
    flex: 1,
  },
  currentBadge: {
    backgroundColor: '#FFC107',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  currentBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  playerStats: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  statItem: {
    flexDirection: 'row',
    marginRight: 14,
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginRight: 4,
  },
  statValue: {
    fontSize: 12,
    color: '#212121',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 8,
  },
  
  // Stats Section
  statsSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.00,
    elevation: 1,
  },
  statsGrid: {
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    marginHorizontal: 4,
  },
  statBoxLabel: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  statBoxValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212121',
    marginTop: 2,
  },
  statSubheading: {
    fontSize: 14,
    color: '#424242',
    fontWeight: '500',
    marginTop: 8,
    marginBottom: 8,
  },
  playerMovesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  playerMovesDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  playerMovesName: {
    flex: 1,
    fontSize: 12,
    color: '#212121',
  },
  playerMovesValue: {
    fontSize: 12,
    fontWeight: '500',
    color: '#212121',
  },
  
  // Lobby screen
  lobbyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lobbyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212121',
    marginBottom: 24,
  },
  lobbyLoader: {
    marginBottom: 32,
  },
  lobbyPlayers: {
    width: '100%',
    marginBottom: 36,
  },
  lobbyPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  lobbyPlayerIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  lobbyPlayerText: {
    fontSize: 16,
    color: '#212121',
  },
  lobbyButton: {
    backgroundColor: '#FF5252',
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lobbyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PlayToEarnScreen;
