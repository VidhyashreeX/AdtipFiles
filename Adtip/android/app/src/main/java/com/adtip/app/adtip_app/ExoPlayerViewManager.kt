package com.adtip.app.adtip_app

import android.content.Context
import android.net.Uri
import android.view.ViewGroup
import com.facebook.react.bridge.*
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.google.android.exoplayer2.*
import com.google.android.exoplayer2.source.MediaSource
import com.google.android.exoplayer2.source.ProgressiveMediaSource
import com.google.android.exoplayer2.source.hls.HlsMediaSource
import com.google.android.exoplayer2.ui.StyledPlayerView
import com.google.android.exoplayer2.upstream.DefaultDataSource
import com.google.android.exoplayer2.upstream.cache.CacheDataSource

class ExoPlayerViewManager : SimpleViewManager<StyledPlayerView>(), LifecycleEventListener {
    
    companion object {
        const val REACT_CLASS = "ExoPlayerView"
    }

    override fun getName(): String = REACT_CLASS

    override fun createViewInstance(reactContext: ThemedReactContext): StyledPlayerView {
        return StyledPlayerView(reactContext).apply {
            useController = false
            layoutParams = ViewGroup.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT
            )
        }
    }

    @ReactProp(name = "source")
    fun setSource(view: StyledPlayerView, source: ReadableMap?) {
        if (source == null) return
        
        val uri = source.getString("uri") ?: return
        val context = view.context
        
        // Create ExoPlayer instance
        val player = ExoPlayer.Builder(context)
            .setLoadControl(
                DefaultLoadControl.Builder()
                    .setBufferDurationsMs(
                        15000,  // Min buffer
                        50000,  // Max buffer
                        1500,   // Buffer for playback
                        5000    // Buffer for playback after rebuffer
                    )
                    .build()
            )
            .build()

        // Create data source factory with cache
        val cacheDataSourceFactory = CacheDataSource.Factory()
            .setCache(VideoCacheManager.getInstance(context))
            .setUpstreamDataSourceFactory(DefaultDataSource.Factory(context))
            .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)

        // Create media source
        val mediaSource: MediaSource = if (uri.contains(".m3u8")) {
            HlsMediaSource.Factory(cacheDataSourceFactory)
                .createMediaSource(MediaItem.fromUri(Uri.parse(uri)))
        } else {
            ProgressiveMediaSource.Factory(cacheDataSourceFactory)
                .createMediaSource(MediaItem.fromUri(Uri.parse(uri)))
        }

        player.setMediaSource(mediaSource)
        player.prepare()
        view.player = player
    }

    @ReactProp(name = "paused", defaultBoolean = true)
    fun setPaused(view: StyledPlayerView, paused: Boolean) {
        view.player?.playWhenReady = !paused
    }

    @ReactProp(name = "muted", defaultBoolean = false)
    fun setMuted(view: StyledPlayerView, muted: Boolean) {
        view.player?.volume = if (muted) 0f else 1f
    }

    @ReactProp(name = "preload", defaultBoolean = false)
    fun setPreload(view: StyledPlayerView, preload: Boolean) {
        if (preload) {
            view.player?.prepare()
        }
    }

    override fun onDropViewInstance(view: StyledPlayerView) {
        view.player?.release()
        super.onDropViewInstance(view)
    }

    override fun onHostResume() {}
    override fun onHostPause() {}
    override fun onHostDestroy() {}
}