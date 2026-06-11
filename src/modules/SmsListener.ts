/**
 * 短信监听模块
 *
 * 这里是 JS 侧的桥接层，对应的原生模块需要在
 * android/app/src/main/java/com/moneypal/SmsReceiverModule.kt 实现。
 *
 * 目前提供 mock 接口，原生模块接入后直接替换 NativeModules 调用即可。
 */
import { NativeModules, NativeEventEmitter } from 'react-native';
import { matchCategory, extractAmount } from '../utils/categoryMatcher';
import { insertTransaction } from '../database/db';

const { SmsReceiver } = NativeModules;

let emitter: NativeEventEmitter | null = null;

export function startSmsListener() {
  if (!SmsReceiver) {
    console.warn('[SmsListener] 原生模块 SmsReceiver 未找到，请确认已完成原生模块开发');
    return;
  }

  emitter = new NativeEventEmitter(SmsReceiver);
  emitter.addListener('onSmsReceived', (sms: { body: string; address: string }) => {
    const { body } = sms;

    // 过滤非支付短信（只处理包含"消费"/"扣款"/"付款"等关键词的）
    const isPayment = /消费|扣款|付款|支出|转账/.test(body);
    if (!isPayment) return;

    const amount = extractAmount(body);
    if (!amount) return;

    const category = matchCategory(body);
    insertTransaction({
      amount,
      category,
      note: '',
      source: 'sms',
      raw: body,
      createdAt: new Date().toISOString(),
    });
    console.log('[SmsListener] 自动记录：', amount / 100, '元，分类：', category);
  });

  SmsReceiver.startListening?.();
}

export function stopSmsListener() {
  emitter?.removeAllListeners('onSmsReceived');
  SmsReceiver?.stopListening?.();
}
