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

// PubScale Company (Bangalore)
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

// Business Collaboration Company
export const BUSINESS_COLLABORATION_NETWORK: AdNetwork = {
  name: 'Business Collaboration',
  appId: 'ca-app-pub-7659347823138327~5340960546',
  adUnits: {
    banner: '/22387492205,23292119919/com.adtip.app.adtip_app.Banner0.1750928844',
    rectangle: '/22387492205,23292119919/com.adtip.app.adtip_app.Mrec0.1750929251',
    interstitial: '/22387492205,23292119919/com.adtip.app.adtip_app.Interstitial0.1750928897',
    appOpen: '/22387492205,23292119919/com.adtip.app.adtip_app.AppOpen0.1750929051',
    rewarded: '/22387492205,23292119919/com.adtip.app.adtip_app.Rewarded0.1750928989',
    native: '/22387492205,23292119919/com.adtip.app.adtip_app.Native0.1750929216',
  },
};

// Ad rotation state
let currentNetworkIndex = 0;
const networks = [PUBSCALE_NETWORK, BUSINESS_COLLABORATION_NETWORK];

class AdRotationService {
  private static instance: AdRotationService;
  private rotationCounter = 0;

  static getInstance(): AdRotationService {
    if (!AdRotationService.instance) {
      AdRotationService.instance = new AdRotationService();
    }
    return AdRotationService.instance;
  }

  /**
   * Get the current ad network for rotation
   */
  getCurrentNetwork(): AdNetwork {
    return networks[currentNetworkIndex];
  }

  /**
   * Get the next ad network in rotation
   */
  getNextNetwork(): AdNetwork {
    currentNetworkIndex = (currentNetworkIndex + 1) % networks.length;
    this.rotationCounter++;
    console.log(`🔄 [AdRotation] Switched to ${networks[currentNetworkIndex].name} (rotation #${this.rotationCounter})`);
    return networks[currentNetworkIndex];
  }

  /**
   * Get ad unit ID for specific ad type with rotation
   */
  getAdUnitId(adType: keyof AdNetwork['adUnits']): string {
    const network = this.getCurrentNetwork();
    const adUnitId = network.adUnits[adType];
    
    console.log(`📱 [AdRotation] Using ${network.name} ${adType} ad: ${adUnitId}`);
    return adUnitId;
  }

  /**
   * Get ad unit ID for next rotation
   */
  getNextAdUnitId(adType: keyof AdNetwork['adUnits']): string {
    const network = this.getNextNetwork();
    const adUnitId = network.adUnits[adType];
    
    console.log(`📱 [AdRotation] Next ${network.name} ${adType} ad: ${adUnitId}`);
    return adUnitId;
  }

  /**
   * Get current network name
   */
  getCurrentNetworkName(): string {
    return networks[currentNetworkIndex].name;
  }

  /**
   * Get rotation statistics
   */
  getRotationStats() {
    return {
      currentNetwork: networks[currentNetworkIndex].name,
      totalRotations: this.rotationCounter,
      availableNetworks: networks.length,
    };
  }

  /**
   * Force switch to specific network
   */
  switchToNetwork(networkIndex: number): AdNetwork {
    if (networkIndex >= 0 && networkIndex < networks.length) {
      currentNetworkIndex = networkIndex;
      this.rotationCounter++;
      console.log(`🔄 [AdRotation] Forced switch to ${networks[currentNetworkIndex].name}`);
      return networks[currentNetworkIndex];
    }
    throw new Error(`Invalid network index: ${networkIndex}`);
  }

  /**
   * Get all available networks
   */
  getAllNetworks(): AdNetwork[] {
    return networks;
  }
}

export default AdRotationService; 