import Foundation
import CallKit
import AVFoundation
import AudioToolbox
import React

@objc(AdtipCallKitManager)
class AdtipCallKitManager: RCTEventEmitter {
    
    private let callController = CXCallController()
    private let provider: CXProvider
    private var currentCallUUID: UUID?
    private var currentCallData: [String: Any]?
    
    override init() {
        let configuration = CXProviderConfiguration(localizedName: "Adtip")
        configuration.supportsVideo = true
        configuration.maximumCallGroups = 1
        configuration.maximumCallsPerCallGroup = 1
        configuration.supportedHandleTypes = [.generic]
        configuration.iconTemplateImageData = UIImage(named: "AppIcon")?.pngData()
        
        provider = CXProvider(configuration: configuration)
        
        super.init()
        
        provider.setDelegate(self, queue: nil)
    }
    
    override func supportedEvents() -> [String]! {
        return [
            "CallKitIncomingCall",
            "CallKitCallAnswered", 
            "CallKitCallDeclined",
            "CallKitCallEnded"
        ]
    }
    
    @objc
    func displayIncomingCall(_ callData: NSDictionary) {
        guard let sessionId = callData["sessionId"] as? String,
              let callerName = callData["callerName"] as? String else {
            print("[AdtipCallKit] Missing required call data")
            return
        }
        
        let callType = callData["callType"] as? String ?? "voice"
        let meetingId = callData["meetingId"] as? String
        let token = callData["token"] as? String
        
        print("[AdtipCallKit] Displaying incoming call from: \(callerName)")
        
        let callUUID = UUID()
        currentCallUUID = callUUID
        currentCallData = callData as? [String: Any]
        
        let update = CXCallUpdate()
        update.remoteHandle = CXHandle(type: .generic, value: callerName)
        update.localizedCallerName = callerName
        update.hasVideo = callType == "video"
        
        provider.reportNewIncomingCall(with: callUUID, update: update) { error in
            if let error = error {
                print("[AdtipCallKit] Error reporting incoming call: \(error)")
            } else {
                print("[AdtipCallKit] Successfully reported incoming call")
                
                // Send event to React Native
                self.sendEvent(withName: "CallKitIncomingCall", body: [
                    "sessionId": sessionId,
                    "callerName": callerName,
                    "callType": callType,
                    "meetingId": meetingId ?? "",
                    "token": token ?? "",
                    "callUUID": callUUID.uuidString
                ])
            }
        }
    }
    
    @objc
    func endCall(_ sessionId: String) {
        guard let callUUID = currentCallUUID else {
            print("[AdtipCallKit] No active call to end")
            return
        }
        
        print("[AdtipCallKit] Ending call: \(sessionId)")
        
        let endCallAction = CXEndCallAction(call: callUUID)
        let transaction = CXTransaction(action: endCallAction)
        
        callController.request(transaction) { error in
            if let error = error {
                print("[AdtipCallKit] Error ending call: \(error)")
            } else {
                print("[AdtipCallKit] Successfully ended call")
            }
        }
    }
    
    @objc
    func startOutgoingCall(_ callData: NSDictionary) {
        guard let recipientName = callData["recipientName"] as? String else {
            print("[AdtipCallKit] Missing recipient name for outgoing call")
            return
        }
        
        let callType = callData["callType"] as? String ?? "voice"
        let callUUID = UUID()
        currentCallUUID = callUUID
        currentCallData = callData as? [String: Any]
        
        let handle = CXHandle(type: .generic, value: recipientName)
        let startCallAction = CXStartCallAction(call: callUUID, handle: handle)
        startCallAction.isVideo = callType == "video"
        
        let transaction = CXTransaction(action: startCallAction)
        
        callController.request(transaction) { error in
            if let error = error {
                print("[AdtipCallKit] Error starting outgoing call: \(error)")
            } else {
                print("[AdtipCallKit] Successfully started outgoing call")
            }
        }
    }
    
    @objc
    func setCallConnected(_ sessionId: String) {
        guard let callUUID = currentCallUUID else {
            print("[AdtipCallKit] No active call to set as connected")
            return
        }
        
        print("[AdtipCallKit] Setting call as connected: \(sessionId)")
        provider.reportOutgoingCall(with: callUUID, connectedAt: Date())
    }
    
    @objc
    func updateCallState(_ sessionId: String, state: String) {
        guard let callUUID = currentCallUUID else {
            print("[AdtipCallKit] No active call to update")
            return
        }
        
        print("[AdtipCallKit] Updating call state: \(state)")
        
        switch state {
        case "connecting":
            provider.reportOutgoingCall(with: callUUID, startedConnectingAt: Date())
        case "connected":
            provider.reportOutgoingCall(with: callUUID, connectedAt: Date())
        default:
            break
        }
    }
    
    private func cleanupCall() {
        currentCallUUID = nil
        currentCallData = nil
    }
}

// MARK: - CXProviderDelegate
extension AdtipCallKitManager: CXProviderDelegate {
    
    func providerDidReset(_ provider: CXProvider) {
        print("[AdtipCallKit] Provider did reset")
        cleanupCall()
    }
    
    func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
        print("[AdtipCallKit] User answered call")
        
        // Configure audio session
        configureAudioSession()
        
        // Send event to React Native
        if let callData = currentCallData {
            sendEvent(withName: "CallKitCallAnswered", body: callData)
        }
        
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
        print("[AdtipCallKit] User ended call")
        
        // Send event to React Native
        if let callData = currentCallData {
            sendEvent(withName: "CallKitCallEnded", body: callData)
        }
        
        cleanupCall()
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
        print("[AdtipCallKit] Starting outgoing call")
        
        // Configure audio session
        configureAudioSession()
        
        // Report call as connecting
        provider.reportOutgoingCall(with: action.callUUID, startedConnectingAt: Date())
        
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXSetHeldCallAction) {
        print("[AdtipCallKit] Call hold state changed: \(action.isOnHold)")
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, perform action: CXSetMutedCallAction) {
        print("[AdtipCallKit] Call mute state changed: \(action.isMuted)")
        action.fulfill()
    }
    
    func provider(_ provider: CXProvider, didActivate audioSession: AVAudioSession) {
        print("[AdtipCallKit] Audio session activated")
        // Start audio processing here if needed
    }
    
    func provider(_ provider: CXProvider, didDeactivate audioSession: AVAudioSession) {
        print("[AdtipCallKit] Audio session deactivated")
        // Stop audio processing here if needed
    }
    
    private func configureAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playAndRecord, mode: .voiceChat, options: [])
            try audioSession.setActive(true)
            print("[AdtipCallKit] Audio session configured")
        } catch {
            print("[AdtipCallKit] Failed to configure audio session: \(error)")
        }
    }

    @objc func playBeep() {
        // Play a simple system beep sound
        AudioServicesPlaySystemSound(1000) // System beep sound
        print("[AdtipCallKit] Beep sound played")
    }
}
