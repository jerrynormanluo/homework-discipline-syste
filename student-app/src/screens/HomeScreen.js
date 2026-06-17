import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  Alert,
} from 'react-native';
import { homeworkService } from '../services/homeworkService';
import { dateUtils } from '../utils/dateUtils';
import colors from '../constants/colors';
import socketService from '../services/socketService';

const HomeScreen = ({ navigation }) => {
  const [homeworks, setHomeworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statistics, setStatistics] = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0 });

  const loadHomeworks = useCallback(async () => {
    try {
      setLoading(true);
      const data = await homeworkService.getHomeworkList();
      
      // 排序：优先级高优先，超时置顶
      const sorted = data.sort((a, b) => {
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (a.status !== 'overdue' && b.status === 'overdue') return 1;
        
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        
        return new Date(a.deadline) - new Date(b.deadline);
      });
      
      setHomeworks(sorted);
      
      // 计算统计
      const stats = {
        total: sorted.length,
        completed: sorted.filter(h => h.status === 'completed').length,
        inProgress: sorted.filter(h => h.status === 'in_progress').length,
        overdue: sorted.filter(h => h.status === 'overdue').length,
      };
      setStatistics(stats);
    } catch (error) {
      Alert.alert('加载失败', error.error || '请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHomeworks();
    
    // 连接Socket
    socketService.connect();
    
    // 监听新作业
    socketService.on('homework:new', (data) => {
      setHomeworks(prev => [...prev, data.homework]);
    });
    
    // 监听作业更新
    socketService.on('homework:update', (data) => {
      setHomeworks(prev => prev.map(h => 
        h.id === data.homework.id ? data.homework : h
      ));
    });
    
    // 监听作业删除
    socketService.on('homework:delete', (data) => {
      setHomeworks(prev => prev.filter(h => h.id !== data.homework_id));
    });
    
    return () => {
      socketService.off('homework:new');
      socketService.off('homework:update');
      socketService.off('homework:delete');
    };
  }, [loadHomeworks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHomeworks();
    setRefreshing(false);
  };

  const handleStatusChange = async (homeworkId, newStatus) => {
    try {
      await homeworkService.updateHomeworkStatus(homeworkId, newStatus);
      await loadHomeworks();
    } catch (error) {
      Alert.alert('操作失败', error.error || '请稍后重试');
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

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return colors.priorityHigh;
      case 'medium': return colors.priorityMedium;
      case 'low': return colors.priorityLow;
      default: return colors.textSecondary;
    }
  };

  const renderHomeworkItem = ({ item }) => {
    const timeRemaining = dateUtils.getTimeRemaining(item.deadline);
    
    return (
      <TouchableOpacity
        style={[styles.homeworkCard, item.status === 'overdue' && styles.overdueCard]}
        onPress={() => navigation.navigate('HomeworkDetail', { homeworkId: item.id })}
      >
        <View style={styles.homeworkHeader}>
          <View style={styles.homeworkTitleContainer}>
            <Text style={styles.homeworkTitle}>{item.title}</Text>
            <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(item.priority) }]}>
              <Text style={styles.priorityText}>{item.priority === 'high' ? '高' : item.priority === 'medium' ? '中' : '低'}</Text>
            </View>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
            <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
          </View>
        </View>

        <View style={styles.homeworkInfo}>
          <Text style={styles.homeworkSubject}>{item.subject}</Text>
          <Text style={styles.homeworkTime}>
            截止: {dateUtils.formatFriendlyDate(item.deadline)} {dateUtils.formatTime(item.deadline)}
          </Text>
        </View>

        {item.estimated_duration && (
          <Text style={styles.homeworkDuration}>
            预计耗时: {dateUtils.formatDuration(item.estimated_duration)}
          </Text>
        )}

        {timeRemaining && !timeRemaining.expired && (
          <View style={styles.countdownContainer}>
            <Text style={styles.countdownLabel}>剩余时间:</Text>
            <Text style={styles.countdownText}>
              {timeRemaining.hours > 0 && `${timeRemaining.hours}小时 `}
              {timeRemaining.minutes}分钟
            </Text>
          </View>
        )}

        {item.status !== 'completed' && (
          <View style={styles.actionButtons}>
            {item.status === 'not_started' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.startButton]}
                onPress={() => handleStatusChange(item.id, 'in_progress')}
              >
                <Text style={styles.actionButtonText}>开始</Text>
              </TouchableOpacity>
            )}
            {item.status === 'in_progress' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.completeButton]}
                onPress={() => handleStatusChange(item.id, 'completed')}
              >
                <Text style={styles.actionButtonText}>完成</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>我的作业</Text>
        <View style={styles.statistics}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{statistics.total}</Text>
            <Text style={styles.statLabel}>总计</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.statusCompleted }]}>{statistics.completed}</Text>
            <Text style={styles.statLabel}>完成</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.statusInProgress }]}>{statistics.inProgress}</Text>
            <Text style={styles.statLabel}>进行中</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, { color: colors.statusOverdue }]}>{statistics.overdue}</Text>
            <Text style={styles.statLabel}>超时</Text>
          </View>
        </View>
      </View>

      <FlatList
        data={homeworks}
        renderItem={renderHomeworkItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>暂无作业</Text>
          </View>
        }
      />
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
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 12,
  },
  statistics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  homeworkCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overdueCard: {
    borderWidth: 2,
    borderColor: colors.error,
  },
  homeworkHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  homeworkTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  homeworkTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    flex: 1,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginLeft: 8,
  },
  priorityText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: 'bold',
  },
  homeworkInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  homeworkSubject: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  homeworkTime: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  homeworkDuration: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  countdownLabel: {
    fontSize: 14,
    color: colors.textSecondary,
    marginRight: 8,
  },
  countdownText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  actionButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  startButton: {
    backgroundColor: colors.primary,
  },
  completeButton: {
    backgroundColor: colors.success,
  },
  actionButtonText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default HomeScreen;
