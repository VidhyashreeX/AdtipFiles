import { useEffect, useCallback, useState } from 'react';
import { Keyboard, Platform, Dimensions } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const useEnhancedKeyboardHandler = () => {
  const keyboardHeight = useSharedValue(0);
  const isKeyboardVisible = useSharedValue(false);
  const [keyboardHeightState, setKeyboardHeightState] = useState(0);
  const [isKeyboardVisibleState, setIsKeyboardVisibleState] = useState(false);

  const handleKeyboardShow = useCallback((event: any) => {
    const height = event.endCoordinates.height;
    const duration = Platform.OS === 'ios' ? 250 : 200;
    
    setKeyboardHeightState(height);
    setIsKeyboardVisibleState(true);
    
    // Use simpler animation to avoid crashes
    keyboardHeight.value = withTiming(height, { duration });
    isKeyboardVisible.value = true;
  }, []);

  const handleKeyboardHide = useCallback((event: any) => {
    const duration = Platform.OS === 'ios' ? 250 : 200;
    
    setKeyboardHeightState(0);
    setIsKeyboardVisibleState(false);
    
    // Use simpler animation to avoid crashes
    keyboardHeight.value = withTiming(0, { duration });
    isKeyboardVisible.value = false;
  }, []);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, handleKeyboardShow);
    const keyboardHideListener = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
    };
  }, [handleKeyboardShow, handleKeyboardHide]);

  const dismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible,
    keyboardHeightState,
    isKeyboardVisibleState,
    dismissKeyboard,
  };
}; 