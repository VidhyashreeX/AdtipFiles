// adtip-reactnative/Adtip/src/utils/VideoPlaybackDebugger.ts
// Debug utility for video playback issues

import { VideoPlaybackService, VideoMetadata } from '../services/VideoPlaybackService';

export class VideoPlaybackDebugger {
  private static instance: VideoPlaybackDebugger;
  private service: VideoPlaybackService;

  private constructor() {
    this.service = VideoPlaybackService.getInstance();
  }

  public static getInstance(): VideoPlaybackDebugger {
    if (!VideoPlaybackDebugger.instance) {
      VideoPlaybackDebugger.instance = new VideoPlaybackDebugger();
    }
    return VideoPlaybackDebugger.instance;
  }

  /**
   * Analyze video data and identify potential playback issues
   */
  public analyzeVideo(video: VideoMetadata): {
    canPlay: boolean;
    issues: string[];
    recommendations: string[];
    debugInfo: object;
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check basic video data
    if (!video.id) {
      issues.push('Missing video ID');
    }

    if (!video.video_link) {
      issues.push('Missing video_link');
      recommendations.push('Ensure video has a valid R2 URL as fallback');
    } else if (!video.video_link.includes('theadtip.in')) {
      issues.push('Invalid video_link domain');
      recommendations.push('Video link should point to theadtip.in domain');
    }

    // Check Cloudflare Stream data
    if (video.stream_video_id) {
      if (!this.service.isValidStreamVideoId(video.stream_video_id)) {
        issues.push('Invalid stream_video_id format');
        recommendations.push('Stream video ID should be a 32-character hex string');
      }

      if (!video.stream_status) {
        issues.push('Missing stream_status');
        recommendations.push('Stream status should be set (uploading/ready/error/inprogress)');
      } else if (video.stream_status !== 'ready') {
        issues.push(`Stream not ready (status: ${video.stream_status})`);
        if (video.stream_status === 'uploading' || video.stream_status === 'inprogress') {
          recommendations.push('Wait for stream processing to complete');
        } else if (video.stream_status === 'error') {
          recommendations.push('Re-upload video to Cloudflare Stream');
        }
      }

      if (video.stream_status === 'ready' && !video.stream_ready_at) {
        issues.push('Missing stream_ready_at timestamp');
      }
    }

    const debugInfo = this.service.getDebugInfo(video);
    const canPlay = this.service.supportsStreamPlayback(video) || !!video.video_link;

    if (!canPlay) {
      issues.push('No valid playback source available');
      recommendations.push('Ensure video has either valid Stream data or R2 fallback URL');
    }

    return {
      canPlay,
      issues,
      recommendations,
      debugInfo
    };
  }

  /**
   * Test video playback configuration
   */
  public testPlaybackConfig(video: VideoMetadata): {
    config: any;
    analysis: any;
  } {
    const analysis = this.analyzeVideo(video);
    const config = this.service.getPlaybackConfig(video);

    console.log('[VideoPlaybackDebugger] Test results:', {
      videoId: video.id,
      analysis,
      config
    });

    return { config, analysis };
  }

  /**
   * Generate a comprehensive report for debugging
   */
  public generateReport(videos: VideoMetadata[]): {
    summary: {
      total: number;
      playable: number;
      streamReady: number;
      hasIssues: number;
    };
    issues: { [key: string]: number };
    videos: Array<{
      id: number;
      canPlay: boolean;
      issues: string[];
      config: any;
    }>;
  } {
    const summary = {
      total: videos.length,
      playable: 0,
      streamReady: 0,
      hasIssues: 0
    };

    const issueCount: { [key: string]: number } = {};
    const videoReports: Array<{
      id: number;
      canPlay: boolean;
      issues: string[];
      config: any;
    }> = [];

    videos.forEach(video => {
      const analysis = this.analyzeVideo(video);
      const config = this.service.getPlaybackConfig(video);

      if (analysis.canPlay) summary.playable++;
      if (this.service.supportsStreamPlayback(video)) summary.streamReady++;
      if (analysis.issues.length > 0) summary.hasIssues++;

      analysis.issues.forEach(issue => {
        issueCount[issue] = (issueCount[issue] || 0) + 1;
      });

      videoReports.push({
        id: video.id,
        canPlay: analysis.canPlay,
        issues: analysis.issues,
        config
      });
    });

    const report = {
      summary,
      issues: issueCount,
      videos: videoReports
    };

    console.log('[VideoPlaybackDebugger] Generated report:', report);
    return report;
  }
}

export default VideoPlaybackDebugger;
