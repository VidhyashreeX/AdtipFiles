#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(AdtipCallKitManager, RCTEventEmitter)

RCT_EXTERN_METHOD(displayIncomingCall:(NSDictionary *)callData)
RCT_EXTERN_METHOD(endCall:(NSString *)sessionId)
RCT_EXTERN_METHOD(startOutgoingCall:(NSDictionary *)callData)
RCT_EXTERN_METHOD(setCallConnected:(NSString *)sessionId)
RCT_EXTERN_METHOD(updateCallState:(NSString *)sessionId state:(NSString *)state)

@end
