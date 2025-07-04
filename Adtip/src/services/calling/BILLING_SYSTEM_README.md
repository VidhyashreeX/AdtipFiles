# Call Billing System Implementation

## Overview
The call billing system automatically manages call duration based on user wallet balance and premium status. It prevents calls from exceeding available balance and provides warnings before termination.

## Call Rates (₹ per minute)
- **Voice Call (Non-Premium)**: ₹7/min
- **Voice Call (Premium)**: ₹4/min  
- **Video Call (Non-Premium)**: ₹14/min
- **Video Call (Premium)**: ₹7/min

## Implementation Architecture

### 1. CallBillingService (`CallBillingService.ts`)
- **Purpose**: Tracks call duration, calculates costs, manages automatic termination
- **Key Features**:
  - Calculates maximum call duration based on balance and rates
  - Shows warnings at 5min, 2min, 1min, 30s, 10s before call ends
  - Automatically ends calls when balance is exhausted
  - Emits events for billing updates and warnings

### 2. UnifiedCallService Integration (`UnifiedCallService.ts`)
- **Pre-call validation**: Checks if user has minimum 30 seconds of call time
- **Billing start**: Automatically starts billing when call status becomes 'connected'
- **Billing stop**: Automatically stops billing when call ends
- **Event handling**: Listens for billing warnings and auto-termination events

### 3. TipCallScreen Integration (`TipCallScreen.tsx`)
- **Pre-call info**: Shows user max call duration and rates before starting call
- **Minimum balance check**: Prevents calls if balance < ₹1
- **Confirmation dialog**: Displays call cost information before proceeding

## How It Works

### Call Initiation Flow
1. User clicks call button on TipCallScreen
2. Check minimum balance (₹1 required)
3. Calculate max call duration and show confirmation dialog
4. If confirmed, start call through UnifiedCallService
5. UnifiedCallService validates balance for minimum 30 seconds
6. Call proceeds if validation passes

### During Call
1. When call status becomes 'connected', billing automatically starts
2. CallBillingService tracks elapsed time every second
3. Warnings are shown at predefined thresholds
4. If time runs out, call is automatically terminated

### Call Termination
1. When call ends (user action or auto-termination), billing stops
2. Final cost is calculated (rounded up to next minute)
3. Billing summary is logged and emitted as event

## Example Scenarios

### Scenario 1: Premium User with ₹20 - Video Call
- Rate: ₹7/min (premium video rate)
- Max duration: 20 ÷ 7 = 2.85 minutes = 171 seconds
- Warnings at: 120s, 60s, 30s, 10s remaining
- Final cost if full duration: ₹21 (3 minutes rounded up)

### Scenario 2: Regular User with ₹15 - Voice Call  
- Rate: ₹7/min (regular voice rate)
- Max duration: 15 ÷ 7 = 2.14 minutes = 128 seconds
- Warnings at: 120s, 60s, 30s, 10s remaining
- Final cost if full duration: ₹14 (2 minutes rounded up)

### Scenario 3: Low Balance User with ₹3
- Would be prevented at TipCallScreen (< ₹1 minimum)
- If somehow started, would allow ~25-43 seconds depending on call type
- Immediate warning about insufficient balance

## Key Events

### Emitted by CallBillingService
- `callBillingStarted`: When billing begins for a call
- `callBillingUpdate`: Every second with current cost and remaining time
- `callBillingWarning`: When warning thresholds are reached
- `callBillingEnded`: When billing stops with final cost calculation
- `callEndDueToBalance`: When call must be terminated due to insufficient balance

### Handled by UnifiedCallService
- Listens for `callEndDueToBalance` and calls `endCall()`
- Starts billing on status change to 'connected'
- Stops billing on status change to 'ended' or 'ending'

## Error Handling
- If billing calculation fails, call proceeds without billing (graceful degradation)
- If balance check fails during call start, call is prevented
- Billing service handles edge cases like negative balances or invalid rates
- Comprehensive logging for debugging billing issues

## Configuration
All rates and warning thresholds are defined as constants in `CallBillingService.ts`:
```typescript
private readonly CALL_RATES: CallRates = {
  voiceNonPremium: 7,
  voicePremium: 4,
  videoNonPremium: 14,
  videoPremium: 7,
};

private readonly WARNING_THRESHOLDS = [300, 120, 60, 30, 10]; // seconds
```

## Testing
Use `CallBillingTestScenarios.ts` for testing various balance and user type combinations.

## Integration Points
1. **WalletService**: Gets current balance and premium status
2. **UnifiedCallService**: Manages call lifecycle and billing integration  
3. **TipCallScreen**: Shows pre-call billing information
4. **AppEventEmitter**: Handles billing events and notifications
