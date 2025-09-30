import React, { useState, useEffect } from 'react';
import { userAPI, contentAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const DataSyncTest = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const runDataSyncTest = async () => {
    setLoading(true);
    const results: any = {};
    
    try {
      const userId = localStorage.getItem('UserId');
      if (!userId) {
        results.error = 'No user ID found in localStorage';
        setTestResults(results);
        setLoading(false);
        return;
      }

      results.userId = userId;
      results.tests = {};

      // Test 1: Channel data
      try {
        const channelResponse = await userAPI.getChannel(userId);
        results.tests.channel = {
          status: channelResponse.status,
          success: channelResponse.data?.status,
          data: channelResponse.data?.data,
          structure: channelResponse.data?.data ? Object.keys(channelResponse.data.data[0] || channelResponse.data.data) : null
        };
      } catch (error: any) {
        results.tests.channel = {
          error: error.message,
          status: error.response?.status
        };
      }

      // Test 2: Videos data (old vs new endpoint)
      try {
        const videosOld = await contentAPI.getVideos(userId, "0", "1");
        results.tests.videosOld = {
          status: videosOld.status,
          success: videosOld.data?.status,
          count: videosOld.data?.data?.length || 0,
          endpoint: '/api/getvideos'
        };
      } catch (error: any) {
        results.tests.videosOld = {
          error: error.message,
          status: error.response?.status
        };
      }

      try {
        const videosNew = await contentAPI.getUserVideos(userId);
        results.tests.videosNew = {
          status: videosNew.status,
          success: videosNew.data?.status,
          count: videosNew.data?.data?.length || 0,
          endpoint: '/api/getrecentlyuploadedvideo',
          sample: videosNew.data?.data?.[0] ? {
            id: videosNew.data.data[0].id,
            name: videosNew.data.data[0].name,
            thumbnail: videosNew.data.data[0].video_Thumbnail,
            hasThumbail: !!videosNew.data.data[0].video_Thumbnail
          } : null
        };
      } catch (error: any) {
        results.tests.videosNew = {
          error: error.message,
          status: error.response?.status
        };
      }

      // Test 3: Shorts data
      try {
        const shortsResponse = await contentAPI.getUserShorts(userId);
        results.tests.shorts = {
          status: shortsResponse.status,
          success: shortsResponse.data?.status,
          count: shortsResponse.data?.data?.length || 0,
          sample: shortsResponse.data?.data?.[0] ? {
            id: shortsResponse.data.data[0].id,
            name: shortsResponse.data.data[0].name,
            thumbnail: shortsResponse.data.data[0].video_Thumbnail,
            hasThumbail: !!shortsResponse.data.data[0].video_Thumbnail
          } : null
        };
      } catch (error: any) {
        results.tests.shorts = {
          error: error.message,
          status: error.response?.status
        };
      }

      // Test 4: Analytics (if channel exists)
      if (results.tests.channel?.data) {
        const channelData = Array.isArray(results.tests.channel.data) 
          ? results.tests.channel.data[0] 
          : results.tests.channel.data;
        const channelId = channelData?.id || channelData?.channelId;
        
        if (channelId) {
          try {
            const analyticsResponse = await userAPI.getAnalytics(String(channelId));
            results.tests.analytics = {
              status: analyticsResponse.status,
              success: analyticsResponse.data?.status,
              data: analyticsResponse.data?.data,
              channelId: channelId
            };
          } catch (error: any) {
            results.tests.analytics = {
              error: error.message,
              status: error.response?.status,
              channelId: channelId
            };
          }
        }
      }

      // Test 5: Comprehensive data fetch
      try {
        const completeData = await userAPI.getUserCompleteData(userId);
        results.tests.comprehensive = {
          success: true,
          channelExists: !!completeData.channel,
          videosCount: completeData.videos?.length || 0,
          shortsCount: completeData.shorts?.length || 0,
          postsCount: completeData.posts?.length || 0,
          errors: completeData.errors
        };
      } catch (error: any) {
        results.tests.comprehensive = {
          error: error.message,
          status: error.response?.status
        };
      }

    } catch (error: any) {
      results.generalError = error.message;
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Data Synchronization Test</CardTitle>
          <p className="text-sm text-gray-600">
            This component tests all API endpoints to identify data sync issues between mobile and web.
          </p>
        </CardHeader>
        <CardContent>
          <Button onClick={runDataSyncTest} disabled={loading}>
            {loading ? 'Running Tests...' : 'Run Data Sync Test'}
          </Button>
          
          {testResults && Object.keys(testResults).length > 0 && (
            <div className="mt-4">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto max-h-96">
                {JSON.stringify(testResults, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSyncTest;