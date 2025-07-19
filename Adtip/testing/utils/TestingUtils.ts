import { performance } from 'perf_hooks'

/**
 * Utility functions for testing VideoSDK CallKeep integration
 */

export class TestingUtils {
  /**
   * Wait for a specified amount of time
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Measure execution time of an async function
   */
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; executionTime: number }> {
    const startTime = performance.now()
    const result = await fn()
    const endTime = performance.now()
    
    return {
      result,
      executionTime: endTime - startTime
    }
  }

  /**
   * Retry an async function with exponential backoff
   */
  static async retryWithBackoff<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 100
  ): Promise<T> {
    let lastError: Error

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn()
      } catch (error) {
        lastError = error as Error
        
        if (attempt === maxRetries) {
          throw lastError
        }

        const delay = baseDelay * Math.pow(2, attempt)
        await this.wait(delay)
      }
    }

    throw lastError!
  }

  /**
   * Create a timeout promise that rejects after specified time
   */
  static createTimeout(ms: number, message: string = 'Operation timed out'): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), ms)
    })
  }

  /**
   * Race a promise against a timeout
   */
  static async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      this.createTimeout(timeoutMs, `Operation timed out after ${timeoutMs}ms`)
    ])
  }

  /**
   * Generate a random string for testing
   */
  static generateRandomString(length: number = 10): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    
    return result
  }

  /**
   * Generate a unique session ID for testing
   */
  static generateSessionId(): string {
    return `test-session-${Date.now()}-${this.generateRandomString(6)}`
  }

  /**
   * Generate a unique meeting ID for testing
   */
  static generateMeetingId(): string {
    return `test-meeting-${Date.now()}-${this.generateRandomString(6)}`
  }

  /**
   * Generate a mock VideoSDK token
   */
  static generateMockToken(): string {
    return `mock-token-${Date.now()}-${this.generateRandomString(20)}`
  }

  /**
   * Validate that a deep link has the correct format
   */
  static validateDeepLink(deepLink: string): boolean {
    const deepLinkRegex = /^adtip:\/\/call\/(active|incoming|outgoing)\/[^\/]+\/[^\/]+\/[^\/]+(\?.*)?$/
    return deepLinkRegex.test(deepLink)
  }

  /**
   * Parse deep link parameters
   */
  static parseDeepLink(deepLink: string): {
    type: string
    sessionId: string
    meetingId: string
    token: string
    params: Record<string, string>
  } | null {
    try {
      const url = new URL(deepLink)
      const pathParts = url.pathname.split('/').filter(Boolean)
      
      if (pathParts.length < 4 || pathParts[0] !== 'call') {
        return null
      }

      const params: Record<string, string> = {}
      url.searchParams.forEach((value, key) => {
        params[key] = value
      })

      return {
        type: pathParts[1],
        sessionId: pathParts[2],
        meetingId: pathParts[3],
        token: decodeURIComponent(pathParts[4]),
        params
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Mock console methods for testing
   */
  static mockConsole(): {
    restore: () => void
    logs: string[]
    warnings: string[]
    errors: string[]
  } {
    const logs: string[] = []
    const warnings: string[] = []
    const errors: string[] = []

    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    console.log = (...args: any[]) => {
      logs.push(args.join(' '))
    }

    console.warn = (...args: any[]) => {
      warnings.push(args.join(' '))
    }

    console.error = (...args: any[]) => {
      errors.push(args.join(' '))
    }

    return {
      restore: () => {
        console.log = originalLog
        console.warn = originalWarn
        console.error = originalError
      },
      logs,
      warnings,
      errors
    }
  }

  /**
   * Create a mock function with call tracking
   */
  static createMockFunction<T extends (...args: any[]) => any>(
    implementation?: T
  ): T & {
    calls: Parameters<T>[]
    results: ReturnType<T>[]
    reset: () => void
  } {
    const calls: Parameters<T>[] = []
    const results: ReturnType<T>[] = []

    const mockFn = ((...args: Parameters<T>) => {
      calls.push(args)
      
      if (implementation) {
        const result = implementation(...args)
        results.push(result)
        return result
      }
      
      return undefined
    }) as T & {
      calls: Parameters<T>[]
      results: ReturnType<T>[]
      reset: () => void
    }

    mockFn.calls = calls
    mockFn.results = results
    mockFn.reset = () => {
      calls.length = 0
      results.length = 0
    }

    return mockFn
  }

  /**
   * Simulate network delay
   */
  static async simulateNetworkDelay(minMs: number = 50, maxMs: number = 200): Promise<void> {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await this.wait(delay)
  }

  /**
   * Simulate random failures for testing error handling
   */
  static async simulateRandomFailure<T>(
    fn: () => Promise<T>,
    failureRate: number = 0.1,
    errorMessage: string = 'Simulated failure'
  ): Promise<T> {
    if (Math.random() < failureRate) {
      throw new Error(errorMessage)
    }
    
    return await fn()
  }

  /**
   * Create a performance monitor
   */
  static createPerformanceMonitor() {
    const metrics: Array<{
      name: string
      startTime: number
      endTime?: number
      duration?: number
    }> = []

    return {
      start: (name: string) => {
        metrics.push({
          name,
          startTime: performance.now()
        })
      },

      end: (name: string) => {
        const metric = metrics.find(m => m.name === name && !m.endTime)
        if (metric) {
          metric.endTime = performance.now()
          metric.duration = metric.endTime - metric.startTime
        }
      },

      getMetrics: () => [...metrics],

      getAverageTime: (name: string) => {
        const namedMetrics = metrics.filter(m => m.name === name && m.duration !== undefined)
        if (namedMetrics.length === 0) return 0
        
        const totalTime = namedMetrics.reduce((sum, m) => sum + (m.duration || 0), 0)
        return totalTime / namedMetrics.length
      },

      reset: () => {
        metrics.length = 0
      }
    }
  }

  /**
   * Validate FCM message structure
   */
  static validateFCMMessage(message: any): boolean {
    if (!message || typeof message !== 'object') {
      return false
    }

    if (!message.messageId || typeof message.messageId !== 'string') {
      return false
    }

    if (!message.data || typeof message.data !== 'object') {
      return false
    }

    return true
  }

  /**
   * Create a test environment setup
   */
  static createTestEnvironment() {
    const mocks = {
      console: this.mockConsole(),
      performance: this.createPerformanceMonitor()
    }

    return {
      ...mocks,
      cleanup: () => {
        mocks.console.restore()
        mocks.performance.reset()
      }
    }
  }

  /**
   * Assert that a value is defined (TypeScript helper)
   */
  static assertDefined<T>(value: T | undefined | null, message?: string): asserts value is T {
    if (value === undefined || value === null) {
      throw new Error(message || 'Expected value to be defined')
    }
  }

  /**
   * Create a debounced function for testing
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T & { cancel: () => void } {
    let timeoutId: NodeJS.Timeout | null = null

    const debouncedFn = ((...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }

      timeoutId = setTimeout(() => {
        func(...args)
        timeoutId = null
      }, delay)
    }) as T & { cancel: () => void }

    debouncedFn.cancel = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
    }

    return debouncedFn
  }

  /**
   * Create a throttled function for testing
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): T {
    let lastCall = 0

    return ((...args: Parameters<T>) => {
      const now = Date.now()
      
      if (now - lastCall >= delay) {
        lastCall = now
        return func(...args)
      }
    }) as T
  }
}
