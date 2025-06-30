// src/utils/debugUtils.ts
// Debug utilities for troubleshooting video playback issues

import { API_BASE_URL } from '../constants/api';
import { testVideoUrl, validateAndFixVideoUrl } from './mediaUtils';

/**
 * Debug video URLs and log detailed analysis
 */
export const debugVideoUrls = async (urls: string[], logPrefix: string = '[VideoDebug]'): Promise<void> => {
  console.log(`${logPrefix} Starting video URL debug for ${urls.length} URLs`);
  
  const results = [];
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    console.log(`${logPrefix} Testing URL ${i + 1}/${urls.length}: ${url}`);
    
    try {
      // Test the original URL
      const originalTest = await testVideoUrl(url);
      
      // Test the validated/fixed URL
      const validatedUrl = await validateAndFixVideoUrl(url);
      const validatedTest = validatedUrl ? await testVideoUrl(validatedUrl) : null;
      
      const result = {
        index: i + 1,
        originalUrl: url,
        validatedUrl: validatedUrl,
        originalTest: originalTest,
        validatedTest: validatedTest,
        isValid: originalTest.isValid || (validatedTest?.isValid ?? false)
      };
      
      results.push(result);
      
      console.log(`${logPrefix} URL ${i + 1} result:`, result);
      
    } catch (error) {
      console.error(`${logPrefix} Failed to test URL ${i + 1}:`, error);
      results.push({
        index: i + 1,
        originalUrl: url,
        error: error,
        isValid: false
      });
    }
  }
  
  // Summary
  const validCount = results.filter(r => r.isValid).length;
  const invalidCount = results.length - validCount;
  
  console.log(`${logPrefix} Summary: ${validCount} valid, ${invalidCount} invalid out of ${results.length} URLs`);
  
  if (invalidCount > 0) {
    console.log(`${logPrefix} Invalid URLs:`, results.filter(r => !r.isValid));
  }
};

/**
 * Test a single video URL with detailed logging
 */
export const debugSingleVideoUrl = async (url: string): Promise<{
  isValid: boolean;
  details: any;
  recommendations: string[];
}> => {
  const recommendations: string[] = [];
  
  console.log('[VideoDebug] Testing single URL:', url);
  
  if (!url) {
    recommendations.push('URL is empty or null');
    return { isValid: false, details: { error: 'No URL provided' }, recommendations };
  }
  
  // Check URL format
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (!url.startsWith('/')) {
      recommendations.push('URL should start with / for relative paths');
    }
    recommendations.push('URL will be converted to: ' + API_BASE_URL + (url.startsWith('/') ? '' : '/') + url);
  }
  
  // Check for video file extensions
  const videoExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.m4v'];
  const hasVideoExtension = videoExtensions.some(ext => url.toLowerCase().includes(ext));
  
  if (!hasVideoExtension) {
    recommendations.push('URL does not contain a common video file extension');
  }
  
  try {
    const testResult = await testVideoUrl(url);
    
    const details = {
      originalUrl: url,
      testResult: testResult,
      hasVideoExtension: hasVideoExtension,
      isAbsoluteUrl: url.startsWith('http://') || url.startsWith('https://'),
      baseUrl: API_BASE_URL
    };
    
    if (!testResult.isValid) {
      if (testResult.status === 404) {
        recommendations.push('Video file not found (404). Check if the file exists on the server.');
      } else if (testResult.status === 403) {
        recommendations.push('Access forbidden (403). Check authentication or file permissions.');
      } else if (testResult.status === 500) {
        recommendations.push('Server error (500). Contact backend team.');
      } else {
        recommendations.push(`HTTP error ${testResult.status}: ${testResult.error}`);
      }
    }
    
    return {
      isValid: testResult.isValid,
      details: details,
      recommendations: recommendations
    };
    
  } catch (error) {
    recommendations.push('Network error or timeout occurred');
    return {
      isValid: false,
      details: { error: error },
      recommendations: recommendations
    };
  }
};

/**
 * Generate a debug report for video playback issues
 */
export const generateVideoDebugReport = async (postData: any[]): Promise<string> => {
  const videoUrls = postData
    .filter(post => post.media_type === 'video' && post.media_url)
    .map(post => ({ id: post.id, url: post.media_url }));
    
  if (videoUrls.length === 0) {
    return 'No video posts found in the data.';
  }
  
  console.log('[VideoDebug] Generating debug report for', videoUrls.length, 'videos');
  
  const results = [];
  
  for (const { id, url } of videoUrls) {
    const debugResult = await debugSingleVideoUrl(url);
    results.push({ postId: id, url, ...debugResult });
  }
  
  const validVideos = results.filter(r => r.isValid);
  const invalidVideos = results.filter(r => !r.isValid);
  
  let report = `VIDEO DEBUG REPORT\n`;
  report += `==================\n\n`;
  report += `Total videos checked: ${results.length}\n`;
  report += `Valid videos: ${validVideos.length}\n`;
  report += `Invalid videos: ${invalidVideos.length}\n\n`;
  
  if (invalidVideos.length > 0) {
    report += `INVALID VIDEOS:\n`;
    report += `---------------\n`;
    
    for (const video of invalidVideos) {
      report += `Post ID: ${video.postId}\n`;
      report += `URL: ${video.url}\n`;
      report += `Recommendations:\n`;
      video.recommendations.forEach((rec: string) => {
        report += `  - ${rec}\n`;
      });
      report += `\n`;
    }
  }
  
  if (validVideos.length > 0) {
    report += `VALID VIDEOS:\n`;
    report += `-------------\n`;
    validVideos.forEach(video => {
      report += `Post ID: ${video.postId} - ${video.url}\n`;
    });
  }
  
  console.log(report);
  return report;
}; 