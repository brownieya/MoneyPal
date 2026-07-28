package com.moneypal

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONObject

class PaymentNotificationListenerService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null) {
      DebugLogStore.append(applicationContext, "native", "warn", "onNotificationPosted received null notification")
      return
    }

    val packageName = sbn.packageName.orEmpty()
    val notification = sbn.notification ?: run {
      DebugLogStore.append(applicationContext, "native", "warn", "notification object missing package=$packageName")
      return
    }
    val extras = notification.extras ?: run {
      DebugLogStore.append(applicationContext, "native", "warn", "notification extras missing package=$packageName")
      return
    }
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim().orEmpty()
    val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim().orEmpty()
    val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()?.trim().orEmpty()
    val body = listOf(title, bigText.ifBlank { text })
      .filter { it.isNotBlank() }
      .joinToString("\n")

    val matchesExpense = looksLikeExpense(packageName, body)
    DebugLogStore.append(
      applicationContext,
      "native",
      "info",
      "notification posted package=$packageName accepted=$matchesExpense body=${preview(body)}"
    )

    if (!matchesExpense) {
      return
    }

    val payload = JSONObject().apply {
      put("externalId", "$packageName:${sbn.id}:${sbn.postTime}")
      put("packageName", packageName)
      put("title", title)
      put("text", if (bigText.isNotBlank()) bigText else text)
      put("postedAt", java.time.Instant.ofEpochMilli(sbn.postTime).toString())
    }

    try {
      PendingNotificationStore.enqueue(applicationContext, payload)
      DebugLogStore.append(
        applicationContext,
        "native",
        "info",
        "notification queued externalId=${payload.getString("externalId")}"
      )
      PaymentNotificationModule.emitNotification(payload)
      DebugLogStore.append(applicationContext, "native", "info", "notification event dispatch attempted to JS")
    } catch (error: Exception) {
      DebugLogStore.append(
        applicationContext,
        "native",
        "error",
        "notification queue or JS dispatch failed error=${error.message ?: error::class.java.simpleName}"
      )
    }
  }

  private fun preview(value: String): String {
    return value.replace('\n', ' ').take(180)
  }

  private fun looksLikeExpense(packageName: String, content: String): Boolean {
    if (content.isBlank()) {
      return false
    }

    val normalized = content.lowercase()
    val includeKeywords = listOf(
      "支付",
      "付款",
      "消费",
      "支出",
      "扣款",
      "交易成功",
      "已支付",
      "微信支付",
      "支付宝",
      "bill",
      "paid",
      "purchase",
      "debit",
    )
    val excludeKeywords = listOf("收款", "到账", "收入", "退款", "入账")
    val trustedPackages = setOf(
      "com.tencent.mm",
      "com.eg.android.AlipayGphone",
      "com.unionpay",
      "com.tencent.mobileqq",
    )
    val hasAmount = Regex("""(?:¥|￥|人民币|RMB|CNY)?\s*\d+(?:\.\d{1,2})?\s*(?:元)?""")
      .containsMatchIn(content)
    val matchesKeyword = includeKeywords.any(normalized::contains)
    val matchesTrustedPackage = packageName in trustedPackages

    return hasAmount &&
      (matchesKeyword || matchesTrustedPackage) &&
      excludeKeywords.none(content::contains)
  }
}
