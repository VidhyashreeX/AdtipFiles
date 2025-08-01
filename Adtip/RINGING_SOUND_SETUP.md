# Ringing Sound Setup Instructions

## Overview
The app now supports playing a custom MP3 ringing sound during outgoing calls. Follow these instructions to add your ringing sound file.

## Required Files
You need to place a file named `ringing.mp3` in the following locations:

### Android
Place your `ringing.mp3` file in:
```
android/app/src/main/res/raw/ringing.mp3
```

### iOS
1. Open the iOS project in Xcode
2. Right-click on the project in the navigator
3. Select "Add Files to [ProjectName]"
4. Choose your `ringing.mp3` file
5. Make sure "Add to target" is checked for your main app target
6. The file should be added to the main bundle

## File Requirements
- **Format**: MP3
- **Name**: Must be exactly `ringing.mp3` (case-sensitive)
- **Duration**: Recommended 2-5 seconds (will loop automatically)
- **Quality**: Recommended 128kbps or higher
- **Sample Rate**: 44.1kHz recommended

## How It Works
1. When an outgoing call is connecting and no remote participant has joined yet, the ringing sound will start playing
2. The sound loops continuously until:
   - A remote participant joins the call
   - The call is ended
   - The call status changes
3. If the MP3 file fails to load, the app will fallback to system beep sounds

## Testing
1. Place the `ringing.mp3` file in the required locations
2. Rebuild the app for both platforms
3. Make an outgoing call
4. You should hear your custom ringing sound while waiting for the other person to join

## Troubleshooting
- If you don't hear the custom sound, check the console logs for loading errors
- Make sure the file is exactly named `ringing.mp3`
- Ensure the file is properly added to the iOS bundle
- The app will fallback to system beeps if the MP3 fails to load

## Implementation Details
- Uses `react-native-sound` library for audio playback
- Plays in `Playback` category to work in silent mode
- Automatically stops when call state changes
- Supports both Android and iOS platforms
