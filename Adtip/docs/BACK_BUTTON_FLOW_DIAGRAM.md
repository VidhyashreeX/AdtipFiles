# Hardware Back Button Flow Diagram

## Complete Navigation Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    USER PRESSES BACK BUTTON                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
         ┌─────────────────────────────┐
         │  Screen-Level Handler        │
         │  (useCustomBackHandler)      │
         └──────────┬──────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
    Has Custom           No Custom
    Handler?             Handler
         │                     │
         ▼                     │
    Execute Custom             │
    Handler                    │
         │                     │
         ├─ Returns true ──────┤
         │  (handled)           │
         │                      │
         │                      ▼
         │              Check if can go back
         │              (navigation.canGoBack())
         │                      │
         │           ┌──────────┴──────────┐
         │           │                     │
         │           ▼                     ▼
         │       Can Go Back          Cannot Go Back
         │           │                     │
         │           ▼                     │
         │    navigation.goBack()         │
         │    return true                 │
         │           │                     │
         │           │                     ▼
         │           │              Return false
         │           │              (pass to global)
         │           │                     │
         └───────────┴─────────────────────┘
                     │
                     ▼
         ┌─────────────────────────────┐
         │   Global Handler             │
         │   (NavigationWithBackHandler)│
         └──────────┬──────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
    Can Go Back           Cannot Go Back
         │                     │
         ▼                     │
  navigation.goBack()          │
  return true                  │
         │                     │
         │                     ▼
         │            Check Current Route
         │                     │
         │      ┌──────────────┼──────────────┐
         │      │              │              │
         │      ▼              ▼              ▼
         │   Root Tab     Auth/Guest    Other Root
         │   Screen        Screen        Screen
         │      │              │              │
         │      ▼              ▼              ▼
         │  Exit           Exit          Navigate to
         │  Confirmation   Confirmation   TabHome
         │      │              │              │
         │      ▼              ▼              │
         │  ┌─────────────────────────┐      │
         │  │  Alert Dialog           │      │
         │  │  "Exit AdTip?"          │      │
         │  │                         │      │
         │  │  [Cancel]    [Exit]     │      │
         │  └────┬──────────────┬─────┘      │
         │       │              │            │
         │       ▼              ▼            │
         │   Dismiss        Exit App        │
         │   Dialog                          │
         │   Stay in App                     │
         └───────┴──────────────┴────────────┘
                 │
                 ▼
         ┌─────────────────┐
         │   User Action    │
         │   Completed      │
         └─────────────────┘
```

## Screen Type Behaviors

### Default Screen Type
```
User presses back
    │
    ▼
Can go back? ──Yes──> navigation.goBack()
    │
    No
    │
    ▼
Pass to global handler
    │
    ▼
Navigate to TabHome or show exit dialog
```

### Call Screen Type
```
User presses back
    │
    ▼
Check navigation source
    │
    ├── From Contacts ──> Navigate to TipCall
    ├── From Profile ──> Go back or TabHome
    ├── From Chat ──> Navigate to ChatList
    └── Default ──> Navigate to TipCall
```

### Profile Screen Type
```
User presses back
    │
    ▼
Check navigation source
    │
    ├── From Call ──> Navigate to TipCall
    ├── From Chat ──> Go back or TabHome
    ├── From Search ──> Go back or TabHome
    ├── From Home ──> Navigate to Home
    └── Default ──> Go back or TabHome
```

### Chat Screen Type
```
User presses back
    │
    ▼
Check navigation source
    │
    ├── Has source ──> Navigate to source
    └── No source ──> Go back or TabHome
```

## Root Tab Screens Flow

```
┌─────────────────────────────────────┐
│  Root Tab Screens                   │
│  • Home                             │
│  • TipTube                          │
│  • LiveStream                       │
│  • TipShorts                        │
│  • Profile                          │
└──────────────┬──────────────────────┘
               │
               ▼ User presses back
               │
    ┌──────────┴──────────┐
    │                     │
    ▼                     ▼
First Press         Second Press
(within 2s)
    │                     │
    │                     ▼
    │          ┌─────────────────────┐
    │          │  Exit Confirmation  │
    │          │      Dialog         │
    │          └─────────┬───────────┘
    │                    │
    │         ┌──────────┴──────────┐
    │         │                     │
    │         ▼                     ▼
    │    [Cancel]               [Exit]
    │         │                     │
    │         ▼                     ▼
    │    Stay in App          Exit App
    │         │               BackHandler.exitApp()
    │         │                     │
    └─────────┴─────────────────────┘
