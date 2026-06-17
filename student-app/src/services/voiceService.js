import Tts from 'react-native-tts';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const voiceService = {
  // 初始化语音
  init: async () => {
    try {
      await Tts.getInitStatus();
      await Tts.setDefaultLanguage('zh-CN');
      await Tts.setDefaultRate(1.0);
      await Tts.setDefaultPitch(1.0);
    } catch (error) {
      console.error('语音初始化失败:', error);
    }
  },

  // 播放语音
  speak: async (text) => {
    try {
      await Tts.speak(text);
    } catch (error) {
      console.error('语音播放失败:', error);
    }
  },

  // 停止播放
  stop: async () => {
    try {
      await Tts.stop();
    } catch (error) {
      console.error('停止播放失败:', error);
    }
  },

  // 设置语速
  setRate: async (rate) => {
    try {
      await Tts.setDefaultRate(rate);
    } catch (error) {
      console.error('设置语速失败:', error);
    }
  },

  // 设置音调
  setPitch: async (pitch) => {
    try {
      await Tts.setDefaultPitch(pitch);
    } catch (error) {
      console.error('设置音调失败:', error);
    }
  },

  // 设置音量
  setVolume: async (volume) => {
    try {
      await Tts.setDefaultVolume(volume);
    } catch (error) {
      console.error('设置音量失败:', error);
    }
  },

  // 检查是否正在播放
  isSpeaking: async () => {
    try {
      return await Tts.isSpeaking();
    } catch (error) {
      console.error('检查播放状态失败:', error);
      return false;
    }
  },
};
