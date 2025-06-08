import React, { useState, useEffect, useRef, useCallback } from 'react';
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

// Calculate adaptive sizes based on screen width
const { width, height } = Dimensions.get('window');
const isSmallScreen = width < 375;
const BOARD_SIZE = Math.min(width * 0.9, height * 0.45);
const CELL_SIZE = BOARD_SIZE / 15;
const TOKEN_SIZE = CELL_SIZE * 0.8;

const PLAYER_COLORS = {
  red: '#FF5252',
  green: '#4CAF50',
  yellow: '#FFC107',
  blue: '#2196F3',
};

// Function to generate token IDs
const generateTokenId = (color: string, index: number) => `${color.toUpperCase()}${index}`;

// Initial player tokens positions with IDs
const getInitialTokens = () => ({
  red: Array(4).fill(null).map((_, i) => ({ id: generateTokenId('red', i), position: 'home', index: i, pathIndex: -1, color: 'red' })),
  green: Array(4).fill(null).map((_, i) => ({ id: generateTokenId('green', i), position: 'home', index: i, pathIndex: -1, color: 'green' })),
  yellow: Array(4).fill(null).map((_, i) => ({ id: generateTokenId('yellow', i), position: 'home', index: i, pathIndex: -1, color: 'yellow' })),
  blue: Array(4).fill(null).map((_, i) => ({ id: generateTokenId('blue', i), position: 'home', index: i, pathIndex: -1, color: 'blue' })),
});

const CHALLENGES = [
  { id: 'free', name: 'Free Play', entryFee: 0, winAmount: 0, players: '2/4', difficulty: 'Easy' },
  { id: 'beginner', name: 'Beginner Challenge', entryFee: 1, winAmount: 1.8, players: '2/4', difficulty: 'Easy' },
  { id: 'casual', name: 'Casual Match', entryFee: 5, winAmount: 9, players: '3/4', difficulty: 'Easy' },
  { id: 'classic', name: 'Classic Battle', entryFee: 10, winAmount: 18, players: '2/4', difficulty: 'Medium' },
  { id: 'pro', name: 'Pro Tournament', entryFee: 25, winAmount: 45, players: '2/4', difficulty: 'Medium' },
  { id: 'expert', name: 'Expert League', entryFee: 50, winAmount: 90, players: '2/4', difficulty: 'Hard' },
  { id: 'championship', name: 'Championship', entryFee: 100, winAmount: 180, players: '2/4', difficulty: 'Hard' },
];

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
const PATH_LENGTH = 52; // Standard Ludo path length before home stretch
const HOME_STRETCH_LENGTH = 6; // Length of the home path
const TOTAL_PATH_LENGTH = PATH_LENGTH + HOME_STRETCH_LENGTH; // 52 common + 6 home = 58 total steps to win

const SAFE_CELLS = [
  {x: 6, y: 2}, {x: 8, y: 6}, {x: 12, y: 8}, {x: 8, y: 12}, {x: 6, y: 8}, {x: 2, y: 6}
];

// Placeholder for actual user ID, replace with your auth logic
const MOCK_USER_ID = 50816; // Replace with actual dynamic user ID

const PlayToEarnScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  let contentPadding = insets.bottom;

  const [userId, setUserId] = useState<number>(MOCK_USER_ID);
  const [gameMode, setGameMode] = useState<'challenges' | 'lobby' | 'game'>('challenges');
  const [gameStarted, setGameStarted] = useState(false);
  const [actualGameStarted, setActualGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [playersInGame, setPlayersInGame] = useState<Array<{id: number, color: string}>>([]);
  const [selectedChallenge, setSelectedChallenge] = useState(CHALLENGES[0]);
  const [tokens, setTokens] = useState(getInitialTokens());
  const [roomId, setRoomId] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [serverMessageLog, setServerMessageLog] = useState<string[]>([]);
  const [gameStats, setGameStats] = useState({
    duration: '0:00',
    totalMoves: 0,
    movesByPlayer: { red: 0, blue: 0, yellow: 0, green: 0 },
    averageDiceRoll: 0,
    luckyRolls: 0
  });

  const socketRef = useRef<WebSocket | null>(null);
  const diceAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // WebSocket URL
  const WEBSOCKET_URL = 'wss://api.adtip.in';

  // Animation for waiting room pulse
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    );
    
    if (gameMode === 'lobby') {
      pulse.start();
    } else {
      pulse.stop();
      pulseAnimation.setValue(1);
    }
    
    return () => pulse.stop();
  }, [gameMode, pulseAnimation]);

  const connectWebSocket = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      // If trying to join a new game while already connected, send join message
      if (gameMode === 'lobby' && selectedChallenge) {
         const joinMessage = {
          type: "join",
          userId: userId,
          challengeAmount: selectedChallenge.entryFee
        };
        console.log('Sending join message (already connected):', joinMessage);
        socketRef.current?.send(JSON.stringify(joinMessage));
      }
      return;
    }
    console.log('Attempting to connect to WebSocket...');
    setLoading(true);
    socketRef.current = new WebSocket(WEBSOCKET_URL);

    socketRef.current.onopen = () => {
      console.log('WebSocket connected');
      setLoading(false);
      if (gameMode === 'lobby' && selectedChallenge) {
        const joinMessage = {
          type: "join",
          userId: userId,
          challengeAmount: selectedChallenge.entryFee
        };
        console.log('Sending join message:', joinMessage);
        socketRef.current?.send(JSON.stringify(joinMessage));
      }
    };

    socketRef.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data as string);
        console.log('WebSocket message received:', message);
        setServerMessageLog(prev => [...prev.slice(-20), JSON.stringify(message, null, 2)]);

        if (message.type === 'room_created' || message.type === 'game_joined' || message.type === 'player_joined') {
          if(message.roomId) setRoomId(message.roomId);
          // Ensure playersInGame is updated with the list from the server
          if(message.players) {
            setPlayersInGame(message.players);
          } else if (message.player) { // Handle single player join confirmation
            setPlayersInGame(prev => {
              const playerExists = prev.some(p => p.id === message.player.id);
              return playerExists ? prev : [...prev, message.player];
            });
          }
          if(message.message) Alert.alert("Game Info", message.message);
          if (message.players && message.players.some(p => p.id === userId) && !actualGameStarted) {
            setGameMode('lobby');
          }
        } else if (message.type === 'game_start') {
          if(message.roomId) setRoomId(message.roomId);
          if(message.players) setPlayersInGame(message.players);
          if(message.currentPlayerId) setCurrentPlayerId(message.currentPlayerId);
          setActualGameStarted(true);
          setGameMode('game');
          setWinnerId(null);
          setLoading(false);
          Alert.alert("Game Started!", `Room ID: ${message.roomId}. Player ${message.currentPlayerId}'s turn.`);
        } 
        // Handling both flat and nested move structures
        else if (message.type === 'move_update' || (message.type === 'move' && message.move)) { 
          const moveData = message.type === 'move' ? message.move : message;

          if (moveData.tokens) { 
            setTokens(prevTokens => {
              const newTokens = JSON.parse(JSON.stringify(prevTokens)); 
              (moveData.tokens as Array<{tokenId: string, newPosition: number, pathIndex?: number, positionType: 'home'|'path'|'finished', color?: string, index?: number}>).forEach(movedToken => {
                const parsedTokenId = parseTokenId(movedToken.tokenId);
                if (parsedTokenId) {
                  const { color, index } = parsedTokenId;
                  if (newTokens[color] && newTokens[color][index]) {
                    // Prefer pathIndex from server if available, otherwise use newPosition
                    newTokens[color][index].pathIndex = movedToken.pathIndex !== undefined ? movedToken.pathIndex : movedToken.newPosition;
                    newTokens[color][index].position = movedToken.positionType || (newTokens[color][index].pathIndex === -1 ? 'home' : (newTokens[color][index].pathIndex >= TOTAL_PATH_LENGTH ? 'finished' : 'path'));
                  }
                }
              });
              return newTokens;
            });
          }
          if (moveData.cut && moveData.cut.tokenId) {
             const cutTokenInfo = parseTokenId(moveData.cut.tokenId);
             if (cutTokenInfo) {
                setTokens(prevTokens => {
                    const newTokens = JSON.parse(JSON.stringify(prevTokens));
                    if (newTokens[cutTokenInfo.color] && newTokens[cutTokenInfo.color][cutTokenInfo.index]) {
                        newTokens[cutTokenInfo.color][cutTokenInfo.index].position = 'home';
                        newTokens[cutTokenInfo.color][cutTokenInfo.index].pathIndex = -1;
                    }
                    return newTokens;
                });
                Alert.alert("Token Cut!", `Token ${moveData.cut.tokenId} was sent home.`);
             }
          }
          if (moveData.currentPlayerId) setCurrentPlayerId(moveData.currentPlayerId);
          if (moveData.diceValue) setDiceValue(moveData.diceValue); 

          if (moveData.isWinner && (moveData.winnerId || message.winnerId)) { // Check both locations for winnerId
            const winner = moveData.winnerId || message.winnerId;
            setWinnerId(winner);
            setCurrentPlayerId(null); 
            setActualGameStarted(false);
            Alert.alert("Game Over!", `Player ${winner} wins!`);
          }
        } else if (message.type === 'turn_change') {
            setCurrentPlayerId(message.currentPlayerId);
            setDiceValue(null); 
            setGameStarted(message.currentPlayerId === userId); 
            Alert.alert("Next Turn", `It's player ${message.currentPlayerId}'s turn.`);
        } else if (message.type === 'dice_rolled') { 
            if (message.userId === currentPlayerId) { 
                setDiceValue(message.diceValue);
                setIsRolling(false); 
            }
        } else if (message.type === 'error') {
          Alert.alert("Game Error", message.message || "An unknown error occurred.");
          setLoading(false);
        } else if (message.type === 'player_quit') {
            Alert.alert("Player Left", `Player ${message.userId} has quit the game.`);
            setPlayersInGame(prev => prev.filter(p => p.id !== message.userId));
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message or handle it:', error);
        setServerMessageLog(prev => [...prev.slice(-20), `Error parsing: ${event.data}`]);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      Alert.alert("Connection Error", "WebSocket connection error. Please try again.");
      setLoading(false);
      if (gameMode !== 'challenges') {
        setGameMode('challenges');
      }
    };

    socketRef.current.onclose = (event) => {
      console.log('WebSocket closed:', event.code, event.reason);
      setLoading(false);
      if (gameMode === 'game' || gameMode === 'lobby') {
      }
      socketRef.current = null; 
    };
  }, [userId, selectedChallenge, gameMode, actualGameStarted]);

  const parseTokenId = (tokenId: string): { color: string, index: number } | null => {
    const match = tokenId.match(/([A-Z]+)(\d+)/i);
    if (match && match[1] && match[2]) {
        const color = match[1].toLowerCase();
        const index = parseInt(match[2], 10);
        if (PLAYER_COLORS[color] !== undefined && !isNaN(index)) {
            return { color, index };
        }
    }
    console.warn("Could not parse tokenId:", tokenId);
    return null;
  };

  useEffect(() => {
    return () => {
      if (socketRef.current) {
        console.log('PlayToEarnScreen unmounting. Closing WebSocket.');
        socketRef.current.onclose = null; 
        socketRef.current.onerror = null;
        socketRef.current.close();
        socketRef.current = null;
      }
    };
  }, []); 

  const handleStartGamePress = () => {
    if (!selectedChallenge) {
      Alert.alert("No Challenge Selected", "Please select a challenge to start.");
      return;
    }
    setWinnerId(null);
    setTokens(getInitialTokens()); 
    setPlayersInGame([]); 
    setRoomId(null);
    setActualGameStarted(false);
    setCurrentPlayerId(null);
    setGameMode('lobby'); 
    
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
        connectWebSocket(); 
    } else {
        const joinMessage = {
            type: "join",
            userId: userId,
            challengeAmount: selectedChallenge.entryFee
        };
        console.log('Sending join message (already connected):', joinMessage);
        socketRef.current?.send(JSON.stringify(joinMessage));
        setLoading(true); 
    }
  };
  
  const rollDice = () => {
    if (isRolling || currentPlayerId !== userId || !actualGameStarted || winnerId) return;
    setIsRolling(true);
    setDiceValue(null); 

    Animated.sequence([
        Animated.timing(diceAnimation, { toValue: 1, duration: 100, useNativeDriver: true, }),
        Animated.timing(diceAnimation, { toValue: 0, duration: 100, useNativeDriver: true, }),
        Animated.timing(diceAnimation, { toValue: 1, duration: 100, useNativeDriver: true, }),
        Animated.timing(diceAnimation, { toValue: 0, duration: 100, useNativeDriver: true, }),
        Animated.timing(diceAnimation, { toValue: 1, duration: 100, useNativeDriver: true, }),
    ]).start(() => {
      const newValue = Math.floor(Math.random() * 6) + 1;
      setDiceValue(newValue);
      setIsRolling(false);
      setGameStarted(true); 
    });
  };

  const handleTokenClick = (color: string, tokenIndex: number) => {
    if (currentPlayerId !== userId || !diceValue || winnerId) {
      // console.log("Not your turn, or dice not rolled, or game over.");
      return;
    }

    const token = tokens[color][tokenIndex];
    if (!token) return;
    
    let newPathIndex = token.pathIndex;
    let finalPositionType = token.position;

    if (token.position === 'home') {
      if (diceValue === 6) {
        newPathIndex = 0; 
        finalPositionType = 'path';
      } else {
        Alert.alert("Invalid Move", "You need a 6 to move a token out of home.");
        return;
      }
    } else if (token.position === 'path') {
      newPathIndex += diceValue;
      if (newPathIndex >= TOTAL_PATH_LENGTH) {
        newPathIndex = TOTAL_PATH_LENGTH; 
        finalPositionType = 'finished';
      } else {
        finalPositionType = 'path';
      }
    } else if (token.position === 'finished') {
        Alert.alert("Token Finished", "This token has already reached home.");
        return;
    }

    // Placeholder for cut detection - this is complex and needs full board state
    let cutInfo = null; 

    const moveMessage = {
      type: "move",
      userId: userId,
      roomId: roomId,
      tokenId: token.id,
      newPosition: newPathIndex, 
      diceRoll: diceValue,
      cut: cutInfo 
    };

    console.log('Sending move message:', moveMessage);
    socketRef.current?.send(JSON.stringify(moveMessage));
    setDiceValue(null); 
    setGameStarted(false); 
  };

  const handleQuitGame = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const quitMessage = {
        type: "quit",
        userId: userId,
        roomId: roomId 
      };
      console.log('Sending quit message:', quitMessage);
      socketRef.current.send(JSON.stringify(quitMessage));
    }
    setRoomId(null);
    setActualGameStarted(false);
    setCurrentPlayerId(null);
    setPlayersInGame([]);
    setTokens(getInitialTokens());
    setGameMode('challenges');
    setWinnerId(null);
    setLoading(false);
  };

  const renderChallengesScreen = () => {
    return (
      <LinearGradient
        colors={isDark ? ['#121212', '#1E1E1E'] : ['#F0F0FF', '#FFFFFF']}
        style={styles.challengesContainer}
      >
        <View style={styles.ludoHeader}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={['#F57C00', '#FF9800']}
              style={styles.logoBox}
            >
              <Icon name="cube-outline" size={24} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.gameTitle, {color: colors.text.primary}]}>
              <Text style={{color: '#F57C00'}}>Ludo</Text>{' '}
              <Text style={{color: '#8BC34A'}}>Game</Text>{' '}
              <Icon name="gamepad-variant-outline" size={20} color="#8BC34A" />
            </Text>
          </View>
          <Text style={[styles.gameSubtitle, {color: colors.text.secondary}]}>
            Classic Board Game • 4 Players • Strategic Fun
          </Text>
        </View>
        
        <Text style={[styles.challengeSectionTitle, {color: isDark ? '#BB86FC' : '#9C27B0'}]}>
          Choose Your Challenge
        </Text>
        <Text style={[styles.challengeSectionSubtitle, {color: colors.text.secondary}]}>
          Select a challenge to start playing and win real money!
        </Text>
        
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.challengesScrollContent}
        >
          {CHALLENGES.map((challenge) => {
            const isSelected = selectedChallenge?.id === challenge.id;
            const difficultyColor = 
              challenge.difficulty === 'Easy' ? '#4CAF50' : 
              challenge.difficulty === 'Medium' ? '#FF9800' : 
              '#F44336';
            
            // Calculate players progress
            const [current, total] = challenge.players.split('/').map(Number);
            const progress = current / total;
            
            return (
              <TouchableOpacity 
                key={challenge.id}
                style={[
                  styles.challengeCard,
                  {
                    backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
                    borderColor: isSelected ? (isDark ? '#BB86FC' : '#9C27B0') : 'transparent'
                  }
                ]}
                onPress={() => setSelectedChallenge(challenge)}
              >
                <View style={styles.challengeCardHeader}>
                  <Text style={[styles.challengeName, {color: colors.text.primary}]}>{challenge.name}</Text>
                  <View style={[styles.difficultyBadge, {backgroundColor: `${difficultyColor}20`}]}>
                    <Text style={[styles.difficultyText, {color: difficultyColor}]}>{challenge.difficulty}</Text>
                  </View>
                </View>
                
                <View style={styles.challengeDetails}>
                  <View style={styles.challengeDetailItem}>
                    <Icon name="ticket-percent-outline" size={16} color={isDark ? '#BB86FC' : '#9C27B0'} />
                    <Text style={[styles.detailLabel, {color: colors.text.secondary}]}>Entry Fee</Text>
                    <Text style={[styles.detailValue, {color: colors.text.primary}]}>₹{challenge.entryFee}</Text>
                  </View>
                  
                  <View style={styles.challengeDetailItem}>
                    <Icon name="trophy-outline" size={16} color="#FFC107" />
                    <Text style={[styles.detailLabel, {color: colors.text.secondary}]}>Win Amount</Text>
                    <Text style={[styles.detailValue, {color: '#4CAF50'}]}>₹{challenge.winAmount}</Text>
                  </View>
                  
                  <View style={styles.challengeDetailItem}>
                    <Icon name="account-group-outline" size={16} color="#2196F3" />
                    <Text style={[styles.detailLabel, {color: colors.text.secondary}]}>Players</Text>
                    <View style={{width: '100%'}}>
                      <Text style={[styles.detailValue, {color: colors.text.primary}]}>{challenge.players}</Text>
                      <View style={[styles.progressBackground, {backgroundColor: isDark ? '#333333' : '#E0E0E0'}]}>
                        <View 
                          style={[styles.progressFill, {
                            backgroundColor: '#2196F3',
                            width: `${Math.max(5, progress * 100)}%`
                          }]} 
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          
          {selectedChallenge && (
            <View style={styles.selectedChallengeContainer}>
              <LinearGradient
                colors={isDark ? ['#222244', '#191932'] : ['#EBE7FF', '#F0F0FF']}
                style={styles.selectedChallengeCard}
              >
                <Text style={[styles.selectedChallengeTitle, {color: isDark ? '#BB86FC' : '#9C27B0'}]}>
                  {selectedChallenge.name} Selected!
                </Text>
                
                <View style={styles.selectedChallengeDetails}>
                  <View style={styles.selectedDetailItem}>
                    <Text style={styles.selectedDetailLabel}>Entry Fee</Text>
                    <Text style={styles.selectedDetailValue}>₹{selectedChallenge.entryFee}</Text>
                  </View>
                  
                  <View style={styles.selectedDetailItem}>
                    <Text style={styles.selectedDetailLabel}>Win Amount</Text>
                    <Text style={[styles.selectedDetailValue, {color: '#4CAF50'}]}>₹{selectedChallenge.winAmount}</Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={[styles.startGameButton, {
                    backgroundColor: isDark ? '#BB86FC' : '#9C27B0'
                  }]}
                  onPress={handleStartGamePress}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <>
                      <Icon name="play" size={18} color="#FFFFFF" style={{marginRight: 8}} />
                      <Text style={styles.startGameButtonText}>
                        {selectedChallenge.entryFee > 0 
                          ? `Start Game - Pay ₹${selectedChallenge.entryFee}`
                          : 'Start Free Game'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </LinearGradient>
            </View>
          )}
          
          <View style={{height: contentPadding > 0 ? contentPadding + 20 : 20}} />
        </ScrollView>
      </LinearGradient>
    );
  };

  const renderLobbyScreen = () => {
    const expectedPlayers = selectedChallenge?.players.includes('/') ? 
      parseInt(selectedChallenge.players.split('/')[1], 10) : 4;
      
    return (
      <LinearGradient
        colors={isDark ? ['#121212', '#1E1E1E'] : ['#F0F0FF', '#FFFFFF']}
        style={styles.lobbyContainer}
      >
        <Animated.View style={{
          transform: [{scale: pulseAnimation}],
          alignItems: 'center'
        }}>
          <View style={styles.lobbyStatusIndicator}>
            <Icon name="access-point" size={24} color="#FFFFFF" />
          </View>
          <Text style={[styles.lobbyTitle, {color: colors.text.primary}]}>Finding Players...</Text>
        </Animated.View>
        
        <View style={[styles.lobbyInfoCard, {
          backgroundColor: isDark ? colors.cardBackground : '#FFFFFF'
        }]}
        >
          <View style={styles.lobbyInfoRow}>
            <Icon name="information-outline" size={16} color={isDark ? '#BB86FC' : '#9C27B0'} />
            <Text style={[styles.lobbyInfoText, {color: colors.text.secondary}]}>
              Room ID: <Text style={{color: colors.text.primary, fontWeight: '600'}}>{roomId || "Connecting..."}</Text>
            </Text>
          </View>
          
          <View style={styles.lobbyInfoRow}>
            <Icon name="trophy-outline" size={16} color="#FFC107" />
            <Text style={[styles.lobbyInfoText, {color: colors.text.secondary}]}>
              Playing <Text style={{color: colors.text.primary, fontWeight: '600'}}>{selectedChallenge?.name}</Text>
            </Text>
          </View>
          
          <View style={styles.lobbyInfoRow}>
            <Icon name="cash-multiple" size={16} color="#4CAF50" />
            <Text style={[styles.lobbyInfoText, {color: colors.text.secondary}]}>
              Entry: ₹{selectedChallenge?.entryFee} | Win: <Text style={{color: '#4CAF50', fontWeight: '600'}}>₹{selectedChallenge?.winAmount}</Text>
            </Text>
          </View>
        </View>
        
        {loading && !roomId && (
          <ActivityIndicator size="large" color={isDark ? '#BB86FC' : '#9C27B0'} style={styles.lobbyLoader} />
        )}
        
        <View style={styles.playersSection}>
          <View style={styles.playersSectionHeader}>
            <Icon name="account-group" size={16} color={colors.text.secondary} />
            <Text style={[styles.playersSectionTitle, {color: colors.text.primary}]}>
              Players ({playersInGame.length}/{expectedPlayers})
            </Text>
          </View>
          
          <View style={[styles.playersProgressBackground, {backgroundColor: isDark ? '#333333' : '#E0E0E0'}]}>
            <View 
              style={[styles.playersProgressFill, {
                backgroundColor: isDark ? '#BB86FC' : '#9C27B0',
                width: `${(playersInGame.length / expectedPlayers) * 100}%`
              }]} 
            />
          </View>
          
          <View style={styles.lobbyPlayersList}>
            {Object.keys(PLAYER_COLORS).map((color, index) => {
              const player = playersInGame[index];
              const isActive = player !== undefined;
              
              return (
                <View 
                  key={color}
                  style={[
                    styles.lobbyPlayerCard,
                    {
                      backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
                      borderColor: PLAYER_COLORS[color],
                      opacity: isActive ? 1 : 0.6
                    }
                  ]}
                >
                  <View style={[styles.playerColorIndicator, {backgroundColor: PLAYER_COLORS[color]}]} />
                  
                  {isActive ? (
                    <Text style={[styles.lobbyPlayerName, {color: colors.text.primary}]}>
                      Player {player.id}{player.id === userId ? " (You)" : ""}
                    </Text>
                  ) : (
                    <View style={styles.waitingForPlayer}>
                      <ActivityIndicator size="small" color={PLAYER_COLORS[color]} style={{marginRight: 8}} />
                      <Text style={[styles.waitingText, {color: colors.text.secondary}]}>Waiting...</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
        
        <TouchableOpacity
          style={[styles.cancelButton, {backgroundColor: '#F44336'}]}
          onPress={handleQuitGame}
        >
          <Icon name="close-circle-outline" size={18} color="#FFFFFF" style={{marginRight: 8}} />
          <Text style={styles.cancelButtonText}>Cancel & Leave</Text>
        </TouchableOpacity>
        
        {/* You can keep server logs for debugging but hide in production */}
        {__DEV__ && (
          <ScrollView style={[styles.serverLogScrollView, {
            backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)'
          }]}
          >
            <Text style={[styles.serverLogTitle, {color: colors.text.secondary}]}>Debug Log:</Text>
            {serverMessageLog.slice(-3).map((log, i) => (
              <Text key={i} style={[styles.serverLogText, {color: colors.text.secondary}]}>{log}</Text>
            ))}
          </ScrollView>
        )}
      </LinearGradient>
    );
  };
  
  const renderGameScreen = () => {
    if (winnerId) {
      return (
        <LinearGradient
          colors={isDark ? ['#121212', '#1E1E1E'] : ['#F0F0FF', '#FFFFFF']}
          style={styles.gameOverContainer}
        >
          <View style={styles.trophyContainer}>
            <Icon name="trophy" size={64} color="#FFC107" />
            <Text style={[styles.gameOverTitle, {color: colors.text.primary}]}>Game Over!</Text>
          </View>
          
          <View style={[styles.gameOverCard, {
            backgroundColor: isDark ? colors.cardBackground : '#FFFFFF'
          }]}>
            <Text style={[styles.gameOverSubtitle, {color: colors.text.secondary}]}>
              Player <Text style={{fontWeight: 'bold', color: winnerId === userId ? '#4CAF50' : colors.text.primary}}>
                {winnerId}{winnerId === userId ? " (You)" : ""}
              </Text> has won!
            </Text>
            
            <View style={styles.gameOverDetails}>
              <View style={styles.gameOverDetailItem}>
                <Icon name="cash" size={20} color="#4CAF50" />
                <Text style={[styles.gameOverDetailLabel, {color: colors.text.secondary}]}>Prize</Text>
                <Text style={styles.gameOverDetailValue}>₹{selectedChallenge?.winAmount}</Text>
              </View>
              
              <View style={styles.gameOverDetailItem}>
                <Icon name="clock-outline" size={20} color={isDark ? '#BB86FC' : '#9C27B0'} />
                <Text style={[styles.gameOverDetailLabel, {color: colors.text.secondary}]}>Duration</Text>
                <Text style={[styles.gameOverDetailValue, {color: colors.text.primary}]}>{gameStats.duration}</Text>
              </View>
              
              <View style={styles.gameOverDetailItem}>
                <Icon name="chess-pawn" size={20} color="#2196F3" />
                <Text style={[styles.gameOverDetailLabel, {color: colors.text.secondary}]}>Moves</Text>
                <Text style={[styles.gameOverDetailValue, {color: colors.text.primary}]}>{gameStats.totalMoves}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={[styles.newGameButton, {backgroundColor: isDark ? '#BB86FC' : '#9C27B0'}]}
              onPress={handleQuitGame}
            >
              <Text style={styles.newGameButtonText}>Back to Challenges</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      );
    }
    
    if (!actualGameStarted) {
      return (
        <LinearGradient
          colors={isDark ? ['#121212', '#1E1E1E'] : ['#F0F0FF', '#FFFFFF']}
          style={styles.loadingGameContainer}
        >
          <ActivityIndicator size="large" color={isDark ? '#BB86FC' : '#9C27B0'} />
          <Text style={[styles.loadingGameText, {color: colors.text.primary}]}>Loading Game...</Text>
          <Text style={[styles.loadingGameSubText, {color: colors.text.secondary}]}>
            Preparing game board for {selectedChallenge?.name}
          </Text>
        </LinearGradient>
      );
    }

    const getTokenScreenPosition = (color: string, tokenIndex: number) => {
      const token = tokens[color][tokenIndex];
      if (token.position === 'home') {
        const homePos = INITIAL_POSITIONS[color][tokenIndex]; 
        return { left: homePos.x, top: homePos.y };
      } else if (token.position === 'path' || token.position === 'finished') {
        const path = PATH_COORDINATES[color];
        const currentPathIndex = Math.max(0, Math.min(token.pathIndex, path.length -1));
        if (path && path[currentPathIndex]) {
          const pathPos = path[currentPathIndex];
          return { left: pathPos.x * CELL_SIZE, top: pathPos.y * CELL_SIZE };
        }
      }
      return { left: -1000, top: -1000 }; 
    };

    // Build home area style objects based on player colors
    const homeAreaStyles = {
      red: { top: 0, left: 0, backgroundColor: 'rgba(255, 82, 82, 0.1)' },
      green: { top: 0, right: 0, backgroundColor: 'rgba(76, 175, 80, 0.1)' },
      yellow: { bottom: 0, left: 0, backgroundColor: 'rgba(255, 193, 7, 0.1)' },
      blue: { bottom: 0, right: 0, backgroundColor: 'rgba(33, 150, 243, 0.1)' },
    };

    return (
      <ScrollView
        style={{flex: 1, backgroundColor: isDark ? '#121212' : '#F5F5F5'}}
        contentContainerStyle={styles.gameContentContainer}
      >
        <View style={styles.gameHeader}>
          <View style={[styles.gameInfoBanner, {
            backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
          }]}>
            <Text style={[styles.gameHeaderTitle, {color: colors.text.primary}]}>
              {selectedChallenge?.name}{' '}
              <Text style={{fontSize: 14, color: colors.text.secondary}}>• Room: {roomId}</Text>
            </Text>
            
            <View style={styles.activePlayerBanner}>
              {currentPlayerId && (
                <View style={[
                  styles.activePlayerIndicator, 
                  {backgroundColor: currentPlayerId === userId ? '#4CAF50' : '#FF9800'}
                ]} />
              )}
              <Text style={[styles.activePlayerText, {
                color: currentPlayerId === userId ? '#4CAF50' : colors.text.primary
              }]}
              >
                {currentPlayerId ? 
                  (currentPlayerId === userId ? "Your Turn!" : `Player ${currentPlayerId}'s Turn`) 
                  : "Waiting for next turn..."}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.gameAreaContainer}>
          {/* Game board */}
          <View style={[styles.gameBoard, {
            backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
            borderColor: isDark ? '#333333' : '#E0E0E0'
          }]}>
            {/* Home areas */}
            {Object.keys(homeAreaStyles).map(color => (
              <View 
                key={`home-${color}`}
                style={[
                  styles.homeArea,
                  homeAreaStyles[color]
                ]}
              />
            ))}
            
            {/* Grid lines */}
            <View style={styles.gridContainer}>
              {Array(15).fill(0).map((_, i) => (
                <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, {
                  top: i * CELL_SIZE,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }]} />
              ))}
              {Array(15).fill(0).map((_, i) => (
                <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, {
                  left: i * CELL_SIZE,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }]} />
              ))}
            </View>
            
            {/* Safe spots */}
            {SAFE_CELLS.map((cell, index) => (
              <View 
                key={`safe-${index}`}
                style={[styles.safeCell, {
                  left: cell.x * CELL_SIZE,
                  top: cell.y * CELL_SIZE,
                  backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)'
                }]}
              />
            ))}
            
            {/* Tokens */}
            {Object.keys(tokens).map(color => 
              tokens[color].map((token, index) => {
                const pos = getTokenScreenPosition(color, index);
                const isMyTurn = currentPlayerId === userId;
                const canMoveThisToken = gameStarted && isMyTurn && diceValue !== null && !isRolling; 
                const isMovable = canMoveThisToken && token.position !== 'finished';

                return (
                  <TouchableOpacity
                    key={token.id}
                    style={[
                      styles.token,
                      {
                        backgroundColor: PLAYER_COLORS[color],
                        left: pos.left, 
                        top: pos.top,
                        width: TOKEN_SIZE,
                        height: TOKEN_SIZE,
                        borderRadius: TOKEN_SIZE / 2,
                        borderColor: isMovable ? '#FFFFFF' : PLAYER_COLORS[color],
                        borderWidth: isMovable ? 2 : 0,
                        opacity: token.position === 'finished' ? 0.7 : 1,
                        elevation: isMovable ? 8 : 4,
                        shadowColor: PLAYER_COLORS[color],
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isMovable ? 0.5 : 0.3,
                        shadowRadius: isMovable ? 4 : 2
                      }
                    ]}
                    onPress={() => isMovable && handleTokenClick(color, index)}
                    disabled={!isMovable}
                  >
                    {isMovable && (
                      <View style={styles.tokenHighlight}>
                        <Icon name="arrow-up" size={12} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </View>
          
          {/* Game controls */}
          <View style={[styles.gameControls, {
            backgroundColor: isDark ? colors.cardBackground : '#FFFFFF'
          }]}>
            <Text style={[styles.gameControlsTitle, {color: colors.text.primary}]}>
              Game Controls
            </Text>
            
            {currentPlayerId === userId && !winnerId ? (
              <View style={styles.diceContainer}>
                <Text style={[styles.diceInstructions, {color: colors.text.secondary}]}>
                  {diceValue ? `You rolled ${diceValue}! Select a token to move.` : "Tap to roll the dice"}
                </Text>
                
                <TouchableOpacity 
                  style={[
                    styles.diceButton, 
                    {
                      backgroundColor: isRolling || (diceValue !== null) ? 
                        (isDark ? '#333333' : '#EEEEEE') : 
                        (isDark ? '#BB86FC' : '#9C27B0')
                    }
                  ]}
                  onPress={rollDice}
                  disabled={isRolling || (diceValue !== null && diceValue > 0)}
                >
                  <Animated.View style={[styles.dice, {
                    transform: [{ 
                      rotate: diceAnimation.interpolate({
                        inputRange: [0, 1], 
                        outputRange: ['0deg', '360deg']
                      })
                    }] 
                  }]}>
                    <Icon 
                      name={diceValue ? `dice-${diceValue}` : 'dice-multiple'} 
                      size={32} 
                      color={isRolling || (diceValue !== null) ? 
                        (isDark ? '#BB86FC' : '#9C27B0') : 
                        '#FFFFFF'
                      } 
                    />
                  </Animated.View>
                  <Text style={[styles.diceButtonText, {
                    color: isRolling || (diceValue !== null) ? 
                      (isDark ? '#BB86FC' : '#9C27B0') : 
                      '#FFFFFF'
                  }]}>
                    {isRolling ? "Rolling..." : (diceValue ? `Dice: ${diceValue}` : "Roll Dice")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.waitingContainer}>
                <Icon 
                  name={winnerId ? "trophy" : "clock-outline"} 
                  size={24} 
                  color={winnerId ? "#FFC107" : (isDark ? '#BB86FC' : '#9C27B0')}
                />
                <Text style={[styles.waitingText, {color: colors.text.secondary}]}>
                  {winnerId ? 
                    `Game over! Player ${winnerId} won.` : 
                    `Waiting for Player ${currentPlayerId}`
                  }
                </Text>
              </View>
            )}
            
            <TouchableOpacity
              style={[styles.quitButton, {backgroundColor: '#F44336'}]}
              onPress={handleQuitGame}
            >
              <Icon name="exit-to-app" size={16} color="#FFFFFF" style={{marginRight: 8}} />
              <Text style={styles.quitButtonText}>Quit Game</Text>
            </TouchableOpacity>
          </View>
          
          {/* Player status cards */}
          <Text style={[styles.playersSectionTitle, {color: colors.text.primary, marginTop: 20}]}>
            <Icon name="account-group" size={16} color={colors.text.secondary} style={{marginRight: 8}} />
            Players
          </Text>
          
          <View style={styles.playerStatsContainer}>
            {Object.keys(PLAYER_COLORS).map(color => {
              const playerTokens = tokens[color];
              const homeCount = playerTokens.filter(t => t.position === 'home').length;
              const boardCount = playerTokens.filter(t => t.position === 'path').length;
              const finishedCount = playerTokens.filter(t => t.position === 'finished').length;
              const playerInGame = playersInGame.find(p => p.color === color);
              
              return (
                <View 
                  key={`stats-${color}`}
                  style={[styles.playerStatsCard, {
                    backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
                    borderColor: PLAYER_COLORS[color],
                    opacity: playerInGame ? 1 : 0.7
                  }]}
                >
                  <View style={styles.playerStatsHeader}>
                    <View style={[styles.playerColorDot, {backgroundColor: PLAYER_COLORS[color]}]} />
                    <Text style={[styles.playerColorName, {color: colors.text.primary}]}>
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                      {playerInGame && playerInGame.id === userId && " (You)"}
                    </Text>
                  </View>
                  
                  <View style={styles.playerTokenCounts}>
                    <View style={styles.tokenCountItem}>
                      <Text style={[styles.tokenCountLabel, {color: colors.text.secondary}]}>Home:</Text>
                      <Text style={[styles.tokenCountValue, {color: colors.text.primary}]}>{homeCount}</Text>
                    </View>
                    <View style={styles.tokenCountItem}>
                      <Text style={[styles.tokenCountLabel, {color: colors.text.secondary}]}>Board:</Text>
                      <Text style={[styles.tokenCountValue, {color: colors.text.primary}]}>{boardCount}</Text>
                    </View>
                    <View style={styles.tokenCountItem}>
                      <Text style={[styles.tokenCountLabel, {color: colors.text.secondary}]}>Finished:</Text>
                      <Text style={[styles.tokenCountValue, {color: colors.text.primary}]}>{finishedCount}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
          
          {/* Game Statistics */}
          <View style={[styles.gameStatsCard, {
            backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
            marginBottom: 20
          }]}>
            <View style={styles.gameStatsHeader}>
              <Icon name="chart-line" size={16} color={colors.text.secondary} />
              <Text style={[styles.gameStatsTitle, {color: colors.text.primary}]}>Game Statistics</Text>
            </View>
            
            <View style={styles.gameStatsGrid}>
              <View style={styles.gameStatItem}>
                <Icon name="clock-outline" size={16} color="#2196F3" />
                <Text style={[styles.gameStatLabel, {color: colors.text.secondary}]}>Duration</Text>
                <Text style={[styles.gameStatValue, {color: colors.text.primary}]}
                >
                  {gameStats.duration}
                </Text>
              </View>
              
              <View style={styles.gameStatItem}>
                <Icon name="chess-pawn" size={16} color="#4CAF50" />
                <Text style={[styles.gameStatLabel, {color: colors.text.secondary}]}>Total Moves</Text>
                <Text style={[styles.gameStatValue, {color: colors.text.primary}]}
                >
                  {gameStats.totalMoves}
                </Text>
              </View>
              
              <View style={styles.gameStatItem}>
                <Icon name="dice-5" size={16} color="#FF9800" />
                <Text style={[styles.gameStatLabel, {color: colors.text.secondary}]}>Avg Dice Roll</Text>
                <Text style={[styles.gameStatValue, {color: colors.text.primary}]}
                >
                  {gameStats.averageDiceRoll}
                </Text>
              </View>
              
              <View style={styles.gameStatItem}>
                <Icon name="star" size={16} color="#FFC107" />
                <Text style={[styles.gameStatLabel, {color: colors.text.secondary}]}>Lucky Rolls (6s)</Text>
                <Text style={[styles.gameStatValue, {color: colors.text.primary}]}
                >
                  {gameStats.luckyRolls}
                </Text>
              </View>
            </View>
            
            <View style={styles.movesByPlayer}>
              <Text style={[styles.movesByPlayerTitle, {color: colors.text.secondary}]}>
                Moves per Player
              </Text>
              
              <View style={styles.movesByPlayerGrid}>
                {Object.keys(PLAYER_COLORS).map(color => (
                  <View key={`moves-${color}`} style={styles.playerMoveItem}>
                    <View style={[styles.playerMoveDot, {backgroundColor: PLAYER_COLORS[color]}]} />
                    <Text style={[styles.playerMoveName, {color: colors.text.secondary}]}>{color}</Text>
                    <Text style={[styles.playerMoveCount, {color: colors.text.primary}]}
                    >
                      {gameStats.movesByPlayer[color]}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: isDark ? '#0A0A0A' : '#FFFFFF'}]}>
      <Header 
        title={gameMode === 'challenges' ? "Ludo Cash" : (
          gameMode === 'lobby' ? `${selectedChallenge?.name} - Waiting` : `Playing Ludo`
        )}
        showBackButton={gameMode !== 'challenges'}
        onBackPress={gameMode === 'challenges' ? undefined : handleQuitGame}
      />
      <View style={styles.mainContainer}>
        {gameMode === 'challenges' && renderChallengesScreen()}
        {gameMode === 'lobby' && renderLobbyScreen()}
        {gameMode === 'game' && renderGameScreen()}
      </View>
    </SafeAreaView>
  );
};

const INITIAL_POSITIONS = { 
  red: [ { x: 1.5 * CELL_SIZE, y: 1.5 * CELL_SIZE }, { x: 3.5 * CELL_SIZE, y: 1.5 * CELL_SIZE }, { x: 1.5 * CELL_SIZE, y: 3.5 * CELL_SIZE }, { x: 3.5 * CELL_SIZE, y: 3.5 * CELL_SIZE } ],
  green: [ { x: 10.5 * CELL_SIZE, y: 1.5 * CELL_SIZE }, { x: 12.5 * CELL_SIZE, y: 1.5 * CELL_SIZE }, { x: 10.5 * CELL_SIZE, y: 3.5 * CELL_SIZE }, { x: 12.5 * CELL_SIZE, y: 3.5 * CELL_SIZE } ],
  yellow: [ { x: 1.5 * CELL_SIZE, y: 10.5 * CELL_SIZE }, { x: 3.5 * CELL_SIZE, y: 10.5 * CELL_SIZE }, { x: 1.5 * CELL_SIZE, y: 12.5 * CELL_SIZE }, { x: 3.5 * CELL_SIZE, y: 12.5 * CELL_SIZE } ],
  blue: [ { x: 10.5 * CELL_SIZE, y: 10.5 * CELL_SIZE }, { x: 12.5 * CELL_SIZE, y: 10.5 * CELL_SIZE }, { x: 10.5 * CELL_SIZE, y: 12.5 * CELL_SIZE }, { x: 12.5 * CELL_SIZE, y: 12.5 * CELL_SIZE } ],
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
  },
  // Challenge Selection Styles
  challengesContainer: {
    flex: 1,
  },
  ludoHeader: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 5,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  logoBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  gameTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  gameSubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  challengeSectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 6,
    paddingHorizontal: 20,
  },
  challengeSectionSubtitle: {
    fontSize: 14,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  challengesScrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  challengeCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  challengeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  challengeName: {
    fontSize: 18,
    fontWeight: '600',
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  challengeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  challengeDetailItem: {
    flex: 1,
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 12,
    marginTop: 4,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBackground: {
    height: 4,
    borderRadius: 2,
    width: '100%',
    marginTop: 4,
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  selectedChallengeContainer: {
    marginTop: 24,
    marginBottom: 10,
  },
  selectedChallengeCard: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  selectedChallengeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  selectedChallengeDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 16,
  },
  selectedDetailItem: {
    alignItems: 'center',
  },
  selectedDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  selectedDetailValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  startGameButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
  },
  startGameButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Lobby Screen Styles
  lobbyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  lobbyStatusIndicator: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#9C27B0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  lobbyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  lobbyInfoCard: {
    borderRadius: 12,
    padding: 16,
    width: '100%',
    marginBottom: 24,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  lobbyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  lobbyInfoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  lobbyLoader: {
    marginVertical: 16,
  },
  playersSection: {
    width: '100%',
    marginBottom: 24,
  },
  playersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playersSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  playersProgressBackground: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginBottom: 16,
  },
  playersProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  lobbyPlayersList: {
    width: '100%',
  },
  lobbyPlayerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  playerColorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 16,
  },
  lobbyPlayerName: {
    fontSize: 16,
    fontWeight: '500',
  },
  waitingForPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waitingText: {
    fontSize: 14,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 16,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  serverLogScrollView: {
    maxHeight: 60,
    width: '100%',
    borderRadius: 8,
    padding: 8,
  },
  serverLogTitle: {
    fontSize: 10,
    marginBottom: 4,
  },
  serverLogText: {
    fontSize: 9,
  },
  
  // Game Screen Styles
  gameContentContainer: {
    alignItems: 'stretch',
    paddingBottom: 24,
  },
  gameHeader: {
    paddingHorizontal: 16,
  },
  gameInfoBanner: {
    borderRadius: 12,
    padding: 12,
    marginVertical: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gameHeaderTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  activePlayerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activePlayerIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  activePlayerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  gameAreaContainer: {
    paddingHorizontal: 16,
  },
  gameBoard: {
    width: BOARD_SIZE,
    height: BOARD_SIZE,
    alignSelf: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 20,
    position: 'relative',
  },
  homeArea: {
    position: 'absolute',
    width: BOARD_SIZE * 0.4,
    height: BOARD_SIZE * 0.4,
    borderRadius: 8,
  },
  gridContainer: {
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#ccc',
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  safeCell: {
    position: 'absolute',
    width: CELL_SIZE,
    height: CELL_SIZE,
    borderRadius: 4,
  },
  token: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tokenHighlight: {
    position: 'absolute',
    top: -16,
    backgroundColor: 'transparent',
  },
  gameControls: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gameControlsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  diceContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  diceInstructions: {
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  diceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '80%',
  },
  dice: {
    marginRight: 12,
  },
  diceButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  waitingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  quitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignSelf: 'center',
  },
  quitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerStatsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  playerStatsCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 2,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  playerStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  playerColorName: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  playerTokenCounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  tokenCountItem: {
    alignItems: 'center',
  },
  tokenCountLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  tokenCountValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  gameStatsCard: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  gameStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameStatsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  gameStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  gameStatItem: {
    width: '48%',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameStatLabel: {
    fontSize: 12,
    marginVertical: 4,
  },
  gameStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  movesByPlayer: {
    marginTop: 8,
  },
  movesByPlayerTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  movesByPlayerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  playerMoveItem: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerMoveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 6,
  },
  playerMoveName: {
    fontSize: 12,
    marginRight: 6,
  },
  playerMoveCount: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  
  // Game Over Screen Styles
  gameOverContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  trophyContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  gameOverTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 12,
  },
  gameOverCard: {
    borderRadius: 16,
    padding: 20,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    alignItems: 'center',
  },
  gameOverSubtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
  gameOverDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 24,
  },
  gameOverDetailItem: {
    alignItems: 'center',
  },
  gameOverDetailLabel: {
    fontSize: 14,
    marginVertical: 6,
  },
  gameOverDetailValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  newGameButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    width: '100%',
    alignItems: 'center',
  },
  newGameButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Loading Game Screen
  loadingGameContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingGameText: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 16,
  },
  loadingGameSubText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default PlayToEarnScreen;