```

## Navigation Stack Visualization

### Example: Deep Navigation Stack
```
┌─────────────────────────┐
│      EditProfile        │ ← Current Screen
├─────────────────────────┤
│      UserProfile        │
├─────────────────────────┤
│      Settings           │
├─────────────────────────┤
│      Home (Tab)         │
├─────────────────────────┤
│      TabHome            │ ← Root
└─────────────────────────┘

Back button pressed at EditProfile:
    ▼
Goes to UserProfile (normal back)

Back button pressed at TabHome:
    ▼
Cannot go back → Show exit dialog
```

### Example: Tab Navigation
```
Current Tab: Home
    │
    ├─ Press back ──> Show exit dialog
    │
    └─ Navigate to Profile tab
           │
           └─ Press back ──> Show exit dialog
                             (not go to Home)
```

## Component Hierarchy

```
App.tsx
  └─> NavigationWithBackHandler
       └─> UltraFastLoader
            └─> NavigationWithBackHandler
                 └─> RootStack.Navigator
                      ├─> MainNavigator
                      │    └─> TabNavigator
                      │         ├─> Home (useCustomBackHandler)
                      │         ├─> TipTube (useCustomBackHandler)
                      │         ├─> LiveStream (useCustomBackHandler)
                      │         ├─> TipShorts (useCustomBackHandler)
                      │         └─> Profile (useCustomBackHandler)
                      │
                      ├─> GuestNavigator
                      │
                      └─> AuthNavigator
```

## Event Flow Timeline

```
Time ──────────────────────────────────────────────>

T0: User presses hardware back button
    │
T1: React Native BackHandler event fires
    │
T2: Screen-level handler (useCustomBackHandler) called
    │
T3: If not handled, global handler called
    │
T4: Navigation state checked
    │
T5: Decision made (go back / show dialog / navigate)
    │
T6: Action executed
    │
T7: UI updated
    │
T8: Event completed
```

## State Machine

```
┌─────────────────────────────────────────────────┐
│              Navigation States                   │
└──────────────────┬──────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
        ▼                     ▼
    CAN_GO_BACK         AT_ROOT
        │                     │
        ▼                     │
   Go to previous             │
   screen                     │
        │                     ▼
        │              Check screen type
        │                     │
        │          ┌──────────┼──────────┐
        │          │          │          │
        │          ▼          ▼          ▼
        │      ROOT_TAB   AUTH_GUEST  OTHER
        │          │          │          │
        │          ▼          ▼          ▼
        │      SHOW_EXIT  SHOW_EXIT   NAVIGATE_HOME
        │                                   │
        └───────────────────────────────────┘
```

## Decision Tree

```
                    Back Button Pressed
                           │
                           ▼
                    Has Custom Handler?
                    │              │
                   Yes            No
                    │              │
                    ▼              │
               Execute Handler     │
                    │              │
              Returns true?        │
              │          │         │
             Yes        No         │
              │          │         │
         HANDLED         └─────────┘
              │                    │
              │                    ▼
              │            Can Go Back?
              │            │          │
              │           Yes        No
              │            │          │
              │            ▼          │
              │      navigation       │
              │      .goBack()        │
              │            │          │
              │            │          ▼
              │            │    At Root Screen?
              │            │    │           │
              │            │   Yes         No
              │            │    │           │
              │            │    ▼           ▼
              │            │  Show Exit  Navigate to
              │            │  Dialog     TabHome
              │            │    │           │
              └────────────┴────┴───────────┘
                           │
                           ▼
                      COMPLETED
```

## Legend

```
┌─────┐
│ Box │  = Process/State
└─────┘

   │
   ▼     = Flow Direction

┌─────┬─────┐
│ Yes │ No  │  = Decision Branches
└─────┴─────┘

• Bullet    = List Item

──────────  = Connection
```

## Key Points

1. **Two-Level Handling**: Screen-level → Global-level
2. **Smart Decisions**: Based on navigation state and screen type
3. **User Confirmation**: Always asks before exit on root screens
4. **Stack Respect**: Properly navigates through React Navigation stack
5. **Fallback**: Always provides a safe fallback action

## Testing Points

Mark these points in your testing:

- ✓ Screen-level handler execution
- ✓ Global handler fallback
- ✓ Exit dialog appearance
- ✓ Dialog button actions
- ✓ Navigation stack traversal
- ✓ Tab navigation behavior
- ✓ Special screen type handling
