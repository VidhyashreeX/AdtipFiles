import { StyleSheet, Platform, StatusBar } from 'react-native';

// Define a basic colors object for use in styles (customize as needed)
export const localFallbackColors = {
  primary: '#24d05a',
  card: '#fff',
  borderLight: '#e5e7eb',
  background: '#f8fafc',
  grey: '#6b7280',
  text: {
    primary: '#374151',
    secondary: '#64748b',
    tertiary: '#9ca3af',
    light: '#FFFFFF',
  },
  inputBackground: '#f1f5f9',
  errorBackground: '#fee2e2',
  errorText: '#dc2626',
  success: '#4CAF50',
  danger: '#F44336',
  white: '#FFFFFF',
  backgroundOpac: 'rgba(0,0,0,0.8)',
};

// Layout styles for enhanced video grid management
export const layoutStyles = StyleSheet.create({
  videoGridContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  
  layoutControls: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  layoutButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
  },
  
  activeLayoutButton: {
    backgroundColor: localFallbackColors.success,
  },
  
  layoutButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  
  paginationButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 15,
    marginHorizontal: 8,
  },
  
  disabledButton: {
    opacity: 0.5,
  },
  
  paginationText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Grid Layout
  gridContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    paddingTop: 80, // Space for layout controls
  },
  
  gridParticipant: {
    padding: 2,
  },
  
  // Spotlight Layout
  spotlightContainer: {
    flex: 1,
    paddingTop: 80,
  },
  
  mainSpeakerContainer: {
    flex: 1,
    margin: 8,
  },
  
  thumbnailsContainer: {
    height: 120,
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  
  thumbnailParticipant: {
    width: 80,
    height: 100,
    marginRight: 8,
  },
  
  // Sidebar Layout  
  sidebarContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 80,
  },
  
  sidebarMain: {
    flex: 3,
    margin: 8,
  },
  
  sidebarList: {
    flex: 1,
    paddingHorizontal: 8,
  },
  
  sidebarParticipant: {
    height: 100,
    marginBottom: 8,
  },
  
  // PiP Layout
  pipContainer: {
    position: 'absolute',
    bottom: 150,
    right: 20,
    width: 150,
    height: 200,
    zIndex: 100,
  },
  
  // Participant Styles
  spotlightParticipant: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  thumbnailParticipantStyle: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  
  sidebarMainParticipant: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  sidebarThumbParticipant: {
    flex: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },
  
  pipParticipant: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  
  fullscreenParticipant: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
    backgroundColor: 'black',
  },
  
  fullscreenButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    padding: 6,
  },
  
  thumbnailInfo: {
    padding: 2,
  },
  
  thumbnailMicIndicator: {
    padding: 1,
  },
  
  thumbnailText: {
    fontSize: 10,
  },
  
  pipParticipantName: {
    fontSize: 10,
  },
  
  qualityIndicator: {
    position: 'absolute',
    top: 5,
    left: 5,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'green',
  },
  
  qualityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

