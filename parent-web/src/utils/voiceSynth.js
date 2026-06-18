/**
 * 浏览器语音合成工具(Web Speech API)
 */

class VoiceSynthesizer {
  constructor() {
    this.synth = window.speechSynthesis;
    this.utterance = null;
    this.isPlaying = false;
    this.onEnd = null;
  }

  /**
   * 检查浏览器是否支持语音合成
   */
  static isSupported() {
    return 'speechSynthesis' in window;
  }

  /**
   * 获取可用的语音列表
   */
  getVoices() {
    return new Promise((resolve) => {
      let voices = this.synth.getVoices();
      
      if (voices.length > 0) {
        resolve(voices);
      } else {
        // 等待语音列表加载
        this.synth.onvoiceschanged = () => {
          voices = this.synth.getVoices();
          resolve(voices);
        };
      }
    });
  }

  /**
   * 播放文本
   * @param {string} text - 要播放的文本
   * @param {object} options - 配置选项
   */
  async speak(text, options = {}) {
    const {
      rate = 1, // 语速 0.5-2
      pitch = 1, // 音调 0-2
      volume = 1, // 音量 0-1
      lang = 'zh-CN', // 语言
      voiceIndex = null, // 指定语音索引
      onEnd = null, // 播放结束回调
    } = options;

    if (!VoiceSynthesizer.isSupported()) {
      console.error('浏览器不支持语音合成');
      return false;
    }

    // 停止当前播放
    this.stop();

    return new Promise((resolve) => {
      this.utterance = new SpeechSynthesisUtterance(text);
      this.utterance.rate = rate;
      this.utterance.pitch = pitch;
      this.utterance.volume = volume;
      this.utterance.lang = lang;

      // 设置语音
      if (voiceIndex !== null) {
        const voices = this.synth.getVoices();
        if (voices[voiceIndex]) {
          this.utterance.voice = voices[voiceIndex];
        }
      } else {
        // 优先选择中文语音
        const voices = this.synth.getVoices();
        const zhVoice = voices.find(v => v.lang.includes('zh'));
        if (zhVoice) {
          this.utterance.voice = zhVoice;
        }
      }

      this.utterance.onend = () => {
        this.isPlaying = false;
        if (onEnd) onEnd();
        resolve(true);
      };

      this.utterance.onerror = (error) => {
        console.error('语音播放失败:', error);
        this.isPlaying = false;
        resolve(false);
      };

      this.isPlaying = true;
      this.onEnd = onEnd;
      this.synth.speak(this.utterance);
    });
  }

  /**
   * 暂停播放
   */
  pause() {
    if (this.isPlaying && this.synth.speaking) {
      this.synth.pause();
    }
  }

  /**
   * 恢复播放
   */
  resume() {
    if (this.isPlaying && this.synth.paused) {
      this.synth.resume();
    }
  }

  /**
   * 停止播放
   */
  stop() {
    if (this.synth.speaking || this.synth.pending) {
      this.synth.cancel();
    }
    this.isPlaying = false;
    this.utterance = null;
  }

  /**
   * 判断是否正在播放
   */
  get isSpeaking() {
    return this.synth.speaking;
  }
}

// 导出单例
const voiceSynth = new VoiceSynthesizer();
export default voiceSynth;

/**
 * 便捷函数:播放文本
 */
export const speakText = (text, options) => {
  return voiceSynth.speak(text, options);
};

/**
 * 便捷函数:停止播放
 */
export const stopSpeaking = () => {
  voiceSynth.stop();
};
