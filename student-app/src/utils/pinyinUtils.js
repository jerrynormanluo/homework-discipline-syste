import pinyin from 'pinyin-pro';

// 高频简单汉字过滤列表
const COMMON_CHARS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
]);

export const pinyinUtils = {
  // 为文本添加拼音标注
  addPinyin: (text, filterCommon = true) => {
    if (!text) return '';
    
    let result = '';
    for (let char of text) {
      // 跳过数字、英文、标点
      if (/[\d\w\s\p{P}]/u.test(char)) {
        result += char;
        continue;
      }
      
      // 过滤高频简单汉字
      if (filterCommon && COMMON_CHARS.has(char)) {
        result += char;
        continue;
      }
      
      // 添加拼音
      const py = pinyin(char, { toneType: 'symbol', type: 'array' });
      if (py && py.length > 0 && py[0]) {
        result += `${char}<ruby>${py[0]}</ruby>`;
      } else {
        result += char;
      }
    }
    
    return result;
  },

  // 获取文本的拼音（不带汉字）
  getPinyinOnly: (text) => {
    if (!text) return '';
    return pinyin(text, { toneType: 'symbol', type: 'array' }).join(' ');
  },

  // 检查字符是否为汉字
  isChinese: (char) => {
    return /[\u4e00-\u9fa5]/.test(char);
  },

  // 过滤非汉字字符
  filterChinese: (text) => {
    if (!text) return '';
    return text.replace(/[^\u4e00-\u9fa5]/g, '');
  },
};
