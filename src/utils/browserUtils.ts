/**
 * Browser detection and compatibility utilities
 */

export const detectBrowser = () => {
  const userAgent = navigator.userAgent.toLowerCase()
  
  return {
    isSafari: /safari/.test(userAgent) && !/chrome/.test(userAgent) && !/chromium/.test(userAgent),
    isWebKit: /webkit/.test(userAgent) && !/chrome/.test(userAgent),
    isChrome: /chrome/.test(userAgent) && !/edge/.test(userAgent),
    isEdge: /edge/.test(userAgent),
    isFirefox: /firefox/.test(userAgent),
    isMobile: /mobile|android|ios/.test(userAgent)
  }
}

export const getBrowserName = () => {
  const browser = detectBrowser()
  
  if (browser.isSafari) return 'Safari'
  if (browser.isChrome) return 'Chrome'
  if (browser.isEdge) return 'Edge'
  if (browser.isFirefox) return 'Firefox'
  return 'Unknown'
}

export const isSafariBrowser = () => {
  return detectBrowser().isSafari || detectBrowser().isWebKit
}

/**
 * Check if browser supports large blob downloads
 * Safari has issues with blob URLs but supports base64 DataURLs
 */
export const supportsLargeBlobDownload = () => {
  const browser = detectBrowser()
  
  // Safari and WebKit have known issues with large blob downloads
  if (browser.isSafari || browser.isWebKit) {
    return false
  }
  
  // Other browsers generally support large blobs
  return true
}

/**
 * Get maximum safe blob size for browser
 * Increased limits based on actual browser capabilities
 */
export const getMaxBlobSize = () => {
  const browser = detectBrowser()
  
  if (browser.isSafari || browser.isWebKit) {
    return 100 * 1024 * 1024 // 100MB limit for Safari base64 DataURL
  }
  
  return 1000 * 1024 * 1024 // 1GB limit for other browsers
}

/**
 * Safari-specific FFmpeg performance limits
 */
export const getSafariFFmpegLimits = () => {
  const browser = detectBrowser()
  
  if (browser.isSafari || browser.isWebKit) {
    return {
      maxSegments: 50,        // Maximum number of segments to process
      fsOperationDelay: 50,   // Delay between FS operations (ms)
      batchSize: 1,           // Process one segment at a time
      memoryCleanupInterval: 10, // Clean memory every N segments
      operationTimeout: 10000,   // Timeout for FS operations (ms)
      maxRetries: 3              // Maximum retry attempts
    }
  }
  
  return {
    maxSegments: 200,
    fsOperationDelay: 0,
    batchSize: 5,
    memoryCleanupInterval: 50,
    operationTimeout: 5000,
    maxRetries: 1
  }
}

/**
 * Safari-specific memory management
 */
export const forceSafariMemoryCleanup = async () => {
  const browser = detectBrowser()
  
  if (browser.isSafari || browser.isWebKit) {
    // Force garbage collection if available
    if (globalThis.gc) {
      globalThis.gc()
    }
    
    // Give Safari time to cleanup
    await new Promise(resolve => setTimeout(resolve, 100))
  }
}

/**
 * Safe FS operation wrapper with timeout and retry
 */
export const safeFSOperation = async (
  operation: () => any,
  timeout: number = 5000,
  retries: number = 1
): Promise<any> => {
  const browser = detectBrowser()
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await Promise.race([
        operation(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('FS operation timeout')), timeout)
        )
      ])
      
      // Add delay for Safari after successful operation
      if (browser.isSafari || browser.isWebKit) {
        await new Promise(resolve => setTimeout(resolve, 50))
      }
      
      return result
    } catch (error) {
      if (attempt === retries) {
        throw error
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }
}

export default {
  detectBrowser,
  getBrowserName,
  isSafariBrowser,
  supportsLargeBlobDownload,
  getMaxBlobSize,
  getSafariFFmpegLimits,
  forceSafariMemoryCleanup,
  safeFSOperation
}