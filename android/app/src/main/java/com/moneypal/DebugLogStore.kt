package com.moneypal

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

object DebugLogStore {
  private const val PREFS_NAME = "money_pal_debug_logs"
  private const val KEY_LOGS = "logs"
  private const val MAX_ITEMS = 200

  @Synchronized
  fun append(context: Context, source: String, level: String, message: String) {
    try {
      val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      val current = prefs.getString(KEY_LOGS, "[]") ?: "[]"
      val items = JSONArray(current)
      items.put(
        JSONObject().apply {
          put("id", System.currentTimeMillis())
          put("timestamp", java.time.Instant.now().toString())
          put("source", source)
          put("level", level)
          put("message", message)
        }
      )

      val trimmed = JSONArray()
      val startIndex = maxOf(0, items.length() - MAX_ITEMS)
      for (index in startIndex until items.length()) {
        trimmed.put(items.getJSONObject(index))
      }

      prefs.edit().putString(KEY_LOGS, trimmed.toString()).apply()
    } catch (_: Exception) {
      // Logging must never interrupt notification handling.
    }
  }

  @Synchronized
  fun read(context: Context): JSONArray {
    val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
    return JSONArray(prefs.getString(KEY_LOGS, "[]") ?: "[]")
  }

  @Synchronized
  fun clear(context: Context) {
    context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
      .edit()
      .remove(KEY_LOGS)
      .apply()
  }
}
