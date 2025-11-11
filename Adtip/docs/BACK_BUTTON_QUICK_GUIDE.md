# Quick Guide: Hardware Back Button Implementation

## Overview
The hardware back button now properly handles navigation throughout the app with exit confirmation at root screens.

## How It Works

### For Screen Developers

If you want custom back button behavior in your screen:

```typescript
import { useCustomBackHandler } from '../hooks/useCustomBackHandler';

const MyScreen = () => {
  // Option 1: Use default behavior for your screen type
  useCustomBackHandler({ 
    screenType: 'default',  // or 'call', 'profile', 'chat'
    fallbackRoute: 'Home'
  });

  // Option 2: Custom back button handling
  useCustomBackHandler({
    onCustomBack: () => {
      // Your custom logic here
      // Return true if handled, false to use default behavior
      if (hasUnsavedChanges) {
        Alert.alert('Unsaved Changes', 'Are you sure?');
        return true; // Prevents default back action
      }
      return false; // Allow default back action
    }
  });

  return <View>{/* Your screen content */}</View>;
};
```

### Screen Types

**`default`**: Standard back navigation
- Goes back if possible
- Never exits app (delegates to global handler)

**`call`**: For call-related screens
- Navigates based on source screen
- Returns to TipCall or previous screen

**`profile`**: For profile screens
- Smart navigation based on source
- Returns to appropriate screen

**`chat`**: For chat screens
- Returns to chat list or previous screen

### Global Back Button Behavior

The global handler (in `NavigationWithBackHandler`) automatically:

1. **On nested screens**: Navigates back through the stack
2. **On root tab screens**: Shows exit confirmation dialog
3. **On auth/guest screens**: Shows exit confirmation dialog
4. **On other root screens**: Navigates to TabHome

## Exit Confirmation

When at a root screen:
```
Press Back → Alert: "Exit AdTip - Are you sure you want to exit?"
             ├─ Cancel → Stay in app
             └─ Exit → App exits
```

## Best Practices

### DO:
✅ Use `useCustomBackHandler` for screens needing custom back behavior
✅ Return `true` from `onCustomBack` if you handled the back press
✅ Return `false` from `onCustomBack` to use default behavior
✅ Pass `navigationSource` when navigating to track flow

### DON'T:
❌ Manually add `BackHandler.addEventListener` (use the hook)
❌ Call `BackHandler.exitApp()` directly from screens
❌ Return `true` from `onCustomBack` without handling the action
❌ Mix multiple back button handlers in one screen

## Navigation with Source Tracking

To enable smart back navigation, pass source information:

```typescript
import { navigateWithSource } from '../hooks/useCustomBackHandler';

// In your component
navigation.navigate('UserProfile', {
  userId: 123,
  from: 'ChatScreen',
  source: 'chat',
  navigationSource: 'ChatScreen'
});

// Or use the helper
navigateWithSource(
  navigation,
  'UserProfile',
  { userId: 123 },
  'ChatScreen'
);
```

## Examples

### Example 1: Simple Screen with Default Back
```typescript
const SimpleScreen = () => {
  useCustomBackHandler(); // That's it!
  return <View>{/* content */}</View>;
};
```

### Example 2: Screen with Unsaved Changes Warning
```typescript
const EditScreen = () => {
  const [hasChanges, setHasChanges] = useState(false);

  useCustomBackHandler({
    onCustomBack: () => {
      if (hasChanges) {
        Alert.alert(
          'Unsaved Changes',
          'You have unsaved changes. Discard them?',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Discard', 
              style: 'destructive',
              onPress: () => navigation.goBack()
            }
          ]
        );
        return true; // Handled
      }
      return false; // Use default back behavior
    }
  });

  return <View>{/* content */}</View>;
};
```

### Example 3: Profile Screen from Different Sources
```typescript
const ProfileScreen = () => {
  useCustomBackHandler({ 
    screenType: 'profile',
    fallbackRoute: 'Home'
  });

  // Will automatically navigate back based on source:
  // - From call: goes to TipCall
  // - From chat: goes back to chat
  // - From search: goes back to search
  // - Default: goes to Home
  
  return <View>{/* content */}</View>;
};
```

## Debugging

Enable logging to see back button behavior:

```typescript
import { Logger } from '../utils/ProductionLogger';

// Logs will show:
// - Current route name
// - Whether navigation can go back
// - Which handler is executing
// - Navigation decisions made
```

Check logs for:
- `[BackHandler]` - Custom back handler logs
- `[NavigationWithBackHandler]` - Global handler logs

## Troubleshooting

**Issue**: Back button exits app from nested screens
- **Solution**: Make sure you're not calling `BackHandler.exitApp()` directly
- **Check**: Remove any manual `BackHandler.addEventListener` calls

**Issue**: Exit confirmation not showing on root tabs
- **Solution**: Verify `NavigationWithBackHandler` is wrapping your NavigationContainer
- **Check**: Ensure navigation is properly initialized

**Issue**: Custom back handler not working
- **Solution**: Check if `onCustomBack` returns `true` when handling the press
- **Check**: Make sure the hook is called at the component level, not in callbacks

**Issue**: Back button does nothing
- **Solution**: Check if multiple handlers are conflicting
- **Check**: Ensure navigation is ready (`navigationRef.isReady()`)

## Architecture

```
Hardware Back Press
        ↓
Screen-level Handler (useCustomBackHandler)
        ↓ (if not handled)
Global Handler (NavigationWithBackHandler)
        ↓ (if at root)
Exit Confirmation Dialog
        ↓
User Choice (Cancel/Exit)
```

## Need Help?

1. Check the logs for navigation state
2. Verify your handler returns the correct boolean
3. Test with the default behavior first
4. Review the full documentation: `docs/HARDWARE_BACK_BUTTON_FIX.md`
