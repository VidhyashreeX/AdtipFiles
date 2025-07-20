# CallKeep Integration Example

## Quick Integration Guide

### 1. Add Permission Guide to Your Home Screen

```typescript
// In your Home screen component (src/scenes/home/index.js)
import { useCallKeepPermissions } from '../../hooks/useCallKeepPermissions'
import { CallKeepPermissionGuide } from '../../components/callkeep/CallKeepPermissionGuide'

export default function Home({ navigation }) {
  // Your existing state...
  const { hasPermissions, showGuide, hideGuide, showPermissionGuide } = useCallKeepPermissions()

  return (
    <KeyboardAvoidingView style={/* your styles */}>
      {/* Your existing UI */}
      
      {/* Add this permission guide */}
      <CallKeepPermissionGuide
        visible={showGuide}
        onClose={hideGuide}
        onPermissionGranted={() => {
          console.log('CallKeep permissions granted!')
          // Optionally show a success message
        }}
      />
    </KeyboardAvoidingView>
  )
}
```

### 2. Add Permission Status Indicator (Optional)

```typescript
// Add this to show permission status in your UI
const PermissionStatus = () => {
  const { hasPermissions, isChecking } = useCallKeepPermissions()
  
  if (isChecking) {
    return <Text>Checking CallKeep permissions...</Text>
  }
  
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', padding: 10 }}>
      <Text>{hasPermissions ? '✅' : '⚠️'}</Text>
      <Text style={{ marginLeft: 8 }}>
        Native Call UI: {hasPermissions ? 'Enabled' : 'Disabled'}
      </Text>
      {!hasPermissions && (
        <TouchableOpacity 
          onPress={showPermissionGuide}
          style={{ marginLeft: 10, padding: 5, backgroundColor: '#007AFF', borderRadius: 5 }}
        >
          <Text style={{ color: 'white', fontSize: 12 }}>Enable</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}
```

### 3. Debug Screen Integration (Temporary)

```typescript
// Add to your navigation stack for debugging
import { CallKeepDebugScreen } from './src/components/debug/CallKeepDebugScreen'

// In your navigation stack
<Screen
  name="CallKeepDebug"
  component={CallKeepDebugScreen}
  options={{ headerShown: true, title: 'CallKeep Debug' }}
/>

// Navigate to it for testing
navigation.navigate('CallKeepDebug')
```

## Testing Steps

### 1. Test Current Status
1. Run your app
2. Check the console logs for CallKeep initialization
3. Look for: `[CallKeepService] ✅ CallKeep initialization successful`

### 2. Test Permission Flow
1. Navigate to the debug screen (if added)
2. Tap "Test CallKeep Service" - should show initialization status
3. Tap "Test Permissions" - should show permission status
4. Tap "Setup Permissions" - should show the permission guide

### 3. Test Manual Permission Setup
1. If permissions are not granted, the guide will show automatically
2. Follow the steps in the guide:
   - Tap "Open Settings"
   - Find Adtip in the app list
   - Look for "Phone Account" or "Calling accounts"
   - Toggle it ON
   - Return to the app
   - Tap "Check Again"

### 4. Test Incoming Call
1. Once permissions are granted
2. Use the debug screen "Test Incoming Call" button
3. You should see the native Android call interface

## Expected Behavior

### ✅ Success Case
- CallKeep initializes without errors
- Permissions are granted (automatically or manually)
- Incoming calls show in native Android interface
- Console shows: `[CallKeepService] ✅ CallKeep initialization successful`

### ⚠️ Needs Manual Setup
- CallKeep initializes but permissions not granted
- Console shows: `[CallKeepService] ⚠️ CallKeep permissions not granted, but app will continue`
- Permission guide appears automatically
- User follows manual steps to enable

### ❌ Fallback Case
- CallKeep fails to initialize (rare)
- App continues with custom call UI
- Console shows: `[CallKeepService] 🚫 CallKeep unavailable after max attempts`

## Common Issues & Solutions

### Issue: "Phone Account not found"
**Solution:** The automatic registration didn't work. Use manual setup:
1. Open Android Settings
2. Apps > Adtip > Phone Account > Enable

### Issue: "Permission guide doesn't show"
**Solution:** Check if the hook is properly imported and used:
```typescript
const { showGuide } = useCallKeepPermissions()
// Make sure showGuide is true when permissions are needed
```

### Issue: "Settings button doesn't work"
**Solution:** Some Android versions have different settings paths. Guide the user:
1. Settings > Apps > Adtip
2. Look for "Phone Account", "Calling accounts", or "Default apps"
3. Enable the phone account for Adtip

## Production Integration

### Recommended Approach
1. **Automatic Detection:** Use `useCallKeepPermissions` hook
2. **User Guidance:** Show permission guide when needed
3. **Graceful Fallback:** App works with custom UI if CallKeep fails
4. **User Choice:** Let users enable/disable native call UI in settings

### User Experience
- Most users won't need to do anything (automatic setup works)
- Some users will see a one-time permission guide
- All users can still make/receive calls regardless of CallKeep status
- Clear feedback about what's happening

## Monitoring

### Key Metrics to Track
- CallKeep initialization success rate
- Permission grant rate (automatic vs manual)
- User completion rate of manual setup
- Call quality/reliability with vs without CallKeep

### Logs to Monitor
```
[CallKeepService] ✅ CallKeep initialization successful
[CallKeepService] ✅ CallKeep permissions granted successfully
[CallKeepService] ⚠️ CallKeep permissions not granted, but app will continue
[CallKeepService] 💡 User needs to manually enable phone account
```

## Next Steps

1. **Test the current implementation** with the debug screen
2. **Add permission guide** to your main app flow
3. **Test on multiple devices** to ensure compatibility
4. **Monitor logs** to understand success/failure rates
5. **Iterate based on user feedback** and analytics

The new implementation should resolve the permission issues and provide a much better user experience for enabling CallKeep functionality.
