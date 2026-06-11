package com.moneypal

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object PendingNotificationStore {
  private const val PREFS_NAME = "money_pal_notifications"
  private const val KEY_PENDING = "pending"
  private const val MAX_ITEMS = 50

  @Synchronized
  fun enqueue(context: Context, payload: JSONObject) {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val current = prefs.getString(KEY_PENDING, "[]") ?: "[]"
    val items = JSONArray(current)

    items.put(payload)

    val trimmed = JSONArray()
    val startIndex = maxOf(0, items.length() - MAX_ITEMS)
    for (index in startIndex until items.length()) {
      trimmed.put(items.getJSONObject(index))
    }

    prefs.edit().putString(KEY_PENDING, trimmed.toString()).apply()
  }

  @Synchronized
  fun consume(context: Context): JSONArray {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    val current = prefs.getString(KEY_PENDING, "[]") ?: "[]"
    prefs.edit().remove(KEY_PENDING).apply()
    return JSONArray(current)
  }
}
