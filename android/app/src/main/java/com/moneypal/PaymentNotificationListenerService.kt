package com.moneypal

import android.app.Notification
import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import org.json.JSONObject

class PaymentNotificationListenerService : NotificationListenerService() {
  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    if (sbn == null) {
      return
    }

    val notification = sbn.notification ?: return
    val extras = notification.extras ?: return
    val title = extras.getCharSequence(Notification.EXTRA_TITLE)?.toString()?.trim().orEmpty()
    val text = extras.getCharSequence(Notification.EXTRA_TEXT)?.toString()?.trim().orEmpty()
    val bigText = extras.getCharSequence(Notification.EXTRA_BIG_TEXT)?.toString()?.trim().orEmpty()
    val body = listOf(title, bigText.ifBlank { text })
      .filter { it.isNotBlank() }
      .joinToString("\n")

    if (!looksLikeExpense(body)) {
      return
    }

    val payload = JSONObject().apply {
      put("externalId", "${sbn.packageName}:${sbn.id}:${sbn.postTime}")
      put("packageName", sbn.packageName)
      put("title", title)
      put("text", if (bigText.isNotBlank()) bigText else text)
      put("postedAt", java.time.Instant.ofEpochMilli(sbn.postTime).toString())
    }

    PendingNotificationStore.enqueue(applicationContext, payload)
    PaymentNotificationModule.emitNotification(payload)
  }

  private fun looksLikeExpense(content: String): Boolean {
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
    )
    val excludeKeywords = listOf("收款", "到账", "收入", "退款", "入账")
    val hasAmount = Regex("""(?:￥|¥|\d+\.\d{1,2}\s*元)""").containsMatchIn(content)

    return hasAmount &&
      includeKeywords.any(normalized::contains) &&
      excludeKeywords.none(content::contains)
  }
}
