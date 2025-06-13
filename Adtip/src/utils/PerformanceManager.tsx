class PerformanceManager {
  private static preloadedScreens = new Set<string>();
  private static screenCache = new Map<string, React.ComponentType<any>>();

  static preloadScreen(screenName: string, component: React.ComponentType<any>) {
    if (!this.preloadedScreens.has(screenName)) {
      this.screenCache.set(screenName, component);
      this.preloadedScreens.add(screenName);
    }
  }

  static getScreen(screenName: string): React.ComponentType<any> | null {
    return this.screenCache.get(screenName) || null;
  }

  static shouldSkipAnimation(screenName: string): boolean {
    // Skip animations for frequently accessed screens
    const fastScreens = ['Home', 'Profile', 'Wallet', 'PlayToEarn'];
    return fastScreens.includes(screenName);
  }
}

export default PerformanceManager;