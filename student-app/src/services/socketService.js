import { io } from 'socket.io-client';
import { WS_URL } from '../constants/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = {};
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', async () => {
      console.log('Socket connected');
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        this.socket.emit('user:connect', user.id);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export default new SocketService();
