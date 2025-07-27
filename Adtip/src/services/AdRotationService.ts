// Ad Network Configuration
export interface AdNetwork {
  name: string;
  appId: string;
  adUnits: {
    banner: string;
    rectangle: string;
    interstitial: string;
    appOpen: string;
    rewarded: string;
    native: string;
  };
}

// PubScale Company (Bangalore) - Only Network
export const PUBSCALE_NETWORK: AdNetwork = {
  name: 'PubScale',
  appId: 'ca-app-pub-3206456546664189~6654042212',
  adUnits: {
    banner: '/22387492205,23297313686/com.adtip.app.adtip_app.Banner0.1752230666',
    rectangle: '/22387492205,23297313686/com.adtip.app.adtip_app.Mrec0.1752230666',
    interstitial: '/22387492205,23297313686/com.adtip.app.adtip_app.Interstitial0.1752230772',
    appOpen: '/22387492205,23297313686/com.adtip.app.adtip_app.AppOpen0.1752230585',
    rewarded: '/22387492205,23297313686/com.adtip.app.adtip_app.Rewarded0.1752230221',
    native: '/22387492205,23297313686/com.adtip.app.adtip_app.Native0.1752230236',
  },
};

// Business Collaboration Company - REMOVED/COMMENTED OUT
// export const BUSINESS_COLLABORATION_NETWORK: AdNetwork = {
//   name: 'Business Collaboration',
//   appId: 'ca-app-pub-7659347823138327~5340960546',
//   adUnits: {
//     banner: '/22387492205,23292119919/com.adtip.app.adtip_app.Banner0.1750928844',
//     rectangle: '/22387492205,23292119919/com.adtip.app.adtip_app.Mrec0.1750929251',
//     interstitial: '/22387492205,23292119919/com.adtip.app.adtip_app.Interstitial0.1750928897',
//     appOpen: '/22387492205,23292119919/com.adtip.app.adtip_app.AppOpen0.1750929051',
//     rewarded: '/22387492205,23292119919/com.adtip.app.adtip_app.Rewarded0.1750928989',
//     native: '/22387492205,23292119919/com.adtip.app.adtip_app.Native0.1750929216',
//   },
// };

// Single network - no rotation needed
const networks = [PUBSCALE_NETWORK];

class AdRotationService {
  private static instance: AdRotationService;

  static getInstance(): AdRotationService {
    if (!AdRotationService.instance) {
      AdRotationService.instance = new AdRotationService();
    }
    return AdRotationService.instance;
  }

  /**
   * Get the current ad network (always PubScale)
   */
  getCurrentNetwork(): AdNetwork {
    return networks[0]; // Always PubScale
  }

  /**
   * Get the next ad network (always PubScale - no rotation)
   */
  getNextNetwork(): AdNetwork {
    // No rotation - always return PubScale
    console.log(`📱 [AdRotation] Using PubScale only - no rotation`);
    return networks[0];
  }

  /**
   * Get ad unit ID for specific ad type (PubScale only)
   */
  getAdUnitId(adType: keyof AdNetwork['adUnits']): string {
    const network = this.getCurrentNetwork();
    const adUnitId = network.adUnits[adType];
    
    console.log(`📱 [AdRotation] Using PubScale ${adType} ad: ${adUnitId}`);
    return adUnitId;
  }

  /**
   * Get ad unit ID for next rotation (same as current - no rotation)
   */
  getNextAdUnitId(adType: keyof AdNetwork['adUnits']): string {
    const network = this.getCurrentNetwork();
    const adUnitId = network.adUnits[adType];
    
    console.log(`📱 [AdRotation] Using PubScale ${adType} ad (no rotation): ${adUnitId}`);
    return adUnitId;
  }

  /**
   * Get current network name
   */
  getCurrentNetworkName(): string {
    return networks[0].name;
  }

  /**
   * Get rotation statistics (no rotation)
   */
  getRotationStats() {
    return {
      currentNetwork: networks[0].name,
      totalRotations: 0, // No rotations
      availableNetworks: 1, // Only PubScale
    };
  }

  /**
   * Force switch to specific network (always PubScale)
   */
  switchToNetwork(networkIndex: number): AdNetwork {
    // Only PubScale available
    console.log(`📱 [AdRotation] Using PubScale only - no switching`);
    return networks[0];
  }

  /**
   * Get all available networks (only PubScale)
   */
  getAllNetworks(): AdNetwork[] {
    return networks;
  }
}

export default AdRotationService; 