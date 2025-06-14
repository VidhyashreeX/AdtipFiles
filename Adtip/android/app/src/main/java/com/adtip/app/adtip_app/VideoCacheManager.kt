package com.adtip.app.adtip_app

import android.content.Context
import com.google.android.exoplayer2.database.StandaloneDatabaseProvider
import com.google.android.exoplayer2.upstream.cache.LeastRecentlyUsedCacheEvictor
import com.google.android.exoplayer2.upstream.cache.SimpleCache
import java.io.File

object VideoCacheManager {
    private var cache: SimpleCache? = null
    
    fun getInstance(context: Context): SimpleCache {
        if (cache == null) {
            val cacheDir = File(context.cacheDir, "exo_video_cache")
            val evictor = LeastRecentlyUsedCacheEvictor(200 * 1024 * 1024) // 200MB
            val databaseProvider = StandaloneDatabaseProvider(context)
            
            cache = SimpleCache(cacheDir, evictor, databaseProvider)
        }
        return cache!!
    }
}