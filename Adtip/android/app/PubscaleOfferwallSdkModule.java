package com.awesomeproject;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.util.Base64;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.Callback;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.ReadableType;
import com.facebook.react.module.annotations.ReactModule;

import com.pubscale.sdkone.offerwall.OfferWall;
import com.pubscale.sdkone.offerwall.OfferWallConfig;
import com.pubscale.sdkone.offerwall.models.OfferWallInitListener;
import com.pubscale.sdkone.offerwall.models.OfferWallListener;
import com.pubscale.sdkone.offerwall.models.Reward;
import com.pubscale.sdkone.offerwall.models.errors.InitError;

import java.util.HashMap;
import java.util.Map;

@ReactModule(name = PubscaleOfferwallSdkModule.NAME)
public class PubscaleOfferwallSdkModule extends ReactContextBaseJavaModule {
  public static final String NAME = "PubscaleOfferwall";
  public PubscaleOfferwallSdkModule(ReactApplicationContext reactContext) {
    super(reactContext);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }


  // Example method
  // See https://reactnative.dev/docs/native-modules-android



  @ReactMethod
  public void launch(Callback onClose, Callback onFailure) {

    getCurrentActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {
        OfferWall.launch(getCurrentActivity(), new OfferWallListener() {
          @Override
          public void onOfferWallShowed() {

          }

          @Override
          public void onOfferWallClosed() {
            if(onClose != null) {
              onClose.invoke();
            }
          }

          @Override
          public void onRewardClaimed(Reward reward) {

          }

          @Override
          public void onFailed(String s) {
            if(onFailure != null) {
              onFailure.invoke(s);
            }
          }
        });
      }
    });
  }

  @ReactMethod
  public void init(String appKey, ReadableMap parameters, Callback onSuccess, Callback onFailure) {

    String userId = parameters.getString("user_id");
    String backgroundBase64 = parameters.getString("background_Base64");
    String appIconBase64 = parameters.getString("appicon_Base64");

    getCurrentActivity().runOnUiThread(new Runnable() {
      @Override
      public void run() {

        OfferWall.destroy();

        OfferWallConfig.Builder config =    new OfferWallConfig.Builder(getReactApplicationContext(), appKey);

        config.setFullscreenEnabled(false);

        if ( userId  != null && !userId.equalsIgnoreCase(""))    {
          config.setUniqueId(userId);
        }

        if (backgroundBase64 != null && !backgroundBase64.equalsIgnoreCase(""))    {

          byte[] decodedString = Base64.decode(backgroundBase64, Base64.DEFAULT);
          Bitmap backgroundBitmap = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);

          config.setLoaderBackgroundBitmap(backgroundBitmap);
        }

        if (appIconBase64 != null && !appIconBase64.equalsIgnoreCase(""))    {

          byte[]  decodedString = Base64.decode(appIconBase64, Base64.DEFAULT);
          Bitmap appIconBitmap = BitmapFactory.decodeByteArray(decodedString, 0, decodedString.length);

          config.setLoaderForegroundBitmap(appIconBitmap);
        }

        OfferWallConfig offerWallConfig = config.build();

        OfferWall.init(offerWallConfig, new OfferWallInitListener() {
          @Override
          public void onInitSuccess() {

            if(onSuccess == null) {
              return;
            }

            onSuccess.invoke();
          }
          @Override
          public void onInitFailed(@NonNull InitError error) {

            if(onFailure == null) {
              return;
            }

            onFailure.invoke(error.getMessage());
          }
        });
      }//public void run() {
    });


  }
}
