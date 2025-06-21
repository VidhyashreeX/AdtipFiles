import { useEffect } from 'react';
import { Keyboard, Platform } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

export const useKeyboardHandler = () => {
  const keyboardHeight = useSharedValue(0);
  const isKeyboardVisible = useSharedValue(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const keyboardShowListener = Keyboard.addListener(showEvent, (event) => {
      console.log('[KeyboardHandler] Keyboard showing:', event.endCoordinates.height);
      keyboardHeight.value = withTiming(event.endCoordinates.height, {
        duration: Platform.OS === 'ios' ? 250 : 200,
      });
      isKeyboardVisible.value = true;
    });

    const keyboardHideListener = Keyboard.addListener(hideEvent, () => {
      console.log('[KeyboardHandler] Keyboard hiding');
      keyboardHeight.value = withTiming(0, {
        duration: Platform.OS === 'ios' ? 250 : 200,
      });
      isKeyboardVisible.value = false;
    });

    return () => {
      keyboardShowListener?.remove();
      keyboardHideListener?.remove();
    };
  }, []);

  return {
    keyboardHeight,
    isKeyboardVisible,
  };
};