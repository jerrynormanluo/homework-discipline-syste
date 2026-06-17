import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  BackHandler,
  Modal,
} from 'react-native';
import { focusService } from '../services/focusService';
import KeepAwake from 'react-native-keep-awake';
import colors from '../constants/colors';

const FocusModeScreen = ({ route, navigation }) => {
  const { sessionId } = route.params;
  const [session, setSession] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isBreak, setIsBreak] = useState(false);
  const [breakTimeRemaining, setBreakTimeRemaining] = useState(0);
  const [exitModalVisible, setExitModalVisible] = useState(false);

  const loadSession = useCallback(async () => {
    try {
      const sessions = await focusService.getFocusSessions();
      const currentSession = sessions.find(s => s.id === sessionId);
      if (currentSession) {
        setSession(currentSession);
        const endTime = new Date(currentSession.start_time).getTime() + currentSession.planned_duration * 60000;
        const remaining = Math.max(0, endTime - Date.now());
        setTimeRemaining(Math.floor(remaining / 1000));
      }
    } catch (error) {
      console.error('加载专注会话失败:', error);
    }
  }, [sessionId]);

  useEffect(() => {
    loadSession();
    KeepAwake.activate();

    const timer = setInterval(() => {
      if (!isBreak) {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // 专注时间结束，开始休息
            setIsBreak(true);
            setBreakTimeRemaining(5 * 60); // 5分钟休息
            return 0;
          }
          return prev - 1;
        });
      } else {
        setBreakTimeRemaining(prev => {
          if (prev <= 1) {
            // 休息结束，可以退出或继续
            Alert.alert('休息结束', '休息时间已结束，是否继续专注？', [
              { text: '退出', onPress: () => handleExit() },
              { text: '继续', onPress: () => handleContinueFocus() }
            ]);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    // 监听家长强制专注
    const handleForceFocus = (data) => {
      if (data.session?.student_id === session?.student_id) {
        Alert.alert('专注提醒', '家长已为您开启专注模式');
        loadSession();
      }
    };

    return () => {
      clearInterval(timer);
      KeepAwake.deactivate();
    };
  }, [sessionId, isBreak, session, loadSession]);

  const handleExit = async () => {
    try {
      await focusService.endFocus(sessionId);
      navigation.goBack();
    } catch (error) {
      Alert.alert('退出失败', error.error || '请稍后重试');
    }
  };

  const handleContinueFocus = async () => {
    try {
      const newSession = await focusService.startFocus(session.homework_id, session.planned_duration);
      setSession(newSession);
      setIsBreak(false);
      setTimeRemaining(newSession.planned_duration * 60);
    } catch (error) {
      Alert.alert('启动失败', error.error || '请稍后重试');
    }
  };

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setExitModalVisible(true);
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isBreak ? '休息时间' : '专注模式'}
        </Text>
      </View>

      <View style={styles.content}>
        <View style={styles.timerContainer}>
          <Text style={styles.timer}>
            {formatTime(isBreak ? breakTimeRemaining : timeRemaining)}
          </Text>
          <Text style={styles.timerLabel}>
            {isBreak ? '剩余休息时间' : '剩余专注时间'}
          </Text>
        </View>

        {!isBreak && session && (
          <View style={styles.infoContainer}>
            <Text style={styles.infoText}>
              已专注: {formatTime(Math.floor((Date.now() - new Date(session.start_time).getTime()) / 1000))}
            </Text>
            <Text style={styles.infoText}>
              计划: {session.planned_duration}分钟
            </Text>
          </View>
        )}

        {isBreak && (
          <View style={styles.breakTips}>
            <Text style={styles.breakTipTitle}>休息建议</Text>
            <Text style={styles.breakTip}>• 站起来活动一下身体</Text>
            <Text style={styles.breakTip}>• 远眺放松眼睛</Text>
            <Text style={styles.breakTip}>• 喝杯水补充水分</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {!isBreak ? (
          <TouchableOpacity
            style={styles.exitButton}
            onPress={() => setExitModalVisible(true)}
          >
            <Text style={styles.exitButtonText}>结束专注</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.skipBreakButton}
            onPress={() => handleContinueFocus()}
          >
            <Text style={styles.skipBreakButtonText}>跳过休息</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={exitModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setExitModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>确认退出？</Text>
            <Text style={styles.modalText}>
              退出专注模式将结束本次专注记录，确定要退出吗？
            </Text>
            <TouchableOpacity
              style={[styles.modalButton, styles.confirmButton]}
              onPress={() => {
                setExitModalVisible(false);
                handleExit();
              }}
            >
              <Text style={styles.modalButtonText}>确认退出</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setExitModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>继续专注</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    backgroundColor: colors.surface,
    padding: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  timer: {
    fontSize: 72,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: 8,
  },
  timerLabel: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  infoText: {
    fontSize: 18,
    color: colors.text,
    marginBottom: 8,
  },
  breakTips: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 24,
    width: '100%',
  },
  breakTipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 16,
    textAlign: 'center',
  },
  breakTip: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 24,
  },
  footer: {
    padding: 24,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  exitButton: {
    backgroundColor: colors.error,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  exitButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  skipBreakButton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  skipBreakButtonText: {
    color: colors.surface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalButton: {
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  confirmButton: {
    backgroundColor: colors.error,
  },
  cancelButton: {
    backgroundColor: colors.background,
  },
  modalButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default FocusModeScreen;
