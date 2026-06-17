import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const dateUtils = {
  // 格式化日期时间
  formatDateTime: (date) => {
    if (!date) return '';
    return format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: zhCN });
  },

  // 格式化日期
  formatDate: (date) => {
    if (!date) return '';
    return format(new Date(date), 'yyyy-MM-dd', { locale: zhCN });
  },

  // 格式化时间
  formatTime: (date) => {
    if (!date) return '';
    return format(new Date(date), 'HH:mm', { locale: zhCN });
  },

  // 相对时间（如：3分钟前）
  formatRelative: (date) => {
    if (!date) return '';
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale: zhCN });
  },

  // 友好的日期显示
  formatFriendlyDate: (date) => {
    if (!date) return '';
    const d = new Date(date);
    
    if (isToday(d)) {
      return '今天';
    } else if (isTomorrow(d)) {
      return '明天';
    } else if (isYesterday(d)) {
      return '昨天';
    } else {
      return format(d, 'MM月dd日', { locale: zhCN });
    }
  },

  // 计算剩余时间
  getTimeRemaining: (deadline) => {
    if (!deadline) return null;
    const now = new Date();
    const end = new Date(deadline);
    const diff = end - now;
    
    if (diff <= 0) return { expired: true };
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds, expired: false };
  },

  // 格式化时长（分钟转小时分钟）
  formatDuration: (minutes) => {
    if (!minutes) return '0分钟';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}小时${mins > 0 ? mins + '分钟' : ''}`;
    }
    return `${mins}分钟`;
  },
};
