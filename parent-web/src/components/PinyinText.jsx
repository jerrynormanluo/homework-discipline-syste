import React from 'react';
import { Typography } from 'antd';
import { addPinyin } from '../utils/pinyinUtils';

const { Text } = Typography;

/**
 * 带拼音标注的文本组件
 * @param {object} props
 * @param {string} props.text - 要显示的文本
 * @param {boolean} props.showPinyin - 是否显示拼音
 * @param {object} props.pinyinOptions - 拼音配置选项
 * @param {object} props.style - 自定义样式
 */
const PinyinText = ({ 
  text, 
  showPinyin = true, 
  pinyinOptions = {},
  style = {},
  ...restProps 
}) => {
  if (!showPinyin || !text) {
    return <Text {...restProps} style={style}>{text}</Text>;
  }

  const htmlContent = addPinyin(text, pinyinOptions);

  return (
    <div 
      style={{ ...style }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
      {...restProps}
    />
  );
};

export default PinyinText;
