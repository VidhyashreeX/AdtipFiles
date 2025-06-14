package com.adtip.app.adtip_app

import android.net.Uri
import com.facebook.react.bridge.*
import com.google.android.exoplayer2.*
import com.google.android.exoplayer2.source.hls.HlsMediaSource
import com.google.android.exoplayer2.source.ProgressiveMediaSource
import com.google.android.exoplayer2.upstream.DefaultDataSource
import com.google.android.exoplayer2.upstream.cache.CacheDataSource

@ReactModule(name = "ExoPlayerPreloader")
class ExoPlayerPreloader(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    override fun getName(): String = "ExoPlayerPreloader"
    
    @ReactMethod
    fun preloadVideo(url: String) {
        val context = reactApplicationContext
        
        // Create a background player for preloading
        val preloadPlayer = ExoPlayer.Builder(context).build()
        
        val cacheDataSourceFactory = CacheDataSource.Factory()
            .setCache(VideoCacheManager.getInstance(context))
            .setUpstreamDataSourceFactory(DefaultDataSource.Factory(context))
            .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)

        val mediaSource = if (url.contains(".m3u8")) {
            HlsMediaSource.Factory(cacheDataSourceFactory)
                .createMediaSource(MediaItem.fromUri(Uri.parse(url)))
        } else {
            ProgressiveMediaSource.Factory(cacheDataSourceFactory)
                .createMediaSource(MediaItem.fromUri(Uri.parse(url)))
        }

        preloadPlayer.setMediaSource(mediaSource)
        preloadPlayer.prepare()
        
        // Listen for ready state and then release
        preloadPlayer.addListener(object : Player.Listener {
            override fun onPlaybackStateChanged(playbackState: Int) {
                if (playbackState == Player.STATE_READY || playbackState == Player.STATE_ENDED) {
                    preloadPlayer.release()
                }
            }
        })
    }
}