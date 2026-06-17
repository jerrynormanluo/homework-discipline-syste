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
import { pointsService } from '../services/pointsService';
import { authService } from '../services/authService';
import colors from '../constants/colors';

const PointsScreen = ({ navigation }) => {
  const [balance, setBalance] = useState(0);
  const [records, setRecords] = useState([]);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('records'); // 'records' or 'rewards'

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const user = await authService.getLocalUser();
      if (!user) return;

      const [balanceData, recordsData, rewardsData] = await Promise.all([
        pointsService.getBalance(user.id),
        pointsService.getRecords(user.id, 50),
        pointsService.getRewards(user.id),
      ]);

      setBalance(balanceData);
      setRecords(recordsData);
      setRewards(rewardsData);
    } catch (error) {
      Alert.alert('加载失败', error.error || '请稍后重试');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRedeem = async (reward) => {
    if (balance < reward.points_required) {
      Alert.alert('积分不足', `需要 ${reward.points_required} 积分，当前只有 ${balance} 积分`);
      return;
    }

    Alert.alert(
      '确认兑换',
      `确定要兑换"${reward.name}"吗？需要消耗 ${reward.points_required} 积分`,
      [
        { text: '取消', style: 'cancel' },
        {
          text: '确定',
          onPress: async () => {
            try {
              await pointsService.redeemReward(reward.id);
              Alert.alert('兑换成功', '兑换申请已提交，等待家长审核');
              await loadData();
            } catch (error) {
              Alert.alert('兑换失败', error.error || '请稍后重试');
            }
          }
        }
      ]
    );
  };

  const renderRecordItem = ({ item }) => (
    <View style={styles.recordItem}>
      <View style={styles.recordInfo}>
        <Text style={styles.recordReason}>{item.reason}</Text>
        <Text style={styles.recordDate}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={[
        styles.recordPoints,
        item.points_change > 0 ? styles.recordPointsPositive : styles.recordPointsNegative
      ]}>
        {item.points_change > 0 ? '+' : ''}{item.points_change}
      </Text>
    </View>
  );

  const renderRewardItem = ({ item }) => (
    <TouchableOpacity
      style={styles.rewardItem}
      onPress={() => handleRedeem(item)}
    >
      <View style={styles.rewardInfo}>
        <Text style={styles.rewardName}>{item.name}</Text>
        {item.description && (
          <Text style={styles.rewardDescription}>{item.description}</Text>
        )}
        <Text style={styles.rewardType}>{getRewardTypeText(item.reward_type)}</Text>
      </View>
      <View style={styles.rewardPoints}>
        <Text style={styles.rewardPointsValue}>{item.points_required}</Text>
        <Text style={styles.rewardPointsLabel}>积分</Text>
      </View>
    </TouchableOpacity>
  );

  const getRewardTypeText = (type) => {
    switch (type) {
      case 'entertainment_time': return '娱乐时长';
      case 'outdoor_activity': return '户外活动';
      case 'gift': return '小礼品';
      case 'no_extra_homework': return '免加餐作业';
      default: return type;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>积分中心</Text>
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>当前积分</Text>
          <Text style={styles.balanceValue}>{balance}</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'records' && styles.tabActive]}
          onPress={() => setActiveTab('records')}
        >
          <Text style={[styles.tabText, activeTab === 'records' && styles.tabTextActive]}>
            积分记录
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rewards' && styles.tabActive]}
          onPress={() => setActiveTab('rewards')}
        >
          <Text style={[styles.tabText, activeTab === 'rewards' && styles.tabTextActive]}>
            奖励兑换
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'records' ? (
        <FlatList
          data={records}
          renderItem={renderRecordItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无积分记录</Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={rewards}
          renderItem={renderRewardItem}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>暂无可兑换奖励</Text>
            </View>
          }
        />
      )}
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
    marginBottom: 16,
  },
  balanceCard: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: colors.surface,
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: colors.surface,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
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
  recordItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordInfo: {
    flex: 1,
  },
  recordReason: {
    fontSize: 16,
    color: colors.text,
    marginBottom: 4,
  },
  recordDate: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  recordPoints: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  recordPointsPositive: {
    color: colors.success,
  },
  recordPointsNegative: {
    color: colors.error,
  },
  rewardItem: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardInfo: {
    flex: 1,
  },
  rewardName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.text,
    marginBottom: 4,
  },
  rewardDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  rewardType: {
    fontSize: 12,
    color: colors.primary,
  },
  rewardPoints: {
    alignItems: 'center',
  },
  rewardPointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: colors.primary,
  },
  rewardPointsLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
});

export default PointsScreen;