// Main styles for TipCallScreen
export const styles = StyleSheet.create({
  // Basic Container Styles
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  
  // Contact List Styles
  contactsContainer: { 
    flex: 1 
  },
  
  contactItem: {
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16, 
    borderBottomWidth: 1,
    marginHorizontal: 16,
  },
  
  contactInfo: { 
    flex: 1, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  
  avatarPlaceholder: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    marginRight: 12,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  
  avatarText: { 
    color: 'white', 
    fontSize: 18, 
    fontWeight: 'bold'
  },
  
  contactName: { 
    fontSize: 16, 
    fontWeight: '600', 
    marginBottom: 2 
  },
  
  contactStatus: { 
    fontSize: 13 
  },
  
  contactDetails: {
    flex: 1,
  },
  
  callButtons: { 
    flexDirection: 'row', 
    marginLeft: 16 
  },
  
  callButton: {
    width: 40, 
    height: 40, 
    borderRadius: 20,
    justifyContent: 'center', 
    alignItems: 'center',
    marginLeft: 8,
  },

  // Filter Styles
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  
  filterItem: {
    flex: 1,
    marginHorizontal: 5,
  },
  
  filterLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  
  filterButton: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  
  selectedFilterButton: {
    backgroundColor: localFallbackColors.primary,
  },
  
  filterButtonText: {
    fontSize: 14,
    color: '#333',
  },

  // Loading and Error States
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 10,
  },
  
  errorContainer: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#f44336',
    margin: 16,
    borderRadius: 8,
  },
  
  errorText: {
    fontSize: 14,
    color: '#dc2626',
    marginBottom: 10,
    textAlign: 'center',
  },
  
  errorContainerFeedback: { 
    padding: 16, 
    borderRadius: 8, 
    marginHorizontal: 16, 
    marginVertical: 16,
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    borderWidth: 1,
    borderColor: '#f44336',
  },
  
  errorTextFeedback: { 
    fontSize: 14, 
    textAlign: 'center', 
    marginBottom: 12,
    color: '#dc2626',
  },
  
  retryButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    alignItems: 'center',
  },
  
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  
  retryButtonFeedback: { 
    paddingVertical: 10, 
    paddingHorizontal: 24, 
    borderRadius: 20, 
    borderWidth: 1,
  },
  
  retryButtonTextFeedback: { 
    fontSize: 14, 
    fontWeight: '600',
  },
  
  emptyContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    padding: 20, 
    marginTop: 50,
  },
  
  emptyText: { 
    fontSize: 16, 
    textAlign: 'center', 
    marginBottom: 8 
  },

  // Call Overlay Styles
  callOverlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.9)' 
  },
  
  callStatus: { 
    fontSize: 18, 
    color: 'white', 
    marginBottom: 20,
    textAlign: 'center',
  },
  
  callStatusText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },

  // Call Controls
  callControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    bottom: 50,
    width: '100%',
    paddingHorizontal: 20,
  },
  
  controlButton: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 3,
  },
  
  controlButtonText: {
    color: 'white',
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  
  controlButtonTextSmall: {
    color: 'white',
    fontSize: 8,
    marginTop: 1,
    textAlign: 'center',
  },
  
  endCallButton: { 
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'red',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 10,
  },
  
  endCallButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },

  // Video Container
  videoContainer: {
    flex: 1,
    width: '100%',
  },
  
  // Joining States
  joiningContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  joiningText: {
    fontSize: 18,
    color: 'white',
    marginTop: 20,
  },
  
  joinButton: {
    backgroundColor: 'black',
    alignSelf: 'center',
    padding: 12,
    borderRadius: 8,
  },
  
  joinButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Participant Video Styles
  participantVideo: {
    height: 300,
    marginVertical: 8,
    marginHorizontal: 8,
    borderRadius: 8,
  },
  
  participantContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  localVideo: { 
    width: 120, 
    height: 180, 
    position: 'absolute', 
    top: 40, 
    right: 20,
    borderRadius: 8,
    overflow: 'hidden',
  },
  
  remoteVideo: { 
    width: '100%', 
    height: '100%', 
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: -1, 
  },
  
  noVideoContainer: {
    backgroundColor: 'grey',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    flex: 1,
  },
  
  noMediaText: {
    fontSize: 16,
    color: 'white',
    marginTop: 8,
  },

  // Participant Info Overlay
  participantInfo: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 5,
    padding: 5,
  },
  
  participantName: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 30,
  },
  
  micIndicator: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 2,
  },
  
  screenShareIndicator: {
    backgroundColor: 'rgba(0,0,255,0.7)',
    borderRadius: 10,
    padding: 2,
    position: 'absolute',
    top: 5,
    right: 5,
  },
  
  activeSpeakerIndicator: {
    backgroundColor: 'rgba(255,255,0,0.7)',
    borderRadius: 10,
    padding: 2,
    position: 'absolute',
    top: 5,
    left: 5,
  },

  // Incoming Call Styles
  incomingCallOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  
  incomingCallText: {
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
    color: 'white',
  },
  
  incomingCallerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
    color: 'white',
  },
  
  incomingCallButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
  },
  
  acceptCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
  },
  
  rejectCallButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F44336',
  },

  // Status Bar
  statusBar: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 10 : 50,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 8,
    zIndex: 100,
  },
  
  connectionStatus: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
  },
  
  connected: { 
    color: '#4CAF50' 
  },
  
  connecting: { 
    color: '#FFC107' 
  },
  
  disconnected: { 
    color: '#F44336' 
  },
  
  networkQualityText: {
    fontSize: 11,
    color: 'white',
    textAlign: 'center',
    marginTop: 2,
  },
  
  recordingStatusText: {
    fontSize: 12,
    color: '#2196F3',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 3,
  },
  
  hlsStatusText: {
    fontSize: 12,
    color: '#9C27B0',
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 3,
  },
  
  errorTextSmall: {
    fontSize: 12,
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },

  // Advanced VideoSDK features styles
  activeSpeakerText: {
    fontSize: 14,
    color: 'yellow',
    fontWeight: 'bold',
  },
  
  activeSpeakerBorder: {
    borderWidth: 3,
    borderColor: 'yellow',
  },
  
  advancedControls: {
    position: 'absolute',
    top: Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 100 : 150,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 10,
    padding: 15,
    zIndex: 90,
  },
  
  deviceSelector: {
    marginBottom: 15,
  },
  
  deviceSelectorLabel: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  
  deviceButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
    marginRight: 8,
  },
  
  selectedDeviceButton: {
    backgroundColor: localFallbackColors.primary,
  },
  
  deviceButtonText: {
    color: 'white',
    fontSize: 11,
  },
  
  recordingControls: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginTop: 5,
    gap: 10,
  },
});