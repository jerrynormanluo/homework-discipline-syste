import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
} from 'react-native';
import { homeworkService } from '../services/homeworkService';
import { focusService } from '../services/focusService';
import { dateUtils } from '../utils/dateUtils';
import { pinyinUtils } from '../utils/pinyinUtils';
import { voiceService } from '../services/voiceService';
import colors from '../constants/colors';

const HomeworkDetailScreen = ({ route, navigation }) => {
  const { homeworkId } = route.params;
  const [homework, setHomework] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPinyin, setShowPinyin] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [focusModalVisible, setFocusModalVisible] = useState(false);
  const [focusDuration, setFocusDuration] = useState(25);

  const loadHomework = useCallback(async () => {
    try {
      setLoading(true);
      const data = await homeworkService.getHomeworkDetail(homeworkId);
      setHomework(data);
    } catch (error) {
      Alert.alert('加载失败', error.error || '请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [homeworkId]);

  useEffect(() => {
    loadHomework();
    voiceService.init();
  }, [loadHomework]);

  const handleStatusChange = async (newStatus) => {
    try {
      await homeworkService.updateHomeworkStatus(homeworkId, newStatus);
      await loadHomework();
    } catch (error) {
      Alert.alert('操作失败', error.error || '请稍后重试');
    }
  };

  const handleVoiceToggle = async () => {
    if (isSpeaking) {
      await voiceService.stop();
      setIsSpeaking(false);
    } else {
      const text = `${homework.title}。${homework.content || ''}。截止时间${dateUtils.formatDateTime(homework.deadline)}`;
      await voiceService.speak(text);
      setIsSpeaking(true);
      
      // 监听播放结束
      const checkSpeaking = setInterval(async () => {
        const speaking = await voiceService.isSpeaking();
        if (!speaking) {
          setIsSpeaking(false);
          clearInterval(checkSpeaking);
        }
      }, 500);
    }
  };

  const handleStartFocus = async () => {
    try {
      const session = await focusService.startFocus(homeworkId, focusDuration);
      setFocusModalVisible(false);
      navigation.navigate('FocusMode', { sessionId: session.id });
    } catch (error) {
      Alert.alert('启动失败', error.error || '请稍后重试');
    }
  };

  const renderContent = () => {
    if (!homework) return null;
    
    const content = showPinyin ? pinyinUtils.addPinyin(homework.content || '暂无内容') : (homework.content || '暂无内容');
    
    return (
      <Text style={styles.contentText}>
        {content}
      </Text>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  if (!homework) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>作业不存在</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.title}>{homework.title}</Text>
          <View style={styles.headerInfo}>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{homework.subject}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: getPriorityColor(homework.priority) }]}>
              <Text style={styles.badgeText}>{homework.priority === 'high' ? '高优先级' : homework.priority === 'medium' ? '中优先级' : '低优先级'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>作业内容</Text>
          <View style={styles.contentContainer}>
            {renderContent()}
          </View>
          <TouchableOpacity
            style={styles.pinyinToggle}
            onPress={() => setShowPinyin(!showPinyin)}
          >
            <Text style={styles.pinyinToggleText}>
              {showPinyin ? '关闭拼音' : '显示拼音'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>作业信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>学科:</Text>
            <Text style={styles.infoValue}>{homework.subject}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>分类:</Text>
            <Text style={styles.infoValue}>{getCategoryText(homework.category)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>截止时间:</Text>
            <Text style={styles.infoValue}>{dateUtils.formatDateTime(homework.deadline)}</Text>
          </View>
          {homework.estimated_duration && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>预计耗时:</Text>
              <Text style={styles.infoValue}>{dateUtils.formatDuration(homework.estimated_duration)}</Text>
            </View>
          )}
          {homework.actual_duration && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>实际耗时:</Text>
              <Text style={styles.infoValue}>{dateUtils.formatDuration(homework.actual_duration)}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>状态:</Text>
            <Text style={[styles.infoValue, { color: getStatusColor(homework.status) }]}>
              {getStatusText(homework.status)}
            </Text>
          </View>
        </View>

        {homework.attachment_urls && homework.attachment_urls.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>附件</Text>
            {homework.attachment_urls.map((url, index) => (
              <Text key={index} style={styles.attachmentText}>
                附件 {index + 1}
              </Text>
            ))}
          </View>
        )}

        {homework.voice_note_url && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>语音讲解</Text>
            <TouchableOpacity style={styles.voiceButton} onPress={handleVoiceToggle}>
              <Text style={styles.voiceButtonText}>
                {isSpeaking ? '停止播放' : '播放语音讲解'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {homework.status === 'not_started' && (
          <>
            <TouchableOpacity
              style={[styles.footerButton, styles.startButton]}
              onPress={() => handleStatusChange('in_progress')}
            >
              <Text style={styles.footerButtonText}>开始作业</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.footerButton, styles.focusButton]}
              onPress={() => setFocusModalVisible(true)}
            >
              <Text style={styles.footerButtonText}>专注模式</Text>
            </TouchableOpacity>
          </>
        )}
        {homework.status === 'in_progress' && (
          <TouchableOpacity
            style={[styles.footerButton, styles.completeButton]}
            onPress={() => handleStatusChange('completed')}
          >
            <Text style={styles.footerButtonText}>完成作业</Text>
          </TouchableOpacity>
        )}
      </View>

      <Modal
        visible={focusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFocusModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>选择专注时长</Text>
            <View style={styles.durationOptions}>
              {[15, 25, 30, 45].map((duration) => (
                <TouchableOpacity
                  key={duration}
                  style={[
                    styles.durationOption,
                    focusDuration === duration && styles.durationOptionActive,
                  ]}
                  onPress={() => setFocusDuration(duration)}
                >
                  <Text style={[
                    styles.durationOptionText,
                    focusDuration === duration && styles.durationOptionTextActive,
                  ]}>
                    {duration}分钟
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={handleStartFocus}
            >
              <Text style={styles.modalButtonText}>开始专注</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton]}
              onPress={() => setFocusModalVisible(false)}
            >
              <Text style={styles.modalButtonText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'high': return colors.priorityHigh;
    case 'medium': return colors.priorityMedium;
    case 'low': return colors.priorityLow;
    default: return colors.textSecondary;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'not_started': return colors.statusNotStarted;
    case 'in_progress': return colors.statusInProgress;
    case 'completed': return colors.statusCompleted;
    case 'overdue': return colors.statusOverdue;
    default: return colors.textSecondary;
  }
};

const getStatusText = (status) => {
  switch (status) {
    case 'not_started': return '未开始';
    case 'in_progress': return '进行中';
    case 'completed': return '已完成';
    case 'overdue': return '已超时';
    default: return status;
  }
};

const getCategoryText = (category) => {
  switch (category) {
    case 'school': return '校内作业';
    case 'extra': return '加餐作业';
    case 'recitation': return '背诵任务';
    case 'wrong_questions': return '错题整理';
    case 'reading': return '课外阅读';
    default: return category;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: colors.error,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  headerInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  badgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: colors.surface,
    marginTop: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  contentContainer: {
    minHeight: 100,
  },
  contentText: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.text,
  },
  pinyinToggle: {
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.background,
    borderRadius: 8,
    alignItems: 'center',
  },
  pinyinToggleText: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    width: 100,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    flex: 1,
  },
  attachmentText: {
    fontSize: 14,
    color: colors.primary,
    marginBottom: 8,
  },
  voiceButton: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  voiceButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  footerButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  startButton: {
    backgroundColor: colors.primary,
  },
  focusButton: {
    backgroundColor: colors.secondary,
  },
  completeButton: {
    backgroundColor: colors.success,
  },
  footerButtonText: {
    color: colors.surface,
    fontSize: 16,
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
    marginBottom: 20,
    textAlign: 'center',
  },
  durationOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  durationOption: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    margin: 4,
  },
  durationOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  durationOptionText: {
    fontSize: 14,
    color: colors.text,
  },
  durationOptionTextActive: {
    color: colors.surface,
    fontWeight: 'bold',
  },
  modalButton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalCancelButton: {
    backgroundColor: colors.background,
  },
  modalButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default HomeworkDetailScreen;
