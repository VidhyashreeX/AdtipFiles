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
  RefreshControl,
} from 'react-native';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import ApiService from '../../services/ApiService';
import { useAuth } from '../../contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
const getInitialTokens = (): Tokens => ({
  red: Array(4).fill(null).map((_, i) => ({ id: generateTokenId('red', i), position: 'home' as const, index: i, pathIndex: -1, color: 'red' })),
  green: Array(4).fill(null).map((_, i) => ({ id: generateTokenId('green', i), position: 'home' as const, index: i, pathIndex: -1, color: 'green' })),
  yellow: Array(4).fill(null).map((_, i) => ({ id: generateTokenId('yellow', i), position: 'home' as const, index: i, pathIndex: -1, color: 'yellow' })),
  blue: Array(4).fill(null).map((_, i) => ({ id: generateTokenId('blue', i), position: 'home' as const, index: i, pathIndex: -1, color: 'blue' })),
});

const CHALLENGES = [
  { id: 'free', name: 'Free Play', entryFee: 0, winAmount: 0, difficulty: 'Easy' },
  { id: 'beginner', name: 'Beginner Challenge', entryFee: 1, winAmount: 1.8, difficulty: 'Easy' },
  { id: 'casual', name: 'Casual Match', entryFee: 5, winAmount: 9, difficulty: 'Easy' },
  { id: 'classic', name: 'Classic Battle', entryFee: 10, winAmount: 18, difficulty: 'Medium' },
  { id: 'pro', name: 'Pro Tournament', entryFee: 25, winAmount: 45, difficulty: 'Medium' },
  { id: 'expert', name: 'Expert League', entryFee: 50, winAmount: 90, difficulty: 'Hard' },
  { id: 'championship', name: 'Championship', entryFee: 100, winAmount: 180, difficulty: 'Hard' },
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

// --- Types ---
type PlayerColor = 'red' | 'green' | 'yellow' | 'blue';

interface Token {
  id: string;
  position: 'home' | 'path' | 'finished';
  index: number;
  pathIndex: number;
  color: PlayerColor;
}

interface Tokens {
  red: Token[];
  green: Token[];
  yellow: Token[];
  blue: Token[];
  [key: string]: Token[]; // for dynamic access
}

interface Player {
  id: number;
  color: PlayerColor;
}

interface Challenge {
  id: string;
  name: string;
  entryFee: number;
  winAmount: number;
  difficulty: string;
}

interface GameStats {
  duration: string;
  totalMoves: number;
  movesByPlayer: Record<PlayerColor, number>;
  averageDiceRoll: number;
  luckyRolls: number;
}

const LudoGameScreen: React.FC = () => {
  const { colors, isDarkMode } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = useAuth();
  let contentPadding = insets.bottom;

  const [userId, setUserId] = useState<number>(user?.id || 50816);
  const [playerNames, setPlayerNames] = useState<Record<number, string>>({});
  const [gameMode, setGameMode] = useState<'challenges' | 'lobby' | 'game'>('challenges');
  const [gameStarted, setGameStarted] = useState(false);
  const [actualGameStarted, setActualGameStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currentPlayerId, setCurrentPlayerId] = useState<number | null>(null);
  const [diceValue, setDiceValue] = useState<number | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [playersInGame, setPlayersInGame] = useState<Player[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge>(CHALLENGES[0]);
  const [tokens, setTokens] = useState<Tokens>(getInitialTokens());
  const [roomId, setRoomId] = useState<string | null>(null);
  const [winnerId, setWinnerId] = useState<number | null>(null);
  const [serverMessageLog, setServerMessageLog] = useState<string[]>([]);
  const [gameStats, setGameStats] = useState<GameStats>({
    duration: '0:00',
    totalMoves: 0,
    movesByPlayer: { red: 0, blue: 0, yellow: 0, green: 0 },
    averageDiceRoll: 0,
    luckyRolls: 0
  });
  const [lobbyCounts, setLobbyCounts] = useState<Record<number, { current: number, total: number }>>({});
  const [loadingLobbyCounts, setLoadingLobbyCounts] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const diceAnimation = useRef(new Animated.Value(0)).current;
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  const [retryCount, setRetryCount] = useState<number>(0);

  // WebSocket URL
  const WEBSOCKET_URL = 'wss://api.adtip.in';

  // Fetch lobby counts for all challenge types
  const fetchLobbyCounts = useCallback(async () => {
    if (gameMode !== 'challenges') return;
    
    setLoadingLobbyCounts(true);
    try {
      const token = await AsyncStorage.getItem('accessToken');
      if (!token) {
        // Set default counts if no token
        const defaultCounts: Record<number, { current: number, total: number }> = {};
        CHALLENGES.forEach(challenge => {
          defaultCounts[challenge.entryFee] = { current: Math.floor(Math.random() * 3), total: 4 };
        });
        setLobbyCounts(defaultCounts);
        return;
      }

      // Call backend API to get lobby counts for each room type (entry fee)
      const response = await ApiService.post('/api/get-lobby-counts', {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response?.data?.success && response.data.data) {
        setLobbyCounts(response.data.data);
      } else {
        // Fallback to random counts if API fails
        const fallbackCounts: Record<number, { current: number, total: number }> = {};
        CHALLENGES.forEach(challenge => {
          fallbackCounts[challenge.entryFee] = { current: Math.floor(Math.random() * 3), total: 4 };
        });
        setLobbyCounts(fallbackCounts);
      }
    } catch (error) {
      console.error('Failed to fetch lobby counts:', error);
      // Fallback to random counts
      const fallbackCounts: Record<number, { current: number, total: number }> = {};
      CHALLENGES.forEach(challenge => {
        fallbackCounts[challenge.entryFee] = { current: Math.floor(Math.random() * 3), total: 4 };
      });
      setLobbyCounts(fallbackCounts);
    } finally {
      setLoadingLobbyCounts(false);
    }
  }, [gameMode]);

  // Fetch lobby counts when component mounts and when returning to challenges
  useEffect(() => {
    if (gameMode === 'challenges') {
      fetchLobbyCounts();
      // Refresh lobby counts every 10 seconds when on challenges screen
      const interval = setInterval(fetchLobbyCounts, 10000);
      return () => clearInterval(interval);
    }
  }, [gameMode, fetchLobbyCounts]);

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
          roomType: selectedChallenge.entryFee
        };
        console.log('Sending join message (already connected):', joinMessage);
        socketRef.current?.send(JSON.stringify(joinMessage));
      }
      return;
    }
    
    console.log('Attempting to connect to WebSocket...');
    setLoading(true);
    
    // Clean up any existing connection
    if (socketRef.current) {
      socketRef.current.onopen = null;
      socketRef.current.onmessage = null;
      socketRef.current.onerror = null;
      socketRef.current.onclose = null;
      try {
        socketRef.current.close();
      } catch (e) {
        console.log('Error closing existing socket:', e);
      }
      socketRef.current = null;
    }
    
    try {
      // Connect to Ludo WebSocket endpoint
      socketRef.current = new WebSocket(`${WEBSOCKET_URL}/ludo`);
      
      // Set up event handlers
      socketRef.current.onopen = () => {
        console.log('WebSocket connected successfully');
        setLoading(false);
        setRetryCount(0); // Reset retry count on successful connection
        
        // Send join message if in lobby mode
        if (gameMode === 'lobby' && selectedChallenge) {
          const joinMessage = {
            type: "join",
            userId: userId,
            roomType: selectedChallenge.entryFee
          };
          console.log('Sending join message:', joinMessage);
          try {
            socketRef.current?.send(JSON.stringify(joinMessage));
          } catch (e) {
            console.error('Error sending join message:', e);
          }
        }
      };

      socketRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data as string);
          console.log('WebSocket message received:', message);
          setServerMessageLog(prev => [...prev.slice(-20), JSON.stringify(message, null, 2)]);

          // Handle different message types
          if (message.type === 'joined') {
            if(message.roomId) setRoomId(message.roomId);
            setGameMode('lobby');
            Alert.alert("Joined Game", `Successfully joined room ${message.roomId}`);
          } else if (message.type === 'room_state') {
            if(message.players) {
              setPlayersInGame(message.players as Player[]);
            }
          } else if (message.type === 'start') {
            if(message.roomId) setRoomId(message.roomId);
            if(message.players) setPlayersInGame(message.players);
            if(message.currentTurn) setCurrentPlayerId(message.currentTurn);
            if(message.tokenPositions) setTokens(message.tokenPositions);
            setActualGameStarted(true);
            setGameMode('game');
            setWinnerId(null);
            setLoading(false);
            Alert.alert("Game Started!", `Room ID: ${message.roomId}. Game has begun!`);
          } else if (message.type === 'turn') {
            setCurrentPlayerId(message.currentTurn);
            setDiceValue(null); 
            setGameStarted(message.currentTurn === userId); 
            console.log(`Turn change: Player ${message.currentTurn}'s turn`);
          } else if (message.type === 'game-over') {
            setWinnerId(message.winner);
            setActualGameStarted(false);
            Alert.alert("Game Over", `Player ${message.winner} wins! Amount: ${message.winnerAmount}`);
          } else if (message.type === 'error') {
            console.error('Game error:', message.message);
            Alert.alert("Game Error", message.message || "An unknown error occurred.");
            setLoading(false);
          } else if (message.type === 'rejoined') {
            if(message.roomId) setRoomId(message.roomId);
            setGameMode('game');
            Alert.alert("Rejoined", "Successfully rejoined the game!");
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
          setServerMessageLog(prev => [...prev.slice(-20), `Error parsing: ${event.data}`]);
        }
      };

      socketRef.current.onerror = (error) => {
        console.error('WebSocket error occurred:', error);
        console.log('Error details:', JSON.stringify(error, null, 2));
        
        // Check if this is the specific control frames error
        if (error.message && error.message.includes('Control frames must be final')) {
          console.log('Detected control frames error - attempting recovery');
          // Don't show alert for this specific error, just log it
          setLoading(false);
          
          // Try to close and reconnect immediately for control frame errors
          setTimeout(() => {
            if (socketRef.current) {
              try {
                socketRef.current.close();
              } catch (e) {
                console.log('Error closing socket after control frame error:', e);
              }
            }
          }, 100);
        } else {
          Alert.alert("Connection Error", "WebSocket connection error. Attempting to reconnect...");
          setLoading(false);
        }
      };

      socketRef.current.onclose = (event) => {
        console.log(`WebSocket closed: Code ${event.code}, Reason: ${event.reason}`);
        setLoading(false);
        
        if (gameMode === 'game' || gameMode === 'lobby') {
          // Handle different close codes
          if (event.code === 1006) {
            // Abnormal closure - likely the control frames error
            console.log('Abnormal closure detected (1006) - likely control frames issue');
            
            setRetryCount(prev => {
              const newCount = prev + 1;
              if (newCount <= 10) { // Increased retry limit for control frame issues
                const baseDelay = 1000; // Start with 1 second
                const backoffDelay = Math.min(baseDelay * newCount + Math.random() * 500, 5000); // Linear backoff up to 5s
                
                console.log(`Attempting reconnection ${newCount}/10 in ${Math.round(backoffDelay/1000)} seconds...`);
                
                setTimeout(() => {
                  console.log(`Reconnection attempt ${newCount}`);
                  connectWebSocket();
                }, backoffDelay);
              } else {
                console.log('Max reconnection attempts reached for control frame error');
                Alert.alert(
                  "Connection Issue", 
                  "Having trouble maintaining connection. Please restart the game.",
                  [
                    { text: "Restart", onPress: () => setGameMode('challenges') },
                    { text: "Keep Trying", onPress: () => setRetryCount(0) }
                  ]
                );
              }
              return newCount;
            });
          } else if (event.code !== 1000) {
            // Other abnormal closures
            console.log('Other abnormal closure detected');
            setRetryCount(prev => {
              const newCount = prev + 1;
              if (newCount <= 5) {
                const backoffDelay = Math.min(1000 * Math.pow(2, newCount), 10000);
                console.log(`Reconnecting (attempt ${newCount}/5) in ${Math.round(backoffDelay/1000)} seconds...`);
                setTimeout(() => {
                  connectWebSocket();
                }, backoffDelay);
              } else {
                Alert.alert("Connection Failed", "Unable to reconnect. Please restart the game.");
              }
              return newCount;
            });
          }
        }
      };
      
    } catch (error) {
      console.error('Error creating WebSocket:', error);
      setLoading(false);
      Alert.alert("Connection Error", "Failed to create WebSocket connection.");
    }
  }, [gameMode, selectedChallenge, userId]);

  const parseTokenId = (tokenId: string): { color: PlayerColor, index: number } | null => {
    const match = tokenId.match(/([A-Z]+)(\d+)/i);
    if (match && match[1] && match[2]) {
        const color = match[1].toLowerCase() as PlayerColor;
        const index = parseInt(match[2], 10);
        if ((PLAYER_COLORS as Record<string, string>)[color] !== undefined && !isNaN(index)) {
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

  // Fetch player names when players list changes
  useEffect(() => {
    const fetchPlayerNames = async () => {
      if (playersInGame.length === 0) return;
      
      try {
        const userIds = playersInGame.map(p => p.id);
        const token = await AsyncStorage.getItem('accessToken');
        
        if (!token) {
          // Fallback to generic names if no token
          const fallbackNames: Record<number, string> = {};
          userIds.forEach(id => {
            fallbackNames[id] = id === userId ? 'You' : 'Random User';
          });
          setPlayerNames(fallbackNames);
          return;
        }

        const response = await ApiService.post('/api/get-multiple-user-names', {
          userid: userIds
        }, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (response?.data?.success && response.data.data) {
          const names: Record<number, string> = {};
          Object.entries(response.data.data).forEach(([id, name]) => {
            const numId = Number(id);
            names[numId] = (!name || name === 'null') ? 'Random User' : String(name);
            if (numId === userId) {
              names[numId] = names[numId] + ' (You)';
            }
          });
          setPlayerNames(names);
        } else {
          // Fallback if API call fails
          const fallbackNames: Record<number, string> = {};
          userIds.forEach(id => {
            fallbackNames[id] = id === userId ? 'You' : 'Random User';
          });
          setPlayerNames(fallbackNames);
        }
      } catch (error) {
        console.error('Failed to fetch player names:', error);
        // Fallback to generic names
        const fallbackNames: Record<number, string> = {};
        playersInGame.forEach(p => {
          fallbackNames[p.id] = p.id === userId ? 'You' : 'Random User';
        });
        setPlayerNames(fallbackNames);
      }
    };

    fetchPlayerNames();
  }, [playersInGame, userId]); 

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
            roomType: selectedChallenge.entryFee
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

  const handleTokenClick = (color: PlayerColor, tokenIndex: number) => {
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

  const handleBack = () => {
    if (gameMode === 'challenges') {
      navigation.goBack();
    } else {
      handleQuitGame();
    }
  };

  const renderHeaderLeft = () => {
    if (gameMode === 'challenges') return undefined;
    return (
      <TouchableOpacity onPress={handleBack} style={{ padding: 8, marginRight: 8 }}>
        <Icon name="arrow-left" size={22} color={colors.text.primary} />
      </TouchableOpacity>
    );
  };

  const renderChallengesScreen = () => {
    return (
      <LinearGradient
        colors={isDarkMode ? ['#121212', '#1E1E1E'] : ['#F0F0FF', '#FFFFFF']}
        style={styles.challengesContainer}
      >
        {/* Sticky top: selected challenge or header/instructions */}
        {selectedChallenge ? (
          <View style={styles.selectedChallengeContainer}>
            <LinearGradient
              colors={isDarkMode ? ['#222244', '#191932'] : ['#EBE7FF', '#F0F0FF']}
              style={styles.selectedChallengeCard}
            >
              <Text style={[styles.selectedChallengeTitle, {color: isDarkMode ? '#BB86FC' : '#9C27B0'}]}>
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
                  backgroundColor: isDarkMode ? '#BB86FC' : '#9C27B0'
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
        ) : (
          <>
            <View style={styles.ludoHeader}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={['#F57C00', '#FF9800']}
                  style={styles.logoBox}
                >
                  <Icon name="casino" size={24} color="#FFFFFF" />
                </LinearGradient>
                <Text style={[styles.gameTitle, {color: colors.text.primary}]}> 
                  <Text style={{color: '#F57C00'}}>Ludo</Text>{' '}
                  <Text style={{color: '#8BC34A'}}>Game</Text>{' '}
                  <Icon name="sports-esports" size={20} color="#8BC34A" />
                </Text>
              </View>
              <Text style={[styles.gameSubtitle, {color: colors.text.secondary}]}> Classic Board Game • 4 Players • Strategic Fun </Text>
            </View>
            <Text style={[styles.challengeSectionTitle, {color: isDarkMode ? '#BB86FC' : '#9C27B0'}]}> Choose Your Challenge </Text>
            <Text style={[styles.challengeSectionSubtitle, {color: colors.text.secondary}]}> Select a challenge to start playing and win real money! </Text>
            <TouchableOpacity 
              style={[styles.refreshButton, {backgroundColor: isDarkMode ? '#333333' : '#F0F0F0'}]}
              onPress={fetchLobbyCounts}
              disabled={loadingLobbyCounts}
            >
              {loadingLobbyCounts ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Icon name="refresh" size={16} color={colors.text.secondary} />
              )}
              <Text style={[styles.refreshButtonText, {color: colors.text.secondary}]}>
                {loadingLobbyCounts ? 'Updating...' : 'Refresh Lobbies'}
              </Text>
            </TouchableOpacity>
          </>
        )}
        {/* Scrollable challenge list below sticky top */}
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.challengesScrollContent}
          refreshControl={
            <RefreshControl
              refreshing={loadingLobbyCounts}
              onRefresh={fetchLobbyCounts}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        >
          {CHALLENGES.map((challenge) => {
            const isSelected = selectedChallenge?.id === challenge.id;
            const difficultyColor = 
              challenge.difficulty === 'Easy' ? '#4CAF50' : 
              challenge.difficulty === 'Medium' ? '#FF9800' : 
              '#F44336';
            // Get dynamic player counts from lobby data
            const lobbyData = lobbyCounts[challenge.entryFee] || { current: 0, total: 4 };
            const current = lobbyData.current;
            const total = lobbyData.total;
            const progress = current / total;
            return (
              <TouchableOpacity 
                key={challenge.id}
                style={[
                  styles.challengeCard,
                  {
                    backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                    borderColor: isSelected ? (isDarkMode ? '#BB86FC' : '#9C27B0') : 'transparent'
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
                    <Icon name="local-offer" size={16} color={isDarkMode ? '#BB86FC' : '#9C27B0'} />
                    <Text style={[styles.detailLabel, {color: colors.text.secondary}]}>Entry Fee</Text>
                    <Text style={[styles.detailValue, {color: colors.text.primary}]}>₹{challenge.entryFee}</Text>
                  </View>
                  <View style={styles.challengeDetailItem}>
                    <Icon name="emoji-events" size={16} color="#FFC107" />
                    <Text style={[styles.detailLabel, {color: colors.text.secondary}]}>Win Amount</Text>
                    <Text style={[styles.detailValue, {color: '#4CAF50'}]}>₹{challenge.winAmount}</Text>
                  </View>
                  <View style={styles.challengeDetailItem}>
                    <Icon name="group" size={16} color="#2196F3" />
                    <Text style={[styles.detailLabel, {color: colors.text.secondary}]}>Players</Text>
                    <View style={{width: '100%'}}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={[styles.detailValue, {color: colors.text.primary}]}>
                          {current}/{total}
                        </Text>
                        {loadingLobbyCounts && (
                          <ActivityIndicator size="small" color="#2196F3" />
                        )}
                      </View>
                      <View style={[styles.progressBackground, {backgroundColor: isDarkMode ? '#333333' : '#E0E0E0'}]}>
                        <View 
                          style={[styles.progressFill, {
                            backgroundColor: current >= total ? '#4CAF50' : '#2196F3',
                            width: `${Math.max(5, progress * 100)}%`
                          }]} 
                        />
                      </View>
                      {current >= total && (
                        <Text style={{ fontSize: 12, color: '#4CAF50', marginTop: 2 }}>
                          Ready to Start!
                        </Text>
                      )}
                      {current > 0 && current < total && (
                        <Text style={{ fontSize: 12, color: colors.text.secondary, marginTop: 2 }}>
                          {total - current} more needed
                        </Text>
                      )}
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          <View style={{height: contentPadding > 0 ? contentPadding + 20 : 20}} />
        </ScrollView>
      </LinearGradient>
    );
  };

  const renderWaitingRoom = () => (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ flexGrow: 1 }}>
      <View style={[styles.ludoHeader, { paddingTop: contentPadding + 10 }]}>
        <TouchableOpacity onPress={handleBack} style={styles.ludoHeaderBackButton}>
          <Icon name="arrow-left" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.ludoHeaderTitle, { color: colors.text.primary }]}>
          Waiting Room
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={styles.waitingContent}>
        <Animated.View style={[styles.waitingCard, { transform: [{ scale: pulseAnimation }] }]}>
          <Text style={[styles.waitingTitle, { color: colors.text.primary }]}>
            Finding Players...
          </Text>
          
          <Text style={[styles.roomInfo, { color: colors.text.secondary }]}>
            Room ID: {roomId || 'Connecting...'}
          </Text>
          
          <Text style={[styles.challengeInfo, { color: colors.text.primary }]}>
            Entry Fee: ₹{selectedChallenge?.entryFee || 0}
          </Text>

          {/* Dynamic Player Display */}
          <View style={styles.playersContainer}>
            <Text style={[styles.playersTitle, { color: colors.text.primary }]}>
              Players ({playersInGame.length}/4)
            </Text>
            
            <View style={styles.playersList}>
              {[0, 1, 2, 3].map((index) => {
                const player = playersInGame[index];
                const playerName = player ? (playerNames[player.id] || `Player ${player.id}`) : '';
                
                return (
                  <View key={index} style={[styles.playerSlot, { borderColor: colors.border }]}>
                    <View style={[
                      styles.playerAvatar, 
                      { 
                        backgroundColor: player ? colors.primary : colors.card,
                        borderColor: player ? colors.primary : colors.border 
                      }
                    ]}>
                      {player ? (
                        <Icon name="user" size={20} color={colors.background} />
                      ) : (
                        <Icon name="user-plus" size={20} color={colors.text.secondary} />
                      )}
                    </View>
                    <Text style={[
                      styles.playerName, 
                      { color: player ? colors.text.primary : colors.text.secondary }
                    ]}>
                      {player ? playerName : 'Waiting...'}
                    </Text>
                    {player && (
                      <View style={[styles.statusIndicator, { backgroundColor: colors.success }]} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles.loadingText, { color: colors.text.secondary }]}>
                Connecting to game server...
              </Text>
            </View>
          )}

          {!loading && playersInGame.length > 0 && playersInGame.length < 4 && (
            <View style={styles.waitingInfo}>
              <Text style={[styles.waitingText, { color: colors.text.secondary }]}>
                Waiting for {4 - playersInGame.length} more player{4 - playersInGame.length > 1 ? 's' : ''}...
              </Text>
              <Text style={[styles.waitingSubtext, { color: colors.text.secondary }]}>
                Game will start automatically when all players join
              </Text>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.error }]} 
            onPress={handleQuitGame}
          >
            <Text style={[styles.cancelButtonText, { color: colors.background }]}>
              Cancel & Leave
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );

  const renderGameScreen = () => {
    if (winnerId) {
      return (
        <LinearGradient
          colors={isDarkMode ? ['#121212', '#1E1E1E'] : ['#F0F0FF', '#FFFFFF']}
          style={styles.gameOverContainer}
        >
          <View style={styles.trophyContainer}>
            <Icon name="trophy" size={64} color="#FFC107" />
            <Text style={[styles.gameOverTitle, {color: colors.text.primary}]}>Game Over!</Text>
          </View>
          
          <View style={[styles.gameOverCard, {
            backgroundColor: isDarkMode ? colors.card : '#FFFFFF'
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
                <Icon name="clock-outline" size={20} color={isDarkMode ? '#BB86FC' : '#9C27B0'} />
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
              style={[styles.newGameButton, {backgroundColor: isDarkMode ? '#BB86FC' : '#9C27B0'}]}
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
          colors={isDarkMode ? ['#121212', '#1E1E1E'] : ['#F0F0FF', '#FFFFFF']}
          style={styles.loadingGameContainer}
        >
          <ActivityIndicator size="large" color={isDarkMode ? '#BB86FC' : '#9C27B0'} />
          <Text style={[styles.loadingGameText, {color: colors.text.primary}]}>Loading Game...</Text>
          <Text style={[styles.loadingGameSubText, {color: colors.text.secondary}]}>
            Preparing game board for {selectedChallenge?.name}
          </Text>
        </LinearGradient>
      );
    }

    const getTokenScreenPosition = (color: PlayerColor, tokenIndex: number) => {
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
        style={{flex: 1, backgroundColor: isDarkMode ? '#121212' : '#F5F5F5'}}
        contentContainerStyle={styles.gameContentContainer}
      >
        <View style={styles.gameHeader}>
          <View style={[styles.gameInfoBanner, {
            backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
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
            backgroundColor: isDarkMode ? '#1E1E1E' : '#FFFFFF',
            borderColor: isDarkMode ? '#333333' : '#E0E0E0'
          }]}>
            {/* Home areas */}
            {Object.keys(homeAreaStyles).map(color => (
              <View 
                key={`home-${color}`}
                style={[
                  styles.homeArea,
                  homeAreaStyles[color as PlayerColor]
                ]}
              />
            ))}
            
            {/* Grid lines */}
            <View style={styles.gridContainer}>
              {Array(15).fill(0).map((_, i) => (
                <View key={`h-${i}`} style={[styles.gridLine, styles.horizontalLine, {
                  top: i * CELL_SIZE,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                }]} />
              ))}
              {Array(15).fill(0).map((_, i) => (
                <View key={`v-${i}`} style={[styles.gridLine, styles.verticalLine, {
                  left: i * CELL_SIZE,
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
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
                  backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)'
                }]}
              />
            ))}
            
            {/* Tokens */}
            {Object.keys(tokens).map((color) => 
              (tokens[color as PlayerColor] as Token[]).map((token: Token, index: number) => {
                const pos = getTokenScreenPosition(color as PlayerColor, index);
                const isMyTurn = currentPlayerId === userId;
                const canMoveThisToken = gameStarted && isMyTurn && diceValue !== null && !isRolling; 
                const isMovable = canMoveThisToken && token.position !== 'finished';

                return (
                  <TouchableOpacity
                    key={token.id}
                    style={[
                      styles.token,
                      {
                        backgroundColor: (PLAYER_COLORS as Record<string, string>)[color],
                        left: pos.left, 
                        top: pos.top,
                        width: TOKEN_SIZE,
                        height: TOKEN_SIZE,
                        borderRadius: TOKEN_SIZE / 2,
                        borderColor: isMovable ? '#FFFFFF' : (PLAYER_COLORS as Record<string, string>)[color],
                        borderWidth: isMovable ? 2 : 0,
                        opacity: token.position === 'finished' ? 0.7 : 1,
                        elevation: isMovable ? 8 : 4,
                        shadowColor: (PLAYER_COLORS as Record<string, string>)[color],
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isMovable ? 0.5 : 0.3,
                        shadowRadius: isMovable ? 4 : 2
                      }
                    ]}
                    onPress={() => isMovable && handleTokenClick(color as PlayerColor, index)}
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
            backgroundColor: isDarkMode ? colors.card : '#FFFFFF'
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
                        (isDarkMode ? '#333333' : '#EEEEEE') : 
                        (isDarkMode ? '#BB86FC' : '#9C27B0')
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
                        (isDarkMode ? '#BB86FC' : '#9C27B0') : 
                        '#FFFFFF'
                      } 
                    />
                  </Animated.View>
                  <Text style={[styles.diceButtonText, {
                    color: isRolling || (diceValue !== null) ? 
                      (isDarkMode ? '#BB86FC' : '#9C27B0') : 
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
                  color={winnerId ? "#FFC107" : (isDarkMode ? '#BB86FC' : '#9C27B0')}
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
            {Object.keys(PLAYER_COLORS).map((color) => {
              const playerTokens = tokens[color as PlayerColor];
              const homeCount = playerTokens.filter((t: Token) => t.position === 'home').length;
              const boardCount = playerTokens.filter((t: Token) => t.position === 'path').length;
              const finishedCount = playerTokens.filter((t: Token) => t.position === 'finished').length;
              const playerInGame = playersInGame.find((p: Player) => p.color === color);
              
              return (
                <View 
                  key={`stats-${color}`}
                  style={[styles.playerStatsCard, {
                    backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
                    borderColor: (PLAYER_COLORS as Record<string, string>)[color],
                    opacity: playerInGame ? 1 : 0.7
                  }]}
                >
                  <View style={styles.playerStatsHeader}>
                    <View style={[styles.playerColorDot, {backgroundColor: (PLAYER_COLORS as Record<string, string>)[color]}]} />
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
            backgroundColor: isDarkMode ? colors.card : '#FFFFFF',
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
                {Object.keys(PLAYER_COLORS).map((color) => (
                  <View key={`moves-${color}`} style={styles.playerMoveItem}>
                    <View style={[styles.playerMoveDot, {backgroundColor: (PLAYER_COLORS as Record<string, string>)[color]}]} />
                    <Text style={[styles.playerMoveName, {color: colors.text.secondary}]}>{color}</Text>
                    <Text style={[styles.playerMoveCount, {color: colors.text.primary}]}
                    >
                      {gameStats.movesByPlayer[color as PlayerColor]}
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
    <SafeAreaView style={[styles.container, {backgroundColor: isDarkMode ? '#0A0A0A' : '#FFFFFF'}]}>
      <Header 
        title={gameMode === 'challenges' ? "Ludo Cash" : (
          gameMode === 'lobby' ? `${selectedChallenge?.name} - Waiting` : `Playing Ludo`
        )}
        leftComponent={renderHeaderLeft()}
      />
      <View style={styles.mainContainer}>
        {gameMode === 'challenges' && renderChallengesScreen()}
        {gameMode === 'lobby' && renderWaitingRoom()}
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

  ludoHeaderBackButton: {
    padding: 8,
    marginRight: 8,
  },
  ludoHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  waitingContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  waitingCard: {
    width: '100%',
    maxWidth: 400,
    padding: 30,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
  },
  waitingTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  roomInfo: {
    fontSize: 16,
    marginBottom: 5,
    textAlign: 'center',
  },
  challengeInfo: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 30,
    textAlign: 'center',
  },
  playersContainer: {
    width: '100%',
    marginBottom: 30,
  },
  playersTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  playersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  playerSlot: {
    width: '48%',
    alignItems: 'center',
    padding: 15,
    marginBottom: 15,
    borderRadius: 12,
    borderWidth: 1,
    position: 'relative',
  },
  playerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  playerName: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  waitingInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  waitingSubtext: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 20,
    marginTop: 10,
    marginBottom: 5,
  },
  refreshButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
});

export default LudoGameScreen;