package com.moneypal

import android.content.Intent
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import org.json.JSONArray
import org.json.JSONObject

class PaymentNotificationModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext) {

  init {
    instance = this
  }

  override fun getName(): String = "PaymentNotificationModule"

  @ReactMethod
  fun isNotificationAccessEnabled(promise: Promise) {
    val enabledPackages = NotificationManagerCompat.getEnabledListenerPackages(reactContext)
    promise.resolve(enabledPackages.contains(reactContext.packageName))
  }

  @ReactMethod
  fun openNotificationAccessSettings() {
    val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS).apply {
      addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    reactContext.startActivity(intent)
  }

  @ReactMethod
  fun consumePendingNotifications(promise: Promise) {
    val pending = PendingNotificationStore.consume(reactContext)
    promise.resolve(jsonArrayToReadableArray(pending))
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Required by NativeEventEmitter on newer React Native versions.
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Required by NativeEventEmitter on newer React Native versions.
  }

  override fun invalidate() {
    if (instance === this) {
      instance = null
    }
    super.invalidate()
  }

  private fun emitEvent(eventName: String, payload: JSONObject) {
    if (!reactContext.hasActiveReactInstance()) {
      return
    }

    reactContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, jsonObjectToWritableMap(payload))
  }

  companion object {
    @Volatile
    private var instance: PaymentNotificationModule? = null

    fun emitNotification(payload: JSONObject) {
      instance?.emitEvent("paymentNotificationReceived", payload)
    }
  }
}

private fun jsonArrayToReadableArray(array: JSONArray): ReadableArray {
  val result = Arguments.createArray()
  for (index in 0 until array.length()) {
    result.pushMap(jsonObjectToWritableMap(array.getJSONObject(index)))
  }
  return result
}

private fun jsonObjectToWritableMap(jsonObject: JSONObject): WritableMap {
  val map = Arguments.createMap()
  val iterator = jsonObject.keys()

  while (iterator.hasNext()) {
    val key = iterator.next()
    val value = jsonObject.get(key)
    when (value) {
      is String -> map.putString(key, value)
      is Int -> map.putInt(key, value)
      is Long -> map.putDouble(key, value.toDouble())
      is Double -> map.putDouble(key, value)
      is Boolean -> map.putBoolean(key, value)
      else -> map.putString(key, value.toString())
    }
  }

  return map
}
