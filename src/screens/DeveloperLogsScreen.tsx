import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { queryDebugLogs } from '../database/db';
import {
  clearNativeDebugLogs,
  getNativeDebugLogs,
} from '../modules/notificationListener';
import { DebugLog } from '../types';
import { AppTheme, useAppTheme } from '../theme/tokens';
import { clearPersistedDebugLogs } from '../utils/debugLogger';

interface DeveloperLogsScreenProps {
  visible: boolean;
  onClose: () => void;
}

export default function DeveloperLogsScreen({ visible, onClose }: DeveloperLogsScreenProps) {
  const theme = useAppTheme();
  const styles = createStyles(theme);
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async () => {
    setLoading(true);

    try {
      const [nativeLogs, databaseLogs] = await Promise.all([
        getNativeDebugLogs(),
        Promise.resolve(queryDebugLogs()),
      ]);
      setLogs(
        [...nativeLogs, ...databaseLogs]
          .sort((left, right) => right.timestamp.localeCompare(left.timestamp) || right.id - left.id)
          .slice(0, 200)
      );
    } catch (error) {
      setLogs([]);
      Alert.alert('读取日志失败', String(error));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      void loadLogs();
    }
  }, [loadLogs, visible]);

  const handleClear = () => {
    Alert.alert('清空开发者日志', '清空后无法恢复，确定继续吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '清空',
        style: 'destructive',
        onPress: () => {
          clearPersistedDebugLogs();
          clearNativeDebugLogs();
          setLogs([]);
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.header}>
          <Pressable
            style={styles.headerButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="关闭开发者日志"
          >
            <Ionicons name="arrow-back" size={22} color={theme.colors.text} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>开发者日志</Text>
            <Text style={styles.headerSubtitle}>通知导入链路，最近 200 条</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              style={styles.headerButton}
              onPress={() => void loadLogs()}
              accessibilityRole="button"
              accessibilityLabel="刷新开发者日志"
            >
              <Ionicons name="refresh-outline" size={22} color={theme.colors.primary} />
            </Pressable>
            <Pressable
              style={styles.headerButton}
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="清空开发者日志"
            >
              <Ionicons name="trash-outline" size={21} color={theme.colors.danger} />
            </Pressable>
          </View>
        </View>

        <View style={styles.hintCard}>
          <Ionicons name="information-circle-outline" size={20} color={theme.colors.primary} />
          <Text style={styles.hintText}>
            购买后打开此页并点击刷新。重点查看 native、parser、database 三类日志，能判断通知是否收到、金额是否解析成功以及是否因重复记录被跳过。
          </Text>
        </View>

        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {loading && <Text style={styles.statusText}>正在读取日志…</Text>}
          {!loading && logs.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="bug-outline" size={28} color={theme.colors.textTertiary} />
              <Text style={styles.emptyTitle}>暂时没有日志</Text>
              <Text style={styles.emptyText}>先返回首页等待一条通知，再回来刷新。</Text>
            </View>
          )}
          {logs.map(log => (
            <View key={`${log.source}-${log.id}-${log.timestamp}`} style={styles.logCard}>
              <View style={styles.logHeader}>
                <View style={styles.badgeRow}>
                  <Text style={styles.sourceBadge}>{log.source}</Text>
                  <Text
                    style={[
                      styles.levelBadge,
                      log.level === 'warn' && styles.levelBadgeWarn,
                      log.level === 'error' && styles.levelBadgeError,
                    ]}
                  >
                    {log.level}
                  </Text>
                </View>
                <Text style={styles.timestamp}>{formatTimestamp(log.timestamp)}</Text>
              </View>
              <Text style={styles.message}>{log.message}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return timestamp;
  }

  return date.toLocaleString();
}

function createStyles(theme: AppTheme) {
  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: theme.colors.background,
    },
    header: {
      minHeight: 64,
      paddingHorizontal: theme.spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    headerButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.radius.pill,
    },
    headerCopy: {
      flex: 1,
      marginLeft: theme.spacing.sm,
    },
    headerTitle: {
      color: theme.colors.text,
      fontSize: theme.typography.section,
      fontWeight: '700',
    },
    headerSubtitle: {
      marginTop: 2,
      color: theme.colors.textTertiary,
      fontSize: theme.typography.caption,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    hintCard: {
      margin: theme.spacing.lg,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: theme.spacing.sm,
      backgroundColor: theme.colors.primaryMuted,
    },
    hintText: {
      flex: 1,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption,
      lineHeight: 18,
    },
    container: {
      flex: 1,
    },
    contentContainer: {
      paddingHorizontal: theme.spacing.lg,
      paddingBottom: theme.spacing.xxxl,
    },
    statusText: {
      paddingVertical: theme.spacing.lg,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      fontSize: theme.typography.caption,
    },
    emptyState: {
      marginTop: theme.spacing.xxl,
      padding: theme.spacing.xxl,
      alignItems: 'center',
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
    },
    emptyTitle: {
      marginTop: theme.spacing.md,
      color: theme.colors.text,
      fontSize: theme.typography.body,
      fontWeight: '700',
    },
    emptyText: {
      marginTop: theme.spacing.xs,
      color: theme.colors.textSecondary,
      fontSize: theme.typography.caption,
    },
    logCard: {
      marginBottom: theme.spacing.sm,
      padding: theme.spacing.md,
      borderRadius: theme.radius.md,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    logHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing.sm,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.xs,
    },
    sourceBadge: {
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 3,
      borderRadius: theme.radius.pill,
      color: theme.colors.primary,
      backgroundColor: theme.colors.primaryMuted,
      fontSize: 11,
      fontWeight: '700',
    },
    levelBadge: {
      color: theme.colors.success,
      fontSize: 11,
      fontWeight: '700',
    },
    levelBadgeWarn: {
      color: theme.colors.warning,
    },
    levelBadgeError: {
      color: theme.colors.danger,
    },
    timestamp: {
      flexShrink: 1,
      color: theme.colors.textTertiary,
      fontSize: 10,
      textAlign: 'right',
    },
    message: {
      marginTop: theme.spacing.sm,
      color: theme.colors.text,
      fontSize: 12,
      lineHeight: 19,
    },
  });
}
